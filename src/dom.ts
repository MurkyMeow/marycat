import { StateOrPlain, zip$ } from './state'
import { Effect } from './vnode'

export const style = (rule: string) => (
  strings: TemplateStringsArray,
  ...values: PrimitiveStateOrPlain[]
) => (el: HTMLElement): void => {
  zip$(strings, ...values).sub(v => el.style.setProperty(rule, v))
}

export type MarycatEventListenerOptions =
  (AddEventListenerOptions | EventListenerOptions) & { prevent?: boolean; stop?: boolean }

type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export const on = <
  TNode extends Node,
  TEvents,
  TIntEvents extends UnionToIntersection<TEvents>,
  K extends keyof TIntEvents,
>(
  event: K & string,
  handler: (arg: TIntEvents[K] & { currentTarget: TNode }) => void,
  options?: MarycatEventListenerOptions,
): Effect<TNode, TEvents> => el => {
  el.addEventListener(event, e => {
    if (options?.prevent) e.preventDefault()
    if (options?.stop) e.stopPropagation()
    // is it possible to prove to the compiler that the right argument is used?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler(e as any)
  }, options)
}

type PrimitiveStateOrPlain =
  StateOrPlain<string> | StateOrPlain<number> | StateOrPlain<boolean>

export const attr = (name: string) => (
  strings: TemplateStringsArray, ...values: PrimitiveStateOrPlain[]
) => (el: Element): void => {
  zip$(strings, ...values).sub(v => el.setAttribute(name, v))
}

export const attrs = (attrs: { [key: string]: PrimitiveStateOrPlain }) =>
  Object.entries(attrs).map(([key, val]) => attr(key)`${val}`)

export const id = attr('id')
export const cx = attr('class')
export const name = attr('name')

export const text = (
  strings: TemplateStringsArray, ...values: PrimitiveStateOrPlain[]
) => (el: Node): void => {
  const text = el.appendChild(document.createTextNode(''))
  zip$(strings, ...values).sub(v => text.textContent = v)
}
