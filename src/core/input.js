import { clamp } from './utils.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.dragDX = 0;
    this.dragDY = 0;
    this.wheel = 0;
    this.dragging = false;
    this.enabled = true;
    this.virtual = { x: 0, y: 0 };
    this.touchAction = false;
    this.touchJump = false;

    window.addEventListener('keydown', (e) => {
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      this.onAnyInput?.();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.released.add(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      this.onAnyInput?.();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.dragDX += e.clientX - this.lastX;
      this.dragDY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    const endDrag = (e) => {
      this.dragging = false;
      canvas.style.cursor = 'grab';
      if (e.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.wheel += clamp(e.deltaY, -120, 120);
      this.onAnyInput?.();
    }, { passive: false });
    canvas.style.cursor = 'grab';

    this.setupTouch();
  }

  setupTouch() {
    const joy = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    if (!joy) return;
    let active = false, pid = null, cx = 0, cy = 0;
    const radius = 40;
    const start = (e) => {
      active = true; pid = e.pointerId;
      const r = joy.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      joy.setPointerCapture(e.pointerId);
      move(e);
    };
    const move = (e) => {
      if (!active || e.pointerId !== pid) return;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      if (len > radius) { dx = dx / len * radius; dy = dy / len * radius; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.virtual.x = dx / radius;
      this.virtual.y = dy / radius;
      this.onAnyInput?.();
    };
    const end = (e) => {
      if (e.pointerId !== pid) return;
      active = false; this.virtual.x = 0; this.virtual.y = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };
    joy.addEventListener('pointerdown', start);
    joy.addEventListener('pointermove', move);
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);

    const jump = document.getElementById('touch-jump');
    const act = document.getElementById('touch-act');
    jump?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.touchJump = true; this.onAnyInput?.(); });
    act?.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.touchAction = true; this.onAnyInput?.(); });
  }

  isDown(code) { return this.enabled && this.keys.has(code); }
  wasPressed(code) { return this.pressed.has(code); }
  wasReleased(code) { return this.released.has(code); }

  consumeInteract() {
    if (this.touchAction) { this.touchAction = false; return true; }
    return this.wasPressed('KeyE') || this.wasPressed('Enter');
  }
  consumeJump() {
    if (this.touchJump) { this.touchJump = false; return true; }
    return this.wasPressed('Space');
  }

  getMove() {
    let x = 0, y = 0;
    if (this.enabled) {
      if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
      if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
      if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
      if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
      x += this.virtual.x;
      y += this.virtual.y;
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  get running() { return this.isDown('ShiftLeft') || this.isDown('ShiftRight'); }

  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.dragDX = 0;
    this.dragDY = 0;
    this.wheel = 0;
  }
}
