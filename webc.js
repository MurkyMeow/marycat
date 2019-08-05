import { State, el, fragment } from './index.js'

const converters = {
  string: String,
  number: Number,
  bigint: BigInt,
  boolean: v => v == 'true',
}

const isObject = val => typeof val === 'object'
  && val !== null
  && !Array.isArray(val)

class MaryNode extends HTMLElement {
  constructor({ props, render, css }) {
    super()
    this.props = {}
    this.render = render
    for (const [key, value] of Object.entries(props)) {
      this.props[key] = new State(value)
      if (isObject(value)) this.props[key].wrap()
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
  customElements.define(name, node)
  return el(name, { _attrs: attrs })
}
