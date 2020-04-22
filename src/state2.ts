type ObserverMap<T> =
  { [x in keyof T]?: (() => void)[] }

type ActionMap =
  { [x: string]: (...args: any) => any }

type FilterKeys<T, U> =
  { [X in keyof T]: T[X] extends U ? X : never }[keyof T]

export interface Store<T> {
  text: (key: FilterKeys<T, string | number>) => (el: Node) => void
  attr: (key: FilterKeys<T, string | number>, attrName: string) => (el: Element) => void
  set: <K extends keyof T>(key: K, val: T[K]) => void
}

export function makeStore<T, A extends ActionMap>(store: T, getActions: (store: T) => A): Store<T> & A {
  const observerMap: ObserverMap<T> = {}

  const observe = <U>(key: FilterKeys<T, U>, fn: (val: U) => void): void => {
    const observers = observerMap[key]
    const observer = () => fn(store[key] as any)
    observer()
    observerMap[key] = observers ? observers.concat(observer) : [observer]
  }

  return {
    ...getActions(store),
    text: key => node => {
      observe(key, val => node.textContent = String(val))
    },
    attr: (key, attrName) => el => {
      observe(key, val => el.setAttribute(attrName, String(val)))
    },
    set(key, val) {
      store[key] = val
      const observers = observerMap[key]
      if (observers) observers.forEach(fn => fn())
    },
  }
}
