import { vnode } from './vnode'

export const vnodeHTML = <TName extends keyof HTMLElementTagNameMap>(elName: TName) =>
  vnode<HTMLElementTagNameMap[TName], HTMLElementEventMap, Node>(root => {
    return root.appendChild(document.createElement(elName))
  })

export const frag = vnode(root => root.appendChild(document.createDocumentFragment()))
export const styleEl = vnodeHTML('style')
