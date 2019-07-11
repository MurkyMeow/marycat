import { withParent, empty } from './core.js'
import { State } from './state.js'

function reactiveItem(initial) {
  const state = new State(initial)
  const getters = new Proxy({}, {
    get: (_, prop) => prop === 'v'
      ? state.v
      : state.after(x => x[prop]),
  })
  return { state, getters }
}

export const iter = state => vnode => $el => {
  let oldLookup = new Map()
  const mount = withParent($el)
  const $hook = $el.appendChild(empty())
  state.sub((nextState, oldState = []) => {
    const newLookup = new Map()
    for (const item of nextState) {
      const key = item[state.key]
      if (oldLookup.has(key)) {
        newLookup.set(key, oldLookup.get(key))
      } else {
        const { state, getters } = reactiveItem(item)
        const $node = mount(vnode(getters))
        newLookup.set(key, { state, $node })
      }
    }
    for (const item of oldState) {
      const key = item[state.key]
      if (!newLookup.has(key)) {
        oldLookup.get(key).$node.remove()
      }
    }
    let $current = $hook.nextSibling
    nextState.forEach((item, i) => {
      const next = newLookup.get(item[state.key])
      if ($current === next.$node) $current = $current.nextSibling
      else $current.before(next.$node)
      next.state.v = { ...item, i }
    })
    oldLookup = newLookup
  })
}
