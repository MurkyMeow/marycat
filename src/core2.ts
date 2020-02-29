type VNode<TNode extends Node, TEvents> =
  (arg: Node) => TNode

type Effect<TNode extends Node, TEvents> =
  (arg: TNode) => void

type ExtractChild<T> =
  T extends VNode<infer U, unknown>[] ? U : Node

type ExtractEvent<T> =
  T extends VNode<Node, infer U>[] ? U : unknown

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

const vnode =
  <TNode extends Node, TEvents>(getNode: () => TNode) =>

  <TChildren extends VNode<Node, unknown>[]>(
    effects: Effect<TNode, ExtractEvent<TChildren>>[],
    ...children: TChildren
  ): VNode<TNode, TEvents & ExtractEvent<TChildren>> =>

  (root: Node): TNode => {
    const node = getNode()
    for (const eff of effects) eff(node)
    for (const child of children) child(node)
    return root.appendChild(node)
  }

const div = vnode<HTMLDivElement, HTMLElementEventMap>(() => document.createElement('div'))
const audio = vnode<HTMLAudioElement, HTMLMediaElementEventMap>(() => document.createElement('audio'))
const marquee = vnode<HTMLMarqueeElement, HTMLMarqueeElementEventMap>(() => document.createElement('marquee'))

const cx = (classname: string) => (el: Element) => el.classList.add(classname)

const on = <
  TNode extends Node,
  TEvents,
  TIntEvents extends UnionToIntersection<TEvents>,
  K extends keyof TIntEvents,
>(
  event: K,
  handler: (arg: TIntEvents[K] & { currentTarget: TNode }) => void,
): Effect<TNode, TEvents> => el => {
  // is it possible to prove to the compiler that the right argument is used?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el.addEventListener(String(event), handler as any)
}

div([
  cx('app'),
  on('keydown', e => e.key),
  on('ended', e => e.currentTarget),
  on('encrypted', e => e.srcElement), // audio event
  on('bounce', e => e.currentTarget), // marquee event
],
  div([],
    marquee([]),
    audio([]),
  ),
  audio([],
    marquee([]),
  ),
)
