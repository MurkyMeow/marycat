import { State, StateOrPlain, zip$ } from './state'

type ElOrShadow = Element | ShadowRoot

const filterShadow = (el: ElOrShadow): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
export const watch = <TNode extends Node, TEvents>(
  state: State<PipedNode<TNode, TEvents>> | State<PipedNode<TNode, TEvents>[]>
) => (el: Node) => {
  const hook: Node = el.appendChild(document.createComment(''))
  let nodes: Node[] = []
  state.sub((nodeOrNodes: PipedNode<TNode, TEvents> | PipedNode<TNode, TEvents>[]) => {
    nodes.forEach(node => el.removeChild(node))
    nodes = ([] as PipedNode<TNode, TEvents>[]).concat(nodeOrNodes).map(x => x.__node)
    nodes.reduce((prev, node) => el.insertBefore(node, prev.nextSibling), hook)
  })
}

export const style = (rule: string) => (
  strings: TemplateStringsArray, ...values: PrimitiveStateOrPlain[]
) => (_el: ElOrShadow): void => {
  const el = filterShadow(_el) as HTMLElement
  zip$(strings, ...values).sub(v => el.style.setProperty(rule, v))
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

type PrimitiveStateOrPlain =
  StateOrPlain<string> | StateOrPlain<number> | StateOrPlain<boolean>

export const attr = (name: string) => (
  strings: TemplateStringsArray, ...values: PrimitiveStateOrPlain[]
) => (_el: ElOrShadow): void => {
  const el = filterShadow(_el)
  zip$(strings, ...values).sub(v => el.setAttribute(name, v))
}

export const attrs = (attrs: { [key: string]: PrimitiveStateOrPlain }) =>
  Object.entries(attrs).map(([key, val]) => attr(key)`${val}`)

export const cx = attr('class')
export const name = attr('name')

export const text = (strings: TemplateStringsArray, ...values: PrimitiveStateOrPlain[]) => (el: ElOrShadow) => {
  const text = el.appendChild(document.createTextNode(''))
  zip$(strings, ...values).sub(v => text.textContent = v)
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
  (...effects: ((node: TNode, piped: PipedNode<TNode, TEvents>) => void)[]): PipedNode<TNode, TEvents>

  // appends a child
  <TChild extends Node, TChildEvents>(
    ...children: PipedNode<TChild, TChildEvents>[]
  ): PipedNode<TNode, TEvents & TChildEvents>

  __node: TNode
}

const isPipedNode = (arg: Function): arg is PipedNode<Node, unknown> =>
  '__node' in arg

export function pipeNode<TNode extends Node, TEvents>(node: TNode): PipedNode<TNode, TEvents> {
  const fn = Object.assign(
    function<TChild extends Node, TChildEvents>(
      ...args: (((node: TNode, piped: PipedNode<TNode, TEvents>) => void) | PipedNode<TChild, TChildEvents>)[]
    ) {
      for (const arg of args) {
        if (isPipedNode(arg)) node.appendChild(arg.__node)
        else arg(node, fn)
      }
      return fn
    }, {
    __node: node,
  })
  return fn
}

export const shorthand = <TName extends keyof HTMLElementTagNameMap>(elName: TName) =>
  (...effects: ((el: HTMLElementTagNameMap[TName]) => void)[]) =>
    pipeNode<HTMLElementTagNameMap[TName], HTMLElementEventMap>(document.createElement(elName))(...effects)

export const frag = () => pipeNode(document.createDocumentFragment())

export const styleEl = shorthand('style')
