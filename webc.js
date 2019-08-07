import { State, el, fragment } from './index.js'

const converters = {
  string: String,
  number: Number,
  bigint: BigInt,
  boolean: v => v == 'true',
}

class MaryNode extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    if (this.css) {
      const style = document.createElement('style')
      style.textContent = this.css
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
    get css() {
      return css
    }
    static get observedAttributes() {
      return attrs
    }
  })
  return el(name, {
    ...api, attrs, render,
    init() {
      this.props = {}
      for (const [key, value] of Object.entries(props)) {
        this.props[key] = new State(value)
      }
      if (api.init) api.init.apply(this)
    },
    connect($parent) {
      const $el = document.createElement(name)
      $el.props = this.props
      this.baseConnect($parent, $el)
      const node = this.render(fragment(), this.props)
      node.connect($el.shadowRoot)
      return $el
    },
  })
}
