import { drawPortrait } from '../world/npc.js';

const $ = (id) => document.getElementById(id);

const PASSPORT_CITIES = [
  { id: 'usa', flag: 'USA', name: '纽约' },
  { id: 'france', flag: 'FRANCE', name: '巴黎' },
  { id: 'japan', flag: 'JAPAN', name: '东京' },
];

const REDUCED = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export class UI {
  constructor() {
    this.d = {
      loading: $('loading'),
      loadingFill: $('loading-fill'),
      loadingTip: $('loading-tip'),
      title: $('title'),
      titleArt: $('title-art'),
      hud: $('hud'),
      locationCard: $('location-card'),
      locStamp: $('loc-stamp'),
      locCn: $('loc-cn'),
      locEn: $('loc-en'),
      objectiveTitle: $('objective-title'),
      objectiveText: $('objective-text'),
      sparkMeter: $('spark-meter'),
      sparkCount: $('spark-count'),
      btnJournal: $('btn-journal'),
      btnSound: $('btn-sound'),
      btnHelp: $('btn-help'),
      btnPause: $('btn-pause'),
      compass: $('compass'),
      compassArrow: $('compass-arrow'),
      compassLabel: $('compass-label'),
      prompt: $('prompt'),
      promptText: $('prompt-text'),
      controlsHint: $('controls-hint'),
      toasts: $('toasts'),
      questFlash: $('quest-flash'),
      touchControls: $('touch-controls'),
      dialogue: $('dialogue'),
      portrait: $('portrait'),
      speaker: $('speaker'),
      speakerSub: $('speaker-sub'),
      dialogueText: $('dialogue-text'),
      journal: $('journal'),
      passport: $('passport'),
      factsList: $('facts-list'),
      questList: $('quest-list'),
      journalProgress: $('journal-progress'),
      btnJournalClose: $('btn-journal-close'),
      pause: $('pause'),
      btnResume: $('btn-resume'),
      btnPauseJournal: $('btn-pause-journal'),
      btnPauseTitle: $('btn-pause-title'),
      toggleMusic: $('toggle-music'),
      toggleSfx: $('toggle-sfx'),
      help: $('help'),
      btnHelpClose: $('btn-help-close'),
      btnHelpOk: $('btn-help-ok'),
      cinema: $('cinema'),
      cineCaption: $('cine-caption'),
      ceremony: $('ceremony'),
      ceremonyKicker: $('ceremony-kicker'),
      stampBig: $('stamp-big'),
      stampCountry: $('stamp-country'),
      stampIcon: $('stamp-icon'),
      stampCity: $('stamp-city'),
      ceremonyTitle: $('ceremony-title'),
      ceremonyText: $('ceremony-text'),
      btnCeremonyNext: $('btn-ceremony-next'),
      ending: $('ending'),
      btnEndingFree: $('btn-ending-free'),
      btnEndingTitle: $('btn-ending-title'),
      travel: $('travel'),
      travelKicker: $('travel-kicker'),
      travelTitle: $('travel-title'),
      travelSub: $('travel-sub'),
      intro: $('intro'),
      btnIntroNext: $('btn-intro-next'),
      btnIntroSkip: $('btn-intro-skip'),
      scene: $('scene'),
    };

    this.dialogue = null;
    this.typing = false;
    this.fullLine = '';
    this.charTime = 0;
    this.displayed = 0;
    this.lastBlip = 0;
    this.dialogueOpen = false;
    this._questTimer = null;
    this._lastSpark = -1;
    this._captionTimer = null;
    this._cinemaTimer = null;

    this.bind();
  }

  bind() {
    const d = this.d;
    d.btnJournal?.addEventListener('click', () => this.onJournal?.());
    d.btnHelp?.addEventListener('click', () => this.onHelp?.());
    d.btnPause?.addEventListener('click', () => this.onPause?.());
    d.btnSound?.addEventListener('click', () => this.onSound?.());

    d.btnJournalClose?.addEventListener('click', () => this.closeJournal());
    d.btnHelpClose?.addEventListener('click', () => this.closeHelp());
    d.btnHelpOk?.addEventListener('click', () => this.closeHelp());

    d.btnResume?.addEventListener('click', () => {
      this.closePause();
      this.onResume?.();
    });
    d.btnPauseJournal?.addEventListener('click', () => {
      this.closePause();
      this.onPauseJournal?.();
    });
    d.btnPauseTitle?.addEventListener('click', () => this.onPauseTitle?.());

    d.toggleMusic?.addEventListener('change', () => this.onMusicToggle?.(d.toggleMusic.checked));
    d.toggleSfx?.addEventListener('change', () => this.onSfxToggle?.(d.toggleSfx.checked));

    d.btnCeremonyNext?.addEventListener('click', () => this.onCeremonyNext?.());
    d.btnEndingFree?.addEventListener('click', () => this.onEndingFree?.());
    d.btnEndingTitle?.addEventListener('click', () => this.onEndingTitle?.());

    document.addEventListener('click', (e) => {
      if (e.target.closest?.('button')) this.onButton?.();
    }, true);
  }

  show(el) {
    const node = typeof el === 'string' ? this.d[el] : el;
    node?.classList.remove('hidden');
  }

  hide(el) {
    const node = typeof el === 'string' ? this.d[el] : el;
    node?.classList.add('hidden');
  }

  /* ---------------- loading ---------------- */
  setLoading(pct, tip) {
    if (this.d.loadingFill) this.d.loadingFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (tip && this.d.loadingTip) this.d.loadingTip.textContent = tip;
  }

  showLoading(tip) {
    this.show('loading');
    this.setLoading(8, tip);
  }

  hideLoading() {
    this.setLoading(100);
    this.hide('loading');
  }

  setTitleArt(url) {
    if (this.d.titleArt) this.d.titleArt.style.backgroundImage = `url("${url}")`;
  }

  /* ---------------- HUD ---------------- */
  setCity(city) {
    const d = this.d;
    d.locStamp.textContent = city.stamp;
    d.locStamp.className = `loc-stamp ${city.id}`;
    d.locCn.textContent = city.locationCn;
    d.locEn.textContent = city.locationEn;
    if (!REDUCED) {
      d.locationCard.animate(
        [
          { opacity: 0, transform: 'translateX(-14px) rotate(-1deg)' },
          { opacity: 1, transform: 'translateX(0) rotate(0deg)' },
        ],
        { duration: 750, delay: 120, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'both' },
      );
    }
  }

  setObjective(title, text) {
    this.d.objectiveTitle.textContent = title;
    this.d.objectiveText.textContent = text;
  }

  setSpark(count, total = 5, animate = true) {
    this.d.sparkCount.textContent = count;
    const meter = this.d.sparkMeter;
    if (count !== this._lastSpark) {
      this._lastSpark = count;
      if (animate && !REDUCED) {
        meter.animate(
          [
            { transform: 'scale(1)' },
            { transform: 'scale(1.12)' },
            { transform: 'scale(1)' },
          ],
          { duration: 480, easing: 'cubic-bezier(.2,1.4,.4,1)' },
        );
      }
    }
    if (total !== 5) {
      const label = meter?.querySelector('.spark-count');
      if (label) {
        label.textContent = '';
        const b = document.createElement('b');
        b.textContent = String(count);
        label.append(b, `/${total}`);
      }
    }
  }

  setPrompt(text) {
    if (!text) { this.hidePrompt(); return; }
    this.d.prompt.classList.remove('hidden');
    this.d.promptText.textContent = text;
  }

  hidePrompt() {
    this.d.prompt.classList.add('hidden');
  }

  setCompass(angle, label) {
    this.d.compass.classList.remove('hidden');
    this.d.compassArrow.style.transform = `rotate(${angle}rad)`;
    if (label) this.d.compassLabel.textContent = label;
  }

  hideCompass() {
    this.d.compass.classList.add('hidden');
  }

  fadeControls() {
    this.d.controlsHint?.classList.add('fade');
  }

  /* ---------------- toasts ---------------- */
  toast({ icon = '✦', title = '', sub = '', teal = false, duration = 3400 } = {}) {
    const node = document.createElement('div');
    node.className = 'toast';
    const iconBox = document.createElement('div');
    iconBox.className = teal ? 'toast-icon teal' : 'toast-icon';
    iconBox.textContent = icon;
    const text = document.createElement('div');
    const titleNode = document.createElement('div');
    titleNode.className = 'toast-title';
    titleNode.textContent = title;
    text.appendChild(titleNode);
    if (sub) {
      const subNode = document.createElement('div');
      subNode.className = 'toast-sub';
      subNode.textContent = sub;
      text.appendChild(subNode);
    }
    node.append(iconBox, text);
    this.d.toasts.appendChild(node);
    while (this.d.toasts.children.length > 4) this.d.toasts.firstElementChild.remove();
    setTimeout(() => {
      node.classList.add('out');
      setTimeout(() => node.remove(), 360);
    }, duration);
  }

  questFlash(title, sub = '', duration = 2600) {
    const el = this.d.questFlash;
    el.getAnimations().forEach((a) => a.cancel());
    clearTimeout(this._questTimer);
    el.textContent = '';
    const h = document.createElement('h3');
    h.textContent = title;
    el.appendChild(h);
    if (sub) {
      const p = document.createElement('p');
      p.textContent = sub;
      el.appendChild(p);
    }
    el.classList.remove('hidden');
    if (!REDUCED) {
      el.animate(
        [
          { opacity: 0, transform: 'translate(-50%, -44%) scale(.92)' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
        ],
        { duration: 420, easing: 'cubic-bezier(.2,1.3,.3,1)', fill: 'both' },
      );
    }
    this._questTimer = setTimeout(() => {
      if (REDUCED) { el.classList.add('hidden'); return; }
      const anim = el.animate(
        [
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          { opacity: 0, transform: 'translate(-50%, -56%) scale(.97)' },
        ],
        { duration: 480, easing: 'ease', fill: 'both' },
      );
      anim.onfinish = () => el.classList.add('hidden');
    }, duration);
  }

  /* ---------------- dialogue ---------------- */
  openDialogue({ def, lines, onDone }) {
    const textLines = (lines && lines.length) ? lines : ['……'];
    this.dialogue = { lines: textLines, index: 0, onDone, def };
    this.dialogueOpen = true;
    drawPortrait(this.d.portrait, def);
    this.d.speaker.textContent = def.name || '';
    this.d.speakerSub.textContent = def.nameSub || '';
    this.d.dialogue.classList.remove('hidden');
    this.showLine();
  }

  showLine() {
    if (!this.dialogue) return;
    this.fullLine = this.dialogue.lines[this.dialogue.index] || '';
    this.charTime = 0;
    this.displayed = 0;
    this.lastBlip = 0;
    this.d.dialogueText.textContent = '';
    this.typing = true;
    if (REDUCED) this.completeLine();
  }

  completeLine() {
    this.typing = false;
    this.displayed = this.fullLine.length;
    this.d.dialogueText.textContent = this.fullLine;
  }

  update(dt) {
    if (!this.dialogue || !this.typing) return;
    this.charTime += dt;
    const count = Math.min(this.fullLine.length, Math.floor(this.charTime * 32));
    if (count !== this.displayed) {
      this.displayed = count;
      this.d.dialogueText.textContent = this.fullLine.slice(0, count);
      if (count - this.lastBlip >= 9) {
        this.lastBlip = count;
        this.onTalkBlip?.();
      }
    }
    if (count >= this.fullLine.length) this.typing = false;
  }

  advanceDialogue() {
    if (!this.dialogue) return;
    if (this.typing) { this.completeLine(); return; }
    if (this.dialogue.index < this.dialogue.lines.length - 1) {
      this.dialogue.index += 1;
      this.showLine();
      return;
    }
    this.closeDialogue();
  }

  closeDialogue() {
    if (!this.dialogue) return;
    const cb = this.dialogue.onDone;
    this.dialogue = null;
    this.dialogueOpen = false;
    this.typing = false;
    this.hide('dialogue');
    cb?.();
  }

  /* ---------------- journal ---------------- */
  openJournal(data) {
    this.renderJournal(data);
    this.d.journal.classList.remove('hidden');
  }

  closeJournal() {
    this.d.journal.classList.add('hidden');
    this.onJournalClose?.();
  }

  renderJournal({ notes = [], quests = [], stamps = {}, sparks = {}, totalSparks = 0, totalStamps = 0 } = {}) {
    const d = this.d;
    d.passport.textContent = '';
    PASSPORT_CITIES.forEach((city) => {
      const stamped = !!stamps[city.id];
      const node = document.createElement('div');
      node.className = stamped ? 'passport-city' : 'passport-city locked';

      const seal = document.createElement('div');
      seal.className = 'pc-seal';

      const flag = document.createElement('div');
      flag.className = 'pc-flag';
      flag.textContent = city.flag;

      const mark = document.createElement('div');
      mark.className = 'pc-mark';
      mark.textContent = stamped ? '✦' : '·';

      const name = document.createElement('div');
      name.className = 'pc-name';
      name.textContent = city.name;

      const spark = document.createElement('div');
      spark.className = 'pc-spark';
      spark.textContent = `${sparks[city.id] || 0} / 5 星火`;

      node.append(seal, flag, mark, name, spark);
      d.passport.appendChild(node);
    });

    d.factsList.textContent = '';
    if (!notes.length) {
      const empty = document.createElement('div');
      empty.className = 'fact-empty';
      empty.textContent = '还没有写下旅途笔记。靠近地标、点亮城市，纸页就会自己长出字来。';
      d.factsList.appendChild(empty);
    } else {
      notes.forEach((note, i) => {
        const item = document.createElement('div');
        item.className = 'fact-item';
        const num = document.createElement('div');
        num.className = 'fact-num';
        num.textContent = String(i + 1).padStart(2, '0');
        const body = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'fact-title';
        title.textContent = `${note.city || ''} · ${note.title || ''}`;
        const text = document.createElement('div');
        text.className = 'fact-text';
        text.textContent = note.text || '';
        body.append(title, text);
        item.append(num, body);
        d.factsList.appendChild(item);
      });
    }

    d.questList.textContent = '';
    const visibleQuests = quests.filter((q) => q.state);
    if (!visibleQuests.length) {
      const empty = document.createElement('div');
      empty.className = 'quest-empty';
      empty.textContent = '还没有接到任务。岛上的人头顶有金色感叹号时，去和他们聊一聊吧。';
      d.questList.appendChild(empty);
    } else {
      visibleQuests.forEach((q) => {
        const node = document.createElement('div');
        node.className = 'quest-item' + (q.state === 'done' ? ' done' : '') + (q.state === 'active' || q.state === 'ready' ? ' active' : '');
        const head = document.createElement('h3');
        head.textContent = q.title;
        const tag = document.createElement('span');
        tag.textContent = q.state === 'done' ? 'DONE' : q.state === 'ready' ? 'RETURN' : 'ACTIVE';
        head.appendChild(tag);
        const p = document.createElement('p');
        p.textContent = q.state === 'ready'
          ? `已经找到${q.item?.label || '那样东西'}，带回去给 ${q.npcName || '居民'} 吧。`
          : q.short;
        const reward = document.createElement('div');
        reward.className = 'q-reward';
        reward.textContent = `✦ ${q.reward || '星火'}`;
        node.append(head, p, reward);
        d.questList.appendChild(node);
      });
    }

    d.journalProgress.innerHTML = `${totalStamps}/3 座城市<br/><b>${totalSparks}</b> / 15 星火`;
  }

  /* ---------------- pause / help ---------------- */
  openPause() {
    this.d.pause.classList.remove('hidden');
  }

  closePause() {
    this.d.pause.classList.add('hidden');
  }

  openHelp() {
    this.d.help.classList.remove('hidden');
  }

  closeHelp() {
    this.d.help.classList.add('hidden');
    this.onHelpClose?.();
  }

  syncSettings(settings) {
    if (this.d.toggleSfx) this.d.toggleSfx.checked = !!settings.sfx;
    if (this.d.toggleMusic) this.d.toggleMusic.checked = !!settings.music;
    this.setSoundIcon(!!settings.sfx);
  }

  setSoundIcon(on) {
    const icon = this.d.btnSound?.querySelector('.icon-sound');
    if (icon) icon.classList.toggle('muted', !on);
  }

  /* ---------------- cinema ---------------- */
  showCinema() {
    this.d.cinema.classList.remove('hidden');
    this.d.cineCaption.textContent = '';
    this.d.cineCaption.classList.add('hide');
    requestAnimationFrame(() => {
      this._cinemaTimer = setTimeout(() => this.d.cinema.classList.add('on'), 40);
    });
  }

  setCinemaCaption(text) {
    clearTimeout(this._captionTimer);
    const cap = this.d.cineCaption;
    if (text === null) {
      cap.classList.add('hide');
      return;
    }
    cap.classList.add('hide');
    this._captionTimer = setTimeout(() => {
      cap.textContent = text;
      cap.classList.remove('hide');
    }, REDUCED ? 0 : 380);
  }

  hideCinema() {
    clearTimeout(this._cinemaTimer);
    clearTimeout(this._captionTimer);
    this.d.cinema.classList.remove('on');
    this.d.cinema.classList.add('hidden');
    this.d.cineCaption.classList.add('hide');
  }

  /* ---------------- ceremony ---------------- */
  showCeremony({ country, icon, city, title, text, nextLabel = '前往下一站' }) {
    const d = this.d;
    d.ceremonyKicker.textContent = 'CITY OF LIGHT';
    d.stampCountry.textContent = country;
    d.stampIcon.textContent = icon;
    d.stampCity.textContent = city;
    d.ceremonyTitle.textContent = title;
    d.ceremonyText.textContent = text;
    d.btnCeremonyNext.textContent = '';
    d.btnCeremonyNext.append(nextLabel);
    const arrow = document.createElement('span');
    arrow.className = 'btn-arrow';
    arrow.textContent = '→';
    d.btnCeremonyNext.appendChild(arrow);
    d.stampBig.style.animation = 'none';
    void d.stampBig.offsetWidth;
    d.stampBig.style.animation = '';
    d.ceremony.classList.remove('hidden');
  }

  hideCeremony() {
    this.d.ceremony.classList.add('hidden');
  }

  /* ---------------- travel ---------------- */
  showTravel({ title, sub, index = 1 }) {
    const d = this.d;
    d.travelKicker.textContent = '下一站 · NEXT STOP';
    d.travelTitle.textContent = title;
    d.travelSub.textContent = sub;
    const dots = d.travel.querySelectorAll('.travel-dots i');
    dots.forEach((dot, i) => dot.classList.toggle('on', i <= index));
    d.travel.classList.remove('hidden');
  }

  hideTravel() {
    this.d.travel.classList.add('hidden');
  }

  /* ---------------- ending ---------------- */
  showEnding() {
    this.d.ending.classList.remove('hidden');
  }

  hideEnding() {
    this.d.ending.classList.add('hidden');
  }

  showIntro() {
    this.d.intro.classList.remove('hidden');
  }

  hideIntro() {
    this.d.intro.classList.add('hidden');
  }
}
