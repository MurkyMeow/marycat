type Observer<T> = (val: T, oldVal: T) => void
type ZipValue<T> = State<T> | T

export class State<T> {
  private observers: Observer<T>[] = []
  constructor(
    private val: T,
  ) {}
  get v() {
    return this.val
  }
  set v(val: T) {
    if (val === this.val) return
    this.observers.forEach(ob => ob(val, this.val))
    this.val = val
  }
  _<K extends keyof T>(key: K | State<K>): State<T[K]> {
    if (key instanceof State) {
      return zip([this, key], (a, b) => a[b])
    }
    return this.map(v => v[key])
  }
  sub(fn: Observer<T>, immediate: boolean = true): this {
    if (immediate) fn(this.v, this.v)
    this.observers.push(fn)
    return this
  }
  map<K>(fn: (val: T) => K): State<K> {
    return zip([this], fn)
  }
  not(): State<boolean> {
    return this.map(v => !v)
  }
  and<K>(s: ZipValue<K>): State<T | K> { return zip([this, s], (a, b) => a && b) }
  or<K>(s: ZipValue<K>): State<T | K> { return zip([this, s], (a, b) => a || b) }
  eq(s: ZipValue<T>): State<boolean> { return zip([this, s], (a, b) => a === b) }
  ne(s: ZipValue<T>): State<boolean> { return zip([this, s], (a, b) => a !== b) }
  gt(s: ZipValue<number>): State<boolean> { return zip([this, s], (a, b) => a > b) }
  ge(s: ZipValue<number>): State<boolean> { return zip([this, s], (a, b) => a >= b) }
  lt(s: ZipValue<number>): State<boolean> { return zip([this, s], (a, b) => a < b) }
  le(s: ZipValue<number>): State<boolean> { return zip([this, s], (a, b) => a <= b) }
}

export function zip<K>(
  states: ZipValue<any>[], map: (...values: any[]) => K,
): State<K> {
  const values = () => map(...states.map(x => x instanceof State ? x.v : x))
  const res = new State(values())
  let frame: number
  const update = () => {
    if (frame) return
    frame = requestAnimationFrame(() => (res.v = values(), frame = 0))
  }
  states.forEach(state => {
    if (state instanceof State) state.sub(update, false)
  })
  return res
}
