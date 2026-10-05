import React, { useEffect, useRef } from 'react';

interface AnimatedPatternCloudProps {
  isDark?: boolean;
  className?: string;
}

/**
 * AnimatedPatternCloud (ProceduralGroundBackground)
 * Inspired by @ashishrajwaniai01 from 21st.dev
 * (https://21st.dev/@ashishrajwaniai01/components/animated-pattern-cloud)
 *
 * A high-performance WebGL 2D background featuring topographic neon lines,
 * procedural terrain noise, and sand-ripple wavy movement.
 */
export const AnimatedPatternCloud: React.FC<AnimatedPatternCloudProps> = React.memo(
  function AnimatedPatternCloud({ isDark = true, className = '' }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDarkRef = useRef(isDark);
    isDarkRef.current = isDark;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });

      if (!gl) {
        console.warn('WebGL not supported for AnimatedPatternCloud background');
        return;
      }

      const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float u_is_dark;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
          
          // Ground Perspective Simulation
          float depth = 1.0 / (uv.y + 1.18);
          vec2 gridUv = vec2(uv.x * depth, depth + u_time * 0.12);
          
          // Layered Procedural Noise for Terrain
          float n = noise(gridUv * 3.5);
          float ripples = sin(gridUv.y * 18.0 + n * 8.0 + u_time * 0.45);
          
          // Neon Topographic Lines
          float topoLine = smoothstep(0.035, 0.0, abs(ripples));
          
          // Color Palettes
          // Dark Theme: Deep Space, Electric Blue, Neon Purple
          vec3 darkBase = vec3(0.035, 0.03, 0.09);
          vec3 darkAccent = vec3(0.08, 0.25, 0.72);
          vec3 darkNeon = vec3(0.65, 0.22, 1.0);

          // Light Theme: Frost Silver, Soft Sky Blue, Gentle Violet
          vec3 lightBase = vec3(0.96, 0.97, 0.99);
          vec3 lightAccent = vec3(0.78, 0.86, 0.98);
          vec3 lightNeon = vec3(0.48, 0.58, 0.95);

          vec3 baseColor = mix(lightBase, darkBase, u_is_dark);
          vec3 accentColor = mix(lightAccent, darkAccent, u_is_dark);
          vec3 neonColor = mix(lightNeon, darkNeon, u_is_dark);
          
          // Composite
          vec3 finalColor = mix(baseColor, accentColor, n * 0.55);
          finalColor += topoLine * neonColor * depth * (u_is_dark > 0.5 ? 0.38 : 0.22);
          
          // Horizon Fog / Vignette Fade
          float fade = smoothstep(0.12, -1.0, uv.y);
          float vignette = 1.0 - length(uv) * (u_is_dark > 0.5 ? 0.4 : 0.12);
          finalColor *= vignette * (1.0 - fade * 0.75);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const createShader = (glCtx: WebGLRenderingContext, type: number, source: string) => {
        const shader = glCtx.createShader(type);
        if (!shader) return null;
        glCtx.shaderSource(shader, source);
        glCtx.compileShader(shader);
        if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
          console.error(glCtx.getShaderInfoLog(shader));
          glCtx.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vertShader || !fragShader) return;

      const program = gl.createProgram();
      if (!program) return;

      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ]),
        gl.STATIC_DRAW
      );

      const posAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      const timeLoc = gl.getUniformLocation(program, 'u_time');
      const resLoc = gl.getUniformLocation(program, 'u_resolution');
      const isDarkLoc = gl.getUniformLocation(program, 'u_is_dark');

      let animationFrameId: number;
      let currentDarkFactor = isDarkRef.current ? 1.0 : 0.0;

      const render = (time: number) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.floor(window.innerWidth * dpr);
        const height = Math.floor(window.innerHeight * dpr);

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }

        // Smooth 60fps lerp crossfade between dark (1.0) and light (0.0)
        const targetDark = isDarkRef.current ? 1.0 : 0.0;
        currentDarkFactor += (targetDark - currentDarkFactor) * 0.08;

        gl.uniform1f(timeLoc, time * 0.001);
        gl.uniform2f(resLoc, width, height);
        gl.uniform1f(isDarkLoc, currentDarkFactor);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animationFrameId = requestAnimationFrame(render);
      };

      animationFrameId = requestAnimationFrame(render);

      return () => {
        cancelAnimationFrame(animationFrameId);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        gl.deleteBuffer(buffer);
      };
    }, []);

    return (
      <div
        className={`fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden transition-colors duration-500 ease-out ${
          isDark ? 'bg-[#09090b]' : 'bg-[#f8fafc]'
        } ${className}`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          style={{ filter: isDark ? 'contrast(1.1) brightness(0.92)' : 'contrast(1.05) brightness(1.0)' }}
        />
        {/* Subtle radial overlay for text readability */}
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
            isDark
              ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]'
              : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.1),rgba(255,255,255,0))]'
          }`}
        />
      </div>
    );
  }
);
