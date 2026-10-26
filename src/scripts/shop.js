// Shop switcher and open/closed pills. The chosen shop lives on html[data-shop] (set before paint by
// the inline script in Base.astro) and in localStorage, so it follows the visitor across pages.
const root = document.documentElement;

function setShop(id) {
  root.dataset.shop = id;
  try { localStorage.setItem('bc_shop', id); } catch { /* storage blocked: still works for this page */ }
  for (const b of document.querySelectorAll('[data-set-shop]')) b.setAttribute('aria-pressed', String(b.dataset.setShop === id));
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-set-shop]');
  if (b) setShop(b.dataset.setShop);
});
setShop(root.dataset.shop || 'patisia');

// Minutes since midnight in Athens, whatever the visitor's own time zone.
function athensMinutes() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get('hour') * 60 + get('minute');
}
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// ponytail: same hours every day and closing before midnight; per-day hours need a weekday lookup here.
function paintPills() {
  const now = athensMinutes();
  for (const p of document.querySelectorAll('.pill[data-opens]')) {
    const open = now >= toMin(p.dataset.opens) && now < toMin(p.dataset.closes);
    p.dataset.state = open ? 'open' : 'closed';
    p.textContent = open ? p.dataset.openText : p.dataset.closedText;
  }
}
paintPills();
setInterval(paintPills, 60_000);
