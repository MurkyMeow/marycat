type Observer<T> = (val: T, oldVal: T) => void

export type StateOrPlain<T> = State<T> | T

export type ObservedFields<T> =
  T extends object ? { [key in keyof T]: State<T[key]> } : never

export type ExtractStateType<T> =
  T extends State<infer U> ? U : never

export class State<T> {
  private observers: Observer<T>[] = []
  constructor(
    private val: T,
  ) {}
  get v() {
    return this.val
  }
  set v(next: T) {
    const current = this.val
    if (next === current) return
    this.val = next
    this.observers.forEach(ob => ob(next, current))
  }
  get string(): State<string> {
    return this.map(String)
  }
  get _(): ObservedFields<T> {
    return <ObservedFields<T>>new Proxy({}, {
      get: (_, key: keyof T) => this.map(v => v[key])
    })
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
  and<V>(s: StateOrPlain<V>) { return zip([this, s], (a, b) => a ? b : a) }
  or<V>(s: StateOrPlain<V>) { return zip([this, s], (a, b) => a || b) }
  eq(s: StateOrPlain<T>) { return zip([this, s], (a, b) => a === b) }
  ne(s: StateOrPlain<T>) { return zip([this, s], (a, b) => a !== b) }
  gt(s: StateOrPlain<number>) { return zip([this, s], (a, b) => a > b) }
  ge(s: StateOrPlain<number>) { return zip([this, s], (a, b) => a >= b) }
  lt(s: StateOrPlain<number>) { return zip([this, s], (a, b) => a < b) }
  le(s: StateOrPlain<number>) { return zip([this, s], (a, b) => a <= b) }
}

export function zip<T, R>(states: [T], map: (arg: ExtractStateType<T>) => R): State<R>
export function zip<T, T2, R>(states: [T, T2], map: (...args: [ExtractStateType<T>, ExtractStateType<T2>]) => R): State<R>

export function zip<R>(
  states: StateOrPlain<any>[], map: (...values: any[]) => R,
): State<R> {
  const values = () => map(...states.map(x => x instanceof State ? x.v : x))
  const res = new State(values())
  const update = () => res.v = values()
  states.forEach(state => {
    if (state instanceof State) state.sub(update, false)
  })
  return res
}

export const zip$ = (
  strings: TemplateStringsArray,
  ...keys: StateOrPlain<string>[]
): State<string> =>
  strings.reduce((acc, str, i) => {
    const state = keys[i]
    return state
      ? zip([acc, state], (a, b) => `${a}${str}${b}`)
      : acc.map(v => `${v}${str}`)
  }, new State(''))
