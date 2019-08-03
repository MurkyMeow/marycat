import { State, el, fragment } from './index.js'

const converters = {
  string: String,
  number: Number,
  bigint: BigInt,
  boolean: v => v == 'true',
}

class MaryNode extends HTMLElement {
  constructor({ props, render, css }) {
    super()
    this.props = {}
    this.render = render
    for (const [key, value] of Object.entries(props)) {
      this.props[key] = this[key] || new State(value)
    }
    this.attachShadow({ mode: 'open' })
    if (css) {
      const style = document.createElement('style')
      style.textContent = css
      this.shadowRoot.appendChild(style)
    }
  }
  connectedCallback() {
    const node = this.render(fragment(), this.props)
    node.connect(this.shadowRoot)
  }
  attributeChangedCallback(name, _, value) {
    const prop = this.props[name]
    const converter = converters[typeof prop.v]
    prop.v = converter ? converter(value) : value
  }
}

export function webc({ name, props = {}, css, render }) {
  const attrs = Object.keys(props)
  const node = class extends MaryNode {
    constructor() {
      super({ props, render, css })
    }
    static get observedAttributes() {
      return attrs
    }
  }
  attrs.filter(key => typeof props[key] === 'object').forEach(key => {
    Object.defineProperty(node.prototype, key, {
      get() {
        return this[`_${key}`] || (this[`_${key}`] = new State(props[key]))
      },
      set(v) {
        this[key].v = v
      },
    })
  })
  customElements.define(name, node)
  return el(name, { _attrs: attrs })
}
