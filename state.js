import { assert } from './core.js'

const isObject = val => typeof val === 'object'
  && val !== null
  && !Array.isArray(val)

export class State {
  constructor(initial, params = {}) {
    const { key, actions = {} } = params
    this.current = initial
    this.observers = []
    this.key = key
    for (const [name, fn] of Object.entries(actions)) {
      this[name] = (...args) => {
        this.v = fn(this.v, ...args)
      }
    }
  }
  get v() {
    return this.current
  }
  set v(next) {
    if (next === this.current) return
    if (this.wrapped) {
      assert(isObject(next),
        `Cant assign non-object value "${next}" to an object state`)
      for (const key in this.wrapped) this[key] = next[key]
    }
    this.observers.forEach(cb => cb(next, this.current))
    this.current = next
  }
  wrap() {
    assert(isObject(this.current), `Cant wrap non-object value: "${this.current}"`)
    assert(!this.wrapped, 'Cant wrap a state twice')
    this.wrapped = {}
    for (const [key, val] of Object.entries(this.current)) {
      const state = this.wrapped[key] = new State(val)
      if (isObject(val)) state.wrap()
      Object.defineProperty(this, key, {
        get: () => state,
        set: v => state.v = v,
      })
      state.sub(v => this.current[key] = v)
    }
    return this
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
  merge(val, f) {
    if (!(val instanceof State)) {
      return this.after(x => f(x, val))
    }
    const comb = this.after(x => f(x, val.v))
    val.sub(x => comb.v = f(this.v, x))
    return comb
  }
  tern(then, otherwise) {
    return this.after(Boolean).after(v => v ? then : otherwise)
  }
  get isEmpty() {
    assert(Array.isArray(this.v), `"isEmpty" was called on non-array value: "${this.v}"`)
    return this.after(v => v.length <= 0)
  }
}

const operators = {
  gt: (a, b) => a > b,
  lt: (a, b) => a < b,
  le: (a, b) => a <= b,
  ge: (a, b) => a >= b,
  ne: (a, b) => a !== b,
  eq: (a, b) => a === b,
  or: (a, b) => a || b,
  and: (a, b) => a && b,
}

for (const [name, fn] of Object.entries(operators)) {
  State.prototype[name] = function(val) {
    return this.merge(val, fn)
  }
}

export function get(strings, ...keys) {
  return strings.map((str, i) => {
    const state = keys[i]
    if (!state) return str || null
    const text = document.createTextNode('')
    state.sub(next => text.textContent = str + next)
    return $el => $el.appendChild(text)
  })
}
