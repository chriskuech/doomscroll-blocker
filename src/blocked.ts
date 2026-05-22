const params = new URL(location.href).searchParams;
const blockedUrl = params.get('url');

const siteEl = document.getElementById('site') as HTMLElement;
const proceedBtn = document.getElementById('proceed-btn') as HTMLButtonElement;

if (blockedUrl) {
  try {
    siteEl.textContent = new URL(blockedUrl).hostname;
    proceedBtn.addEventListener('click', () => { location.href = blockedUrl; });
  } catch {
    proceedBtn.addEventListener('click', () => history.back());
  }
} else {
  proceedBtn.addEventListener('click', () => history.back());
}
