import { State, StateOrPlain } from './state'

export type Effect = StateOrPlain<
  | string
  | number
  | boolean
  | VirtualNode
  | (() => VirtualNode)// lazy nodes for conditional rendering
  | ((el: Element | ShadowRoot) => void)
>

const filterShadow = (el: Element | ShadowRoot): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
function applyObserved<T extends Effect>(el: Element | ShadowRoot, state: T extends State<infer U> ? T : never): Node[] {
  const hook: Node = el.appendChild(new Comment(''))
  const nodes: Node[] = []
  state.sub(next => {
    while (nodes.length) el.removeChild(nodes.pop()!)
    let refNode: Node = hook
    const _nodes = <Node[]>apply(el, next).filter(x => x)
    _nodes.forEach(node => {
      refNode = el.insertBefore(node, refNode.nextSibling)
      nodes.push(node)
    })
  })
  return nodes
}

function apply(el: Element | ShadowRoot, effect: Effect | Effect[]): (Node | undefined)[] {
  if (Array.isArray(effect)) {
    const res: (Node | undefined)[] = []
    return res.concat(...effect.map(m => apply(el, m)))
  }
  if (effect instanceof VirtualNode) {
    return [mount(el, effect)]
  }
  if (effect instanceof State) {
    return applyObserved(el, effect)
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
    case 'function': {
      const val = effect(el)
      return [val instanceof VirtualNode ? mount(el, val) : undefined]
    }
    default:
      console.trace('Unexpected child:', effect)
      return []
  }
}

export class VirtualNode {
  el?: Element
  chain: Effect[] = []
  constructor(
    public readonly elName: string,
    setup: string[],
  ) {
    this.chain.push(...setup.map(str => {
      const [prefix, rest] = [str[0], str.slice(1)]
      switch (prefix) {
        case '.': return attr('class', rest)
        case '#': return attr('id', rest)
        case '@': return attr('name', rest)
        default: return (el: Element | ShadowRoot) => el.textContent += str
      }
    }))
  }
}

export const style = (prop: string, val: StateOrPlain<string>) => (el: Element | ShadowRoot) => {
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

export const dispatch = (name: string, detail?: any, opts: CustomEventInit = {}) => (el: Element | ShadowRoot) => {
  const event = new CustomEvent(name, { detail, ...opts })
  filterShadow(el).dispatchEvent(event)
}

export const attr = <T extends string | number | boolean>(name: string, val: StateOrPlain<T>) => (_el: Element | ShadowRoot) => {
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
        const nodes = <Node[]>apply(el, effects).filter(_=>_)
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

export function mount(parent: Element | ShadowRoot, node: VirtualNode | PipeFn): Element | ShadowRoot {
  if (isPipeFn(node)) {
    return mount(parent, node.__vnode)
  }
  if (node.elName === 'fragment') {
    node.chain.forEach(m => apply(parent, m))
    return parent
  }
  const el = node.el = node.el || document.createElement(node.elName)
  node.chain.forEach(m => apply(el, m))
  node.chain.length = 0
  return parent.appendChild(el)
}

export type PipeArg =
  VirtualNode | Effect | Effect[] | PipeFn

export type PipeFn =
  { __vnode: VirtualNode } & ((arg: PipeArg) => PipeFn)

const isPipeFn = (arg: any): arg is PipeFn =>
  Boolean(arg.__vnode)

export function _(vnode: VirtualNode): PipeFn {
  const pipe = Object.assign(function(arg: PipeArg) {
    if (isPipeFn(arg)) vnode.chain.push(arg.__vnode)
    else vnode.chain = vnode.chain.concat(arg)
    return pipe
  }, {
    __vnode: vnode,
  })
  return pipe
}

export const shorthand = (name: string) => (...setup: string[]) =>
  _(new VirtualNode(name, setup))

export const fragment = shorthand('fragment')
