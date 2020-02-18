type Effect<TNode extends Node, TChild extends Node, TEvents> =
  (arg: TNode) => void | TChild

type ExtractChild<T> =
  T extends Effect<Node, infer U, unknown> ? U : never

type ExtractEvent<T> =
  T extends Effect<Node, Node, infer U> ? U : unknown

const vnode =
  <TNode extends Node, TEvents>(getNode: () => TNode) =>

  <TChildren extends Effect<TNode, Node, unknown>>(
    children: TChildren[],
    effects: Effect<TNode, ExtractChild<TChildren>, ExtractEvent<TChildren>>[],
  ): Effect<Node, TNode, TEvents | ExtractEvent<TChildren>> =>

  (root: Node): TNode => {
    const node = getNode()
    ;[...effects, ...children].forEach(eff => eff(node))
    return root.appendChild(node)
  }

const div = vnode<HTMLDivElement, HTMLElementEventMap>(() => document.createElement('div'))
const audio = vnode<HTMLAudioElement, HTMLMediaElementEventMap>(() => document.createElement('audio'))

const cx = (classname: string) => (el: Element) => el.classList.add(classname)

const on = <TNode extends Node, TChild extends Node, TEvents, K extends keyof TEvents>(
  event: K,
  handler: (arg: TEvents[K] & { currentTarget: TNode }) => void,
): Effect<TNode, TChild, TEvents> => el => {
  // is it possible to prove to the compiler that the right argument is used?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  el.addEventListener(event.toString(), handler as any)
}

div([
  div([], []),
  audio([], []),
], [
  cx('app'),
  on('keydown', e => e.key),
  on('ended', e => e.currentTarget),
])
