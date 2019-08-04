import { assert } from './core.js'

export class State {
  constructor(initial, params = {}) {
    const { key, observed, actions = {} } = params
    this.current = initial
    this.observers = []
    this.key = key
    for (const [name, fn] of Object.entries(actions)) {
      this[name] = (...args) => {
        this.v = fn(this.v, ...args)
      }
    }
    if (observed) {
      this.observed = observed
      for (const [key, val] of Object.entries(this.current)) {
        this.current[key] = new State(val)
        Object.defineProperty(this, key, {
          get: () => this.current[key],
          set: v => this.current[key].v = v,
        })
      }
    }
  }
  get v() {
    return this.current
  }
  set v(next) {
    if (next === this.current) return
    if (this.observed) {
      assert(typeof next === 'object',
        `Cant assign the primitive value "${next}" to an object state`)
      this.observed.forEach(key => this[key] = next[key])
    }
    this.observers.forEach(cb => cb(next, this.current))
    if (!this.observed) this.current = next
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
