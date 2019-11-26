import { StateOrPlain } from './state'
import { PipeFn, attr, pipe, on, dispatch, PipeConstructor } from './core'
import { observable, observe } from '@nx-js/observer-util'

let props: Record<string, unknown>
let keys: string[]

export function defAttr<T>(defaultValue: T): T {
  const [current] = keys.slice(-1)
  const state = observable(defaultValue)
  props[current] = state
  return state
}

export abstract class MaryElement<T, E> extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  // as props are defined using default parameters
  // they're considered to be optional and thus nullable
  // `Required` frees from the need of writing null checks
  props: T
  constructor(render: RenderFunction<T, E>) {
    super()
    props = {}, keys = []
    const trap = new Proxy({}, {
      get(_, key: string): void { keys.push(key) },
    })
    render(pipe(this.root), trap as T, t_dispatch)
    this.props = props as Required<T>
    const observer = new MutationObserver(m => this.onAttributeChange(m))
    observer.observe(this, {
      attributes: true,
      attributeFilter: keys,
    })
  }
  onAttributeChange(mutations: MutationRecord[]): void {
    mutations.forEach(m => {
      const attrName = m.attributeName as keyof T
      const val = this.getAttribute(attrName as string)
      const prop = this.props[attrName]
      // switch (typeof prop) {
      //   case 'bigint': prop = BigInt(val); break
      //   case 'number': prop = Number(val); break
      //   case 'string': prop = String(val); break
      //   case 'boolean': prop =  Boolean(val); break
      //   default: console.trace(val, 'is not assignable to', name, 'of', this)
      // }
    })
  }
}

export type TypedDispatch<E> =
  <K extends keyof E>(
    event: K, detail: E[K], opts?: Omit<CustomEventInit, 'detail'>
  ) => (el: ShadowRoot) => void

const t_dispatch = <E, K extends keyof E>(
  event: K, detail: E[K], opts?: Omit<CustomEventInit, 'detail'>,
) => dispatch(event as string, detail, opts)

type RenderFunction<T, E> =
  (host: PipeFn<ShadowRoot>, props: T, t_dispatch: TypedDispatch<E>) => PipeFn<ShadowRoot>

export interface CustomElementConstructor<T, E> {
  new: PipeConstructor<MaryElement<T, E>>

  on: <K extends keyof E>(event: K, handler: (event: CustomEvent<E[K]>) => void) =>
    (el: MaryElement<T, E>) => void

  prop: <K extends keyof T, E extends Node>(key: K, val: StateOrPlain<T[K]>) =>
    (el: MaryElement<T, E>) => void
}

export const customElement = <T, E>(
  elName: string, render: RenderFunction<T, E>,
): CustomElementConstructor<T, E> => {
  class CustomElement extends MaryElement<T, E> {
    constructor() { super(render) }
  }
  customElements.define(elName, CustomElement)
  return {
    new(...effects) {
      const el = new CustomElement()
      return pipe(el)(...effects)
    },
    on<K extends keyof E>(event: K, handler: (event: CustomEvent<E[K]>) => void) {
      return on(event as string, (e: Event) => handler(e as CustomEvent<E[K]>))
    },
    prop: <K extends keyof T>(key: K, val: StateOrPlain<T[K]>) => (el: MaryElement<T, E>): void => {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        attr(key as string, val)(el)
      } else {
        el.props[key] = val
      }
    },
  }
}
