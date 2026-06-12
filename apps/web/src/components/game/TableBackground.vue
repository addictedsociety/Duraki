<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Timer,
  WebGLRenderer,
} from "three";
import { useThemeStore } from "@/stores/theme";

const theme = useThemeStore();

const canvas = ref<HTMLCanvasElement | null>(null);

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: OrthographicCamera | null = null;
let material: ShaderMaterial | null = null;
let geometry: PlaneGeometry | null = null;
let mesh: Mesh | null = null;
let timer: Timer | null = null;
let frame = 0;
let observer: ResizeObserver | null = null;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Liest eine CSS-Custom-Property (z. B. --felt-from) und löst sie über ein
// Probe-Element + Canvas zu einem von three.js parsebaren Hex-Wert auf.
// So folgt der 3D-Tisch automatisch dem aktiven Theme + Mode.
const resolveColor = (cssVar: string, fallback: string): string => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${cssVar})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();

  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = resolved || fallback;
  return ctx.fillStyle;
};

const applyPalette = (): void => {
  if (!material) return;
  (material.uniforms.uColorA.value as Color).set(
    resolveColor("--felt-from", "#2e5d4b"),
  );
  (material.uniforms.uColorB.value as Color).set(
    resolveColor("--felt-to", "#16271f"),
  );
  (material.uniforms.uGlow.value as Color).set(
    resolveColor("--trump-glow", "#d8b24a"),
  );
};

const resize = (): void => {
  if (!renderer || !canvas.value) return;
  const parent = canvas.value.parentElement;
  const width = parent?.clientWidth ?? window.innerWidth;
  const height = parent?.clientHeight ?? window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);
};

const renderOnce = (): void => {
  if (renderer && scene && camera) renderer.render(scene, camera);
};

const loop = (): void => {
  if (!renderer || !material || !timer) return;
  timer.update();
  material.uniforms.uTime.value = timer.getElapsed();
  renderOnce();
  frame = requestAnimationFrame(loop);
};

onMounted(() => {
  if (!canvas.value) return;

  renderer = new WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: false });
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  geometry = new PlaneGeometry(2, 2);
  material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uGlow: { value: new Color() },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uGlow;
      void main() {
        vec2 uv = vUv;
        float d = distance(uv, vec2(0.5, 0.18));
        vec3 base = mix(uColorA, uColorB, clamp(d, 0.0, 1.0));
        vec2 g = vec2(0.5 + 0.22 * sin(uTime * 0.18), 0.32 + 0.14 * cos(uTime * 0.13));
        float glow = 0.12 / (0.08 + distance(uv, g) * 2.2);
        vec3 col = base + uGlow * glow * 0.25;
        col *= smoothstep(1.25, 0.15, distance(uv, vec2(0.5)));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  mesh = new Mesh(geometry, material);
  scene.add(mesh);

  applyPalette();
  resize();

  observer = new ResizeObserver(() => {
    resize();
    if (reducedMotion) renderOnce();
  });
  if (canvas.value.parentElement) observer.observe(canvas.value.parentElement);

  timer = new Timer();
  if (reducedMotion) renderOnce();
  else frame = requestAnimationFrame(loop);
});

watch(
  () => [theme.themeId, theme.resolvedMode],
  () => {
    // Nach dem DOM-Update (data-theme/data-mode) die neuen Farben lesen.
    requestAnimationFrame(() => {
      applyPalette();
      if (reducedMotion) renderOnce();
    });
  },
);

onUnmounted(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
  geometry?.dispose();
  material?.dispose();
  renderer?.dispose();
  renderer = null;
});
</script>

<template>
  <canvas ref="canvas" class="absolute inset-0 h-full w-full" aria-hidden="true" />
</template>
