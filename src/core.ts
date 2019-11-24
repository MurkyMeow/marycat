import { State, StateOrPlain, zip$ } from './state'

type ElOrShadow = Element | ShadowRoot

export type Effect<T extends Node, K extends Node> =
  | string
  | number
  | boolean
  | PipeFn<K>
  | PipeFn<K>[]
  | ((el: T) => void)

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
function watch<T extends Node, K extends Node, E extends Effect<T, K>>(el: T, state: State<E>): Node[] {
  const hook: Node = el.appendChild(document.createComment(''))
  let nodes: Node[] = []
  state.sub((next: Effect<T, K>) => {
    nodes.forEach(node => el.removeChild(node))
    nodes = applyEffect(el, next)
    nodes.reduce((prev, node) => el.insertBefore(node, prev.nextSibling), hook)
    return nodes
  })
  return nodes
}

function applyEffect<T extends Node, K extends Node>(
  el: T,
  effect: StateOrPlain<Effect<T, K>> | StateOrPlain<Effect<T, K>>[],
): Node[] {
  if (Array.isArray(effect)) {
    const res: Node[] = []
    for (const m of effect) res.push(...applyEffect(el, m))
    return res
  }
  if (isPipeFn(effect)) {
    return mount(el, effect)
  }
  if (effect instanceof State) {
    return watch(el, effect)
  }
  switch (typeof effect) {
    case 'number':
    case 'string': {
      const text = document.createTextNode(String(effect))
      return [el.appendChild(text)]
    }
    case 'boolean': return []
    case 'function': return effect(el), []
    default: return console.trace('Unexpected child', effect), []
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
  eventName: string, detail?: T, opts: Omit<CustomEventInit, 'detail'> = {},
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

export const attrs = <T extends string | number | boolean>(
  attrs: { [key: string]: StateOrPlain<T> }
) =>
  Object.entries(attrs).map(([key, val]) => attr(key, val))

export const cx = (strings: TemplateStringsArray, ...values: StateOrPlain<string>[]) =>
  attr('class', zip$(strings, ...values))

export const name = (strings: TemplateStringsArray, ...values: StateOrPlain<string>[]) =>
  attr('name', zip$(strings, ...values))

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

export function mount<T extends Node>(parent: Node, vnode: PipeFn<T> | PipeFn<T>[]): T[] {
  if (Array.isArray(vnode)) {
    return ([] as T[]).concat(...vnode.map(x => mount(parent, x)))
  }
  return [parent.appendChild(vnode.__node)]
}

export type PipeConstructor<T extends Node> =
  <E extends Effect<T, Node>>(...effects: StateOrPlain<E>[]) => PipeFn<T>

// yes, this is a monkey-patched function
export type PipeFn<T extends Node> =
  & (<K extends Node, E extends Effect<T, K>>(...effects: StateOrPlain<E>[]) => PipeFn<T>)
  & { __node: T }

const isPipeFn = <T extends Node>(arg: unknown): arg is PipeFn<T> =>
  typeof arg === 'function' && '__node' in arg

/**
 * turns a vnode into a function which can be called
 * infinite amount of times adding effects to the vnode
*/
export function pipe<T extends Node>(node: T): PipeFn<T> {
  const fn = Object.assign(
    function<K extends Node, E extends Effect<T, K>>(...effects: StateOrPlain<E>[]) {
      applyEffect(node, effects as Effect<T, K>)
      return fn
    }, {
    __node: node,
  })
  return fn
}

export const shorthand = <T extends keyof HTMLElementTagNameMap>(elName: T): PipeConstructor<HTMLElementTagNameMap[T]> =>
  (...effects) => pipe(document.createElement(elName))(...effects)

export const frag = (): PipeFn<DocumentFragment> =>
  pipe(document.createDocumentFragment())

export const styleEl = shorthand('style')
