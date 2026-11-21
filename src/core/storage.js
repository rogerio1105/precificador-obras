const CHAVE = 'precificador-estado-v1'

/** Persiste o estado no localStorage */
export function salvar (estado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado))
  } catch (e) {
    console.warn('[storage] Falha ao salvar:', e)
  }
}

/** Carrega o estado salvo, ou retorna null se não existir */
export function carregar () {
  try {
    const raw = localStorage.getItem(CHAVE)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('[storage] Falha ao carregar:', e)
    return null
  }
}

/** Limpa o estado salvo (volta para os defaults) */
export function limpar () {
  try {
    localStorage.removeItem(CHAVE)
  } catch (e) {
    console.warn('[storage] Falha ao limpar:', e)
  }
}

const CHAVE_MODO = 'precificador-modo-v1'

/** Modo de visualização: 'etapas' (abas) ou 'pagina' (tudo numa página) */
export function carregarModo () {
  try {
    return localStorage.getItem(CHAVE_MODO) === 'pagina' ? 'pagina' : 'etapas'
  } catch (e) {
    return 'etapas'
  }
}

export function salvarModo (modo) {
  try {
    localStorage.setItem(CHAVE_MODO, modo)
  } catch (e) {
    console.warn('[storage] Falha ao salvar modo:', e)
  }
}
