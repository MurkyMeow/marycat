export type VNode<TNode extends Node, TRoot extends Node, TEvents> =
  (arg: TRoot) => TNode

export type Effect<TNode extends Node, TEvents> =
  (arg: TNode) => void

type ExtractEvent<T> =
  T extends VNode<Node, Node, infer U>[] ? U : unknown

export type VNodeConstructor<TNode extends Node, TRoot extends Node = Node, TEvents = GlobalEventHandlersEventMap> =
  <TChildren extends VNode<Node, TNode, unknown>[]>(
    effects?: Effect<TNode, TEvents & ExtractEvent<TChildren>>[],
    ...children: TChildren
  ) => VNode<TNode, TRoot, TEvents & ExtractEvent<TChildren>>

export const vnode =
  <TNode extends Node, TEvents, TRoot extends Node>(
    getNode: () => TNode,
  ): VNodeConstructor<TNode, TRoot, TEvents> => (effects, ...children) => root => {
    const node = getNode()
    for (const eff of effects || []) eff(node)
    for (const child of children) child(node)
    return root.appendChild(node)
  }
