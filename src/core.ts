import { State, StateOrPlain } from './state'

type ElOrShadow = Element | ShadowRoot

type ElName = keyof HTMLElementTagNameMap
type ElByName<T extends ElName> = HTMLElementTagNameMap[T]

export type Effect<T extends Node> =
  | StateOrPlain<PipeFn<T>>
  | StateOrPlain<PipeFn<T>[]>
  | ((el: T) => void)

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
function watch <T extends Node>(
  el: Node,
  state: State<PipeFn<T>> | State<PipeFn<T>[]>,
): void {
  const hook: Node = el.appendChild(new Comment(''))
  let nodes: Node[] = []
  state.sub((next: PipeFn<T> | PipeFn<T>[]) => {
    nodes.forEach(node => el.removeChild(node))
    let refNode: Node = hook
    nodes = mount(el, next)
    nodes.forEach(node => {
      refNode = el.insertBefore(node, refNode.nextSibling)
      nodes.push(node)
    })
  })
}

export const text = <K extends string | number | boolean>(
  val: StateOrPlain<K>,
) => (el: Node): void => {
  const textNode = document.createTextNode('')
  if (val instanceof State) {
    val.sub(next => textNode.textContent = String(next))
  } else {
    textNode.textContent = String(val)
  }
  el.appendChild(textNode)
}

export class VirtualNode<T extends Node> {
  constructor(
    public readonly el: T, setup: string[] = [],
  ) {
    if (!(el instanceof Element)) return
    setup.forEach(str => {
      const [prefix, rest] = [str[0], str.slice(1)]
      switch (prefix) {
        case '.': return el.classList.add(rest)
        case '#': return el.setAttribute('id', rest)
        case '@': return el.setAttribute('name', rest)
        default: return el.textContent += str
      }
    })
  }
}

export const style = (rule: string, val: StateOrPlain<string>) => (_el: ElOrShadow): void => {
  const el = filterShadow(_el) as HTMLElement
  if (val instanceof State) {
    val.sub(next => el.style.setProperty(rule, next))
  } else {
    el.style.setProperty(rule, val)
  }
}

export const on = (
  event: string,
  handler: EventListener,
  mods: { prevent?: boolean; stop?: boolean; shadow?: boolean } = {},
  options?: AddEventListenerOptions | EventListenerOptions
) => (_el: ElOrShadow): void => {
  const el = mods.shadow ? _el : filterShadow(_el)
  el.addEventListener(event, (e: Event) => {
    if (mods.prevent) e.preventDefault()
    if (mods.stop) e.stopPropagation()
    handler(e)
  }, options)
}

export const dispatch = <T>(
  eventName: string, detail?: T, opts: CustomEventInit = {},
) => (el: ElOrShadow): void => {
  const event = new CustomEvent<T>(eventName, { detail, ...opts })
  filterShadow(el).dispatchEvent(event)
}

export const attr = <T extends string | number | boolean>(
  name: string, val: StateOrPlain<T>,
) => (_el: ElOrShadow): void => {
  const el = filterShadow(_el)
  const setAttr = (value: T): void =>
    el.setAttribute(name, val === false ? '' : String(value))
  if (val instanceof State) val.sub(setAttr)
  else setAttr(val)
}

export const repeat = <T, K extends Node>(
  items: State<T[]>,
  getKey: (el: T) => string | object,
  render: (el: State<T>, i: State<number>) => PipeFn<K> | PipeFn<K>[],
) => (el: Node): void => {
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
        const nodes = mount(el, vnodes)
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

export function mount<T extends Node>(
  parent: Node,
  vnode: (VirtualNode<T> | PipeFn<T>) | (VirtualNode<T> | PipeFn<T>)[],
): T[] {
  if (Array.isArray(vnode)) {
    return ([] as T[]).concat(...vnode.map(x => mount(parent, x)))
  }
  return vnode instanceof VirtualNode
    ? [parent.appendChild(vnode.el)]
    : mount(parent, vnode.__vnode)
}

// yes, this is a monkey-patched function
export type PipeFn<T extends Node> =
  & ((effect: Effect<T>) => PipeFn<T>)
  & { __vnode: VirtualNode<T> }

/**
 * turns a vnode into a function which can be called
 * infinite amount of times adding effects to the vnode
*/
export function pipe<T extends Node>(vnode: VirtualNode<T>): PipeFn<T> {
  const fn = Object.assign(function(effect: Effect<T>) {
    if (Array.isArray(effect) || '__vnode' in effect) {
      mount(vnode.el, effect)
    } else if (effect instanceof State) {
      watch(vnode.el, effect)
    } else {
      effect(vnode.el)
    }
    return fn
  }, { __vnode: vnode })
  return fn
}

export const shorthand = <T extends ElName>(elName: T) =>
  (...setup: string[]): PipeFn<ElByName<T>> =>
    pipe(new VirtualNode(document.createElement(elName), setup))

export const frag = (): PipeFn<DocumentFragment> =>
  pipe(new VirtualNode(document.createDocumentFragment()))

export const styleEl = shorthand('style')
