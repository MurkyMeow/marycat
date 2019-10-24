import { State, StateOrPlain } from './state'
import { PipeFn, mount, _, fragment, shorthand, VirtualNode, attr } from './core'

type Props<T> =
  { [key in keyof T]: State<T[key]> }

function getConverter(type: string) {
  switch (type) {
    case 'bigint': return BigInt
    case 'number': return Number
    case 'string': return String
    case 'boolean': return Boolean
  }
}

export class MaryElement<T> extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props!: Props<T>
  attributeChangedCallback(name: keyof T, _: string, val: string) {
    const prop = this.props[name]
    const converter = getConverter(typeof prop.v)
    if (converter) prop.v = <any>converter(val) // fixme
    else console.trace(val, 'is not assignable to', name, 'of', this)
  }
}

export type ElementOf<T> =
  T extends CustomElementConstructor<infer U> ? MaryElement<U> : never

type RenderFunction<T> =
  (host: PipeFn, props: Props<T>) => PipeFn

const renderLookup = new Map<string, RenderFunction<any>>()

let props: { [key: string]: State<any> }
let keys: string[]

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  props[current] = new State(defaultValue)
  return props[current]
}

export function createComponent(_node: VirtualNode | PipeFn): MaryElement<any> {
  const node = _node instanceof VirtualNode
    ? _node : _node.__vnode
  props = {}, keys = []
  const trap = new Proxy({}, {
    get: (_, key: string) => void keys.push(key),
  })
  const render = renderLookup.get(node.elName)
  if (!render) {
    throw Error(`Cant find a render function for "${node.elName}"`)
  }
  const elements = render(fragment(), <any>trap)
  if (!customElements.get(node.elName)) {
    customElements.define(node.elName, class extends MaryElement<any> {
      static get observedAttributes() { return keys }
    })
  }
  const el = node.el =
    <MaryElement<any>>document.createElement(node.elName)
  el.props = props
  mount(el.root, elements)
  return el
}

interface CustomElementConstructor<T> {
  new: () => PipeFn
  prop:
    <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) =>
    (el: Element | ShadowRoot) => void
}

export const customElement = <T>(
  elName: string,
  render: RenderFunction<T>,
): CustomElementConstructor<T> => {
  renderLookup.set(elName, render)
  return {
    new: shorthand(elName),
    prop: <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) => (el: Element | ShadowRoot) => {
      const comp = <MaryElement<T>>el
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        attr(<string>key, val)(comp)
      } else if (val instanceof State) {
        val.sub(next => comp.props[key].v = next)
      } else {
        comp.props[key].v = val
      }
    },
  }
}
