import { State, StateOrPlain } from './state'
import { createComponent } from './webc'

export type Effect =
  | string
  | number
  | boolean
  | PipeFn
  | (() => PipeFn | PipeFn[]) // lazy vnode for conditional rendering
  | ((el: Element | ShadowRoot) => Node | void)

const filterShadow = (el: Element | ShadowRoot): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
function applyobservedEffect<T extends Effect>(
  el: Element | ShadowRoot,
  state: State<T> | State<T[]>,
): Node[] {
  const hook: Node = el.appendChild(new Comment(''))
  const nodes: Node[] = []
  state.sub((next: T | T[]) => {
    while (nodes.length) el.removeChild(nodes.pop()!)
    let refNode: Node = hook
    const _nodes = applyEffect(el, next)
    _nodes.forEach(node => {
      refNode = el.insertBefore(node, refNode.nextSibling)
      nodes.push(node)
    })
  })
  return nodes
}

function applyEffect(
  el: Element | ShadowRoot,
  effect: Effect | Effect[] | State<Effect> | State<Effect[]>,
): Node[] {
  if (Array.isArray(effect)) {
    const res: Node[] = []
    return res.concat(...effect.map(m => applyEffect(el, m)))
  }
  if (effect instanceof VirtualNode) {
    return [mount(el, effect)]
  }
  if (effect instanceof State) {
    return applyobservedEffect(el, effect)
  }
  switch (typeof effect) {
    case 'number': {
      const text = new Text(effect.toString())
      return [el.appendChild(text)]
    }
    case 'boolean':
      return []
    case 'string':
      return [el.appendChild(new Text(effect))]
    case 'function':
      if (isPipeFn(effect)) return [mount(el, effect.__vnode)]
      const val = ([] as (PipeFn | Node | void)[]).concat(effect(el))
      return <Node[]>val
        .map(x => isPipeFn(x) ? mount(el, x.__vnode) : x)
        .filter(_=>_)
    default:
      console.trace('Unexpected child:', effect)
      return []
  }
}

export class VirtualNode {
  el?: Element
  chain: (Effect | State<Effect>)[] 
  constructor(
    public readonly elName: string,
    setup: string[],
  ) {
    this.chain = setup.map(str => {
      const [prefix, rest] = [str[0], str.slice(1)]
      switch (prefix) {
        case '.': return (el: Element | ShadowRoot) => {
          filterShadow(el).classList.add(rest)
        }
        case '#': return attr('id', rest)
        case '@': return attr('name', rest)
        default: return str
      }
    })
  }
}

export const style = (
  prop: string,
  val: StateOrPlain<string>,
) => (el: Element | ShadowRoot) => {
  if (!(el instanceof HTMLElement)) {
    return console.trace('Cant set style on', el)
  }
  if (val instanceof State) {
    val.sub(next => el.style.setProperty(prop, next))
  } else {
    el.style.setProperty(prop, val)
  }
}

export const on = (
  event: string,
  handler: EventListener,
  mods: { prevent?: boolean, stop?: boolean, shadow?: boolean } = {},
  options?: AddEventListenerOptions | EventListenerOptions,
) => (_el: Element | ShadowRoot) => {
  const el = mods.shadow ? _el : filterShadow(_el)
  el.addEventListener(event, (e: Event) => {
    if (mods.prevent) e.preventDefault()
    if (mods.stop) e.stopPropagation()
    handler(e)
  }, options)
}

export const dispatch = (
  name: string,
  detail?: any,
  opts: CustomEventInit = {},
) => (el: Element | ShadowRoot) => {
  const event = new CustomEvent(name, { detail, ...opts })
  filterShadow(el).dispatchEvent(event)
}

export const attr = <T extends string | number | boolean>(
  name: string,
  val: StateOrPlain<T>
) => (_el: Element | ShadowRoot) => {
  const el = filterShadow(_el)
  const setAttr = (value: T) =>
    el.setAttribute(name, val === false ? '' : String(value))
  if (val instanceof State) {
    val.sub(setAttr)
  } else {
    setAttr(val)
  }
}

export const repeat = <T>(
  items: State<T[]>,
  getKey: (el: T) => string | object,
  render: (el: State<T>, i: State<number>) => Effect | Effect[],
) => (el: Element | ShadowRoot) => {
  const hook = el.appendChild(new Comment(''))
  type ObservedItem = {
    nodes: Node[],
    state: State<T>,
    index: State<number>,
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
        const effects = render(state, index)
        const nodes = applyEffect(el, effects)
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
      const observed = lookup.get(key)!
      observed.nodes.forEach(node => el.removeChild(node))
    })
    lookup = newLookup
  })
}

export function mount(
  parent: Element | ShadowRoot,
  vnode: VirtualNode | PipeFn,
): Element | ShadowRoot {
  if (isPipeFn(vnode)) {
    return mount(parent, vnode.__vnode)
  }
  if (vnode.elName === 'fragment') {
    vnode.chain.forEach(m => applyEffect(parent, m))
    return parent
  }
  const el = vnode.el = vnode.el || vnode.elName.includes('-')
    ? createComponent(vnode)
    : document.createElement(vnode.elName)
  vnode.chain.forEach(m => applyEffect(el, m))
  vnode.chain.length = 0
  return parent.appendChild(el)
}

// yes, this is a monkey-patched function
export type PipeFn =
  & (<T extends Effect | Effect[]>(...args: StateOrPlain<T>[]) => PipeFn)
  & { __vnode: VirtualNode }

const isPipeFn = (arg: any): arg is PipeFn =>
  typeof arg === 'function' && arg.__vnode

/**
 * turns a vnode into a function which can be called
 * infinite amount of times each time adding effects to the vnode
*/
export function _(vnode: VirtualNode): PipeFn {
  const pipe = Object.assign(
    function<T extends Effect | Effect[]>(...args: StateOrPlain<T>[]) {
      // remove this line somehow?
      const effects = args as (StateOrPlain<Effect>)[]
      if (vnode.el) {
        for (const effect of effects) applyEffect(vnode.el, effect)
      } else {
        vnode.chain = vnode.chain.concat(effects)
      }
      return pipe
    },
    { __vnode: vnode },
  )
  return pipe
}

export const shorthand = (elName: string) => (...setup: string[]) =>
  _(new VirtualNode(elName, setup))

export const styleEl = shorthand('style')
export const fragment = shorthand('fragment')
