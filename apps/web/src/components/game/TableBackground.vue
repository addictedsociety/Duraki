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
import type { ThemeId } from "@/types/theme.type";
import { useThemeStore } from "@/stores/theme";

const theme = useThemeStore();

const canvas = ref<HTMLCanvasElement | null>(null);

type Palette = { a: number; b: number; glow: number };
const PALETTES: Record<ThemeId, Palette> = {
  default: { a: 0x2e5d4b, b: 0x16271f, glow: 0xd8b24a },
  emerald: { a: 0x2f7a5a, b: 0x13301f, glow: 0xe3c24d },
  crimson: { a: 0x5e2630, b: 0x220f12, glow: 0xd99a55 },
  royal: { a: 0x3a2f6a, b: 0x171430, glow: 0xc9a8f0 },
};

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

const applyPalette = (id: ThemeId): void => {
  if (!material) return;
  const palette = PALETTES[id];
  (material.uniforms.uColorA.value as Color).setHex(palette.a);
  (material.uniforms.uColorB.value as Color).setHex(palette.b);
  (material.uniforms.uGlow.value as Color).setHex(palette.glow);
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

  applyPalette(theme.themeId);
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
  () => theme.themeId,
  (id) => {
    applyPalette(id);
    if (reducedMotion) renderOnce();
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
