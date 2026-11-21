// Service worker do PWA. No build, o vite.config.js troca VERSAO e ARQUIVOS
// pela versão do conteúdo e pela lista completa de arquivos gerados.
const VERSAO = 'dev' // @versao
const ARQUIVOS = [] // @arquivos
const CACHE = 'precificador-' + VERSAO

// Instalação: guarda o app inteiro, para abrir offline já depois da primeira visita
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', ...ARQUIVOS])))
  self.skipWaiting()
})

// Ativação: apaga os caches de versões anteriores
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return

  // Abrir o app: tenta a rede (pega versão nova) e cai para o cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }

  // Demais arquivos: cache primeiro (os do build têm hash no nome), rede se faltar
  e.respondWith(
    caches.match(req).then(
      (guardado) =>
        guardado ||
        fetch(req).then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone()
            caches.open(CACHE).then((c) => c.put(req, copia))
          }
          return resposta
        })
    )
  )
})
