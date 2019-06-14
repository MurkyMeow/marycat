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

const withParent = $el => entity => {
  switch (typeof entity) {
    case 'string': return plain($el, entity)
    case 'function': return entity($el)
    default: throw Error(`Unexpected child: ${entity}`)
  }
}

const el = name => (...entities) => {
  const chained = entities
  return function chain(...entities) {
    const $parent = entities.find(x => x instanceof Element)
    if (!$parent) {
      chained.push(...entities.flat())
      return chain
    }
    const $el = document.createElement(name)
    chained.forEach(withParent($el))
    return $parent.appendChild($el)
  }
}

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
      current = value
      observers.forEach(cb => cb(value))
    }
  })
  subscribe.after = f => {
    const newState = makeState(current)
    subscribe(value => newState.value = f(value))
    return newState
  }
  const actions = Object.entries(params.actions || {})
  for (const [name, fn] of actions) {
    subscribe[name] = (...args) => {
      subscribe.value = fn(current, ...args)
    }
  }
  const views = Object.entries(params.views || {})
  for (const [name, fn] of views) {
    subscribe[name] = subscribe.after(fn)
  }
  return subscribe
}

const on = name => handler => $el => {
  $el.addEventListener(name, handler)
}

const attr = name => value => $el => {
  $el.setAttribute(name, value)
}

const ternary = cond => then => otherwise => $el => {
  const state = cond.after(Boolean)
  const mount = withParent($el)
  let $node
  state(value => {
    const $new = mount(value ? then : otherwise)
    if ($node) $node.replaceWith($new)
    else $el.appendChild($new)
    $node = $new
  })
}

const when = cond => vnode =>
  ternary(cond)(vnode)('')