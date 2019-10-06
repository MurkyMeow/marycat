import { State } from './state'
import { MaryElement, fragment, Effect } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

class MaryComponent extends HTMLElement {
  root: ShadowRoot
  props: { [key: string]: State<any> } = {}
  converters: { [key: string]: Converter } = {}
  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
  }
  attributeChangedCallback(name: string, _: string, val: string) {
    const prop = this.props[name]
    const converter = this.converters[name]
    prop.v = converter(val)
  }
}

export function webc(
  name: string,
  args: {
    css?: string,
    attributes: [Converter, any],
    render: (host: MaryElement, props: { [key: string]: State<any> }) => MaryElement,
  },
) {
  customElements.define(name, class extends MaryComponent {
    static get observedAttributes() {
      return Object.keys(args.attributes)
    }
  })
  class Chainable extends MaryElement {
    constructor(chain: Effect[]) {
      super(name, chain)
    }
    attr(name: string, val: any): this {
      if (typeof val !== 'object') return super.attr(name, val)
      return this.$(el => {
        const comp = <MaryComponent>el
        const prop = comp.props[name]
        if (prop) prop.v = val
        else console.trace(el, 'does not support setting the prop:', { name, val })
      })
    }
    mount(parent: Element | ShadowRoot) {
      const el = this.el = <MaryComponent>document.createElement(name)
      Object.entries(args.attributes).forEach(([key, attr]) => {
        const [converter, initial] = attr
        el.props[key] = new State(initial)
        el.converters[key] = converter
      })
      args.render(fragment(), el.props).mount(el.root)
      return super.mount(parent)
    }
  }
  return (...effects: Effect[]) => new Chainable(effects)
}
