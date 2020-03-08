import { State, StateOrPlain } from './state'
import { VNode, VNodeConstructor, vnode } from './vnode'

type Props<T extends object> =
  { [K in keyof T]: State<T[K]> }

type Init<T extends object> =
  { [K in keyof T]: StateOrPlain<T[K]> }

function initToProps<T extends object>(init: Init<T>): Props<T> {
  // TODO optimize
  // it's much faster to just use the assignment (acc[key] = blabla)
  // but typescript complains about that and i can't fix it
  return Object.entries(init)
    .reduce((acc, [key, val]) => ({
      ...acc, [key]: val instanceof State ? val : new State(val),
    }), init as Props<T>)
}

export abstract class MaryElement<TProps extends object, TEvents> extends HTMLElement {
  props: Props<TProps>

  constructor(init: Init<TProps>) {
    super()
    this.props = initToProps(init)
    const observer = new MutationObserver(m => this.onAttributeChange(m))
    observer.observe(this, {
      attributes: true,
      attributeFilter: Object.keys(this.props),
    })
  }

  get renderRoot(): Element | ShadowRoot {
    return this.shadowRoot || this;
  }

  onAttributeChange(mutations: MutationRecord[]): void {
    mutations.forEach(m => {
      const attrName = m.attributeName as keyof TProps & string
      const val = this.getAttribute(attrName)
      const prop = this.props[attrName] as State<unknown>
      switch (typeof prop.v) {
        case 'bigint': prop.v = BigInt(val); break
        case 'number': prop.v = Number(val); break
        case 'string': prop.v = String(val); break
        case 'boolean': prop.v =  val === 'true'; break
        default: console.trace(val, 'is not assignable to', name, 'of', this)
      }
    })
  }

  emit<K extends keyof TEvents>(
    name: K & string,
    detail: TEvents[K] extends CustomEvent<infer U> ? U : never,
  ): boolean {
    return this.dispatchEvent(new CustomEvent(name, { detail }))
  }
}

export function customElement<TProps extends object, TEvents = unknown>(
  elName: string,
  view: (args: {
    host: VNodeConstructor<MaryElement<TProps, TEvents>>;
    props: Props<TProps>;
  }) => VNode<MaryElement<TProps, TEvents>, Element, TEvents>,
): (
  init: Init<TProps>,
) => VNodeConstructor<MaryElement<TProps, TEvents>, Node, TEvents> {
  class Component extends MaryElement<TProps, TEvents> {
    constructor(init: Init<TProps>) {
      super(init)
      const mount = view({
        props: this.props,
        host: (effects, ...children) => () => {
          for (const eff of effects || []) eff(this)
          for (const child of children) child(this)
          return this
        },
      })
      mount(this)
    }
  }
  customElements.define(elName, Component)
  return init => vnode(() => new Component(init))
}

export const shadow: VNodeConstructor<ShadowRoot, Element> = (effects, ...children) => root => {
  const node = root.attachShadow({ mode: 'open' })
  for (const eff of effects || []) eff(node)
  for (const child of children) child(node)
  return node
}
