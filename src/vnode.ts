export type VNode<TNode extends Node, TRoot extends Node, TEvents> =
  (arg: TRoot) => TNode

export type Effect<TNode extends Node, TEvents> =
  (arg: TNode) => void

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

type ExtractReadonlyType<T> = T extends ReadonlyArray<infer U> ? U : unknown

type VNodeExtractEvent<T> = T extends VNode<Node, Node, infer U> ? U : unknown

type VNodesExtractEvent<T> = UnionToIntersection<VNodeExtractEvent<ExtractReadonlyType<T>>>

export type VNodeConstructor<TNode extends Node, TRoot extends Node = Node, TEvents = GlobalEventHandlersEventMap> =
  <TChildren extends VNode<Node, TNode, unknown>[]>(
    effects?: Effect<TNode, TEvents & VNodesExtractEvent<TChildren>>[],
    ...children: TChildren
  ) => VNode<TNode, TRoot, TEvents & VNodesExtractEvent<TChildren>>

export const vnode =
  <TNode extends Node, TEvents, TRoot extends Node>(
    getNode: (root: TRoot) => TNode,
  ): VNodeConstructor<TNode, TRoot, TEvents> => (effects, ...children) => root => {
    const node = getNode(root)
    for (const eff of effects || []) eff(node)
    for (const child of children) child(node)
    return node
  }
