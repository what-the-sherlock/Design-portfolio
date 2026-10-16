// Intro choreography helpers (port of utilities.js `introDelay`).
//
// An inline <head> script decides once per hard load whether the loader plays
// (first visit this session and not arriving from another page of this site) and
// stores the answer on window.__loaderWillPlay. Client-side navigations add
// html.skip-loader, so pages mounted later animate in immediately.

declare global {
  interface Window {
    __loaderWillPlay?: boolean;
    __heroAnimComplete?: boolean;
  }
}

export function loaderWillPlay(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.__loaderWillPlay && !document.documentElement.classList.contains("skip-loader");
}

/** 3.6s when the loader is playing, otherwise a near-immediate start. */
export function introDelay(withLoader = 3.6, without = 0.05): number {
  return loaderWillPlay() ? withLoader : without;
}

/** Inline script injected into <head> before first paint. */
export const headScript = `(function(){try{var d=document.documentElement;var r=document.referrer;var internal=false;try{internal=!!r&&new URL(r).origin===location.origin}catch(e){}var played=sessionStorage.getItem('loaderPlayed');if(internal||played){d.classList.add('skip-loader');window.__loaderWillPlay=false}else{window.__loaderWillPlay=true}if(location.pathname.indexOf('/contact')===0){d.setAttribute('data-theme','theme-2')}}catch(e){window.__loaderWillPlay=false;document.documentElement.classList.add('skip-loader')}})();`;
