import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(53, 1, 0.1, 900);
    this.camera.position.set(0, 5, 10);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.composer = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  buildComposer() {
    const composer = new EffectComposer(this.renderer);
    composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.34, 0.55, 0.9,
    );
    // An isolated non-finite HDR highlight must not spread through the full blur pyramid.
    // The scene keeps its HDR target; the soft, additive glow only needs a bounded mask.
    for (const target of [this.bloom.renderTargetBright, ...this.bloom.renderTargetsHorizontal, ...this.bloom.renderTargetsVertical]) {
      target.texture.type = THREE.UnsignedByteType;
    }
    composer.addPass(this.bloom);
    composer.addPass(new OutputPass());
    this.fxaa = new ShaderPass(FXAAShader);
    composer.addPass(this.fxaa);
    this.composer = composer;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.composer) this.buildComposer();
    this.composer.setPixelRatio(ratio);
    this.composer.setSize(w, h);
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.fxaa.uniforms.resolution.value.set(1 / size.x, 1 / size.y);
    this.needsRender = true;
  }

  setBloom({ strength, radius, threshold }) {
    if (!this.bloom) return;
    if (strength !== undefined) this.bloom.strength = strength;
    if (radius !== undefined) this.bloom.radius = radius;
    if (threshold !== undefined) this.bloom.threshold = threshold;
  }

  render() {
    this.composer.render();
    this.needsRender = false;
  }
}
