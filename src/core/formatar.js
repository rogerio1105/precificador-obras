/**
 * Utilitários de formatação de números para pt-BR
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

const NUM = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/** Formata como moeda: R$ 1.234,56 */
export const moeda = (v) => BRL.format(v ?? 0)

/** Formata como número sem símbolo: 1.234,56 */
export const numero = (v) => NUM.format(v ?? 0)

/** Formata como salários mínimos: 1,50 SM */
export const sm = (v) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0) + ' SM'

/**
 * Converte string de input numérico para float.
 * Suporta tanto vírgula (pt-BR) quanto ponto (en-US) como decimal.
 */
export const parseDecimal = (v) => {
  let s = String(v ?? '0').trim()
  // "1.499,42" (pt-BR com milhar) -> remove pontos; vírgula vira ponto decimal
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

/** Número para exibir dentro de um input: 1499.42 -> "1499,42" */
export const paraInput = (v) => String(v ?? 0).replace('.', ',')
