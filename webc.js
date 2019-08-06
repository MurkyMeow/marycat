import { State, el, fragment } from './index.js'

const converters = {
  string: String,
  number: Number,
  bigint: BigInt,
  boolean: v => v == 'true',
}

class MaryNode extends HTMLElement {
  constructor({ props, css }) {
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
  }
  attributeChangedCallback(name, _, value) {
    const prop = this.props[name]
    const converter = converters[typeof prop.v]
    prop.v = converter ? converter(value) : value
  }
}

export function webc({ name, props = {}, css, render, ...api }) {
  const attrs = Object.keys(props)
  customElements.define(name, class extends MaryNode {
    constructor() {
      super({ props, css })
    }
    static get observedAttributes() {
      return attrs
    }
  })
  return el(name, {
    _attrs: attrs,
    ...api,
    render,
    connect($parent) {
      const $el = this.baseConnect($parent)
      const node = this.render(fragment(), $el.props)
      node.connect($el.shadowRoot)
      return $el
    },
  })
}
