import { Engine } from './core/engine.js';
import { Input } from './core/input.js';
import { AudioSys } from './core/audio.js';
import { UI } from './game/ui.js';
import { Game } from './game/game.js';

const canvas = document.getElementById('scene');

try {
  const engine = new Engine(canvas);
  const ui = new UI();
  const input = new Input(canvas);
  const audio = new AudioSys();
  const game = new Game({ engine, ui, input, audio });
  game.boot();
  window.__coco = game;
} catch (error) {
  console.error(error);
  const tip = document.getElementById('loading-tip');
  if (tip) tip.textContent = '世界暂时没有打开。刷新一下，再把背包背上试试？';
}
