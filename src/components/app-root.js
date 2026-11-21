import { LitElement, html, nothing } from 'lit'
import { calcular, DEFAULTS } from '../core/calculadora.js'
import { moeda, numero, sm, parseDecimal, paraInput } from '../core/formatar.js'
import { salvar, carregar, limpar, carregarModo, salvarModo } from '../core/storage.js'
import { icone } from '../core/icons.js'
import './graficos-resultado.js'

/**
 * Espelha a planilha orcamento_v2.xlsx: mesmos rótulos, mesmos 13 campos
 * de entrada (amarelos) e mesmos valores calculados (cinza).
 * A planilha vira 4 abas para reduzir o que aparece por vez.
 */
const ABAS = [
  { id: 'meta', rotulo: 'Meta', icone: 'target' },
  { id: 'servico', rotulo: 'Serviço', icone: 'wrench' },
  { id: 'custos', rotulo: 'Custos', icone: 'receipt-text' },
  { id: 'resultado', rotulo: 'Resultado', icone: 'chart-column' }
]

const CAMPOS_MOEDA = new Set([
  'salarioMinimoRef', 'salarioEsperado', 'diariaAtual', 'diariaAjudantes',
  'gasPrice', 'depreciacaoMensal', 'materiaisMensais', 'alimentacaoDiaria', 'impostosMensais'
])

class PrecoApp extends LitElement {
  createRenderRoot () { return this }

  static properties = {
    _s: { state: true },
    _aba: { state: true },
    _compacto: { state: true },
    _contAberta: { state: true },
    _modo: { state: true }
  }

  // Texto digitado em cada campo enquanto ele está em edição
  _raw = {}

  constructor () {
    super()
    this._s = { ...DEFAULTS, ...(carregar() ?? {}) }
    this._aba = 'meta'
    this._compacto = false
    this._contAberta = true
    this._modo = carregarModo()
  }

  firstUpdated () {
    this._io = new IntersectionObserver(
      ([e]) => { this._compacto = !e.isIntersecting },
      { threshold: 0 }
    )
    this._io.observe(this.querySelector('.hero'))
    this._observarSecoes()
  }

  updated (changed) {
    if (changed.has('_modo')) this._observarSecoes()
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this._io?.disconnect()
    this._ioSecoes?.disconnect()
  }

  /** No modo "tudo numa página", destaca na barra de baixo a seção que está na tela */
  _observarSecoes () {
    this._ioSecoes?.disconnect()
    if (this._modo !== 'pagina') return
    this._ioSecoes = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) this._aba = e.target.dataset.sec
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    this.querySelectorAll('section.aba[data-sec]').forEach((el) => this._ioSecoes.observe(el))
  }

  _mudarModo (modo) {
    if (modo === this._modo) return
    this._modo = modo
    salvarModo(modo)
    window.scrollTo({ top: 0 })
  }

  get _c () { return calcular(this._s) }

  // ─── Estado ───────────────────────────────────────────────────────────────

  _onInput (key, valor) {
    this._raw[key] = valor
    this._s = { ...this._s, [key]: parseDecimal(valor) }
    salvar(this._s)
  }

  _onBlur (key) {
    delete this._raw[key]
    this.requestUpdate()
  }

  _passo (key, delta, min) {
    const v = Math.max(min, Math.round(this._s[key]) + delta)
    delete this._raw[key]
    this._s = { ...this._s, [key]: v }
    salvar(this._s)
  }

  _resetar () {
    if (!confirm('Restaurar todos os valores padrão?')) return
    limpar()
    this._raw = {}
    this._s = { ...DEFAULTS }
  }

  _ir (id) {
    this._aba = id
    if (this._modo === 'pagina') {
      const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      this.querySelector(`#sec-${id}`)?.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0 })
    }
  }

  // ─── Peças de interface ───────────────────────────────────────────────────

  _valorInput (key) {
    if (key in this._raw) return this._raw[key]
    // Campos em reais aparecem como 1.499,42; contagens e km ficam simples
    return CAMPOS_MOEDA.has(key) ? numero(this._s[key]) : paraInput(this._s[key])
  }

  _input (key, id) {
    return html`
      <input
        id=${id}
        data-campo=${key}
        type="text"
        inputmode="decimal"
        autocomplete="off"
        .value=${this._valorInput(key)}
        @focus=${(e) => e.target.select()}
        @input=${(e) => this._onInput(key, e.target.value)}
        @blur=${() => this._onBlur(key)}
      />
    `
  }

  /** Campo editável com rótulo, unidade e (opcional) ajuda */
  _campo (key, rotulo, { pre = '', suf = '', ajuda = '' } = {}) {
    const id = `f-${key}`
    return html`
      <div class="campo">
        <label class="campo-rotulo" for=${id}>${rotulo}</label>
        <div class="entrada">
          ${pre ? html`<span class="entrada-pre">${pre}</span>` : nothing}
          ${this._input(key, id)}
          ${suf ? html`<span class="entrada-suf">${suf}</span>` : nothing}
        </div>
        ${ajuda ? html`<p class="campo-ajuda">${ajuda}</p>` : nothing}
      </div>
    `
  }

  /** Contador com botões grandes (dias, ajudantes) */
  _contador (key, rotulo, min, suf) {
    const id = `f-${key}`
    const v = this._s[key]
    return html`
      <div class="campo">
        <label class="campo-rotulo" for=${id}>${rotulo}</label>
        <div class="stepper">
          <button type="button" class="passo" aria-label="Diminuir: ${rotulo}"
            ?disabled=${v <= min} @click=${() => this._passo(key, -1, min)}>${icone('minus')}</button>
          <div class="entrada">
            ${this._input(key, id)}
            <span class="entrada-suf">${suf}</span>
          </div>
          <button type="button" class="passo" aria-label="Aumentar: ${rotulo}"
            @click=${() => this._passo(key, 1, min)}>${icone('plus')}</button>
        </div>
      </div>
    `
  }

  _calcLinha (rotulo, valor, variante = '') {
    return html`
      <div class="linha-calc">
        <span>${rotulo}</span>
        <strong class="valor ${variante}">${valor}</strong>
      </div>
    `
  }

  /** Célula de um custo: editável (amarela) ou calculada (cinza) */
  _celula (rotulo, def) {
    if (def.key) {
      const id = `f-${def.key}`
      return html`
        <div>
          <label class="cel-rotulo" for=${id}>${rotulo}</label>
          <div class="entrada">
            <span class="entrada-pre">R$</span>
            ${this._input(def.key, id)}
          </div>
        </div>
      `
    }
    return html`
      <div>
        <span class="cel-rotulo">${rotulo}</span>
        <div class="cel-calc">${moeda(def.valor)}</div>
      </div>
    `
  }

  /** Um custo: nome + valor no serviço em cima; mês e diário embaixo */
  _custo ({ ico, tom, nome, detalhe = '', servico, mes, dia, nota = '', extra = nothing }) {
    return html`
      <article class="cartao custo tom-${tom}">
        <div class="custo-topo">
          <span class="chip-ico">${icone(ico)}</span>
          <h3 class="custo-nome">
            ${nome.split('/').map((parte, i) => (i ? html`/<wbr>${parte}` : parte))}
            ${detalhe ? html`<small>${detalhe}</small>` : nothing}
          </h3>
          <div class="custo-servico">
            <small>no serviço</small>
            <b>${moeda(servico)}</b>
          </div>
        </div>
        <div class="custo-par">
          ${this._celula('Valor mês', mes)}
          ${this._celula('Valor diário', dia)}
        </div>
        ${nota ? html`<p class="custo-nota">${nota}</p>` : nothing}
        ${extra}
      </article>
    `
  }

  _subitem (rotulo, mensal, servico) {
    return html`
      <li>
        <span>${rotulo}</span>
        <b>${moeda(mensal)}<small>${moeda(servico)} no serviço</small></b>
      </li>
    `
  }

  _continuar (id, texto) {
    // Na página única todas as seções já estão em sequência
    if (this._modo === 'pagina') return nothing
    return html`
      <button type="button" class="btn-principal" @click=${() => this._ir(id)}>
        ${texto} ${icone('arrow-right')}
      </button>
    `
  }

  // ─── Abas ─────────────────────────────────────────────────────────────────

  _abaMeta (c) {
    return html`
      <section class="aba" id="sec-meta" data-sec="meta" aria-label="Meta">
        <div class="aba-intro">
          <h2>Quanto você quer ganhar?</h2>
          <p>Informe sua meta. O app calcula a diária que fecha a conta.</p>
        </div>
        <div class="cartao">
          <div class="cartao-topo">
            <span class="chip-ico">${icone('target')}</span>
            <h3 class="cartao-titulo">Meta de renda</h3>
          </div>
          ${this._campo('salarioMinimoRef', 'Referência: Salário mínimo líquido 2026', { pre: 'R$', suf: '/mês' })}
          ${this._campo('salarioEsperado', 'Salário líquido esperado no mês (20d)', { pre: 'R$', suf: '/mês' })}
          ${this._calcLinha('Ganho esperado em Salário mínimo líquido', sm(c.ganhoEmSM))}
          ${this._campo('diariaAtual', 'Valor da diária praticada', { pre: 'R$', suf: '/dia' })}
          ${this._calcLinha('Valor da diária sugerida', moeda(c.diariaSugerida), 'destaque')}
        </div>
        ${this._continuar('servico', 'Continuar: Serviço')}
      </section>
    `
  }

  _abaServico () {
    return html`
      <section class="aba" id="sec-servico" data-sec="servico" aria-label="Serviço">
        <div class="aba-intro">
          <h2>Sobre o serviço</h2>
          <p>Quanto tempo dura, quem ajuda e quanto custa chegar na obra.</p>
        </div>
        <div class="cartao">
          <div class="cartao-topo">
            <span class="chip-ico">${icone('wrench')}</span>
            <h3 class="cartao-titulo">Serviço</h3>
          </div>
          ${this._contador('diasServico', 'Dias de trabalho até entrega (úteis)', 1, 'dias')}
          ${this._contador('qtdAjudantes', 'Quantos ajudantes', 0, 'pessoas')}
          ${this._campo('diariaAjudantes', 'Valor da diária dos ajudantes', { pre: 'R$', suf: '/dia' })}
        </div>
        <div class="cartao">
          <div class="cartao-topo">
            <span class="chip-ico">${icone('truck')}</span>
            <h3 class="cartao-titulo">Transporte</h3>
          </div>
          ${this._campo('gasPrice', 'Valor da gasolina por litro', { pre: 'R$', suf: '/litro' })}
          ${this._campo('km', 'Km deslocamento aproximado', { suf: 'km' })}
          ${this._campo('kmPerLiter', 'Consumo do veículo (km/L)', { suf: 'km/L' })}
        </div>
        ${this._continuar('custos', 'Continuar: Custos')}
      </section>
    `
  }

  _abaCustos (c) {
    const s = this._s
    const dias = s.diasServico
    return html`
      <section class="aba" id="sec-custos" data-sec="custos" aria-label="Custos">
        <div class="aba-intro">
          <h2>Custos operacionais e indiretos</h2>
          <p>
            Valores para ${dias} ${dias === 1 ? 'dia' : 'dias'} de serviço.
            Preencha os campos amarelos; os cinzas o app calcula.
          </p>
        </div>

        ${this._custo({
          ico: 'truck', tom: 'azul', nome: 'Custo de transporte total',
          servico: c.transporteServico,
          mes: { valor: c.transporteMensal }, dia: { valor: c.transporteDiario },
          nota: 'Calculado com gasolina, km e consumo da aba Serviço.'
        })}

        ${this._custo({
          ico: 'hammer', tom: 'ambar', nome: 'Depreciação contábil de ferramentas e equipamentos',
          servico: c.depreciacaoServico,
          mes: { key: 'depreciacaoMensal' }, dia: { valor: c.depreciacaoDiaria }
        })}

        ${this._custo({
          ico: 'package', tom: 'ambar', nome: 'Materiais consumo operacional, de custo do prestador',
          servico: c.materiaisServico,
          mes: { key: 'materiaisMensais' }, dia: { valor: c.materiaisDiarios }
        })}

        ${this._custo({
          ico: 'utensils', tom: 'verde', nome: 'Alimentação de preparo próprio',
          servico: c.alimentacaoServico,
          mes: { valor: c.alimentacaoMensal }, dia: { key: 'alimentacaoDiaria' }
        })}

        ${this._custo({
          ico: 'shield-check', tom: 'violeta',
          nome: 'Fundo de contingência/Reservas',
          detalhe: '(emergência, 13º, férias, seguro saúde 15d)',
          servico: c.contingenciaServico,
          mes: { valor: c.contingenciaMensal }, dia: { valor: c.contingenciaDiaria },
          extra: html`
            <button type="button" class="toggle" aria-expanded=${this._contAberta}
              aria-controls="subitens-conting"
              @click=${() => { this._contAberta = !this._contAberta }}>
              <span>${this._contAberta ? 'Ocultar' : 'Ver'} os 5 itens da reserva</span>
              ${icone('chevron-down')}
            </button>
            ${this._contAberta
              ? html`
                <ul class="subitens" id="subitens-conting">
                  ${this._subitem('Fundo de emergência (8% da renda)', c.contingEmergencia, c.contingEmergenciaServico)}
                  ${this._subitem('13º salário (1/12 ao mês)', c.contingDecimoTerceiro, c.contingDecimoTerceiroServico)}
                  ${this._subitem('Férias (1/12 ao mês)', c.contingFerias, c.contingFeriasServico)}
                  ${this._subitem('Adicional de férias (1/3, proporcional 1/12 ao mês)', c.contingAdicionalFerias, c.contingAdicionalFeriasServico)}
                  ${this._subitem('Reserva p/ afastamento (~15 dias/ano)', c.contingReservaAfastamento, c.contingReservaAfastamentoServico)}
                </ul>`
              : nothing}
          `
        })}

        ${this._custo({
          ico: 'landmark', tom: 'azul', nome: 'Impostos',
          servico: c.impostosServico,
          mes: { key: 'impostosMensais' }, dia: { valor: c.impostosDiario }
        })}

        ${this._continuar('resultado', 'Ver resultado')}
      </section>
    `
  }

  _abaResultado (c) {
    return html`
      <section class="aba" id="sec-resultado" data-sec="resultado" aria-label="Resultado">
        <div class="aba-intro">
          <h2>Resultado</h2>
          <p>Para ${this._s.diasServico} dias de serviço, com a sua meta de renda.</p>
        </div>

        <div class="cartao">
          <div class="cartao-topo">
            <span class="chip-ico">${icone('users')}</span>
            <h3 class="cartao-titulo">Mão de obra</h3>
          </div>
          <div class="recibo-linha"><span>Ajudantes</span><b>${moeda(c.ajudantesTotal)}</b></div>
          <div class="recibo-linha"><span>Própria (valor agregado e ganho)</span><b>${moeda(c.moPropriaAtual)}</b></div>
        </div>

        <div class="cartao">
          <div class="cartao-topo">
            <span class="chip-ico">${icone('wallet')}</span>
            <h3 class="cartao-titulo">Valores do serviço</h3>
          </div>
          <div class="recibo-linha"><span>Valor total do serviço</span><b>${moeda(c.totalAtual)}</b></div>
          <div class="recibo-linha principal">
            <span>Valor total do serviço sugerido</span><b>${moeda(c.totalSugerido)}</b>
          </div>
          <div class="recibo-linha"><span>Remuneração proporcional esperada</span><b>${moeda(c.remuneracaoProportional)}</b></div>
        </div>

        <preco-graficos .calc=${c}></preco-graficos>
      </section>
    `
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  render () {
    const c = this._c
    return html`
      <div class="compacto ${this._compacto ? 'visivel' : ''}" aria-hidden=${!this._compacto}>
        <div class="compacto-in">
          <div><span>Diária sugerida</span><b>${moeda(c.diariaSugerida)}</b></div>
          <div class="dir"><span>Total sugerido</span><b>${moeda(c.totalSugerido)}</b></div>
        </div>
      </div>

      <div class="app">
        <header class="topo">
          <div class="topo-marca">
            <span class="logo" aria-hidden="true">R$</span>
            <div>
              <div class="topo-titulo">Precificador de Obras</div>
              <div class="topo-sub">Demonstração para precificação</div>
            </div>
          </div>
          <button type="button" class="btn-icone" aria-label="Restaurar valores padrão"
            @click=${this._resetar}>${icone('rotate-ccw')}</button>
        </header>

        <section class="hero" aria-label="Resumo">
          <span class="hero-rotulo">Valor da diária sugerida</span>
          <strong class="hero-valor">${moeda(c.diariaSugerida)}</strong>
          <div class="hero-linha">
            <div><span>Diária praticada</span><b>${moeda(this._s.diariaAtual)}</b></div>
            <div><span>Total sugerido</span><b>${moeda(c.totalSugerido)}</b></div>
          </div>
        </section>

        <div class="modo" role="group" aria-label="Como ver as informações">
          <button type="button" data-modo="etapas" aria-pressed=${this._modo === 'etapas'}
            @click=${() => this._mudarModo('etapas')}>Por etapas</button>
          <button type="button" data-modo="pagina" aria-pressed=${this._modo === 'pagina'}
            @click=${() => this._mudarModo('pagina')}>Tudo numa página</button>
        </div>

        ${this._modo === 'pagina'
          ? html`
            ${this._abaMeta(c)}
            ${this._abaServico()}
            ${this._abaCustos(c)}
            ${this._abaResultado(c)}`
          : html`
            ${this._aba === 'meta' ? this._abaMeta(c) : nothing}
            ${this._aba === 'servico' ? this._abaServico() : nothing}
            ${this._aba === 'custos' ? this._abaCustos(c) : nothing}
            ${this._aba === 'resultado' ? this._abaResultado(c) : nothing}`}

        <div class="legenda">
          <span><i class="l-edit"></i>Campo amarelo → você pode editar</span>
          <span><i class="l-calc"></i>Campo cinza → calculado automaticamente</span>
        </div>
      </div>

      <nav class="abas" aria-label="Seções">
        <div class="abas-in" role="tablist">
          ${ABAS.map((a) => html`
            <button type="button" role="tab" class="aba-btn" data-aba=${a.id}
              aria-selected=${this._aba === a.id}
              @click=${() => this._ir(a.id)}>
              <span class="pilula">${icone(a.icone)}</span>
              ${a.rotulo}
            </button>
          `)}
        </div>
      </nav>
    `
  }
}

customElements.define('preco-app', PrecoApp)
