import { chainable, empty, withParent } from './core.js'

export const _if = chainable({
  _init(cond) {
    this.then()
    this.cond = cond
    this.nodes = { then: [], else: [] }
  },
  _take(first, ...rest) {
    this.nodes[this.mode].push(first, ...rest)
  },
  _connect($parent) {
    const mount = withParent($parent)
    const state = this.cond.after(Boolean)
    let nodes = []
    state.sub(value => {
      while (nodes.length > 1) nodes.pop().remove()
      const $hook = nodes[0] || $parent.appendChild(empty())
      const newNodes = mount(this.nodes[value ? 'then' : 'else'])
      nodes = [].concat(newNodes)
      nodes.reduce((prev, cur) => (prev.after(cur), cur), $hook)
      $hook.remove()
    })
    const frag = document.createDocumentFragment()
    frag.append(...nodes)
    return frag
  },
  then() {
    this.mode = 'then'
    return this
  },
  else() {
    this.mode = 'else'
    return this
  },
  // TODO: elseif
})
