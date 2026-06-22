import { loadDenylist, type SiteMetadata } from './denylist.js';
import { getSettings, saveSettings } from './storage.js';

const RELEASE_RANK: Record<string, number> = { stable: 0, beta: 1, alpha: 2 };
const BADGE_TEXT: Record<string, string> = { alpha: 'α', beta: 'β' };

let SITES: SiteMetadata[] = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────

const listEl       = document.getElementById('sites-list')!;
const challengeEl  = document.getElementById('challenge') as HTMLElement;
const problemEl    = document.getElementById('problem')!;
const answerInput  = document.getElementById('answer') as HTMLInputElement;
const btnConfirm   = document.getElementById('btn-confirm') as HTMLButtonElement;
const btnSave      = document.getElementById('btn-save') as HTMLButtonElement;
const errorEl      = document.getElementById('challenge-error') as HTMLElement;

// ── State ─────────────────────────────────────────────────────────────────────

/** true = blocking enabled for this site */
let savedState:   Record<string, boolean> = {};
let currentState: Record<string, boolean> = {};
let isDirty    = false;
let inSaveFlow = false;  // prevents blur handler firing while challenge is open
let expectedAnswer = 0;

// ── Render ────────────────────────────────────────────────────────────────────

function renderList(): void {
  listEl.innerHTML = '';
  for (const site of SITES) {
    const label = document.createElement('label');
    label.className = 'site-row';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = site.label;
    const badge = BADGE_TEXT[site.release];
    if (badge) {
      const sup = document.createElement('sup');
      sup.className = 'release-badge';
      sup.textContent = badge;
      nameSpan.append(sup);
    }

    const toggleWrap = document.createElement('span');
    toggleWrap.className = 'toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = currentState[site.id];
    checkbox.addEventListener('change', () => {
      currentState[site.id] = checkbox.checked;
      onStateChange();
    });

    const track = document.createElement('span');
    track.className = 'track';

    toggleWrap.append(checkbox, track);
    label.append(nameSpan, toggleWrap);
    listEl.append(label);
  }
}

function onStateChange(): void {
  isDirty = SITES.some(s => currentState[s.id] !== savedState[s.id]);
  btnSave.disabled = !isDirty;
  btnSave.classList.remove('saved');
  btnSave.textContent = 'Save';
  // Reset challenge if user keeps tweaking after opening it
  if (!challengeEl.hidden) {
    challengeEl.hidden = true;
    inSaveFlow = false;
  }
}

// ── Arithmetic challenge ──────────────────────────────────────────────────────

function showChallenge(): void {
  const a = Math.floor(Math.random() * 20) + 5;   // 5–24
  const b = Math.floor(Math.random() * 10) + 2;   // 2–11
  const add = Math.random() > 0.5 || a <= b;
  expectedAnswer = add ? a + b : a - b;
  problemEl.textContent = add ? `${a} + ${b}` : `${Math.max(a, b)} − ${Math.min(a, b)}`;
  answerInput.value = '';
  errorEl.hidden = true;
  challengeEl.hidden = false;
  inSaveFlow = true;
  answerInput.focus();
}

async function confirmSave(): Promise<void> {
  const answer = parseInt(answerInput.value, 10);
  if (isNaN(answer) || answer !== expectedAnswer) {
    errorEl.hidden = false;
    answerInput.select();
    return;
  }

  const disabledSites = SITES.filter(s => s.release !== 'alpha' && !currentState[s.id]).map(s => s.id);
  const enabledAlphaSites = SITES.filter(s => s.release === 'alpha' && currentState[s.id]).map(s => s.id);
  await saveSettings({ disabledSites, enabledAlphaSites });

  savedState = { ...currentState };
  isDirty = false;
  inSaveFlow = false;
  challengeEl.hidden = true;
  btnSave.disabled = true;
  btnSave.textContent = 'Saved ✓';
  btnSave.classList.add('saved');
}

// ── Unsaved-changes guard ─────────────────────────────────────────────────────

// `blur` fires when the popup window loses focus (user clicks outside).
// We try to show a confirm before the popup closes; if cancelled, refocus it.
// A guard flag prevents re-entrance when the confirm dialog itself briefly blurs us.
let handlingBlur = false;
window.addEventListener('blur', () => {
  if (!isDirty || inSaveFlow || handlingBlur) return;
  handlingBlur = true;
  const discard = window.confirm('You have unsaved changes. Discard them?');
  handlingBlur = false;
  if (discard) {
    currentState = { ...savedState };
    renderList();
    onStateChange();
  } else {
    window.focus();
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  const [{ disabledSites, enabledAlphaSites }, denylist] = await Promise.all([
    getSettings(),
    loadDenylist(),
  ]);
  SITES = denylist.sites.sort((a, b) =>
    (RELEASE_RANK[a.release] - RELEASE_RANK[b.release]) || a.label.localeCompare(b.label)
  );
  const disabled = new Set(disabledSites);
  const enabledAlpha = new Set(enabledAlphaSites);
  for (const site of SITES) {
    const enabled = site.release === 'alpha'
      ? enabledAlpha.has(site.id)
      : !disabled.has(site.id);
    savedState[site.id] = enabled;
    currentState[site.id] = enabled;
  }
  renderList();
}

btnSave.addEventListener('click', showChallenge);
btnConfirm.addEventListener('click', () => { void confirmSave(); });
answerInput.addEventListener('keydown', e => { if (e.key === 'Enter') void confirmSave(); });

void init();
