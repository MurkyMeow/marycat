import { chainable, empty, withParent, assert } from './core.js'
import { State } from './state.js';

export function debounce(fn) {
  let frame
  return (...args) => {
    if (frame) return
    frame = requestAnimationFrame(() => (fn(...args), frame = null))
  }
}

export const _if = chainable({
  init(cond) {
    this.elif(cond)
    this.nodes = new Map()
    this.state = this.current
  },
  take(...args) {
    const { current, nodes } = this
    if (!nodes.has(current)) nodes.set(current, [])
    nodes.get(current).push(...args)
  },
  connect($parent) {
    const node = new State(empty)
    const reconcile = debounce(() => node.v = this.getNodes())
    for (const [cond] of this.nodes) {
      if (cond !== 'else') cond.sub(reconcile)
    }
    return withParent($parent)(node)
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
