import { State, el, fragment } from './index.js'

const converters = {
  string: v => String(v),
  number: v => Number(v),
  bigint: v => BigInt(v),
  object: v => JSON.parse(v),
  boolean: v => v == 'true',
}

class MaryNode extends HTMLElement {
  constructor({ props, fun, css }) {
    super()
    this.props = {}
    for (const [key, value] of Object.entries(props)) {
      this.props[key] = new State(value)
    }
    this.attachShadow({ mode: 'open' })
    if (css) {
      const style = document.createElement('style')
      style.textContent = css
      this.shadowRoot.appendChild(style)
    }
    const node = fun(fragment(), this.props)
    node(this.shadowRoot) // mount nodes to the shadow root
  }
  attributeChangedCallback(name, _, value) {
    const prop = this.props[name]
    const converter = converters[typeof prop.v]
    if (converter) {
      prop.v = converter(value)
    } else {
      prop.v = value
    }
  }
}

export function webc({ name, props = {}, css, fun }) {
  const attrs = Object.keys(props)
  customElements.define(name, class extends MaryNode {
    constructor() {
      super({ props, fun, css })
    }
    static get observedAttributes() {
      return attrs
    }
  })
  return el(name, { _attrs: attrs })
}
