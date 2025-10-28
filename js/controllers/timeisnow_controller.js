import { Controller } from "@hotwired/stimulus"

let tickerInstance = null
function getTicker() {
  if (tickerInstance) return tickerInstance
  const subs = new Set()
  let id = null
  const tick = () => {
    const now = new Date()
    subs.forEach(s => { try { s.update(now) } catch (e) { /* ignore */ } })
  }
  tickerInstance = {
    sub(s) {
      subs.add(s)
      if (!id) { tick(); id = setInterval(tick, 1000) }
    },
    unsub(s) {
      subs.delete(s)
      if (subs.size === 0 && id) { clearInterval(id); id = null }
    }
  }
  return tickerInstance
}

export default class extends Controller {
  connect() {
    this.ticker = getTicker()
    this.ticker.sub(this)
    if (!this.element.hasAttribute('datetime')) {
      this.element.setAttribute('datetime', new Date().toISOString())
    }
  }

  disconnect() {
    this.ticker.unsub(this)
  }

  update(d) {
    this.element.textContent = this.format(d)
    this.element.setAttribute('datetime', d.toISOString())
  }

  format(d) {
    const z = (n, l = 2) => String(n).padStart(l, '0')
    return `${d.getFullYear()}/${z(d.getMonth()+1)}/${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
  }
}
