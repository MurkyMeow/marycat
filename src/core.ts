import { observe, observable } from '@nx-js/observer-util'
import { StateOrPlain, zipTemplate } from './state'

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

export const watch = <T extends Node, K extends Node>(
  observable: () => Effect<T, K>,
) => (el: T): void => {
  const hook: Node = el.appendChild(document.createComment(''))
  let nodes: Node[] = []
  observe(() => {
    nodes.forEach(node => el.removeChild(node))
    nodes = applyEffect(el, observable())
    nodes.reduce((prev, node) => el.insertBefore(node, prev.nextSibling), hook)
  })
}

function applyEffect<T extends Node, K extends Node>(
  el: T,
  effect: Effect<T, K> | Effect<T, K>[],
): Node[] {
  if (Array.isArray(effect)) {
    const res: Node[] = []
    for (const m of effect) res.push(...applyEffect(el, m))
    return res
  }
  if (isPipeFn(effect)) {
    return mount(el, effect)
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
  if (typeof val === 'function') {
    observe(() => el.style.setProperty(rule, val()))
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
  if (typeof val === 'function') {
    observe(() => setAttr(val()))
  } else {
    setAttr(val)
  }
}

export const cx = zipTemplate(str => attr('class', str))
export const name = zipTemplate(str => attr('name', str))

export const repeat = <T, K extends Node>(
  items: { v: T[] },
  getKey: (el: T) => string | object,
  render: (args: { el: T, i: number }) => PipeFn<K> | PipeFn<K>[],
) => (el: Node): void => {
  const hook = el.appendChild(new Comment(''))
  interface ObservedItem {
    nodes: Node[];
    state: { el: T, i: number }
  }
  let lookup = new Map<string | object, ObservedItem>()
  let prev: T[]
  observe(() => {
    let refNode: Node = hook
    const newLookup = new Map<string | object, ObservedItem>()
    // update existing nodes and append the new ones
    items.v.forEach((item, i) => {
      const key = getKey(item)
      let observed = lookup.get(key)
      if (observed) {
        observed.state.i = i
        observed.state.el = item
      } else {
        const state = observable({ el: item, i })
        const nodes = mount(el, render(state))
        observed = { nodes, state }
      }
      // restore the order of the nodes
      observed.nodes.forEach(
        node => refNode = el.insertBefore(node, refNode.nextSibling))
      newLookup.set(key, observed)
    })
    if (!prev) prev = [...items.v]
    else {
      // remove nodes that are not present anymore
      prev.forEach(item => {
        const key = getKey(item)
        if (newLookup.has(key)) return
        const observed = lookup.get(key)
        if (observed) observed.nodes.forEach(node => el.removeChild(node))
      })
    }
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
 * turns a node into a function which can be called
 * infinite amount of times adding effects to the node
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
