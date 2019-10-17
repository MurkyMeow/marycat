import { State, ExtractStateType } from './state'
import { VirtualNode, fragment, Effect } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

function getConverter(type: string): Converter | undefined {
  switch (type) {
    case 'bigint': return BigInt
    case 'number': return Number
    case 'string': return String
    case 'boolean': return Boolean
  }
}

export class MaryElement extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props: { [key: string]: State<unknown> } = {}
  attributeChangedCallback(name: string, _: string, val: string) {
    const prop = this.props[name]
    const converter = getConverter(typeof prop.v)
    if (converter) prop.v = converter(val)
    else console.trace(val, 'is not assignable to', `"${name}"`, 'of', this)
  }
}

let props: { [key: string]: State<any> }
let keys: string[]

export function Attr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  props[current] = new State(defaultValue)
  return props[current]
}

export function customElement<T>(
  name: string,
  render: (host: VirtualNode, props: T) => VirtualNode,
) {
  class ComponentVirtualNode extends VirtualNode {
    constructor(chain: Effect[]) {
      super(name, chain)
    }
    prop<K extends keyof T>(key: K, val: ExtractStateType<T[K]>): this {
      const sKey = <string>key
      if (typeof val !== 'object') {
        return super.attr(sKey, String(val))
      }
      return this.$(el => {
        const comp = <MaryElement>el
        comp.props[sKey].v = val
      })
    }
    mount(parent: Element | ShadowRoot) {
      props = {}
      keys = []
      const trap = new Proxy({}, {
        get: (_, key: string) => void keys.push(key),
      })
      const elements = render(fragment(), <any>trap)
      if (!customElements.get(name)) {
        customElements.define(name, class extends MaryElement {
          static get observedAttributes() { return keys }
        })
      }
      const el = this.el = <MaryElement>document.createElement(name)
      el.props = props
      elements.mount(el.root)
      return super.mount(parent)
    }
  }
  return (...effects: Effect[]) => new ComponentVirtualNode(effects)
}
