import { useSyncExternalStore } from 'react'

declare global {
  interface Window {
    __APP_READY__?: boolean
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('app-ready', onChange)
  return () => window.removeEventListener('app-ready', onChange)
}

/**
 * True once the LoadingScreen has finished (it sets window.__APP_READY__
 * and fires 'app-ready'). Lets intro animations wait for the loader.
 * Reading the flag as a snapshot means a ready event fired before this
 * component subscribed (skipped intro) is never missed.
 */
export function useAppReady(): boolean {
  return useSyncExternalStore(subscribe, () => !!window.__APP_READY__, () => false)
}
