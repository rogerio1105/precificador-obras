import { LitElement, html } from 'lit'
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { moeda } from '../core/formatar.js'

Chart.defaults.font.family = "'Inter Variable', system-ui, sans-serif"
Chart.defaults.font.size = 13
Chart.defaults.color = '#111827'

// Mesmas séries dos gráficos da planilha
const COMPOSICAO = [
  { nome: 'Transporte', cor: '#1E3A5F', chave: 'transporteServico' },
  { nome: 'Depreciação', cor: '#2563EB', chave: 'depreciacaoServico' },
  { nome: 'Materiais Op.', cor: '#0E7490', chave: 'materiaisServico' },
  { nome: 'Alimentação', cor: '#059669', chave: 'alimentacaoServico' },
  { nome: 'Contingência', cor: '#7C3AED', chave: 'contingenciaServico' },
  { nome: 'Impostos', cor: '#D97706', chave: 'impostosServico' },
  { nome: 'Ajudantes', cor: '#E65100', chave: 'ajudantesTotal' },
  { nome: 'MO Própria', cor: '#15803D', chave: 'moPropriaAtual' }
]

// Valores proporcionais ao serviço: quanto separar de cada reserva nesta obra
const RESERVAS = [
  { nome: 'Fundo Emerg. (8%)', cor: '#312E81', chave: 'contingEmergenciaServico' },
  { nome: '13º Salário', cor: '#4F46E5', chave: 'contingDecimoTerceiroServico' },
  { nome: 'Férias', cor: '#0284C7', chave: 'contingFeriasServico' },
  { nome: 'Adic. Férias', cor: '#7C3AED', chave: 'contingAdicionalFeriasServico' },
  { nome: 'Reserva afastamento', cor: '#DB2777', chave: 'contingReservaAfastamentoServico' }
]

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const valores = (def, c) => def.map((d) => Math.max(0, c[d.chave]))

const tooltip = {
  callbacks: {
    label: (ctx) => ` ${ctx.label || ctx.dataset.label}: ${brl(ctx.parsed.y ?? ctx.parsed)}`
  }
}

const rotuloFatia = (inteiro) => ({
  color: '#fff',
  font: { size: 12, weight: 'bold' },
  formatter: (v) => (inteiro ? 'R$ ' + Math.round(v).toLocaleString('pt-BR') : brl(v)),
  display: (ctx) => {
    const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
    return total > 0 && ctx.dataset.data[ctx.dataIndex] / total > (inteiro ? 0.1 : 0.06)
  }
})

class PrecoGraficos extends LitElement {
  createRenderRoot () { return this }

  static properties = { calc: { type: Object } }

  _graficos = {}

  firstUpdated () { this._iniciar() }

  updated (changed) {
    if (changed.has('calc')) this._atualizar()
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    Object.values(this._graficos).forEach((g) => g.destroy())
    this._graficos = {}
  }

  _dadosFatias (def, c) {
    return {
      labels: def.map((d) => d.nome),
      datasets: [{
        data: valores(def, c),
        backgroundColor: def.map((d) => d.cor),
        borderWidth: 3,
        borderColor: '#fff'
      }]
    }
  }

  _dadosDiaria (c) {
    return {
      labels: [''],
      datasets: [
        { label: 'Praticada', data: [c.diariaAtual], backgroundColor: '#1E3A5F', borderRadius: 8 },
        { label: 'Sugerida', data: [c.diariaSugerida], backgroundColor: '#E65100', borderRadius: 8 }
      ]
    }
  }

  _iniciar () {
    const c = this.calc
    const base = { responsive: true, maintainAspectRatio: false }

    this._graficos.composicao = new Chart(this.querySelector('#g-composicao'), {
      type: 'doughnut',
      data: this._dadosFatias(COMPOSICAO, c),
      plugins: [ChartDataLabels],
      options: {
        ...base,
        cutout: '45%',
        plugins: { legend: { display: false }, tooltip, datalabels: rotuloFatia(true) }
      }
    })

    this._graficos.diaria = new Chart(this.querySelector('#g-diaria'), {
      type: 'bar',
      data: this._dadosDiaria(c),
      plugins: [ChartDataLabels],
      options: {
        ...base,
        layout: { padding: { top: 26 } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#E3E7EE' }, ticks: { callback: (v) => brl(v) } },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip,
          datalabels: {
            anchor: 'end', align: 'end', color: '#111827',
            font: { size: 14, weight: 'bold' }, formatter: (v) => brl(v)
          }
        }
      }
    })

    this._graficos.reservas = new Chart(this.querySelector('#g-reservas'), {
      type: 'pie',
      data: this._dadosFatias(RESERVAS, c),
      plugins: [ChartDataLabels],
      options: {
        ...base,
        plugins: { legend: { display: false }, tooltip, datalabels: rotuloFatia(true) }
      }
    })
  }

  _atualizar () {
    const c = this.calc
    const g = this._graficos
    if (!g.composicao) return
    g.composicao.data = this._dadosFatias(COMPOSICAO, c)
    g.diaria.data = this._dadosDiaria(c)
    g.reservas.data = this._dadosFatias(RESERVAS, c)
    Object.values(g).forEach((chart) => chart.update('none'))
  }

  /** Legenda em HTML: texto equivalente do gráfico, em tamanho legível */
  _legenda (def, c, rotuloTotal = '') {
    const vals = valores(def, c)
    const total = vals.reduce((a, b) => a + b, 0)
    return html`
      <ul class="leg">
        ${def.map((d, i) => html`
          <li>
            <i style="background:${d.cor}"></i>
            <span>${d.nome}</span>
            <b>${moeda(vals[i])}</b>
            <em>${total > 0 ? Math.round((vals[i] / total) * 100) : 0}%</em>
          </li>
        `)}
        ${rotuloTotal
          ? html`<li class="total"><span>${rotuloTotal}</span><b>${moeda(total)}</b></li>`
          : ''}
      </ul>
    `
  }

  render () {
    const c = this.calc
    if (!c) return html``
    return html`
      <div class="cartao">
        <h3 class="cartao-titulo">Composição do Orçamento</h3>
        <div class="grafico-canvas"><canvas id="g-composicao" role="img"
          aria-label="Composição do orçamento por tipo de custo"></canvas></div>
        ${this._legenda(COMPOSICAO, c)}
      </div>

      <div class="cartao">
        <h3 class="cartao-titulo">Diária: Praticada vs Sugerida</h3>
        <div class="grafico-canvas"><canvas id="g-diaria" role="img"
          aria-label="Comparação entre a diária praticada e a sugerida"></canvas></div>
        <ul class="leg">
          <li><i style="background:#1E3A5F"></i><span>Praticada</span><b>${moeda(c.diariaAtual)}</b><em></em></li>
          <li><i style="background:#E65100"></i><span>Sugerida</span><b>${moeda(c.diariaSugerida)}</b><em></em></li>
        </ul>
      </div>

      <div class="cartao">
        <h3 class="cartao-titulo">Reservas e Contingência (neste serviço)</h3>
        <p class="grafico-sub">
          Quanto separar de cada reserva para este serviço de
          ${c.diasServico} ${c.diasServico === 1 ? 'dia' : 'dias'}.
        </p>
        <div class="grafico-canvas"><canvas id="g-reservas" role="img"
          aria-label="Quanto reservar de cada item neste serviço"></canvas></div>
        ${this._legenda(RESERVAS, c, 'Total a reservar neste serviço')}
      </div>
    `
  }
}

customElements.define('preco-graficos', PrecoGraficos)
