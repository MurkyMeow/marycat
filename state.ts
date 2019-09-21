type Observer<T> = (val: T, oldVal?: T) => any
type Transform<T, K> = (val: T) => K

export class State<T> {
  private observers: Observer<T>[] = []
  constructor(private val: T) {}
  get v() {
    return this.val
  }
  set v(val) {
    this.observers.forEach(ob => ob(this.val, val))
    this.val = val
  }
  sub(fn: Observer<T>, immediate: boolean = true): this {
    if (immediate) fn(this.v)
    this.observers.push(fn)
    return this
  }
  map<K>(fn: Transform<T, K>): State<K> {
    const state = stateful(fn(this.v))
    this.sub(val => state.v = fn(val), false)
    return state
  }
}

export const stateful = <T>(val: T) => new State<T>(val)

export const get = (strings: string[], ...keys: State<any>[]) =>
  strings.map((str, i) => {
    const state = keys[i]
    if (!state) return str || null
    const text = document.createTextNode('')
    state.sub(next => text.textContent = str + next)
    return (el: HTMLElement) => el.appendChild(text)
  })
