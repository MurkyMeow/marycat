type ObserverMap<T> =
  { [x in keyof T]?: (() => void)[] }

type ActionMap =
  { [x: string]: (...args: any) => any }

export function store<T, A extends ActionMap>(obj: T, getActions: (store: T) => A) {
  type FilterKeys<U> =
    { [X in keyof T]: T[X] extends U ? X : never }[keyof T]

  const observerMap: ObserverMap<T> = {}

  const actionsMap = getActions(obj)

  const observe = <U>(key: FilterKeys<U>, fn: (val: U) => void): void => {
    const observers = observerMap[key]
    const observer = () => fn(obj[key])
    observerMap[key] = observers ? observers.concat(observer) : [observer]
  }

  return {
    _text: (key: FilterKeys<string>) => (el: Node) => {
      observe(key, val => el.textContent = val)
    },
    _attr: (attrName: string, key: FilterKeys<string>) => (el: Element) => {
      observe(key, val => el.setAttribute(attrName, val))
    },
    _dispatch<K extends keyof A>(action: K, ...params: Parameters<A[K]>): ReturnType<A[K]> {
      return actionsMap[action].apply(null, params)
    },
  }
}

const myStore = store({
  hello: 'hi',
  bar: 1234,
}, store => ({
  setHello: (val: string) => store.hello = val,
}))

myStore._dispatch('setHello', 'ciao')

myStore._text('hello')
myStore._attr('data-stuff', 'bar') // error
