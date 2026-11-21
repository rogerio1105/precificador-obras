import { defineConfig } from 'vite'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Depois do build, grava em dist/sw.js a lista de todos os arquivos gerados e uma versão
 * derivada do conteúdo. Assim o service worker guarda o app inteiro na primeira visita
 * (funciona offline de imediato) e cada publicação nova invalida o cache antigo.
 */
function precacheServiceWorker () {
  let saida
  return {
    name: 'precache-service-worker',
    apply: 'build',
    configResolved (config) {
      saida = path.resolve(config.root, config.build.outDir)
    },
    closeBundle () {
      const arquivos = []
      const varrer = (dir) => {
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const caminho = path.join(dir, item.name)
          if (item.isDirectory()) varrer(caminho)
          else arquivos.push(path.relative(saida, caminho).split(path.sep).join('/'))
        }
      }
      varrer(saida)

      const lista = arquivos.filter((a) => a !== 'sw.js').sort()
      const hash = createHash('sha1')
      for (const a of lista) hash.update(a).update(fs.readFileSync(path.join(saida, a)))
      const versao = hash.digest('hex').slice(0, 10)

      const swPath = path.join(saida, 'sw.js')
      const sw = fs.readFileSync(swPath, 'utf8')
        .replace(/const VERSAO = .*\/\/ @versao/, `const VERSAO = '${versao}' // @versao`)
        .replace(/const ARQUIVOS = .*\/\/ @arquivos/, `const ARQUIVOS = ${JSON.stringify(lista)} // @arquivos`)
      fs.writeFileSync(swPath, sw)
      console.log(`[pwa] service worker: ${lista.length} arquivos em cache, versão ${versao}`)
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [precacheServiceWorker()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 5173
  }
})
