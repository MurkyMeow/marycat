import { State } from './state'
import { MaryElement, fragment, Effect } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

export class MaryComponent extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props: { [key: string]: State<unknown> } = {}
  converters: { [key: string]: Converter } = {}
  attributeChangedCallback(name: string, _: string, val: string) {
    const prop = this.props[name]
    const converter = this.converters[name]
    if (converter) prop.v = converter(val)
    else console.trace('Cant find a converter for property', name, 'of', this)
  }
}

let conf: {
  [key: string]: { state: State<any>, converter?: Converter }
} = {}

const trap = new Proxy({}, {
  get(_, key: string): void {
    conf[key] = { state: new State({}) }
  },
})
export function Attr(converter?: Converter): State<any> {
  const [current] = Object.values(conf).slice(-1)
  if (converter) {
    current.converter = converter
    current.state.v = converter('')
  }
  return current.state
}

export type Props<T> = {
  [key in keyof T]: State<T[key]>
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
      const elements = render(fragment(), <any>trap)
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
