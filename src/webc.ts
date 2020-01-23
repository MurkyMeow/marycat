import { State, StateOrPlain } from './state'
import { PipedNode, pipeNode } from './core'

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

export abstract class MaryElement<TProps extends object> extends HTMLElement {
  root: ShadowRoot
  props: Props<TProps>

  constructor(init: Init<TProps>) {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    this.props = initToProps(init)
    const observer = new MutationObserver(m => this.onAttributeChange(m))
    observer.observe(this, {
      attributes: true,
      attributeFilter: Object.keys(this.props),
    })
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
}

export function customElement<TProps extends object, TEvents = unknown>(
  elName: string,
  render: (args: {
    host: PipedNode<ShadowRoot, TEvents & HTMLElementEventMap>,
    props: Props<TProps>,
  }) => PipedNode<ShadowRoot, TEvents>,
): (init: Init<TProps>) => PipedNode<MaryElement<TProps>, TEvents> {
  class Component extends MaryElement<TProps> {
    constructor(init: Init<TProps>) {
      super(init)
      render({
        host: pipeNode(this.root),
        props: this.props,
      })
    }
  }
  customElements.define(elName, Component)
  return init => pipeNode(new Component(init))
}
