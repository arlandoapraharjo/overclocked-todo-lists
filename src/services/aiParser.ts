import type { Priority, Category } from '../types/todo';
import { getAISettings } from './aiSettings';

export interface ParsedTask {
  title: string;
  estimatedTime?: string;
  priority: Priority;
  category: Category;
}

const SYSTEM_PROMPT = `You are an expert productivity assistant. Analyze the user's raw input (paragraphs, notes, or bullet points) and extract discrete, actionable tasks.
For each task:
1. "title": A concise, clear action-oriented task summary.
2. "estimatedTime": Estimated time duration (e.g. "15m", "30m", "1h", "2h", "1d").
3. "priority": One of "high" (urgent/blocking/critical/tight deadline), "medium" (standard tasks), or "low" (nice to have/backlog).
4. "category": Choose the best matching domain: "Work", "Personal", "Design", "Urgent", or "General".

Crucial: Return ONLY a valid JSON array of tasks sorted from most urgent ("high") to least urgent ("low"). No markdown code blocks, no other text.`;

export async function parseTasksFromText(rawText: string): Promise<ParsedTask[]> {
  const text = rawText.trim();
  if (!text) return [];

  const settings = getAISettings();

  // If user provided an API key, use their chosen provider
  if (settings.apiKey.trim()) {
    try {
      if (settings.provider === 'gemini') {
        return await parseWithGemini(text, settings.apiKey.trim(), settings.model);
      } else if (settings.provider === 'openai') {
        return await parseWithOpenAI(text, settings.apiKey.trim(), settings.model);
      } else if (settings.provider === 'claude') {
        return await parseWithClaude(text, settings.apiKey.trim(), settings.model);
      }
    } catch (err) {
      console.warn('AI API call failed, falling back to smart local parser:', err);
    }
  }

  // Fallback: Smart local rule-based NLP parser
  return parseWithLocalHeuristics(text);
}

// 1. Google Gemini API
async function parseWithGemini(text: string, apiKey: string, model: string): Promise<ParsedTask[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${SYSTEM_PROMPT}\n\nUser Text:\n${text}` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) return parseWithLocalHeuristics(text);

  return sanitizeParsedTasks(JSON.parse(rawContent));
}

// 2. OpenAI API
async function parseWithOpenAI(text: string, apiKey: string, model: string): Promise<ParsedTask[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return parseWithLocalHeuristics(text);

  const parsed = JSON.parse(content);
  const tasksArray = Array.isArray(parsed) ? parsed : parsed.tasks || Object.values(parsed)[0];
  return sanitizeParsedTasks(Array.isArray(tasksArray) ? tasksArray : []);
}

// 3. Anthropic Claude API
async function parseWithClaude(text: string, apiKey: string, model: string): Promise<ParsedTask[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.content?.[0]?.text;
  if (!rawContent) return parseWithLocalHeuristics(text);

  // Strip possible markdown fences
  const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
  return sanitizeParsedTasks(JSON.parse(cleaned));
}

// Helper: Ensure tasks match type specifications and sort by urgency
function sanitizeParsedTasks(items: unknown[]): ParsedTask[] {
  const validPriorities: Priority[] = ['high', 'medium', 'low'];
  const validCategories: Category[] = ['Work', 'Personal', 'Design', 'Urgent', 'General'];

  const tasks: ParsedTask[] = items.map(item => {
    const obj = item as Record<string, unknown>;
    const title = String(obj.title || obj.task || obj.name || '').trim();
    const rawPriority = String(obj.priority || '').toLowerCase() as Priority;
    const priority = validPriorities.includes(rawPriority) ? rawPriority : 'medium';
    
    let rawCategory = String(obj.category || 'General').trim();
    // Normalize category
    let category: Category = 'General';
    for (const cat of validCategories) {
      if (rawCategory.toLowerCase() === cat.toLowerCase()) {
        category = cat;
        break;
      }
    }

    const estimatedTime = obj.estimatedTime ? String(obj.estimatedTime).trim() : undefined;

    return {
      title,
      estimatedTime,
      priority,
      category,
    };
  }).filter(t => t.title.length > 0);

  // Auto-sort by urgency: high -> medium -> low
  const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
  tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return tasks;
}

// 4. Smart Local Rule-based NLP Extractor (Instant, Zero Key Required)
export function parseWithLocalHeuristics(text: string): ParsedTask[] {
  // Split by line breaks, semicolons, bullet points, or sentence boundaries
  const rawSegments = text
    .split(/\n+|•|-|\*|;|\.(?=\s+[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  const tasks: ParsedTask[] = [];

  for (const segment of rawSegments) {
    let clean = segment.replace(/^[-*•\d.)\s]+/, '').trim();
    if (!clean) continue;

    // Detect time markers (e.g. 15m, 30 min, 1 hour, 2h)
    let estimatedTime: string | undefined;
    const timeMatch = clean.match(/(\d+\s*(?:m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days))\b/i);
    if (timeMatch) {
      estimatedTime = timeMatch[1].replace(/\s+/g, '').toLowerCase();
      clean = clean.replace(timeMatch[0], '').replace(/[()]/g, '').trim();
    }

    // Detect urgency
    const lower = clean.toLowerCase();
    let priority: Priority = 'medium';
    if (
      lower.includes('asap') ||
      lower.includes('urgent') ||
      lower.includes('critical') ||
      lower.includes('immediately') ||
      lower.includes('priority') ||
      lower.includes('today') ||
      lower.includes('deadline')
    ) {
      priority = 'high';
    } else if (
      lower.includes('later') ||
      lower.includes('someday') ||
      lower.includes('maybe') ||
      lower.includes('backlog') ||
      lower.includes('when free')
    ) {
      priority = 'low';
    }

    // Detect Category
    let category: Category = 'General';
    if (
      lower.includes('design') ||
      lower.includes('figma') ||
      lower.includes('ui') ||
      lower.includes('ux') ||
      lower.includes('sketch') ||
      lower.includes('logo') ||
      lower.includes('palette')
    ) {
      category = 'Design';
    } else if (
      lower.includes('urgent') ||
      priority === 'high' && (lower.includes('fix') || lower.includes('bug') || lower.includes('server'))
    ) {
      category = 'Urgent';
    } else if (
      lower.includes('work') ||
      lower.includes('code') ||
      lower.includes('api') ||
      lower.includes('client') ||
      lower.includes('deploy') ||
      lower.includes('meeting') ||
      lower.includes('sprint') ||
      lower.includes('email')
    ) {
      category = 'Work';
    } else if (
      lower.includes('call') ||
      lower.includes('buy') ||
      lower.includes('groceries') ||
      lower.includes('gym') ||
      lower.includes('workout') ||
      lower.includes('dinner') ||
      lower.includes('home')
    ) {
      category = 'Personal';
    }

    tasks.push({
      title: clean.charAt(0).toUpperCase() + clean.slice(1),
      estimatedTime: estimatedTime || '15m',
      priority,
      category,
    });
  }

  // Auto-sort by urgency: high -> medium -> low
  const priorityWeight: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
  tasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return tasks;
}
