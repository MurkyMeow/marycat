import { State, StateOrPlain, zip$ } from './state'

type ElOrShadow = Element | ShadowRoot

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
export const watch = (state: State<Node | Node[]>) => (el: Node) => {
  const hook: Node = el.appendChild(document.createComment(''))
  let nodes: Node[] = []
  state.sub(nodeOrNodes => {
    nodes.forEach(node => el.removeChild(node))
    nodes = ([] as Node[]).concat(nodeOrNodes)
    nodes.reduce((prev, node) => el.insertBefore(node, prev.nextSibling), hook)
  })
}

export const style = (rule: string, val: StateOrPlain<string>) => (_el: ElOrShadow): void => {
  const el = filterShadow(_el) as HTMLElement
  if (val instanceof State) {
    val.sub(next => el.style.setProperty(rule, next))
  } else {
    el.style.setProperty(rule, val)
  }
}

export type MarycatEventListenerOptions =
  & (AddEventListenerOptions | EventListenerOptions)
  & { prevent?: boolean; stop?: boolean; shadow?: boolean }

export const on = <
  TElement extends ElOrShadow,
  TEvents,
  TName extends keyof TEvents & string,
>(
  event: TName,
  handler: (evt: TEvents[TName] & { currentTarget: TElement }) => void,
  options?: MarycatEventListenerOptions,
) => (
  _el: TElement,
  // this is a hack to help typescript infer TEvents properly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: PipedNode<TElement, TEvents>,
): void => {
  const el = options?.shadow ? _el : filterShadow(_el)
  el.addEventListener(event, e => {
    if (options?.prevent) e.preventDefault()
    if (options?.stop) e.stopPropagation()
    // is it possible to prove to the compiler that the right argument is used?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler(e as any)
  }, options)
}

type EventType<T> = 
  T extends CustomEvent<infer U> ? U : T

export const dispatch = <
  TElement extends Element | ShadowRoot,
  TEvents, TName extends keyof TEvents & string,
>(
  event: TName,
  detail: EventType<TEvents[TName]>,
  options: EventInit = {},
) => (
  el: TElement,
  // this is a hack to help typescript infer TEvents properly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _: PipedNode<TElement, TEvents>,
) => {
  filterShadow(el).dispatchEvent(new CustomEvent(event, { detail, ...options }))
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

export const text = (
  strings: TemplateStringsArray,
  ...values: (StateOrPlain<string> | StateOrPlain<number> | StateOrPlain<boolean>)[]
) => (el: ElOrShadow) => {
  const text = el.appendChild(document.createTextNode(''))
  zip$(strings, ...values.map(String)).sub(v => text.textContent = v)
}

export const repeat = <TItem, TNode extends PipedNode<Node, unknown>>(
  items: State<TItem[]>,
  getKey: (el: TItem) => string | object,
  render: (el: State<TItem>, i: State<number>) => TNode | TNode[],
) => (el: Node): void => {
  const hook = el.appendChild(new Comment(''))
  interface ObservedItem {
    nodes: Node[]
    state: State<TItem>
    index: State<number>
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

export const mount = <TNode extends Node>(
  parent: Node,
  piped: PipedNode<TNode, unknown> | PipedNode<TNode, unknown>[],
): TNode[] =>
  Array.isArray(piped)
    ? ([] as TNode[]).concat(...piped.map(x => mount(parent, x)))
    : [parent.appendChild(piped.__node)]

// yes, this is a monkey-patched function
export interface PipedNode<TNode extends Node, TEvents> {
  // applies an arbitrary effect
  (effect: (node: TNode, piped: PipedNode<TNode, TEvents>) => void): PipedNode<TNode, TEvents>

  // appends a child
  <TChild extends Node, TChildEvents>(
    child: PipedNode<TChild, TChildEvents>,
  ): PipedNode<TNode, TEvents & TChildEvents>

  __node: TNode
}

const isPipedNode = (arg: Function): arg is PipedNode<Node, unknown> =>
  '__node' in arg

/**
 * turns a node into a function which can be called
 * infinite amount of times adding effects to the node
*/
export function pipeNode<TNode extends Node, TEvents>(node: TNode): PipedNode<TNode, TEvents> {
  const fn = Object.assign(
    function<TChild extends Node, TChildEvents>(
      arg: ((node: TNode, piped: PipedNode<TNode, TEvents>) => void) | PipedNode<TChild, TChildEvents>,
    ) {
      if (isPipedNode(arg)) {
        node.appendChild(arg.__node)
      } else {
        arg(node, fn)
      }
      return fn
    }, {
    __node: node,
  })
  return fn
}

export const shorthand = <TNode extends Node, TEvents>(getNode: () => TNode) => (effect: (el: TNode) => void) =>
  pipeNode<TNode, TEvents>(getNode())(effect)

export const frag = () => pipeNode(document.createDocumentFragment())

export const styleEl = shorthand(() => document.createElement('style'))
