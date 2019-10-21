import { State, ExtractStateType } from './state'
import { PipeFn, mount, _, fragment, shorthand, VirtualNode } from './core'

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

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  props[current] = new State(defaultValue)
  return props[current]
}

function mountComponent(
  parent: Element | ShadowRoot,
  node: VirtualNode | PipeFn,
): Element {
  props = {}
  keys = []
  const trap = new Proxy({}, {
    get: (_, key: string) => void keys.push(key),
  })
  const elements = render(fragment(), <any>trap)
  if (!customElements.get(elName)) {
    customElements.define(elName, class extends MaryElement {
      static get observedAttributes() { return keys }
    })
  }
  const el = <MaryElement>document.createElement(elName)
  el.props = props
  mount(el.root, elements)
  const _node = node instanceof VirtualNode ? node : node.__vnode
  _node.el = el
  // apply the chain
  return <Element>mount(parent, _node)
}

export const customElement = <T>(
  name: string,
  render: (host: PipeFn, props: T) => PipeFn,
) => ({
  new: shorthand(name),
  prop: <K extends keyof T>(
    key: K,
    val: T[K] | ExtractStateType<T[K]>,
  ) => (el: Element | ShadowRoot) => {
    const sKey = <string>key
    const comp = <MaryElement>el
    if (typeof val !== 'object') {
      comp.setAttribute(sKey, String(val))
    } else if (val instanceof State) {
      val.sub(next => comp.props[sKey].v = next)
    } else {
      comp.props[sKey].v = val
    }
  },
})
