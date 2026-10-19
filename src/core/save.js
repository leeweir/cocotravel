const KEY = 'coco-little-world-save-v1';

export function emptyProgress() {
  return {
    version: 1,
    started: false,
    completed: false,
    city: 'usa',
    stamps: { usa: false, france: false, japan: false },
    sparks: { usa: 0, france: 0, japan: 0 },
    sparkIds: { usa: [], france: [], japan: [] },
    quests: {},
    facts: {},
    factNotes: {},
    settings: { sfx: true, music: false },
    updatedAt: Date.now(),
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    const base = emptyProgress();
    return {
      ...base,
      ...data,
      stamps: { ...base.stamps, ...(data.stamps || {}) },
      sparks: { ...base.sparks, ...(data.sparks || {}) },
      sparkIds: { ...base.sparkIds, ...(data.sparkIds || {}) },
      quests: { ...(data.quests || {}) },
      facts: { ...(data.facts || {}) },
      factNotes: { ...(data.factNotes || {}) },
      settings: { ...base.settings, ...(data.settings || {}) },
    };
  } catch { return null; }
}

export function saveProgress(progress) {
  try {
    progress.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch { /* storage might be unavailable */ }
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
