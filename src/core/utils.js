import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  seeded random                                                      */
/* ------------------------------------------------------------------ */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = mulberry32(20260718);
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
export const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/*  canvas texture helpers                                             */
/* ------------------------------------------------------------------ */
export function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, ctx: c.getContext('2d') };
}

export function canvasTexture(c, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  return t;
}

const FONT_HAND = '"HanziPen SC","Kaiti SC","STKaiti","KaiTi",cursive';
const FONT_UI = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function grassTexture(seed = 1, base = [132, 165, 93], light = [158, 188, 112]) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(512, 512);
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
  ctx.fillRect(0, 0, 512, 512);
  // soft patches
  for (let i = 0; i < 60; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 80;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const a = r() * 0.12;
    g.addColorStop(0, `rgba(${light[0]},${light[1]},${light[2]},${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // blades
  for (let i = 0; i < 4200; i++) {
    const x = r() * 512, y = r() * 512;
    const l = 2 + r() * 6;
    const hue = 78 + r() * 40;
    ctx.strokeStyle = `hsla(${hue}, ${28 + r() * 22}%, ${30 + r() * 22}%, ${0.25 + r() * 0.5})`;
    ctx.lineWidth = 1 + r();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 3, y - l);
    ctx.stroke();
  }
  // tiny flowers
  for (let i = 0; i < 26; i++) {
    const x = r() * 512, y = r() * 512;
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,248,224,.7)' : 'rgba(246,201,120,.55)';
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + r() * 1.3, 0, TAU);
    ctx.fill();
  }
  return canvasTexture(c, { repeat: [12, 12] });
}

export function pavingTexture(kind = 'slab', seed = 2) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(512, 512);
  if (kind === 'cobble') {
    ctx.fillStyle = '#b6a995';
    ctx.fillRect(0, 0, 512, 512);
    const cols = 8, rows = 12;
    const cw = 512 / cols, ch = 512 / rows;
    for (let y = -1; y <= rows; y++) {
      for (let x = -1; x <= cols; x++) {
        const ox = (y % 2 === 0 ? 0 : cw / 2) + x * cw;
        const oy = y * ch;
        const w = cw - 7 - r() * 4, h = ch - 7 - r() * 3;
        const l = 58 + r() * 15;
        ctx.fillStyle = `hsl(${32 + r() * 12}, ${9 + r() * 8}%, ${l}%)`;
        roundRect(ctx, ox + 4 + r() * 2, oy + 4, w, h, 9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.09)';
        roundRect(ctx, ox + 6, oy + 5, w - 6, h * 0.32, 7);
        ctx.fill();
      }
    }
  } else if (kind === 'slab') {
    ctx.fillStyle = '#a89f92';
    ctx.fillRect(0, 0, 512, 512);
    const n = 4, s = 512 / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const l = 66 + r() * 12;
        ctx.fillStyle = `hsl(${34 + r() * 12}, ${6 + r() * 6}%, ${l}%)`;
        ctx.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(x * s + 4, y * s + 4, s - 8, s * 0.16);
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = `rgba(60,50,40,${r() * 0.08})`;
          ctx.fillRect(x * s + 5 + r() * (s - 12), y * s + 5 + r() * (s - 12), 1.6, 1.6);
        }
      }
    }
  } else if (kind === 'stone') {
    ctx.fillStyle = '#c8bfae';
    ctx.fillRect(0, 0, 512, 512);
    const s = 128;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const l = 72 + r() * 8;
        ctx.fillStyle = `hsl(${38 + r() * 8}, ${8 + r() * 6}%, ${l}%)`;
        roundRect(ctx, x * s + 4, y * s + 4, s - 8, s - 8, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(90,75,60,.12)';
        ctx.stroke();
      }
    }
  } else if (kind === 'gravel') {
    ctx.fillStyle = '#d9d0bd';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5200; i++) {
      const l = 42 + r() * 40;
      ctx.fillStyle = `hsla(${35 + r() * 20}, ${6 + r() * 12}%, ${l}%, ${0.28 + r() * 0.45})`;
      const s = 0.8 + r() * 2.4;
      ctx.beginPath();
      ctx.ellipse(r() * 512, r() * 512, s, s * (0.6 + r() * 0.6), r() * TAU, 0, TAU);
      ctx.fill();
    }
    // raked lines
    ctx.strokeStyle = 'rgba(120,104,86,.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(256, 256, 40 + i * 28, 0, TAU);
      ctx.stroke();
    }
  } else if (kind === 'asphalt') {
    ctx.fillStyle = '#4c4d4d';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const l = 24 + r() * 34;
      ctx.fillStyle = `hsla(${30 + r() * 30}, ${2 + r() * 5}%, ${l}%, ${0.18 + r() * 0.32})`;
      ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2.2, 1 + r() * 2.2);
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * 512, y = r() * 512;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 18 + r() * 55);
      g.addColorStop(0, `rgba(28,30,31,${0.05 + r() * 0.08})`);
      g.addColorStop(1, 'rgba(28,30,31,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    }
    ctx.strokeStyle = 'rgba(26,27,27,.25)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = r() * 512, y = r() * 512;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (r() - 0.5) * 60;
        y += 20 + r() * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  return canvasTexture(c, {
    repeat: kind === 'gravel' ? [7, 7] : kind === 'asphalt' ? [5, 5] : [6, 6],
  });
}

export function sandTexture(seed = 5) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(512, 512);
  ctx.fillStyle = '#e6d3ac';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    ctx.fillStyle = `hsla(${38 + r() * 16}, ${22 + r() * 20}%, ${60 + r() * 22}%, ${0.2 + r() * 0.5})`;
    ctx.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = 'rgba(255,250,236,.65)';
    ctx.beginPath();
    ctx.arc(r() * 512, r() * 512, 1 + r() * 2.4, 0, TAU);
    ctx.fill();
  }
  return canvasTexture(c, { repeat: [10, 10] });
}

export function copperTexture(seed = 7) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(512, 1024);
  const g = ctx.createLinearGradient(0, 0, 512, 1024);
  g.addColorStop(0, '#79b7a3');
  g.addColorStop(0.45, '#8fc7b2');
  g.addColorStop(0.75, '#6da795');
  g.addColorStop(1, '#87bfa9');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 240; i++) {
    const x = r() * 512, y = r() * 1024, rad = 6 + r() * 60;
    const bright = r() > 0.5;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, bright ? 'rgba(186,224,205,.18)' : 'rgba(48,100,84,.18)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // vertical streaks
  for (let i = 0; i < 90; i++) {
    ctx.strokeStyle = `rgba(${r() > 0.5 ? '210,238,222' : '46,92,76'},${0.03 + r() * 0.08})`;
    ctx.lineWidth = 1 + r() * 5;
    const x = r() * 512;
    ctx.beginPath();
    ctx.moveTo(x, r() * 200);
    ctx.bezierCurveTo(x + 20, 380, x - 16, 700, x + 8, 1024);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [3, 2] });
}

export function barkTexture(seed = 9) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(256, 512);
  ctx.fillStyle = '#7c5c42';
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = `rgba(${r() > 0.5 ? '48,33,22' : '168,134,100'},${0.12 + r() * 0.3})`;
    ctx.lineWidth = 1 + r() * 6;
    const x = r() * 256;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.bezierCurveTo(x + 14, 150, x - 12, 320, x + 6, 522);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [3, 2] });
}

export function roofTexture(seed = 11, base = '#4e5c58') {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) {
    for (let x = -1; x < 8; x++) {
      const ox = x * 32 + (y % 2 ? 16 : 0);
      ctx.strokeStyle = 'rgba(255,255,255,.09)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ox + 16, y * 32 + 30, 17, Math.PI, TAU);
      ctx.stroke();
    }
  }
  return canvasTexture(c, { repeat: [5, 5] });
}

export function windowTextures(seed, base = '#6c7f8d', litChance = 0.3) {
  const r = mulberry32(seed);
  const { c, ctx } = canvas2d(256, 512);
  const { c: ce, ctx: cte } = canvas2d(256, 512);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);
  cte.fillStyle = '#000';
  cte.fillRect(0, 0, 256, 512);
  const cols = 5, rows = 12;
  const cw = 256 / cols, ch = 512 / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const wx = x * cw + 10, wy = y * ch + 10;
      const ww = cw - 20, wh = ch - 22;
      const lit = r() < litChance;
      ctx.fillStyle = lit ? '#f7d89c' : `rgba(22,30,40,${0.5 + r() * 0.3})`;
      ctx.fillRect(wx, wy, ww, wh);
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(wx, wy, ww, 3);
      if (lit) {
        cte.fillStyle = r() > 0.4 ? '#ffcf88' : '#ffe6b8';
        cte.fillRect(wx, wy, ww, wh);
      }
    }
  }
  return {
    map: canvasTexture(c, { repeat: [1, 1] }),
    emissiveMap: canvasTexture(ce, { repeat: [1, 1] }),
  };
}

export function flagTexture(kind) {
  const { c, ctx } = canvas2d(480, 300);
  if (kind === 'usa') {
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#c9554c' : '#f8f3e8';
      ctx.fillRect(0, i * 300 / 13, 480, 300 / 13 + 1);
    }
    ctx.fillStyle = '#354c78';
    ctx.fillRect(0, 0, 200, 300 * 7 / 13);
    ctx.fillStyle = '#f8f3e8';
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 6; x++) {
        const ox = 18 + x * 30 + (y % 2 ? 14 : 0);
        const oy = 17 + y * 28;
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 5;
          const rad = k % 2 ? 2.6 : 6;
          ctx.lineTo(ox + Math.cos(a) * rad, oy + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  } else if (kind === 'france') {
    ctx.fillStyle = '#3e5c8f'; ctx.fillRect(0, 0, 160, 300);
    ctx.fillStyle = '#f8f3e8'; ctx.fillRect(160, 0, 160, 300);
    ctx.fillStyle = '#c9554c'; ctx.fillRect(320, 0, 160, 300);
  } else {
    ctx.fillStyle = '#f8f3e8'; ctx.fillRect(0, 0, 480, 300);
    ctx.fillStyle = '#c9554c';
    ctx.beginPath(); ctx.arc(240, 150, 72, 0, TAU); ctx.fill();
  }
  return canvasTexture(c);
}

export function signTexture(text, {
  sub = '', bg = '#f7efdc', fg = '#40332c', border = '#40332c',
  font = FONT_HAND, size = 84, w = 512, h = 200, tape = true,
} = {}) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  if (tape) {
    ctx.fillStyle = 'rgba(215,178,104,.45)';
    ctx.save();
    ctx.translate(40, 22); ctx.rotate(-0.35);
    ctx.fillRect(-30, -10, 84, 24);
    ctx.restore();
  }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${size}px ${font}`;
  ctx.fillText(text, w / 2, sub ? h * 0.42 : h * 0.5);
  if (sub) {
    ctx.font = `600 ${Math.max(18, size * 0.26)}px ${FONT_UI}`;
    ctx.globalAlpha = 0.62;
    ctx.fillText(sub, w / 2, h * 0.72);
  }
  return canvasTexture(c);
}

export function sparkleTexture(seed = 3) {
  const { c, ctx } = canvas2d(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,246,205,.95)');
  g.addColorStop(0.45, 'rgba(255,205,102,.34)');
  g.addColorStop(1, 'rgba(255,190,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const r = i % 2 ? 8 : 40;
    ctx.lineTo(64 + Math.cos(a) * r * 0.35, 64 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  return canvasTexture(c);
}

export function dotTexture() {
  const { c, ctx } = canvas2d(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvasTexture(c);
}

export function petalTexture() {
  const { c, ctx } = canvas2d(64, 64);
  ctx.translate(32, 32);
  ctx.fillStyle = '#ffd5dd';
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.bezierCurveTo(20, -18, 22, 8, 0, 24);
  ctx.bezierCurveTo(-22, 8, -20, -18, 0, -24);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.beginPath();
  ctx.ellipse(-4, -10, 5, 10, 0.4, 0, TAU);
  ctx.fill();
  return canvasTexture(c);
}

export function cloudTexture() {
  const { c, ctx } = canvas2d(512, 256);
  const blobs = [
    [150, 160, 90], [240, 120, 110], [340, 150, 95], [400, 175, 60], [100, 185, 55], [280, 190, 75],
  ];
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,252,244,.95)');
    g.addColorStop(0.65, 'rgba(255,249,238,.72)');
    g.addColorStop(1, 'rgba(255,246,232,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  return canvasTexture(c);
}

export function mosaicTexture() {
  const { c, ctx } = canvas2d(512, 512);
  ctx.fillStyle = '#d9cdb7';
  ctx.fillRect(0, 0, 512, 512);
  ctx.translate(256, 256);
  const rings = [
    [240, '#7ba49b'], [206, '#e8dcc2'], [176, '#c9968a'], [140, '#f1e6cf'],
    [108, '#7ba49b'], [74, '#e8dcc2'], [42, '#f0b64b'],
  ];
  for (const [r, col] of rings) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(63,49,43,.55)';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = i * TAU / 16;
    const rad = i % 2 ? 20 : 36;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill();
  // tiled seams
  ctx.strokeStyle = 'rgba(80,64,48,.16)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 22 + i * 16, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * 240, Math.sin(a) * 240);
    ctx.stroke();
  }
  return canvasTexture(c, { repeat: [1, 1] });
}

export function waterNormalTexture(seed = 13) {
  const r = mulberry32(seed);
  const size = 256;
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 260; i++) {
    const x = r() * size, y = r() * size;
    const rad = 6 + r() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const dx = 110 + r() * 36, dy = 110 + r() * 36;
    g.addColorStop(0, `rgba(${dx},${dy},255,.6)`);
    g.addColorStop(0.5, 'rgba(128,128,255,.2)');
    g.addColorStop(1, 'rgba(128,128,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  return t;
}

/* ------------------------------------------------------------------ */
/*  geometry helpers                                                   */
/* ------------------------------------------------------------------ */
export function beamMatrix(a, b, width, depth = width) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const m = new THREE.Matrix4();
  m.compose(mid, q, new THREE.Vector3(width, len, depth));
  return m;
}

export function instancedBeams(segments, material, { castShadow = true, receiveShadow = false } = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, segments.length);
  segments.forEach((s, i) => {
    mesh.setMatrixAt(i, beamMatrix(s.a, s.b, s.w, s.d || s.w));
  });
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function makeLathe(points, segments, material, { phiStart = 0, phiLength = TAU } = {}) {
  const geo = new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), segments, phiStart, phiLength);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function addMesh(parent, geo, mat, pos = [0, 0, 0], opts = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  if (opts.scale) m.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
  m.castShadow = opts.castShadow !== false;
  m.receiveShadow = opts.receiveShadow !== false;
  parent.add(m);
  return m;
}

export function box(w, h, d, mat, pos, opts = {}) {
  return addMesh(opts.parent || new THREE.Group(), new THREE.BoxGeometry(w, h, d), mat, pos, opts);
}

export function canvasPlane(tex, w, h, { transparent = true, doubleSide = true, emissive = false } = {}) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent, side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: !transparent, toneMapped: !emissive ? true : false,
    alphaTest: transparent ? 0.01 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return mesh;
}

/* soft blob shadow - a cheap trick for props that don't need real shadow */
export function blobShadow(radius = 1, opacity = 0.22) {
  const geo = new THREE.CircleGeometry(radius, 24);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x2c2119, transparent: true, opacity, depthWrite: false,
    map: (() => {
      const { c, ctx } = canvas2d(128, 128);
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(0,0,0,.65)');
      g.addColorStop(0.6, 'rgba(0,0,0,.28)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
      const t = new THREE.CanvasTexture(c); return t;
    })(),
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function disposeObject(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        for (const k in m) {
          const v = m[k];
          if (v && v.isTexture) v.dispose();
        }
        m.dispose();
      });
    }
  });
}

export function screenToWorldRay(camera, ndcX, ndcY, raycaster) {
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  return raycaster.ray;
}

/* triangle wave 0..1 */
export function pingPong(t) {
  const x = t % 2;
  return x < 1 ? x : 2 - x;
}
