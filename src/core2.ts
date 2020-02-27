type Effect<TNode extends Node, TChild extends Node, TEvents> =
  (arg: TNode) => void | TChild

type ExtractChild<T> =
  T extends Effect<Node, infer U, unknown> ? U : never

type ExtractEvent<T> =
  T extends Effect<Node, Node, infer U> ? U : unknown

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

const vnode =
  <TNode extends Node, TEvents>(getNode: () => TNode) =>

  <TChildren extends Effect<TNode, Node, unknown>>(
    children: TChildren[],
    effects: Effect<TNode, ExtractChild<TChildren>, ExtractEvent<TChildren>>[],
  ): Effect<Node, TNode, TEvents | ExtractEvent<TChildren>> =>

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
  TChild extends Node,
  TEvents,
  TIntEvents extends UnionToIntersection<TEvents>,
  K extends keyof TIntEvents,
>(
  event: K,
  handler: (arg: TIntEvents[K] & { currentTarget: TNode }) => void,
): Effect<TNode, TChild, TEvents> => el => {
  // is it possible to prove to the compiler that the right argument is used?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el.addEventListener(String(event), handler as any)
}

div([
  div([], []),
  audio([
    marquee([], []),
  ], []),
], [
  cx('app'),
  on('keydown', e => e.key),
  on('ended', e => e.currentTarget),
  on('encrypted', e => e.srcElement), // audio event
  on('bounce', e => e.currentTarget), // marquee event
])
