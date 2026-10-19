import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 900);
    this.camera.position.set(0, 5, 10);

    this.world = new THREE.Group();
    this.scene.add(this.world);

    this.composer = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  buildComposer() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y);
    const composer = new EffectComposer(this.renderer, rt);
    composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.34, 0.55, 0.9,
    );
    composer.addPass(this.bloom);
    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.composer) this.buildComposer();
    this.composer.setSize(w, h);
  }

  setBloom({ strength, radius, threshold }) {
    if (!this.bloom) return;
    if (strength !== undefined) this.bloom.strength = strength;
    if (radius !== undefined) this.bloom.radius = radius;
    if (threshold !== undefined) this.bloom.threshold = threshold;
  }

  render() {
    this.composer.render();
  }
}
