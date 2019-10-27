import { State, StateOrPlain } from './state'
import { PipeFn, VirtualNode, attr, pipe, Effect } from './core'

type Props<T> =
  { [key in keyof T]: State<T[key]> }


let props: Record<string, State<unknown>>
let keys: string[]

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  const state = new State(defaultValue)
  props[current] = state as State<unknown>
  return state
}

export abstract class MaryElement<T> extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props!: Props<T>
  constructor(
    private readonly render: RenderFunction<T>,
  ) {
    super()
  }
  onAttributeChange(mutations: MutationRecord[]): void {
    mutations.forEach(m => {
      const attrName = m.attributeName as keyof T
      const val = this.getAttribute(attrName as string)
      const prop = this.props[attrName] as State<unknown>
      switch (typeof prop.v) {
        case 'bigint': prop.v = BigInt(val); break
        case 'number': prop.v = Number(val); break
        case 'string': prop.v = String(val); break
        case 'boolean': prop.v =  Boolean(val); break
        default: console.trace(val, 'is not assignable to', name, 'of', this)
      }
    })
  }
  connectedCallback(): void {
    props = {}, keys = []
    const trap = new Proxy({}, {
      get: (_, key: string): void => {
        keys.push(key)
      },
    })
    const vnode = new VirtualNode<ShadowRoot>(this.root)
    this.render(pipe(vnode), trap as Props<T>)
    this.props = props as Props<T>
    const attributeObserver = new MutationObserver(this.onAttributeChange);
    attributeObserver.observe(this, {
      attributes: true,
      attributeFilter: Object.keys(props),
    })
  }
}

type RenderFunction<T> =
  (host: PipeFn<ShadowRoot>, props: Props<T>) => PipeFn<ShadowRoot>

export interface CustomElementConstructor<T> {
  new: () => PipeFn<MaryElement<T>>;
  prop: <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) => Effect<MaryElement<T>>;
}

export const customElement = <T>(
  elName: string, render: RenderFunction<T>,
): CustomElementConstructor<T> => {
  class CustomElement extends MaryElement<T> {
    constructor() { super(render) }
  }
  customElements.define(elName, CustomElement)
  return {
    new(...setup: string[]): PipeFn<MaryElement<T>> {
      return pipe(new VirtualNode(new CustomElement(), setup))
    },
    prop: <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) => (el: MaryElement<T>): void => {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        attr(key as string, val)(el)
      } else if (val instanceof State) {
        val.sub(next => el.props[key].v = next)
      } else {
        el.props[key].v = val
      }
    },
  }
}
