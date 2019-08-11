import { State, debounce, chainable, withParent, empty, assert } from './index.js'

export const iter = chainable({
  init(state, vnode) {
    this.state = state
    this.vnode = vnode
    this.lookup = new Map()
  },
  connect($el) {
    const reconcile = debounce((n, p) => this.reconcile(n, p))
    this.state.sub(reconcile)
    this.mount = withParent($el)
    this.$hook = $el.appendChild(empty())
    return this.nodes = []
  },
  reconcile(nextState, oldState = []) {
    assert(Array.isArray(nextState), `Cant iterate over "${nextState}"`)
    this.nodes.length = 0
    const newLookup = new Map()
    const getkey = this.state.key || (x => x)
    for (const item of nextState) {
      const key = getkey(item)
      newLookup.set(key, this.lookup.get(key))
    }
    for (const item of oldState) {
      const key = getkey(item)
      if (!newLookup.has(key)) {
        this.lookup.get(key).$node.remove()
      }
    }
    let $current = this.$hook
    nextState.forEach((item, i) => {
      const key = getkey(item)
      let next = newLookup.get(key)
      if (!next) {
        const [state, index] = [new State(item), new State(i)]
        const $node = this.mount(this.vnode(state, index))
        next = { state, index, $node }
        newLookup.set(key, next)
      } else {
        // update existing node
        [next.state.v, next.index.v] = [item, i]
      }
      this.nodes.push(next.$node)
      if ($current === next.$node) {
        $current = $current.nextSibling
      } else {
        $current.before(next.$node)
      }
    })
    this.lookup = newLookup
  },
})
