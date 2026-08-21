/**
 * Safe PWA service worker registration wrapper.
 *
 * Registers only in production, top-frame, on non-preview hosts, and not
 * when the URL has ?sw=off. In every refused context, actively unregisters
 * any stale /sw.js registration so an old worker cannot keep serving
 * cached HTML.
 */

const SW_URL = "/sw.js";

const previewHostnamePatterns = [
  /^id-preview--/,
  /^preview--/,
  /(^|\.)lovableproject\.com$/,
  /(^|\.)lovableproject-dev\.com$/,
  /(^|\.)beta\.lovable\.dev$/,
];

function isPreviewHost(hostname: string) {
  return previewHostnamePatterns.some((rx) => rx.test(hostname));
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter(
        (r) => r.active?.scriptURL.endsWith(SW_URL) || r.installing?.scriptURL.endsWith(SW_URL),
      )
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const inIframe = window.self !== window.top;
  const isProd = import.meta.env.PROD;
  const disabled = url.searchParams.get("sw") === "off";
  const preview = isPreviewHost(window.location.hostname);

  if (!isProd || inIframe || preview || disabled) {
    void unregisterMatching();
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL).catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}
