import '@fontsource-variable/inter'
import './style.css'
import './components/app-root.js'

// Registra o Service Worker para modo offline (PWA)
// Só no build publicado: no desenvolvimento o cache atrapalharia ver as mudanças
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => console.log('[PWA] Service Worker registrado'))
      .catch((err) => console.warn('[PWA] Falha ao registrar SW:', err))
  })
}
