"""Shared rules for the capture tools: hide banners/chat widgets and pre-accept consent."""

# Ask cookie banners/popups to stay closed where sites honour common flags.
HIDE_NOISE = """
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
  [aria-label*="cookie" i], [aria-label*="consent" i], [aria-label^="Open chat" i],
  #chatbase-bubble-button, #chatbase-message-bubbles, iframe[src*="chatbase"],
  nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
"""

# Pre-accept known consent flags so banners never mount (keys taken from the projects' own code).
SEED_CONSENT = """
try {
  localStorage.setItem('chapeau-cookie-consent', 'accepted');
  localStorage.setItem('roswell_consent', JSON.stringify({
    v: 2, id: 'capture', ts: new Date().toISOString(), method: 'reject_all',
    categories: { necessary: true, analytics: false, functional: false, marketing: false }
  }));
} catch (e) {}
"""
