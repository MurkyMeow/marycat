import { State, ExtractStateType } from './state'
import { PipeFn, mount, _, fragment, shorthand, VirtualNode, attr } from './core'

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

type RenderFunction<T = any> =
  (host: PipeFn, props: T) => PipeFn

const renderLookup = new Map<string, RenderFunction>()

let props: { [key: string]: State<any> }
let keys: string[]

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  props[current] = new State(defaultValue)
  return props[current]
}

export function createComponent(_node: VirtualNode | PipeFn): MaryElement {
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
    customElements.define(node.elName, class extends MaryElement {
      static get observedAttributes() { return keys }
    })
  }
  const el = node.el = <MaryElement>document
    .createElement(node.elName)
  el.props = props
  mount(el.root, elements)
  return el
}

export const customElement = <T>(
  elName: string,
  render: RenderFunction<T>,
) => {
  renderLookup.set(elName, render)
  return {
    new: shorthand(elName),
    prop: <K extends keyof T>(
      key: K,
      val: T[K] | ExtractStateType<T[K]>,
    ) => (el: Element | ShadowRoot) => {
      const sKey = <string>key
      const comp = <MaryElement>el
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        attr(sKey, val)(comp)
      } else if (val instanceof State) {
        val.sub(next => comp.props[sKey].v = next)
      } else {
        comp.props[sKey].v = val
      }
    },
  }
}
