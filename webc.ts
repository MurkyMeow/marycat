import { State } from './state'
import { MaryElement, fragment, Effect } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

class MaryComponent extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props: { [key: string]: State<unknown> } = {}
  converters: { [key: string]: Converter } = {}
  attributeChangedCallback(name: string, _: string, val: string) {
    const prop = this.props[name]
    const converter = this.converters[name]
    prop.v = converter(val)
  }
}

let conf: {
  [key: string]: { state: State<any>, converter?: Converter }
} = {}

export function Attr(name: string, converter?: Converter): State<any> {
  const state = new State(converter ? converter('') : null)
  conf[name] = { converter, state }
  return state
}

export type Props<T> = {
  [key: string]: State<T[keyof T]>
}

export function customElement<T>(
  name: string,
  render: (host: MaryElement, props: Props<T>) => MaryElement,
) {
  class Chainable extends MaryElement {
    constructor(chain: Effect[]) {
      super(name, chain)
    }
    prop<K extends keyof T>(key: K, val: T[K]): this {
      const sKey = <string>key
      if (typeof val !== 'object') {
        return super.attr(sKey, String(val))
      }
      return this.$(el => {
        const comp = <MaryComponent>el
        comp.props[sKey].v = val
      })
    }
    mount(parent: Element | ShadowRoot) {
      // `render` mutates `conf` by calling `Attr` within it's parameters
      const elements = render(fragment(), {})
      if (!customElements.get(name)) {
        customElements.define(name, class extends MaryComponent {
          static get observedAttributes() { return Object.keys(conf) }
        })
      }
      const el = this.el = <MaryComponent>document.createElement(name)
      Object.entries(conf).forEach(([key, val]) => {
        el.props[key] = val.state
        if (val.converter) el.converters[key] = val.converter
      })
      conf = {}
      elements.mount(el.root)
      return super.mount(parent)
    }
  }
  return (...effects: Effect[]) => new Chainable(effects)
}
