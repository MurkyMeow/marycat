function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

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

const chainable = api => (...initial) => {
  const chained = []
  function chain(first, ...rest) {
    if (first instanceof Element) {
      return chain._connect(first, chained)
    }
    if (chain._take) {
      return chain._take(first, ...rest)
    }
    chained.push(first, ...rest)
    return chain
  }
  const { _init, ...rest } = api
  Object.assign(chain, rest)
  if (_init) {
    _init.apply(chain, initial)
    return chain
  }
  return chain(...initial)
}

const el = (name, api = {}) => chainable({
  ...api,
  _connect($parent, chained) {
    const $el = document.createElement(name)
    const mount = withParent($el)
    chained.forEach(mount)
    return $parent.appendChild($el)
  },
  on(name, handler) {
    this($el => $el.addEventListener(name, handler))
    return this
  },
  attr(name, handler) {
    this($el => $el.setAttribute(name, handler))
    return this
  },
})

class State {
  constructor(initial, params = {}) {
    const { key, actions = {}, views = {} } = params
    this.current = initial
    this.observers = []
    this.key = key
    for (const [name, fn] of Object.entries(actions)) {
      this[name] = (...args) => {
        this.v = fn(this.v, ...args)
      }
    }
    for (const [name, fn] of Object.entries(views)) {
      this[name] = this.after(fn)
    }
  }
  get v() {
    return this.current
  }
  set v(value) {
    if (value === this.v) return
    this.observers.forEach(cb => cb(value, this.v))
    this.current = value
  }
  sub(cb) {
    cb(this.v)
    this.observers.push(cb)
    return this
  }
  after(f) {
    const derivation = new State()
    this.sub(x => derivation.v = f(x))
    return derivation
  }
  not() {
    return this.after(x => !x)
  }
  merge(state, f) {
    const comb = new State()
    state.sub(x => comb.v = f(this.v, x))
    this.sub(x => comb.v = f(x, state.v))
    return comb
  }
  and(state) {
    return this.merge(state, (a, b) => a && b)
  }
  or(state) {
    return this.merge(state, (a, b) => a || b)
  }
}

function get(strings, ...keys) {
  return strings.map((str, i) => {
    const state = keys[i]
    if (!state) return str || null
    const text = document.createTextNode('')
    state.sub(next => text.textContent = str + next)
    return $el => $el.appendChild(text)
  })
}

function empty() {
  return document.createComment('')
}

const _if = chainable({
  _init(cond) {
    this.then()
    this.cond = cond
    this.nodes = { then: [], else: [] }
  },
  _take(first, ...rest) {
    this.nodes[this.mode].push(first, ...rest)
    return this
  },
  _connect($parent) {
    const mount = withParent($parent)
    const state = this.cond.after(Boolean)
    let $hook, nodes = []
    state.sub(value => {
      while (nodes.length > 1) nodes.pop().remove()
      $hook = nodes[0] || $parent.appendChild(empty())
      const newNodes = mount(this.nodes[value ? 'then' : 'else'])
      nodes = [].concat(newNodes)
      nodes.reduce((prev, cur) => (prev.after(cur), cur), $hook)
      $hook.remove()
    })
    return $hook
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

function reactiveItem(initial) {
  const state = new State(initial)
  const getters = new Proxy({}, {
    get: (_, prop) => prop === 'v'
      ? state.v
      : state.after(x => x[prop]),
  })
  return { state, getters }
}

const iter = state => vnode => $el => {
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
