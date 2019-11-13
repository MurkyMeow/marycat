import { State, StateOrPlain } from './state'
import { PipeFn, attr, pipe, Effect, on, dispatch, PipeConstructor } from './core'

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

export abstract class MaryElement<T, E> extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  // as props are defined using default parameters
  // they're considered to be optional and thus nullable
  // `Required` frees from the need of writing null checks
  props: Required<Props<T>>
  constructor(render: RenderFunction<T, E>) {
    super()
    props = {}, keys = []
    const trap = new Proxy({}, {
      get: (_, key: string): void => {
        keys.push(key)
      },
    })
    render(pipe(this.root), trap as Props<T>, t_dispatch)
    this.props = props as Required<Props<T>>
    const observer = new MutationObserver(m => this.onAttributeChange(m))
    observer.observe(this, {
      attributes: true,
      attributeFilter: Object.keys(props),
    })
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
}

export type TypedDispatch<E> =
  <K extends keyof E>(
    event: K, detail: E[K], opts?: Omit<CustomEventInit, 'detail'>
  ) => (el: ShadowRoot) => void

const t_dispatch = <E, K extends keyof E>(
  event: K, detail: E[K], opts?: Omit<CustomEventInit, 'detail'>,
) => dispatch(event as string, detail, opts)

type RenderFunction<T, E> =
  (host: PipeFn<ShadowRoot>, props: Props<T>, t_dispatch: TypedDispatch<E>) => PipeFn<ShadowRoot>

export interface CustomElementConstructor<T, E> {
  new: PipeConstructor<MaryElement<T, E>>

  on: <K extends keyof E>(event: K, handler: (event: CustomEvent<E[K]>) => void) =>
    (el: MaryElement<T, E>) => void

  prop: <K extends keyof T, E extends Node>(key: K, val: StateOrPlain<T[K]>) =>
    Effect<MaryElement<T, E>, E>
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
      } else if (val instanceof State) {
        val.sub(next => el.props[key].v = next)
      } else {
        el.props[key].v = val
      }
    },
  }
}
