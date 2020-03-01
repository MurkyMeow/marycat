import { State } from './state'
import { VNode } from './vnode'

// TODO generalize with `repeat` somehow?
export function watch<TVNode extends VNode<Node, unknown>>(state: State<TVNode[]>): (el: Node) => void
export function watch<TVNode extends VNode<Node, unknown>>(state: State<TVNode>): (el: Node) => void
export function watch<TVNode extends VNode<Node, unknown>>(state: State<TVNode | TVNode[]>) {
  return (el: Node) => {
    const hook: Node = el.appendChild(document.createComment(''))
    let nodes: Node[] = []
    state.sub(nodeOrNodes => {
      nodes.forEach(node => el.removeChild(node))
      nodes = Array.isArray(nodeOrNodes)
        ? nodeOrNodes.map(vnode => vnode(el))
        : [nodeOrNodes].map(vnode => vnode(el))
      nodes.reduce((prev, node) => el.insertBefore(node, prev.nextSibling), hook)
    })
  }
}

export const repeat = <TItem, TNode extends VNode<Node, unknown>>(
  items: State<TItem[]>,
  getKey: (el: TItem) => string | number | object,
  render: (el: State<TItem>, i: State<number>) => TNode | TNode[],
) => (el: Node): void => {
  const hook = el.appendChild(new Comment(''))
  interface ObservedItem {
    nodes: Node[]
    state: State<TItem>
    index: State<number>
  }
  let lookup = new Map<string | number | object, ObservedItem>()
  items.sub((next, prev) => {
    let refNode: Node = hook
    const newLookup = new Map<string | number | object, ObservedItem>()
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
        const nodes = (Array.isArray(vnodes) ? vnodes : [vnodes]).map(vnode => vnode(el))
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
