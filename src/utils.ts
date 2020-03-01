import { vnode } from './vnode'

export const vnodeHTML = <TName extends keyof HTMLElementTagNameMap>(elName: TName) =>
  vnode<HTMLElementTagNameMap[TName], HTMLElementEventMap>(() => document.createElement(elName))

export const frag = vnode(() => document.createDocumentFragment())
export const styleEl = vnodeHTML('style')
