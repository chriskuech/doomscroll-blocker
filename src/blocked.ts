const params = new URL(location.href).searchParams;
const blockedUrl = params.get('url');
const siteEl = document.getElementById('site') as HTMLElement;

if (blockedUrl) {
  try { siteEl.textContent = new URL(blockedUrl).hostname; } catch {}
}
