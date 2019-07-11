export class State {
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

export function get(strings, ...keys) {
  return strings.map((str, i) => {
    const state = keys[i]
    if (!state) return str || null
    const text = document.createTextNode('')
    state.sub(next => text.textContent = str + next)
    return $el => $el.appendChild(text)
  })
}
