type Observer<T> = (val: T, oldVal: T) => void
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
    if (immediate) fn(this.v, this.v)
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
