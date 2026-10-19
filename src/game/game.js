import * as THREE from 'three';
import { Coco, PaperPlane } from '../world/character.js';
import { Player, FollowCamera } from './player.js';
import { createUSA } from '../world/cities/usa.js';
import { createFrance } from '../world/cities/france.js';
import { createJapan } from '../world/cities/japan.js';
import { createHeartGate, BurstSystem } from '../world/collectibles.js';
import { disposeObject } from '../core/utils.js';
import { emptyProgress, loadProgress, saveProgress } from '../core/save.js';
import titleArt from '../assets/title.jpg';

const FACTORY = { usa: createUSA, france: createFrance, japan: createJapan };
const CITY_NAMES = { usa: '纽约', france: '巴黎', japan: '东京' };
const NEXT_CITY = { usa: 'france', france: 'japan', japan: null };
const CITY_ORDER = ['usa', 'france', 'japan'];
const GATE_NAMES = { usa: '自由女神像', france: '埃菲尔铁塔', japan: '东京塔' };

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export class Game {
  constructor({ engine, ui, input, audio }) {
    this.engine = engine;
    this.ui = ui;
    this.input = input;
    this.audio = audio;

    this.progress = loadProgress();
    this.city = null;
    this.gate = null;
    this.mode = 'loading';
    this.busy = false;
    this.t = 0;
    this.sparkCount = 0;
    this.interaction = null;
    this.promptKey = '';
    this.landmarkSeenKnown = false;
    this.cineQueue = [];
    this.cineT = 0;
    this.fxIndex = 0;
    this.controlsFaded = false;

    const scene = engine.scene;
    this.coco = new Coco();
    this.plane = new PaperPlane();
    scene.add(this.coco.root);
    scene.add(this.plane.root);
    this.coco.root.visible = false;
    this.plane.root.visible = false;

    this.player = new Player(this.coco);
    this.cameraRig = new FollowCamera(engine.camera);
    this.bursts = new BurstSystem(scene);

    this.player.onJump = () => this.audio.play('jump');
    this.player.onLand = (speed) => { if (speed > 3.2) this.audio.play('land'); };
    this.input.onAnyInput = () => this.audio.unlock();

    this.bindUI();
    this.bindDom();
    this.applySettings(this.progress?.settings || { sfx: true, music: false });
    this.setupTouch();
    this.ui.setTitleArt(titleArt);

    this.lastTime = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  /* ------------------------------------------------------------------ */
  /*  wiring                                                             */
  /* ------------------------------------------------------------------ */
  bindUI() {
    const ui = this.ui;
    ui.onJournal = () => this.openJournal();
    ui.onJournalClose = () => {
      if (this.mode === 'journal') {
        this.mode = 'play';
        this.audio.play('close');
      }
    };
    ui.onHelp = () => this.openHelp();
    ui.onHelpClose = () => {
      if (this.mode === 'help') this.mode = 'play';
    };
    ui.onPause = () => this.openPause();
    ui.onResume = () => {
      if (this.mode === 'pause') {
        this.mode = 'play';
        this.audio.play('close');
      }
    };
    ui.onPauseJournal = () => this.openJournal(true);
    ui.onPauseTitle = () => {
      this.save();
      window.location.reload();
    };
    ui.onSound = () => this.toggleSfx();
    ui.onMusicToggle = (on) => {
      this.audio.setMusic(on);
      if (!this.progress) return;
      this.progress.settings.music = on;
      this.save();
    };
    ui.onSfxToggle = (on) => {
      this.audio.setSfx(on);
      ui.setSoundIcon(on);
      if (!this.progress) return;
      this.progress.settings.sfx = on;
      this.save();
      if (on) this.audio.play('click');
    };
    ui.onCeremonyNext = () => this.leaveCeremony();
    ui.onEndingFree = () => this.freeRoam();
    ui.onEndingTitle = () => {
      this.save();
      window.location.reload();
    };
    ui.onButton = () => this.audio.play('click');
    ui.onTalkBlip = () => this.audio.play('talk');
  }

  bindDom() {
    document.getElementById('btn-start')?.addEventListener('click', () => this.requestNewJourney());
    document.getElementById('btn-continue')?.addEventListener('click', () => this.continueJourney());
    document.getElementById('btn-intro-next')?.addEventListener('click', () => this.beginFromIntro());
    document.getElementById('btn-intro-skip')?.addEventListener('click', () => this.beginFromIntro());

    document.getElementById('dialogue')?.addEventListener('click', (e) => {
      if (this.mode !== 'dialogue') return;
      if (e.target.closest('button')) return;
      this.ui.advanceDialogue();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Tab') return;
      e.preventDefault();
      if (this.mode === 'play') this.openJournal();
      else if (this.mode === 'journal') this.ui.closeJournal();
    });

    window.addEventListener('beforeunload', () => this.save());
  }

  setupTouch() {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const touchy = coarse || (navigator.maxTouchPoints > 0 && window.innerWidth < 980);
    if (touchy) this.ui.d.touchControls?.classList.remove('hidden');
  }

  applySettings(settings) {
    this.audio.setSfx(settings.sfx !== false);
    this.audio.musicOn = !!settings.music;
    this.ui.syncSettings({ sfx: settings.sfx !== false, music: !!settings.music });
  }

  /* ------------------------------------------------------------------ */
  /*  boot & title                                                       */
  /* ------------------------------------------------------------------ */
  async boot() {
    this.mode = 'loading';
    this.ui.showLoading('正在系好旅行靴的鞋带…');
    this.ui.setLoading(18);

    const art = new Image();
    art.src = titleArt;
    const loaded = new Promise((resolve) => {
      art.onload = resolve;
      art.onerror = resolve;
    });

    await delay(420);
    this.ui.setLoading(52, '正在给热气球打气…');
    await delay(420);
    this.ui.setLoading(78, '正在把护照放进背包…');
    await Promise.race([loaded, delay(900)]);
    this.ui.setLoading(100);

    const startBtn = document.getElementById('btn-start');
    const continueBtn = document.getElementById('btn-continue');
    if (this.progress?.started) {
      if (startBtn) {
        startBtn.className = 'btn btn-ghost';
        startBtn.textContent = '重新开始';
      }
      if (continueBtn) {
        continueBtn.className = 'btn btn-primary';
        continueBtn.textContent = this.progress.completed ? '继续漫游' : '继续旅程';
        continueBtn.classList.remove('hidden');
      }
    }

    await delay(220);
    this.ui.hideLoading();
    this.ui.show('title');
    this.mode = 'title';
  }

  requestNewJourney() {
    if (this.progress?.started) {
      const ok = window.confirm('要重新开始一段新的旅程吗？现有的护照印章和旅途笔记会被清空。');
      if (!ok) return;
    }
    this.progress = emptyProgress();
    this.progress.started = true;
    this.progress.settings = { sfx: true, music: false };
    this.applySettings(this.progress.settings);
    this.save();
    this.ui.hide('title');
    this.ui.showIntro();
    this.mode = 'intro';
    this.audio.play('open');
  }

  beginFromIntro() {
    if (this.busy || this.mode !== 'intro') return;
    this.ui.hideIntro();
    this.beginCity(this.startCityId());
  }

  continueJourney() {
    if (this.busy) return;
    if (!this.progress) {
      this.requestNewJourney();
      return;
    }
    this.progress.started = true;
    this.ui.hide('title');
    this.beginCity(this.startCityId());
  }

  startCityId() {
    const progress = this.progress;
    if (!progress) return 'usa';
    let idx = CITY_ORDER.indexOf(progress.city);
    if (idx < 0) idx = 0;
    while (idx < CITY_ORDER.length - 1 && progress.stamps[CITY_ORDER[idx]]) idx += 1;
    return CITY_ORDER[idx];
  }

  async beginCity(cityId) {
    if (this.busy) return;
    this.busy = true;
    this.mode = 'loading';
    const id = FACTORY[cityId] ? cityId : 'usa';
    this.ui.hide('hud');
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.ui.showLoading(`正在把${CITY_NAMES[id]}装进背包…`);
    this.ui.setLoading(16);
    await nextFrame();
    this.ui.setLoading(44, '正在搭起港口和街道…');
    await nextFrame();
    await nextFrame();

    this.enterCity(id);

    this.ui.setLoading(94, '正在叫醒岛上的居民…');
    await delay(320);
    this.ui.hideLoading();
    this.ui.show('hud');
    this.mode = 'play';
    this.busy = false;
    this.showArrival();
    if (!this.controlsFaded) {
      this.controlsFaded = true;
      setTimeout(() => this.ui.fadeControls(), 16000);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  city lifecycle                                                     */
  /* ------------------------------------------------------------------ */
  enterCity(cityId) {
    this.unloadCity();
    const factory = FACTORY[cityId];
    if (!factory) return;

    const city = factory(this.engine.scene);
    this.city = city;
    this.cameraRig.setBlockers(city.cameraBlockers || []);

    const landmarkKey = city.facts.find((f) => f.key.endsWith('-landmark'))?.key;
    city.factsState.landmarkSeen = !!(landmarkKey && this.progress.facts[landmarkKey]);
    this.landmarkSeenKnown = city.factsState.landmarkSeen;

    this.gate = createHeartGate({
      position: city.heart.clone(),
      label: `点亮${city.cityName}`,
    });
    city.group.add(this.gate.group);

    this.restoreCityState();

    this.player.setCity({
      walkables: city.walkables,
      colliders: city.colliders,
      walkRadius: city.walkRadius,
      walkAreas: city.walkAreas,
      spawn: city.spawn,
      spawnYaw: city.spawnYaw,
    });

    this.coco.root.visible = true;
    this.plane.root.visible = true;
    this.plane.pos.set(city.spawn.x + 0.9, city.spawn.y + 1.7, city.spawn.z + 0.6);
    this.plane.root.position.copy(this.plane.pos);
    this.plane.faceYaw = city.spawnYaw;

    this.cameraRig.clearCinematic();
    this.cameraRig.reset(city.spawnYaw - Math.PI);
    this.snapCamera();

    this.engine.setBloom({ strength: 0.34, radius: 0.55, threshold: 0.9 });
    this.audio.city = city.id;

    if (this.progress.stamps[city.id]) city.setLit(true);

    this.sparkCount = this.countSparks();
    this.progress.sparks[city.id] = this.sparkCount;
    this.progress.city = city.id;
    this.progress.started = true;

    this.ui.setCity(city);
    this.ui.setSpark(this.sparkCount, 5, false);
    this.syncGate(false);
    this.refreshObjective();
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    this.interaction = null;

    this.input.touchAction = false;
    this.input.touchJump = false;
    this.input.dragging = false;

    this.save();
  }

  unloadCity() {
    if (!this.city) return;
    this.bursts.dispose();
    const { group, env } = this.city;
    this.engine.scene.remove(group);
    if (env?.group) this.engine.scene.remove(env.group);
    disposeObject(group);
    if (env?.group) disposeObject(env.group);
    this.engine.scene.fog = null;
    this.city = null;
    this.gate = null;
    this.cameraRig?.setBlockers([]);
    this.coco.root.visible = false;
    this.plane.root.visible = false;
    this.cineQueue = [];
  }

  restoreCityState() {
    const city = this.city;
    if (!city) return;
    const savedIds = new Set(this.progress.sparkIds[city.id] || []);
    city.sparks.forEach((spark) => {
      if (savedIds.has(spark.id)) spark.setVisible(false);
      else spark.setVisible(true);
    });

    city.quests.forEach((q) => {
      const state = this.progress.quests[q.id];
      const item = city.questItems.find((i) => i.id === q.id);
      const npc = this.npcById(q.npcId);
      if (state === 'active') {
        item?.setActive(true);
        npc?.setMarker('none');
      } else if (state === 'ready') {
        item?.setActive(false);
        npc?.setMarker('ready');
      } else if (state === 'done') {
        item?.setActive(false);
        npc?.setMarker('done');
      } else {
        item?.setActive(false);
        npc?.setMarker('quest');
      }
    });
  }

  snapCamera() {
    const rig = this.cameraRig;
    const p = this.player.position;
    const ty = p.y + 1.15;
    rig.target.set(p.x, ty, p.z);
    rig.ready = true;
    const cp = Math.cos(rig.pitch);
    rig.camera.position.set(
      p.x + Math.sin(rig.yaw) * cp * rig.dist,
      ty + Math.sin(rig.pitch) * rig.dist + 0.4,
      p.z + Math.cos(rig.yaw) * cp * rig.dist,
    );
    rig.camera.lookAt(rig.target);
  }

  countSparks() {
    if (!this.city) return 0;
    const ids = new Set(this.city.sparks.map((s) => s.id));
    const saved = new Set((this.progress.sparkIds[this.city.id] || []).filter((id) => ids.has(id)));
    const questSparks = this.city.quests.filter((q) => this.progress.quests[q.id] === 'done').length;
    return Math.min(5, saved.size + questSparks);
  }

  syncSparks(announce = true) {
    if (!this.city) return;
    const prevGate = this.gate?.active;
    this.sparkCount = this.countSparks();
    this.progress.sparks[this.city.id] = this.sparkCount;
    this.ui.setSpark(this.sparkCount, 5, announce);
    const active = this.sparkCount >= 5 && !this.progress.stamps[this.city.id];
    this.gate?.setActive(active);
    if (announce && active && !prevGate) {
      this.audio.play('quest');
      this.ui.questFlash('五颗星火，聚齐了！', `去${GATE_NAMES[this.city.id]}前的光之门，按下 E`, 3800);
    }
    this.refreshObjective();
    this.save();
  }

  syncGate(announce = false) {
    if (!this.city || !this.gate) return;
    const active = this.sparkCount >= 5 && !this.progress.stamps[this.city.id];
    const was = this.gate.active;
    this.gate.setActive(active);
    if (announce && active && !was) {
      this.audio.play('quest');
      this.ui.questFlash('光之门，亮起来了', `去${GATE_NAMES[this.city.id]}前点亮城市`, 3600);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  frame loop                                                         */
  /* ------------------------------------------------------------------ */
  frame(now) {
    const dt = Math.min(0.05, Math.max(0.0005, (now - this.lastTime) / 1000));
    this.lastTime = now;
    this.tick(dt);
    requestAnimationFrame(this.frame);
  }

  tick(dt) {
    this.t += dt;
    this.ui.update(dt);
    this.handleHotkeys();

    if (this.city) {
      this.city.update(dt, this.t, this.player.position);
      this.gate?.update(dt, this.t);
      this.bursts.update(dt);
      this.checkLandmarkFact();

      if (this.mode === 'play') {
        this.player.update(dt, this.input, this.cameraRig.yaw);
        this.checkPickups();
        this.updateInteraction();
        if (this.input.consumeInteract() && this.interaction) this.doInteract();
        if (this.mode === 'play') this.updateCompass();
      } else if (this.mode === 'ferry') {
        this.updateFerry(dt);
      } else if (['dialogue', 'journal', 'pause', 'help', 'cinema'].includes(this.mode)) {
        this.player.update(dt, this.input, this.cameraRig.yaw, { inputEnabled: false, allowJump: false });
        if (this.mode === 'dialogue') {
          if (this.input.consumeInteract() || this.input.wasPressed('Space')) this.ui.advanceDialogue();
        }
      }

      if (this.mode === 'cinema') this.updateCinema(dt);

      this.plane.update(dt, this.player.position, this.player.yaw, this.player.idleTime);
      this.cameraRig.update(dt, this.player.position, this.mode === 'play' ? this.input : null);
    }

    this.engine.render();
    this.input.endFrame();
  }

  handleHotkeys() {
    if (this.input.wasPressed('Escape')) this.handleEscape();
  }

  handleEscape() {
    switch (this.mode) {
      case 'play':
        this.openPause();
        break;
      case 'journal':
        this.ui.closeJournal();
        break;
      case 'help':
        this.ui.closeHelp();
        break;
      case 'pause':
        this.ui.closePause();
        this.mode = 'play';
        this.audio.play('close');
        break;
      case 'dialogue':
        this.ui.closeDialogue();
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  interaction & collectibles                                         */
  /* ------------------------------------------------------------------ */
  npcById(id) {
    return this.city?.npcs.find((n) => n.def.id === id) || null;
  }

  checkPickups() {
    const p = this.player.position;

    for (const spark of this.city.sparks) {
      if (spark.collected || spark.isCollecting) continue;
      const s = spark.group.position;
      if (Math.abs(s.y - p.y) > 1.9) continue;
      const dx = s.x - p.x, dz = s.z - p.z;
      if (dx * dx + dz * dz > 1.35 * 1.35) continue;
      this.collectSpark(spark);
      break;
    }

    for (const q of this.city.quests) {
      if (this.progress.quests[q.id] !== 'active') continue;
      const item = this.city.questItems.find((i) => i.id === q.id);
      if (!item || !item.group.visible) continue;
      const s = item.group.position;
      if (Math.abs(s.y - p.y) > 2.4) continue;
      const dx = s.x - p.x, dz = s.z - p.z;
      if (dx * dx + dz * dz > 1.55 * 1.55) continue;
      this.findQuestItem(q, item);
      break;
    }
  }

  collectSpark(spark) {
    const list = this.progress.sparkIds[this.city.id];
    if (!list.includes(spark.id)) list.push(spark.id);
    spark.collect();
    this.audio.play('spark', { index: Math.max(0, this.sparkCount - 1) });
    this.ui.toast({
      icon: '✦',
      title: '找到一颗星火',
      sub: spark.label,
      duration: 3200,
    });
    this.syncSparks(true);
  }

  findQuestItem(q, item) {
    this.progress.quests[q.id] = 'ready';
    item.setActive(false);
    const npc = this.npcById(q.npcId);
    npc?.setMarker('ready');
    const p = item.group.position;
    this.bursts.emit(new THREE.Vector3(p.x, p.y + 0.35, p.z), {
      count: 16, spread: 1.8, up: 2.6, size: 0.22, gravity: 4.2, life: 1.1,
    });
    this.audio.play('questUpdate');
    this.ui.toast({
      icon: '✧',
      title: `找到了${q.item.label}`,
      sub: `带回去给 ${npc?.def.name || '居民'} 吧`,
      duration: 3800,
    });
    this.refreshObjective();
    this.save();
  }

  updateInteraction() {
    const p = this.player.position;
    let best = null;
    let bestD = Infinity;

    if (this.gate?.active) {
      const dx = this.city.heart.x - p.x, dz = this.city.heart.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 3.1) {
        best = { type: 'gate' };
        bestD = d;
      }
    }

    for (const npc of this.city.npcs) {
      const dx = npc.root.position.x - p.x;
      const dz = npc.root.position.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.35 && d < bestD) {
        best = { type: 'npc', npc };
        bestD = d;
      }
    }

    const stand = this.city.ferry?.riding ? null : this.city.ferry?.currentStand();
    if (stand) {
      const dx = stand.pos.x - p.x;
      const dz = stand.pos.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 2.9 && d < bestD) {
        best = { type: 'ferry', stand };
        bestD = d;
      }
    }

    this.interaction = best;
    const key = best ? (best.type === 'gate' ? 'gate' : best.type === 'ferry' ? `ferry:${best.stand.dock}` : `npc:${best.npc.def.id}`) : '';
    if (key === this.promptKey) return;
    this.promptKey = key;
    if (!best) {
      this.ui.hidePrompt();
    } else if (best.type === 'gate') {
      this.ui.setPrompt('点亮这座城市');
    } else if (best.type === 'ferry') {
      this.ui.setPrompt(best.stand.label);
    } else {
      this.ui.setPrompt(`和 ${best.npc.def.name} 说说话`);
    }
  }

  doInteract() {
    if (!this.interaction) return;
    if (this.interaction.type === 'gate') {
      this.startCinema();
      return;
    }
    if (this.interaction.type === 'ferry') {
      this.startFerry(this.interaction.stand);
      return;
    }
    this.talkTo(this.interaction.npc);
  }

  startFerry(stand) {
    if (this.mode !== 'play' || !this.city?.ferry) return;
    const ferry = this.city.ferry;
    if (!ferry.beginRide(stand.destination)) return;
    this.mode = 'ferry';
    this.ferryRide = {
      dest: stand.destination,
      arrive: ferry.arrival(stand.destination),
      boardT: 0,
      boardDur: 0.65,
      boardFrom: this.player.position.clone(),
    };
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    this.interaction = null;
    this.audio.play('whoosh', { volume: 0.25 });
  }

  updateFerry(dt) {
    if (!this.city?.ferry || !this.ferryRide) {
      this.mode = 'play';
      return;
    }
    const ferry = this.city.ferry;
    const ride = this.ferryRide;
    if (!ferry.riding) {
      const arrival = ride.arrive;
      this.player.pos.copy(arrival.pos);
      this.player.vy = 0;
      this.player.grounded = true;
      this.player.speed = 0;
      this.player.yaw = arrival.yaw;
      this.player.idleTime = 0;
      this.player.setSpawn(arrival.pos, arrival.yaw);
      this.coco.root.position.copy(arrival.pos);
      this.coco.root.rotation.y = arrival.yaw;
      this.coco.faceTowards(arrival.yaw, 1);
      this.cameraRig.yaw = arrival.yaw - Math.PI;
      this.mode = 'play';
      this.ferryRide = null;
      this.interaction = null;
      this.promptKey = '';
      this.audio.play('questUpdate', { volume: 0.5 });
      this.ui.toast({
        icon: '⛴',
        title: arrival.name,
        sub: '海风里带着一点自由的味道',
        teal: true,
        duration: 3200,
      });
      this.refreshObjective();
      return;
    }

    ride.boardT = Math.min(ride.boardDur, ride.boardT + dt);
    const k = ride.boardT / ride.boardDur;
    const ease = 1 - (1 - k) ** 3;
    const deck = ferry.getDeckPoint();
    const px = ride.boardFrom.x + (deck.x - ride.boardFrom.x) * ease;
    const py = ride.boardFrom.y + (deck.y - ride.boardFrom.y) * ease;
    const pz = ride.boardFrom.z + (deck.z - ride.boardFrom.z) * ease;
    this.player.pos.set(px, py, pz);
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.speed = 0;
    this.player.idleTime += dt;
    this.player.yaw = ferry.boatYaw;
    this.coco.root.position.copy(this.player.pos);
    this.coco.root.rotation.y = this.player.yaw;
    this.coco.update(dt, { moving: false, running: false, grounded: true, speed: 0 });

    let diff = ferry.boatYaw - this.cameraRig.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.cameraRig.yaw += diff * (1 - Math.exp(-1.6 * dt));
  }

  talkTo(npc) {
    const city = this.city;
    const q = city.quests.find((quest) => quest.npcId === npc.def.id);
    const state = q ? this.progress.quests[q.id] : null;
    const dialogues = npc.def.dialogues || {};
    let lines = dialogues.hint || dialogues.done || ['……'];
    let after = null;

    if (q) {
      if (!state) {
        lines = dialogues.new || dialogues.hint || ['……'];
        after = () => this.acceptQuest(q);
      } else if (state === 'active') {
        lines = dialogues.active || dialogues.hint || ['……'];
      } else if (state === 'ready') {
        lines = dialogues.ready || dialogues.done || ['……'];
        after = () => this.completeQuest(q);
      } else {
        lines = dialogues.done || dialogues.hint || ['……'];
      }
    }

    this.mode = 'dialogue';
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    npc.setTalking(true);
    this.audio.play('open');

    this.ui.openDialogue({
      def: npc.def,
      lines,
      onDone: () => {
        npc.setTalking(false);
        this.mode = 'play';
        after?.();
      },
    });
  }

  acceptQuest(q) {
    if (this.progress.quests[q.id]) return;
    this.progress.quests[q.id] = 'active';
    const item = this.city.questItems.find((i) => i.id === q.id);
    item?.setActive(true);
    this.npcById(q.npcId)?.setMarker('none');
    this.audio.play('quest');
    this.ui.questFlash(`新任务 · ${q.title}`, q.short, 3900);
    this.refreshObjective();
    this.save();
  }

  completeQuest(q) {
    if (this.progress.quests[q.id] !== 'ready') return;
    this.progress.quests[q.id] = 'done';
    const npc = this.npcById(q.npcId);
    npc?.setMarker('done');
    if (npc) {
      const p = npc.root.position;
      this.bursts.emit(new THREE.Vector3(p.x, 1.25, p.z), {
        count: 30, spread: 2.6, up: 4.2, size: 0.3, gravity: 3.6, life: 1.5,
        colors: ['#ffd37c', '#fff3cf', '#f0a94b', '#8fd0c4'],
      });
    }
    this.audio.play('quest');
    this.ui.toast({
      icon: '✓',
      title: '任务完成',
      sub: `获得 ${q.reward}`,
      teal: true,
      duration: 4200,
    });
    this.syncSparks(true);
  }

  /* ------------------------------------------------------------------ */
  /*  compass & objectives                                              */
  /* ------------------------------------------------------------------ */
  updateCompass() {
    if (!this.city) return;
    const stamped = this.progress.stamps[this.city.id];
    if (stamped) {
      this.ui.hideCompass();
      return;
    }
    const p = this.player.position;
    let target = null;
    let label = '';

    if (this.sparkCount >= 5) {
      target = this.city.heart;
      label = '光之门';
    } else {
      const ready = this.city.quests.find((q) => this.progress.quests[q.id] === 'ready');
      if (ready) {
        const npc = this.npcById(ready.npcId);
        if (npc) {
          target = npc.root.position;
          label = `交给 ${npc.def.name}`;
        }
      }
      if (!target) {
        const active = this.city.quests.find((q) => this.progress.quests[q.id] === 'active');
        const item = active && this.city.questItems.find((i) => i.id === active.id);
        if (item) {
          target = item.group.position;
          label = active.item.label;
        }
      }
      if (!target) {
        let best = null;
        let bestD = Infinity;
        const saved = new Set(this.progress.sparkIds[this.city.id] || []);
        for (const spark of this.city.sparks) {
          if (saved.has(spark.id) || spark.collected) continue;
          const d = Math.hypot(spark.group.position.x - p.x, spark.group.position.z - p.z);
          if (d < bestD) { best = spark; bestD = d; }
        }
        if (best) {
          target = best.group.position;
          label = '星火';
        }
      }
      if (!target) {
        const available = this.city.quests.find((q) => !this.progress.quests[q.id]);
        if (available) {
          const npc = this.npcById(available.npcId);
          if (npc) {
            target = npc.root.position;
            label = npc.def.name;
          }
        }
      }
      if (!target) {
        target = this.city.heart;
        label = GATE_NAMES[this.city.id];
      }
    }

    const dx = target.x - p.x;
    const dz = target.z - p.z;
    const yaw = this.cameraRig.yaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const angle = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
    this.ui.setCompass(angle, label);
  }

  refreshObjective() {
    if (!this.city) return;
    const city = this.city;
    const stamped = this.progress.stamps[city.id];
    let title = '';
    let text = '';

    if (stamped) {
      title = '自由漫游';
      text = '这座城市已经重新亮起来了。听听风，看看灯，和朋友们说声再见。';
    } else if (this.sparkCount >= 5) {
      title = '点亮城市';
      text = `星火已经聚齐。走到${GATE_NAMES[city.id]}前的光之门，按下 E。`;
    } else {
      const ready = city.quests.find((q) => this.progress.quests[q.id] === 'ready');
      const active = city.quests.find((q) => this.progress.quests[q.id] === 'active');
      const available = city.quests.find((q) => !this.progress.quests[q.id]);
      if (ready) {
        const npc = this.npcById(ready.npcId);
        title = '把东西带回去';
        text = `把${ready.item.label}交给 ${npc?.def.name || '居民'}，他一定等急了。`;
      } else if (active) {
        title = active.title;
        text = `在岛上找找${active.item.label}。它正一闪一闪地发光呢。`;
      } else if (available) {
        const npc = this.npcById(available.npcId);
        title = '听听岛上的故事';
        text = `${npc?.def.name || '居民'}好像需要帮忙。头顶有金色感叹号的人都可以聊一聊。`;
      } else {
        title = '寻找星火';
        text = `还差 ${5 - this.sparkCount} 颗星火。试试跳上箱子、爬上台阶，去岛上每个角落看看。`;
      }
    }
    this.ui.setObjective(title, text);
  }

  checkLandmarkFact() {
    if (!this.city || this.landmarkSeenKnown) return;
    if (!this.city.factsState.landmarkSeen) return;
    this.landmarkSeenKnown = true;
    const fact = this.city.facts.find((f) => f.key.endsWith('-landmark'));
    if (fact) this.unlockFact(this.city, fact, true);
  }

  unlockFact(city, fact, announce = true) {
    if (!fact) return false;
    if (this.progress.facts[fact.key] && this.progress.factNotes[fact.key]) return false;
    this.progress.facts[fact.key] = true;
    this.progress.factNotes[fact.key] = {
      city: city.cityName,
      title: fact.title,
      text: fact.text,
    };
    this.save();
    if (announce) {
      this.audio.play('open');
      this.ui.toast({
        icon: '✎',
        title: '旅途笔记 · 新的一页',
        sub: fact.title,
        teal: true,
        duration: 3600,
      });
    }
    return true;
  }

  showArrival() {
    if (!this.city) return;
    const city = this.city;
    const arrival = city.facts.find((f) => f.key.endsWith('-arrival'));
    const isNew = arrival ? this.unlockFact(city, arrival, false) : false;

    setTimeout(() => {
      if (!this.city || this.city.id !== city.id) return;
      this.ui.questFlash(city.locationCn, city.intro, 4600);
      this.audio.play('open');
    }, 180);

    if (isNew) {
      setTimeout(() => {
        if (!this.city || this.city.id !== city.id) return;
        this.ui.toast({
          icon: '✎',
          title: '旅途笔记 · 新的一页',
          sub: arrival.title,
          teal: true,
          duration: 3800,
        });
      }, 2700);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  cinematic & stamp                                                  */
  /* ------------------------------------------------------------------ */
  startCinema() {
    if (this.mode !== 'play' || !this.city || !this.gate?.active) return;
    const city = this.city;
    this.mode = 'cinema';
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.ui.hide('hud');
    this.ui.showCinema();
    this.cameraRig.setCinematic(city.cinema.camera.clone(), city.cinema.look.clone());
    this.cineT = 0;
    this.fxIndex = 0;
    this.audio.play('bell');
    this.audio.play('whoosh');

    const captions = city.cinema.captions;
    this.cineQueue = [
      { t: 0.9, fn: () => this.scheduleFirework() },
      { t: 1.2, fn: () => this.updateCinemaCaption(captions[0]) },
      { t: 1.6, fn: () => this.scheduleFirework() },
      { t: 2.2, fn: () => city.celebrate() },
      { t: 2.8, fn: () => this.scheduleFirework() },
      { t: 3.4, fn: () => this.updateCinemaCaption(captions[1]) },
      { t: 3.9, fn: () => this.scheduleFirework() },
      { t: 5.1, fn: () => this.scheduleFirework() },
      { t: 5.6, fn: () => this.updateCinemaCaption(captions[2]) },
      { t: 6.4, fn: () => this.scheduleFirework() },
      { t: 7.2, fn: () => this.scheduleFirework() },
      { t: 8.6, fn: () => this.finishCinema() },
    ];
  }

  updateCinema(dt) {
    this.cineT += dt;
    while (this.cineQueue.length && this.cineT >= this.cineQueue[0].t) {
      const event = this.cineQueue.shift();
      event.fn();
      if (this.mode !== 'cinema') break;
    }
  }

  updateCinemaCaption(text) {
    if (text) this.ui.setCinemaCaption(text);
    else this.ui.setCinemaCaption(null);
  }

  scheduleFirework(delaySeconds = 0) {
    if (delaySeconds > 0) {
      setTimeout(() => {
        if (this.mode === 'cinema') this.firework();
      }, delaySeconds * 1000);
    } else {
      this.firework();
    }
  }

  firework() {
    if (!this.city) return;
    const anchors = Object.values(this.city.anchors || {}).filter((v) => v?.isVector3);
    let base;
    if (anchors.length) {
      base = anchors[this.fxIndex % anchors.length].clone();
      this.fxIndex += 1;
    } else {
      base = this.city.heart.clone().setY(8);
    }
    base.x += (Math.random() - 0.5) * 5;
    base.y += Math.random() * 3;
    base.z += (Math.random() - 0.5) * 5;
    this.bursts.emit(base, {
      count: 60,
      spread: 6.6,
      up: 7.2,
      size: 0.85,
      gravity: 2.8,
      life: 2.5,
      colors: ['#ff8a5c', '#ff6f61', '#ffc24b', '#63c7b8', '#e78bb0'],
      blending: THREE.NormalBlending,
    });
    this.audio.play('firework', { volume: 0.05 });
  }

  finishCinema() {
    if (this.mode !== 'cinema' || !this.city) return;
    this.cineQueue = [];
    this.ui.hideCinema();
    this.stampCity();
  }

  stampCity() {
    const city = this.city;
    this.gate?.setActive(false);
    this.progress.stamps[city.id] = true;
    this.progress.sparks[city.id] = 5;
    this.sparkCount = 5;

    const light = city.facts.find((f) => f.key.endsWith('-light'));
    if (light) this.unlockFact(city, light, false);

    if (CITY_ORDER.every((id) => this.progress.stamps[id])) this.progress.completed = true;
    this.save();

    this.mode = 'ceremony';
    this.engine.setBloom({ strength: 0.42, radius: 0.6, threshold: 0.86 });
    this.ui.showCeremony({
      country: city.postcard.country,
      icon: city.postcard.icon,
      city: city.postcard.city,
      title: city.postcard.title,
      text: city.postcard.text,
      nextLabel: city.travel ? `乘热气球去${city.travel.title}` : '完成环游世界',
    });
    this.audio.play('stamp');
    setTimeout(() => this.audio.play('bell'), 520);
    this.refreshObjective();
  }

  leaveCeremony() {
    if (this.mode !== 'ceremony' || !this.city) return;
    this.ui.hideCeremony();
    if (this.city.travel) this.goTravel();
    else this.showEnding();
  }

  async goTravel() {
    if (!this.city) return;
    const from = this.city;
    const nextId = NEXT_CITY[from.id];
    if (!nextId) {
      this.showEnding();
      return;
    }
    const info = from.travel;
    this.mode = 'travel';
    this.ui.hide('hud');
    this.ui.showTravel({
      title: info.title,
      sub: info.sub,
      index: CITY_ORDER.indexOf(nextId),
    });
    this.audio.play('whoosh');

    await delay(3000);
    await nextFrame();
    this.enterCity(nextId);
    this.ui.hideTravel();
    this.ui.show('hud');
    this.mode = 'play';
    this.showArrival();
  }

  showEnding() {
    if (this.mode !== 'ceremony' && this.mode !== 'travel') return;
    this.ui.hideCeremony();
    this.progress.completed = true;
    this.save();
    this.ui.showEnding();
    this.mode = 'ending';
    this.engine.setBloom({ strength: 0.38, radius: 0.58, threshold: 0.88 });
    this.audio.play('finish');
  }

  freeRoam() {
    if (this.mode !== 'ending') return;
    this.ui.hideEnding();
    this.ui.show('hud');
    this.mode = 'play';
    this.cameraRig.clearCinematic();
    this.cameraRig.yaw = this.player.yaw - Math.PI;
    this.cameraRig.ready = false;
    this.engine.setBloom({ strength: 0.34, radius: 0.55, threshold: 0.9 });
    this.refreshObjective();
    this.ui.toast({
      icon: '✦',
      title: '继续漫游',
      sub: '东京的夜还很长，慢慢逛吧。',
      teal: true,
      duration: 3600,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  overlays                                                           */
  /* ------------------------------------------------------------------ */
  openJournal(fromPause = false) {
    if (!this.city) return;
    if (!fromPause && this.mode !== 'play') return;
    this.mode = 'journal';
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    this.ui.openJournal(this.journalData());
    this.audio.play('open');
  }

  openPause() {
    if (this.mode !== 'play') return;
    this.mode = 'pause';
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    this.ui.syncSettings(this.progress?.settings || { sfx: this.audio.sfxOn, music: this.audio.musicOn });
    this.ui.openPause();
    this.audio.play('open');
  }

  openHelp() {
    if (this.mode !== 'play') return;
    this.mode = 'help';
    this.ui.hidePrompt();
    this.ui.hideCompass();
    this.promptKey = '';
    this.ui.openHelp();
    this.audio.play('open');
  }

  toggleSfx() {
    const on = !this.audio.sfxOn;
    this.audio.setSfx(on);
    this.ui.setSoundIcon(on);
    if (this.progress) {
      this.progress.settings.sfx = on;
      this.save();
    }
    if (on) this.audio.play('click');
  }

  journalData() {
    const progress = this.progress;
    const sparks = { ...progress.sparks };
    if (this.city) sparks[this.city.id] = this.sparkCount;
    const quests = this.city
      ? this.city.quests.map((q) => ({
        ...q,
        state: progress.quests[q.id],
        npcName: this.npcById(q.npcId)?.def.name,
      }))
      : [];
    return {
      notes: Object.values(progress.factNotes || {}),
      quests,
      stamps: { ...progress.stamps },
      sparks,
      totalSparks: Object.values(sparks).reduce((a, b) => a + (b || 0), 0),
      totalStamps: CITY_ORDER.filter((id) => progress.stamps[id]).length,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  save                                                               */
  /* ------------------------------------------------------------------ */
  save() {
    if (!this.progress) return;
    if (this.city) {
      this.progress.sparks[this.city.id] = this.sparkCount;
      this.progress.city = this.city.id;
    }
    saveProgress(this.progress);
  }
}
