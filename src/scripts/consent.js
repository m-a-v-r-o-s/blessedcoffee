// Cookie consent. One optional category (Google Maps embed); the choice is 'accepted' or 'rejected'
// in localStorage 'bc_consent' (same key and values the old site used, so past choices carry over).
const KEY = 'bc_consent';
const box = document.getElementById('cookies');
const banner = box.querySelector('[data-view="banner"]');
const prefs = box.querySelector('[data-view="prefs"]');
const maps = box.querySelector('#consent-maps');

export const getConsent = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

function show(view) {
  banner.hidden = view !== 'banner';
  prefs.hidden = view !== 'prefs';
  maps.checked = getConsent() === 'accepted';
  box.hidden = false;
  // Keep focused elements clear of the banner (WCAG 2.4.11).
  document.documentElement.style.scrollPaddingBottom = `${box.offsetHeight + 100}px`;
}

function choose(value) {
  try { localStorage.setItem(KEY, value); } catch { /* blocked storage: choice lasts this page */ }
  box.hidden = true;
  document.documentElement.style.scrollPaddingBottom = '';
  document.dispatchEvent(new CustomEvent('bc:consent', { detail: value }));
}

box.addEventListener('click', (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.consent) choose(t.dataset.consent);
  else if ('openPrefs' in t.dataset) { show('prefs'); maps.focus(); }
  else if ('savePrefs' in t.dataset) choose(maps.checked ? 'accepted' : 'rejected');
});

// Footer "Cookie settings" link reopens the preferences.
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); show('prefs'); maps.focus(); }
});

const stored = getConsent();
if (stored !== 'accepted' && stored !== 'rejected') show('banner');
