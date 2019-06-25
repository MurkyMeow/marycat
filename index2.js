function plain($el, str) {
  const [prefix, rest] = [str[0], str.slice(1)]
  switch (prefix) {
    case '.': return $el.classList.add(rest)
    case '#': return $el.setAttribute('id', rest)
    case '@': return $el.setAttribute('name', rest)
    default:
      return $el.appendChild(document.createTextNode(str))
  }
}

function withParent($el) {
  return function mount(entity) {
    if (entity === null) return
    if (Array.isArray(entity)) {
      return entity.map(mount)
    }
    switch (typeof entity) {
      case 'number':
      case 'boolean':
        return $el.appendChild(document.createTextNode(entity))
      case 'string': return plain($el, entity)
      case 'function': return entity($el)
      default: throw Error(`Unexpected child: ${entity}`)
    }
  }
}

const chainable = cb => (...initial) => {
  const chained = []
  function chain(first, ...rest) {
    if (first instanceof Element) {
      return cb(first, chained)
    }
    chained.push(first, ...rest)
    return chain
  }
  return chain(...initial)
}

const el = name => chainable(($parent, chained) => {
  const $el = document.createElement(name)
  const mount = withParent($el)
  chained.forEach(mount)
  return $parent.appendChild($el)
})

function makeState(initial, params = {}) {
  let current = initial
  const observers = []
  function subscribe(cb) {
    cb(current)
    observers.push(cb)
    return subscribe
  }
  Object.defineProperty(subscribe, 'value', {
    get: () => current,
    set(value) {
      if (value === current) return
      observers.forEach(cb => cb(value, current))
      current = value
    }
  })
  subscribe.after = f => {
    const newState = makeState(current)
    subscribe(value => newState.value = f(value))
    return newState
  }
  subscribe.combine = f => state => {
    const comb = makeState()
    state(x => comb.value = f(current, x))
    subscribe(x => comb.value = f(x, state.value))
    return comb
  }
  subscribe.not = () => subscribe.after(x => !x)
  subscribe.and = subscribe.combine((a, b) => a && b)
  subscribe.or = subscribe.combine((a, b) => a || b)
  const { key, actions, views } = params
  subscribe.key = key
  for (const [name, fn] of Object.entries(actions || {})) {
    subscribe[name] = (...args) => {
      subscribe.value = fn(current, ...args)
    }
  }
  for (const [name, fn] of Object.entries(views || {})) {
    subscribe[name] = subscribe.after(fn)
  }
  return subscribe
}

function get(strings, ...keys) {
  return strings.map((str, i) => {
    const state = keys[i]
    if (!state) return str || null
    const text = document.createTextNode('')
    state(next => text.textContent = str + next)
    return $el => $el.appendChild(text)
  })
}

const on = name => handler => $el => {
  $el.addEventListener(name, handler)
}

const attr = name => value => $el => {
  $el.setAttribute(name, value)
}

function empty() {
  return document.createComment('')
}

const ternary = cond => then => otherwise => $el => {
  const state = cond.after(Boolean)
  const mount = withParent($el)
  let nodes = []
  state(value => {
    while (nodes.length > 1) nodes.pop().remove()
    const $hook = nodes[0] || $el.appendChild(empty())
    const newNodes = mount(value ? then : otherwise)
    nodes = [].concat(newNodes)
    nodes.reduce((prev, cur) => (prev.after(cur), cur), $hook)
    $hook.remove()
  })
}

const when = cond => chainable(($el, chained) =>
  ternary(cond)(chained)(empty)($el)
)

function reactiveItem(item) {
  const observers = []
  function get(_, prop) {
    if (prop === '$') return item
    return cb => {
      observers.push((value, i) => cb(prop === 'i' ? i : value[prop]))
    }
  }
  function update(value, index) {
    observers.forEach(cb => cb(value, index))
  }
  const getters = new Proxy({}, { get })
  return { update, getters }
}

const iter = state => vnode => $el => {
  let oldLookup = new Map()
  const mount = withParent($el)
  const $hook = $el.appendChild(empty())
  state((nextState, oldState = []) => {
    const newLookup = new Map()
    for (const item of nextState) {
      const key = item[state.key]
      if (oldLookup.has(key)) {
        newLookup.set(key, oldLookup.get(key))
      } else {
        const { update, getters } = reactiveItem(item)
        const $node = mount(vnode(getters))
        newLookup.set(key, { update, $node })
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
      next.update(item, i)
    })
    oldLookup = newLookup
  })
}
