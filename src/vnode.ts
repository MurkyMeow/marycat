export type VNode<TNode extends Node, TEvents> =
  (arg: Node) => TNode

export type Effect<TNode extends Node, TChild extends Node, TEvents> =
  (arg: TNode) => void | TChild
  
type ExtractChild<T> =
  T extends Effect<Node, infer U, unknown>[] ? U : Node

type ExtractEvent<T> =
  T extends Effect<Node, Node, infer U>[] ? U : unknown

export const vnode =
  <TNode extends Node, TEvents>(getNode: () => TNode) =>

  <TChildren extends Effect<TNode, Node, unknown>[]>(
    effects: Effect<TNode, ExtractChild<TChildren>, ExtractEvent<TChildren>>[],
    ...children: TChildren
  ): Effect<Node, TNode, TEvents & ExtractEvent<TChildren>> =>

  (root: Node): TNode => {
    const node = getNode()
    for (const eff of effects) eff(node)
    for (const child of children) child(node)
    return root.appendChild(node)
  }
