import { State, StateOrPlain } from './state'

export type Effect
  = string
  | number
  | boolean
  | State<any>
  | VirtualNode
  | (() => VirtualNode) // lazy nodes for conditional rendering
  | ((el: Element | ShadowRoot) => Node | void)

export type GenericVirtualNodeFn<T extends VirtualNode> =
  T & ((...effects: Effect[]) => GenericVirtualNodeFn<T>)

export type VirtualNodeFn =
  GenericVirtualNodeFn<VirtualNode>

const isVirtualNode = (arg: any): arg is VirtualNode =>
  arg && typeof arg.mount === 'function'

const filterShadow = (el: Element | ShadowRoot): Element =>
  el instanceof ShadowRoot ? el.host : el

// TODO generalize with `repeat` somehow?
function applyObserved(el: Element | ShadowRoot, state: State<Effect>): Node[] {
  const hook: Node = el.appendChild(new Comment(''))
  const nodes: Node[] = []
  state.sub(next => {
    while (nodes.length) el.removeChild(nodes.pop()!)
    let refNode: Node = hook
    const _nodes = <Node[]>apply(el, next).filter(x => x)
    _nodes.forEach(node => {
      refNode = el.insertBefore(node, refNode.nextSibling)
      nodes.push(node)
    })
  })
  return nodes
}

function apply(el: Element | ShadowRoot, effect: Effect | Effect[]): (Node | undefined)[] {
  if (!el) {
    throw Error(`Cant apply an effect to a not mounted element`)
  }
  if (effect === null) return []
  if (Array.isArray(effect)) {
    const res: (Node | undefined)[] = []
    return res.concat(...effect.map(m => apply(el, m)))
  }
  if (isVirtualNode(effect)) {
    return [effect.mount(el)]
  }
  if (effect instanceof State) {
    return applyObserved(el, effect)
  }
  switch (typeof effect) {
    case 'number': {
      const text = new Text(effect.toString())
      return [el.appendChild(text)]
    }
    case 'boolean':
      return []
    case 'string':
      return [el.appendChild(new Text(effect))]
    case 'function': {
      const val = effect(el)
      return [isVirtualNode(val) ? val.mount(el) : val || undefined]
    }
    default:
      console.trace('Unexpected child:', effect)
      return []
  }
}

export class VirtualNode {
  el?: Element
  chain: Effect[] = []

  constructor(
    public readonly elName: string,
    setup: string[],
  ) {
    this.effect(_el => {
      const el = filterShadow(_el)
      setup.forEach(str => {
        const [prefix, rest] = [str[0], str.slice(1)]
        switch (prefix) {
          case '.': return el.classList.add(rest)
          case '#': return el.setAttribute('id', rest)
          case '@': return el.setAttribute('name', rest)
          default: el.textContent += str
        }
      })
    })
  }

  effect(...effects: Effect[]): this {
    if (this.el) apply(this.el, effects)
    else this.chain.push(...effects)
    return this
  }
  style(prop: string, val: StateOrPlain<string>): this {
    return this.effect(el => {
      if (!(el instanceof HTMLElement)) {
        return console.trace(`Cant set style on a "${el.nodeName}"`)
      }
      if (val instanceof State) {
        val.sub(next => this.style(prop, next))
      } else {
        el.style.setProperty(prop, val)
      }
    })
  }
  on(
    event: string,
    handler: EventListener,
    mods: { prevent?: boolean, stop?: boolean, shadow?: boolean } = {},
    options?: AddEventListenerOptions | EventListenerOptions,
  ): this {
    return this.effect(_el => {
      const el = mods.shadow ? _el : filterShadow(_el)
      el.addEventListener(event, (e: Event) => {
        if (mods.prevent) e.preventDefault()
        if (mods.stop) e.stopPropagation()
        handler(e)
      }, options)
    })
  }
  dispatch(name: string, detail?: any, opts: CustomEventInit = {}) {
    return this.effect(el => {
      const event = new CustomEvent(name, { detail, ...opts })
      filterShadow(el).dispatchEvent(event)
    })
  }
  attr<T extends string | number | boolean>(name: string, val: StateOrPlain<T>): this {
    return this.effect(_el => {
      const el = filterShadow(_el)
      if (val instanceof State) {
        val.sub(next => this.attr(name, next))
      } else {
        el.setAttribute(name, val === false ? '' : String(val))
      }
    })
  }
  text$(strings: TemplateStringsArray, ...keys: State<string>[]): this {
    return this.effect(el => {
      strings.forEach((str, i) => {
        const state = keys[i]
        if (!state) return
        const text = new Text('')
        state.sub(next => text.textContent = str + next)
        el.appendChild(text)
      })
    })
  }
  repeat<T>(
    items: State<T[]>,
    getKey: (el: T) => string | object,
    render: (el: State<T>, i: State<number>) => Effect | Effect[],
  ): this {
    return this.effect(el => {
      const hook = el.appendChild(new Comment(''))
      type ObservedItem = {
        nodes: Node[],
        state: State<T>,
        index: State<number>,
      }
      let lookup = new Map<string | object, ObservedItem>()
      items.sub((next, prev) => {
        let refNode: Node = hook
        const newLookup = new Map<string | object, ObservedItem>()
        // update existing nodes and append the new ones
        next.forEach((item, i) => {
          const key = getKey(item)
          let observed = lookup.get(key)
          if (observed) {
            observed.index.v = i
            observed.state.v = item
          } else {
            const state = new State(item)
            const index = new State(i)
            const effects = render(state, index)
            const nodes = <Node[]>apply(el, effects).filter(_=>_)
            observed = { nodes, state, index }
          }
          // restore the order of the nodes
          observed.nodes.forEach(
            node => refNode = el.insertBefore(node, refNode.nextSibling))
          newLookup.set(key, observed)
        })
        // remove nodes that are not present anymore
        prev.forEach(item => {
          const key = getKey(item)
          if (newLookup.has(key)) return
          const observed = lookup.get(key)!
          observed.nodes.forEach(node => el.removeChild(node))
        })
        lookup = newLookup
      })
    })
  }
  mount(parent: Element | ShadowRoot): Element | ShadowRoot {
    if (this.elName === 'fragment') {
      this.chain.forEach(m => apply(parent, m))
      return parent
    }
    const el = this.el = this.el || document.createElement(this.elName)
    this.chain.forEach(m => apply(el, m))
    this.chain.length = 0
    return parent.appendChild(el)
  }
}

// get method names defined on the whole prototype chain
function getMethodNames(obj: any): string[] {
  if (obj === Object.prototype) return []
  const methods = Object
    .getOwnPropertyNames(obj)
    .filter(x => typeof obj[x] === 'function' && x !== 'constructor')
  return getMethodNames(Object.getPrototypeOf(obj)).concat(methods)
}

export function chainify<T extends VirtualNode>(vnode: T): GenericVirtualNodeFn<T> {
  const fn = Object.assign(function(...effects: Effect[]) {
    vnode.effect(...effects)
    return fn
  }, vnode)
  // Object.assign only inserts the state of vnode
  // also insert the methods
  const proto = Object.getPrototypeOf(vnode)
  getMethodNames(proto).forEach(key => {
    // @ts-ignore
    fn[key] = proto[key]
  })
  return fn
}

export const shorthand = (name: string) => (...setup: string[]) =>
  chainify(new VirtualNode(name, setup))

export const div = shorthand('div')
export const h1 = shorthand('h1')
export const style = shorthand('style')
export const fragment = shorthand('fragment')
