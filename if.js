import { chainable, empty, withParent, assert } from './core.js'
import { State } from './state.js';

function debounce(fn) {
  let frame
  return (...args) => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      fn(...args)
      frame = null
    })
  }
}

export const _if = chainable({
  _init(cond) {
    this.elif(cond)
    this.nodes = new Map()
    this.state = this.current
  },
  _take(first, ...rest) {
    const { current, nodes } = this
    if (!nodes.has(current)) nodes.set(current, [])
    nodes.get(current).push(first, ...rest)
  },
  _connect($parent) {
    this.mount = withParent($parent)
    this.refs = [$parent.appendChild(empty())]
    const reconcile = debounce(() => this.reconcile())
    for (const [cond] of this.nodes) {
      if (cond !== 'else') cond.sub(reconcile)
    }
  },
  reconcile() {
    const [$hook, ...children] = this.refs
    children.forEach($el => $el.remove())
    const newNodes = this.mount(this.getNodes())
    this.refs = [].concat(newNodes)
    this.refs.reduce((prev, cur) => (prev.after(cur), cur), $hook)
    $hook.remove()
  },
  getNodes() {
    for (const [cond, nodes] of this.nodes) {
      if (cond !== 'else' && cond.v) return nodes
    }
    return this.nodes.get('else') || [empty]
  },
  then() {
    return this.elif(this.state)
  },
  else() {
    this.current = 'else'
    return this
  },
  elif(cond) {
    assert(cond instanceof State, `Got non-state value: ${cond}`)
    this.current = cond
    return this
  },
})
