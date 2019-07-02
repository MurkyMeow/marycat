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

class MaryNode {
  constructor(name, ...initial) {
    this.el = name
    this.chain = initial
  }
  onconnect($parent, $el = document.createElement(this.el)) {
    const mount = withParent($el)
    this.chain.forEach(mount)
    return $parent.appendChild($el)
  }
  add(first, ...rest) {
    if (first instanceof Element) {
      return this.onconnect(first)
    }
    this.chain.push(first, ...rest)
  }
  on(name, handler) {
    this.add($el => $el.addEventListener(name, handler))
  }
  attr(name, value = '') {
    this.add($el => $el.setAttribute(name, value))
  }
}

const el = Type => (...initial) => {
  const inst = typeof Type === 'string'
    ? new MaryNode(Type, ...initial)
    : new Type(...initial)
  const proxy = new Proxy(inst.add.bind(inst), {
    apply(target, _, args) {
      return target(...args) || proxy
    },
    get: (target, prop) => (...args) => {
      assert(prop in inst, `"${prop}" is not defined on "${Type.name || Type}"`)
      target($el => inst[prop]($el, ...args))
      return proxy
    },
  })
  return proxy
}

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

class When extends MaryNode {
  constructor(cond) {
    super()
    this.cond = cond
    this.mode = 'then'
    this.nodes = { then: [], else: [] }
  }
  onconnect($parent) {
    const mount = withParent($parent)
    const state = this.cond.after(Boolean)
    let nodes = []
    state.sub(value => {
      while (nodes.length > 1) nodes.pop().remove()
      const $hook = nodes[0] || $parent.appendChild(empty())
      const newNodes = mount(this.nodes[value ? 'then' : 'else'])
      nodes = [].concat(newNodes)
      nodes.reduce((prev, cur) => (prev.after(cur), cur), $hook)
      $hook.remove()
    })
  }
  then() {
    this.mode = 'then'
  }
  else() {
    this.mode = 'else'
  }
  add(first, ...rest) {
    const node = super.add(first, ...rest)
    if (node instanceof Element) return node
    const { chain, mode } = this
    const nodes = chain.splice(0, chain.length)
    this.nodes[mode].push(...nodes)
  }
}
const when = el(When)

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
