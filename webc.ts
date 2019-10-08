import { State } from './state'
import { MaryElement, fragment, Effect } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

class MaryComponent extends HTMLElement {
  root: ShadowRoot
  props: { [key: string]: State<unknown> } = {}
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

let conf: {
  [key: string]: {
    state: State<any>,
    converter?: Converter,
  }
} = {}

export function Attr(name: string, converter?: Converter): State<any> {
  const state = new State(converter ? converter('') : null)
  conf[name] = { converter, state }
  return state
}

export function webc(
  name: string,
  observed: string[],
  render: (host: MaryElement, ...rest: any[]) => MaryElement,
) {
  customElements.define(name, class extends MaryComponent {
    static get observedAttributes() { return observed }
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
        if (prop) {
          prop.v = val
        } else {
          console.trace(el, 'does not support assigning an object to prop called', name)
        }
      })
    }
    mount(parent: Element | ShadowRoot) {
      const el = this.el = <MaryComponent>document.createElement(name)
      render(fragment()).mount(el.root)
      Object.entries(conf).forEach(([key, val]) => {
        el.props[key] = val.state
        if (val.converter) el.converters[key] = val.converter
      })
      return super.mount(parent)
    }
  }
  return (...effects: Effect[]) => new Chainable(effects)
}
