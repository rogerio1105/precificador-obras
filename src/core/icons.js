import { html } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'

// Ícones Lucide (licença ISC), embutidos no bundle: funcionam offline.
import target from 'lucide-static/icons/target.svg?raw'
import wrench from 'lucide-static/icons/wrench.svg?raw'
import receiptText from 'lucide-static/icons/receipt-text.svg?raw'
import chartColumn from 'lucide-static/icons/chart-column.svg?raw'
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg?raw'
import chevronDown from 'lucide-static/icons/chevron-down.svg?raw'
import minus from 'lucide-static/icons/minus.svg?raw'
import plus from 'lucide-static/icons/plus.svg?raw'
import truck from 'lucide-static/icons/truck.svg?raw'
import hammer from 'lucide-static/icons/hammer.svg?raw'
import pkg from 'lucide-static/icons/package.svg?raw'
import utensils from 'lucide-static/icons/utensils.svg?raw'
import shieldCheck from 'lucide-static/icons/shield-check.svg?raw'
import landmark from 'lucide-static/icons/landmark.svg?raw'
import users from 'lucide-static/icons/users.svg?raw'
import hardHat from 'lucide-static/icons/hard-hat.svg?raw'
import arrowRight from 'lucide-static/icons/arrow-right.svg?raw'
import wallet from 'lucide-static/icons/wallet.svg?raw'
import fuel from 'lucide-static/icons/fuel.svg?raw'

const ICONES = {
  target,
  wrench,
  'receipt-text': receiptText,
  'chart-column': chartColumn,
  'rotate-ccw': rotateCcw,
  'chevron-down': chevronDown,
  minus,
  plus,
  truck,
  hammer,
  package: pkg,
  utensils,
  'shield-check': shieldCheck,
  landmark,
  users,
  'hard-hat': hardHat,
  'arrow-right': arrowRight,
  wallet,
  fuel
}

/** Renderiza um ícone SVG decorativo (o texto vizinho já descreve a ação). */
export const icone = (nome) =>
  html`<span class="ico" aria-hidden="true">${unsafeHTML(ICONES[nome] ?? '')}</span>`
