type Observer<T> = (arg: T) => void

type ObserverArgument<F> = F extends Observer<infer A> ? A : never

type Observers = { [x: string]: Observer<any> }

interface Vnode<T extends Node, O extends Observers> {
  <K extends Observers>(transform: (el: Vnode<T, O>) => Vnode<T, K>): Vnode<T, O & K>

  el: T

  observers: O

  update: (patch: { [K in keyof O]?: ObserverArgument<O[K]> }) => void
}

function makeVnode<T extends Node, O extends Observers>(el: T, observers: O): Vnode<T, O> {
  const next = Object.assign(function<K extends Observers>(
    transform: (current: Vnode<T, O>) => Vnode<T, K>,
  ): Vnode<T, O & K> {
    return next(transform)
  }, {
    el,
    observers,
    update(patch: { [K in keyof O]?: ObserverArgument<O[K]> }): void {
      Object.entries(patch).forEach(([_key, val]) => {
        const key = _key as keyof O
        observers[key](val)
      })
    },
  })
  return next
}

const div = () => makeVnode(document.createElement('div'), {})

function watch<K extends string>(key: K) {
  return {
    toAttr: (attrName: string) => <
      E extends Element,
      O extends Observers
    >(vnode: Vnode<E, O>): Vnode<E, O & { [P in K]: (val: string) => void }> => {
      return makeVnode(vnode.el, {
        ...vnode.observers,
        [key](val: string): void {
          vnode.el.setAttribute(attrName, val)
        },
      })
    },
    toText: () => <
      E extends Element,
      O extends Observers
    >(vnode: Vnode<E, O>): Vnode<E, O & { [P in K]: (val: string) => void }> => {
      return makeVnode(vnode.el, {
        ...vnode.observers,
        [key](val: string): void {
          vnode.el.textContent = val
        },
      })
    },
  }
}

const app =
  (div()
    (watch('class').toAttr('class'))
    (watch('count').toText())
    (div()
      (watch('childClass').toAttr('class'))
    )
  )

app.update({
  class: 'app',
  count: '0',
  childClass: 'app_child',
})

document.body.append(app.el)
