import { State, el, fragment } from './index.js'

const converters = {
  string: v => String(v),
  number: v => Number(v),
  bigint: v => BigInt(v),
  object: v => JSON.parse(v),
  boolean: v => v == 'true',
}

class MaryNode extends HTMLElement {
  constructor(props, fun) {
    super()
    this.fun = fun
    this.props = {}
    for (const [key, value] of Object.entries(props)) {
      this.props[key] = new State(value)
    }
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
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    const frag = fragment()
    this.fun(frag, this.props)
    frag(this.shadowRoot)
  }
}

export function webc({ name, props, fun }) {
  const attrs = Object.keys(props)
  customElements.define(name, class extends MaryNode {
    constructor() {
      super(props, fun)
    }
    static get observedAttributes() {
      return attrs
    }
  })
  return el(name, { _attrs: attrs })
}
