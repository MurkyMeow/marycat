export type VNode<TNode extends Node, TEvents> =
  (arg: Node) => TNode

export type Effect<TNode extends Node, TEvents> =
  (arg: TNode) => void

type ExtractEvent<T> =
  T extends VNode<Node, infer U>[] ? U : unknown

export const vnode =
  <TNode extends Node, TEvents = GlobalEventHandlersEventMap>(getNode: () => TNode) =>

  <TChildren extends VNode<Node, unknown>[]>(
    effects: Effect<TNode, TEvents & ExtractEvent<TChildren>>[],
    ...children: TChildren
  ): VNode<TNode, TEvents & ExtractEvent<TChildren>> =>

  (root: Node): TNode => {
    const node = getNode()
    for (const eff of effects) eff(node)
    for (const child of children || []) child(node)
    return root.appendChild(node)
  }
