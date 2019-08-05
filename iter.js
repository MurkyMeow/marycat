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
        const state = new State({ ...item, i })
        const $node = mount(vnode(state))
        next = { state, $node }
        newLookup.set(key, next)
      } else {
        next.state.v = { ...item, i } // update existing node
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
