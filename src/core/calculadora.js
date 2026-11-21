/**
 * Valores padrão iniciais — espelham a planilha orcamento_v2.xlsx
 */
export const DEFAULTS = {
  // Meta de renda
  salarioMinimoRef: 1499.42,
  salarioEsperado: 2250.00,
  diariaAtual: 200.00,

  // Parâmetros do serviço
  diasServico: 5,
  qtdAjudantes: 1,
  diariaAjudantes: 150.00,

  // Transporte
  gasPrice: 7.00,
  km: 50,
  kmPerLiter: 10,

  // Custos operacionais (inputs mensais, exceto alimentação que é diária)
  depreciacaoMensal: 100.00,
  materiaisMensais: 90.00,
  alimentacaoDiaria: 35.00,
  impostosMensais: 86.05
}

/**
 * Motor de cálculo puro — não tem efeitos colaterais.
 * Recebe o estado (s) e retorna todos os valores derivados (c).
 */
export function calcular (s) {
  // ─── Referência ───────────────────────────────────────────────────────────
  const ganhoEmSM = s.salarioEsperado / s.salarioMinimoRef

  // ─── Transporte ───────────────────────────────────────────────────────────
  const transporteDiario = s.kmPerLiter > 0 ? (s.gasPrice / s.kmPerLiter) * s.km : 0
  const transporteMensal = transporteDiario * 20
  const transporteServico = transporteDiario * s.diasServico

  // ─── Depreciação ──────────────────────────────────────────────────────────
  const depreciacaoDiaria = s.depreciacaoMensal / 20
  const depreciacaoServico = depreciacaoDiaria * s.diasServico

  // ─── Materiais operacionais ───────────────────────────────────────────────
  const materiaisDiarios = s.materiaisMensais / 20
  const materiaisServico = materiaisDiarios * s.diasServico

  // ─── Alimentação ──────────────────────────────────────────────────────────
  const alimentacaoMensal = s.alimentacaoDiaria * 20
  const alimentacaoServico = s.alimentacaoDiaria * s.diasServico

  // ─── Contingência e Reservas ──────────────────────────────────────────────
  const contingEmergencia = s.salarioEsperado * 0.08
  const contingDecimoTerceiro = s.salarioEsperado / 12
  const contingFerias = s.salarioEsperado / 12
  const contingAdicionalFerias = (s.salarioEsperado / 3) / 12
  const contingReservaAfastamento = ((s.salarioEsperado / 30) * 15) / 12
  const contingenciaMensal =
    contingEmergencia +
    contingDecimoTerceiro +
    contingFerias +
    contingAdicionalFerias +
    contingReservaAfastamento
  const contingenciaDiaria = contingenciaMensal / 20
  const contingenciaServico = contingenciaDiaria * s.diasServico

  // Cada reserva proporcional ao serviço: (mensal / 20 dias úteis) × dias do serviço.
  // A soma dos cinco itens é igual a contingenciaServico.
  const fatorServico = s.diasServico / 20
  const contingEmergenciaServico = contingEmergencia * fatorServico
  const contingDecimoTerceiroServico = contingDecimoTerceiro * fatorServico
  const contingFeriasServico = contingFerias * fatorServico
  const contingAdicionalFeriasServico = contingAdicionalFerias * fatorServico
  const contingReservaAfastamentoServico = contingReservaAfastamento * fatorServico

  // ─── Impostos ─────────────────────────────────────────────────────────────
  const impostosDiario = s.impostosMensais / 20
  const impostosServico = impostosDiario * s.diasServico

  // ─── Total de custos operacionais diários ─────────────────────────────────
  const custosOpDiarios =
    transporteDiario +
    depreciacaoDiaria +
    materiaisDiarios +
    s.alimentacaoDiaria +
    contingenciaDiaria +
    impostosDiario

  // ─── Mão de obra ──────────────────────────────────────────────────────────
  const ajudantesTotal = s.qtdAjudantes * s.diariaAjudantes * s.diasServico
  const moPropriaAtual = (s.diariaAtual - custosOpDiarios) * s.diasServico

  // ─── Resultados ───────────────────────────────────────────────────────────
  // Remuneração proporcional: quanto do salário mensal este serviço deveria gerar
  const remuneracaoProportional = s.salarioEsperado * (s.diasServico / 20)

  // Diária sugerida: ajusta a diária atual para cobrir a meta proporcional
  const diariaSugerida = s.diasServico > 0
    ? s.diariaAtual + (remuneracaoProportional - moPropriaAtual) / s.diasServico
    : s.diariaAtual

  // Total atual: soma de todos os custos + mão de obra na diária praticada
  const totalAtual =
    transporteServico +
    depreciacaoServico +
    materiaisServico +
    alimentacaoServico +
    contingenciaServico +
    impostosServico +
    ajudantesTotal +
    moPropriaAtual

  // Total sugerido: diária sugerida × dias + ajudantes
  const totalSugerido = diariaSugerida * s.diasServico + ajudantesTotal

  return {
    // Entradas repassadas (usadas pelos gráficos e pelo resultado)
    diariaAtual: s.diariaAtual,
    diasServico: s.diasServico,
    ganhoEmSM,
    // Transporte
    transporteDiario, transporteMensal, transporteServico,
    // Depreciação
    depreciacaoDiaria, depreciacaoServico,
    // Materiais
    materiaisDiarios, materiaisServico,
    // Alimentação
    alimentacaoMensal, alimentacaoServico,
    // Contingência — subitens
    contingEmergencia,
    contingDecimoTerceiro,
    contingFerias,
    contingAdicionalFerias,
    contingReservaAfastamento,
    contingenciaMensal, contingenciaDiaria, contingenciaServico,
    contingEmergenciaServico,
    contingDecimoTerceiroServico,
    contingFeriasServico,
    contingAdicionalFeriasServico,
    contingReservaAfastamentoServico,
    // Impostos
    impostosDiario, impostosServico,
    // Custos operacionais
    custosOpDiarios,
    // Mão de obra
    ajudantesTotal,
    moPropriaAtual,
    // Resultados
    diariaSugerida,
    remuneracaoProportional,
    totalAtual,
    totalSugerido
  }
}
