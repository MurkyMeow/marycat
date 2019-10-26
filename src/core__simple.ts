import { StateOrPlain, State } from './state'

type ElOrShadow = Element | ShadowRoot

type ElName = keyof HTMLElementTagNameMap
type ElByName<T extends ElName> = HTMLElementTagNameMap[T]

export type Effect<T extends ElOrShadow> =
  (el: T) => void

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

export class VirtualNode<T extends ElOrShadow> {
  constructor(
    public readonly el: T, setup: string[],
  ) {
    const _el = filterShadow(el)
    setup.forEach(str => {
      const [prefix, rest] = [str[0], str.slice(1)]
      switch (prefix) {
        case '.': return _el.classList.add(rest)
        case '#': return _el.setAttribute('id', rest)
        case '@': return _el.setAttribute('name', rest)
        default: return el.textContent += str
      }
    })
  }
}

// yes, this is a monkey-patched function
export type PipeFn<T extends ElOrShadow> =
  & ((effect: Effect<T>) => PipeFn<T>)
  & { __vnode: VirtualNode<T> }

export function mount<T extends ElOrShadow>(
  parent: ElOrShadow,
  vnodes: (VirtualNode<T> | PipeFn<T>)[],
): T[] {
  return ([] as T[]).concat(...vnodes.map(vnode =>
    vnode instanceof VirtualNode
      ? parent.appendChild(vnode.el)
      : mount(parent, [vnode.__vnode])
    )
  )
}

/**
 * turns a vnode into a function which can be called
 * infinite amount of times adding effects to the vnode
*/
export function pipe<T extends ElOrShadow>(vnode: VirtualNode<T>): PipeFn<T> {
  const fn = Object.assign(function(effect: Effect<T>) {
    effect(vnode.el)
    return fn
  }, { __vnode: vnode })
  return fn
}

export function text(val: StateOrPlain<string>) {
  return (el: ElOrShadow): void => {
    const textNode = el.appendChild(document.createTextNode(''))
    if (val instanceof State) {
      val.sub(next => textNode.textContent = next)
    } else {
      textNode.textContent = val
    }
  }
}

export function style(rule: string, val: StateOrPlain<string>) {
  return (_el: ElOrShadow): void => {
    const el = <HTMLElement>filterShadow(_el)
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
  mods: { prevent?: boolean; stop?: boolean, shadow?: boolean } = {},
  options?: AddEventListenerOptions | EventListenerOptions
) {
  return (_el: ElOrShadow): void => {
    const el = mods.shadow ? _el : filterShadow(_el)
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
  return (_el: ElOrShadow): void => {
    const el = filterShadow(_el)
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
    pipe(new VirtualNode(document.createElement(elName), setup))

// export const fragment = shorthand('fragment')
export const styleEl = shorthand('style')
