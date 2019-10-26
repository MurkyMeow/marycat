import { StateOrPlain, State } from './state'
import { createComponent } from './webc'

type ElOrShadow = Element | ShadowRoot

type ElName = keyof HTMLElementTagNameMap
type ElByName<T extends ElName> = HTMLElementTagNameMap[T]

export type Effect<T extends ElOrShadow> =
  (el: T) => void

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

export class GenericVirtualNode<T extends ElOrShadow> {
  el?: T
  chain: Effect<T>[] = []
  constructor(
    public readonly elName: string, setup: string[],
  ) {
    this.chain.push(_el => {
      const el = filterShadow(_el)
      setup.forEach(str => {
        const [prefix, rest] = [str[0], str.slice(1)]
        switch (prefix) {
          case '.': return el.classList.add(rest)
          case '#': return el.setAttribute('id', rest)
          case '@': return el.setAttribute('name', rest)
          default: return el.textContent += str
        }
      })
    })
  }
}

export class VirtualNode<T extends ElName> extends GenericVirtualNode<ElByName<T>> {}

// yes, this is a monkey-patched function
export type PipeFn<T extends ElOrShadow> =
  & ((effect: Effect<T>) => PipeFn<T>)
  & { __vnode: GenericVirtualNode<T> }

export function mount<T extends ElOrShadow>(
  parent: ElOrShadow,
  vnodes: (GenericVirtualNode<T> | PipeFn<T>)[],
): T[] {
  return ([] as T[]).concat(...vnodes.map(vnode => {
    if (vnode instanceof VirtualNode) {
      const el = document.createElement(vnode.elName)
      vnode.chain.forEach(effect => effect(el))
      vnode.chain.length = 0
      return [parent.appendChild(el)]
    }
    if (vnode instanceof GenericVirtualNode) {
      return []
    }
    return mount(parent, [vnode.__vnode])
  }))
}

/**
 * turns a vnode into a function which can be called
 * infinite amount of times adding effects to the vnode
*/
export function pipe<T extends ElOrShadow>(vnode: GenericVirtualNode<T>): PipeFn<T> {
  const fn = Object.assign(function(effect: Effect<T>) {
    if (vnode.el) effect(vnode.el)
    else vnode.chain.push(effect)
    return fn
  }, { __vnode: vnode })
  return fn
}

export function text(val: StateOrPlain<string>) {
  return (el: Element): void => {
    const textNode = el.appendChild(document.createTextNode(''))
    if (val instanceof State) {
      val.sub(next => textNode.textContent = next)
    } else {
      textNode.textContent = val
    }
  }
}

export function style(rule: string, val: StateOrPlain<string>) {
  return (el: HTMLElement): void => {
    if (val instanceof State) {
      val.sub(next => el.style.setProperty(rule, next))
    } else {
      el.style.setProperty(rule, val)
    }
  }
}

export function on(
  event: string,
  handler: EventListener,
  mods: { prevent?: boolean; stop?: boolean } = {},
  options?: AddEventListenerOptions | EventListenerOptions
) {
  return (el: ElOrShadow): void => {
    el.addEventListener(event, (e: Event) => {
      if (mods.prevent) e.preventDefault()
      if (mods.stop) e.stopPropagation()
      handler(e)
    }, options)
  }
}

export function dispatch<T>(
  eventName: string, detail?: T, opts: CustomEventInit = {},
) {
  return (el: ElOrShadow): void => {
    const event = new CustomEvent<T>(eventName, { detail, ...opts })
    filterShadow(el).dispatchEvent(event)
  }
}

export function attr<T extends string | number | boolean>(
  name: string, val: StateOrPlain<T>,
) {
  return (el: Element): void => {
    const setAttr = (value: T): void =>
      el.setAttribute(name, val === false ? '' : String(value))
    if (val instanceof State) val.sub(setAttr)
    else setAttr(val)
  }
}

export function repeat<T>(
  items: State<T[]>,
  getKey: (el: T) => string | object,
  render: (el: State<T>, i: State<number>) => PipeFn<ElOrShadow> | PipeFn<ElOrShadow>[],
) {
  return (el: ElOrShadow): void => {
    const hook = el.appendChild(new Comment(''))
    interface ObservedItem {
      nodes: Node[];
      state: State<T>;
      index: State<number>;
    }
    let lookup = new Map<string | object, ObservedItem>()
    items.sub((next, prev) => {
      let refNode: Node = hook
      const newLookup = new Map<string | object, ObservedItem>()
      // update existing nodes and append the new ones
      next.forEach((item, i) => {
        const key = getKey(item)
        let observed = lookup.get(key)
        if (observed) {
          observed.index.v = i
          observed.state.v = item
        } else {
          const state = new State(item)
          const index = new State(i)
          const vnodes = render(state, index)
          const nodes = mount(el, ([] as PipeFn<ElOrShadow>[]).concat(vnodes))
          observed = { nodes, state, index }
        }
        // restore the order of the nodes
        observed.nodes.forEach(
          node => refNode = el.insertBefore(node, refNode.nextSibling))
        newLookup.set(key, observed)
      })
      // remove nodes that are not present anymore
      prev.forEach(item => {
        const key = getKey(item)
        if (newLookup.has(key)) return
        const observed = lookup.get(key)
        if (observed) observed.nodes.forEach(node => el.removeChild(node))
      })
      lookup = newLookup
    })
  }
}

export const shorthand = <T extends ElName>(elName: T) =>
  (...setup: string[]): PipeFn<ElByName<T>> =>
    pipe(new VirtualNode<T>(elName, setup))

// export const fragment = shorthand('fragment')
export const styleEl = shorthand('style')
