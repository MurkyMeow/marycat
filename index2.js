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

function makeArray(initial = [], params) {
  const observers = []
  const array = new Proxy(initial, {
    set(target, prop, value) {
      const length = target.length
      const current = target[prop]
      target[prop] = value
      if (prop !== 'length') {
        observers.forEach(ob => ob.onset(value, Number(prop), current))
      } else if (value < length) {
        observers.forEach(ob => ob.ondel(Number(value - 1)))
      }
      return true
    }
  })
  const state = makeState(array, params)
  state.subscribe = ob => {
    observers.push(ob)
    array.forEach((value, i) => ob.onset(value, i))
  }
  return state
}

const iter = state => vnode => $el => {
  const mount = withParent($el)
  const $hook = document.createComment('')
  const refs = [$hook]
  $el.appendChild($hook)
  state.subscribe({
    onset(next, index, current) {
      if (!next._key) {
        next._key = Math.random()
        next._i = index
        const $node = mount(vnode(next, index))
        refs[index].after($node)
        refs.splice(index + 1, 0, $node)
      } else {
        const [$current] = refs.splice(current._i + 1, 1)
        const newIndex = state.value.findIndex(x => x._key === current._key)
        if (newIndex < 0) {
          $current.remove()
        } else {
          current._i = newIndex
          refs[newIndex].after($current)
          refs.splice(newIndex + 1, 0, $current)
        }
      }
    },
    ondel(index) {
      const [$node] = refs.splice(index + 1, 1)
      $node.remove()
    },
  })
}
