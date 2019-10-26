import { State, StateOrPlain } from './state'
import { PipeFn, mount, shorthand, GenericVirtualNode, attr, pipe } from './core__simple'

type Props<T> =
  { [key in keyof T]: State<T[key]> }

export class MaryElement<T> extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props!: Props<T>
  attributeChangedCallback(name: keyof T, _: string, val: string): void {
    const prop = this.props[name] as State<unknown>
    switch (typeof prop.v) {
      case 'bigint': prop.v = BigInt(val); break
      case 'number': prop.v = Number(val); break
      case 'string': prop.v = String(val); break
      case 'boolean': prop.v =  Boolean(val); break
      default: console.trace(val, 'is not assignable to', name, 'of', this)
    }
  }
}

export type ElementOf<T> =
  T extends CustomElementConstructor<infer U> ? MaryElement<U> : never

type RenderFunction<T> =
  (host: PipeFn<MaryElement<T>>, props: Props<T>) => PipeFn<MaryElement<T>>

const renderLookup = new Map<string, RenderFunction<unknown>>()

let props: Record<string, State<unknown>>
let keys: string[]

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  const state = new State(defaultValue)
  props[current] = state as State<unknown>
  return state
}

const maryFragment = shorthand('fragment')

export function createComponent(
  _node: GenericVirtualNode<MaryElement<unknown>> | PipeFn<MaryElement<unknown>>,
): MaryElement<unknown> {
  const node = _node instanceof GenericVirtualNode
    ? _node : _node.__vnode
  props = {}, keys = []
  const trap = new Proxy({}, {
    get: (_, key: string): void => {
      keys.push(key)
    },
  })
  const render = renderLookup.get(node.elName)
  if (!render) {
    throw Error(`Cant find a render function for "${node.elName}"`)
  }
  const children = render(maryFragment(), trap)
  if (!customElements.get(node.elName)) {
    customElements.define(node.elName, class extends MaryElement<unknown> {
      static get observedAttributes(): string[] { return keys }
    })
  }
  const el = document.createElement(node.elName) as MaryElement<unknown>
  el.props = props
  mount(el.root, [children])
  return el
}

interface CustomElementConstructor<T> {
  new: () => PipeFn<MaryElement<T>>;
  prop:
    <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) =>
    (el: MaryElement<T>) => void;
}

export const customElement = <T>(
  elName: string, render: RenderFunction<T>,
): CustomElementConstructor<T> => {
  renderLookup.set(elName, render as RenderFunction<unknown>)
  return {
    new(...setup: string[]) {
      return pipe(new GenericVirtualNode(elName, setup))
    },
    prop: <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) => (el: MaryElement<T>): void => {
      if (
        typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        attr(key as string, val)(el)
      } else if (val instanceof State) {
        val.sub(next => el.props[key].v = next)
      } else {
        el.props[key].v = val
      }
    },
  }
}
