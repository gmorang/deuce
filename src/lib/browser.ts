/**
 * Detects in-app / embedded browsers (WhatsApp, Instagram, Facebook, etc.).
 * Google blocks OAuth sign-in inside these webviews and their storage is
 * partitioned, which breaks Firebase Auth ("missing initial state"). We steer
 * users to open the app in a real browser instead.
 */
export function isEmbeddedBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const embeddedApps = /(FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line|WeChat|MicroMessenger|Twitter|TikTok|Snapchat|Pinterest|LinkedInApp)/i
  const androidWebview = /; wv\)|\bwv\b/i.test(ua)
  return embeddedApps.test(ua) || androidWebview
}

/** Rough mobile check — mobile favors redirect sign-in over popup. */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}
