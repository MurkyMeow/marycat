import { State, withParent, empty } from './index.js'

export const iter = (state, vnode) => $el => {
  let oldLookup = new Map()
  const mount = withParent($el)
  const $hook = $el.appendChild(empty())
  const getkey = state.key || (x => x)
  state.sub((nextState, oldState = []) => {
    const newLookup = new Map()
    for (const item of nextState) {
      const key = getkey(item)
      newLookup.set(key, oldLookup.get(key))
    }
    for (const item of oldState) {
      const key = getkey(item)
      if (!newLookup.has(key)) {
        oldLookup.get(key).$node.remove()
      }
    }
    let $current = $hook
    nextState.forEach((item, i) => {
      const key = getkey(item)
      let next = newLookup.get(key)
      if (!next) {
        const [index, state] = [new State(i), new State(item)]
        const $node = mount(vnode(state, index))
        next = { state, index, $node }
        newLookup.set(key, next)
      } else {
        // update existing node
        [next.state.v, next.index.v] = [item, i]
      }
      if ($current.nextSibling === next.$node) {
        $current = $current.nextSibling
      } else {
        $current.before(next.$node)
      }
    })
    oldLookup = newLookup
  })
}
