import { State } from './state'

export type Effect
  = string
  | number
  | boolean
  | State<any>
  | MaryElement
  | ((el: Element | ShadowRoot) => Node | void)

const filterShadow = (el: Element | ShadowRoot): Element =>
  el instanceof ShadowRoot ? el.host : el

function applyPlain(el: Element | ShadowRoot, str: string): Node | undefined {
  const [prefix, rest] = [str[0], str.slice(1)]
  const filtered = filterShadow(el)
  switch (prefix) {
    case '.': filtered.classList.add(rest); break
    case '#': filtered.setAttribute('id', rest); break
    case '@': filtered.setAttribute('name', rest); break
    default: return el.appendChild(new Text(str))
  }
}

// TODO generalize with `repeat` somehow?
function applyObserved(el: Element | ShadowRoot, state: State<Effect | Effect[]>): Node[] {
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
  if (effect instanceof MaryElement) {
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
      return [applyPlain(el, effect)]
    case 'function':
      return [effect(el) || undefined]
    default:
      console.trace('Unexpected child:', effect)
      return []
  }
}

export class MaryElement {
  el?: Element

  constructor(
    public name: string,
    private chain: Effect[],
  ) {}

  $(...effects: Effect[]): this {
    if (this.el) apply(this.el, effects)
    else this.chain.push(...effects)
    return this
  }
  style(prop: string, val: string): this {
    return this.$(el => el instanceof HTMLElement
      ? el.style.setProperty(prop, val)
      : console.trace(`Cant set style on a "${el.nodeName}"`)
    )
  }
  on(
    event: string,
    handler: EventListener,
    mods: { prevent?: boolean, stop?: boolean, shadow?: boolean } = {},
    options?: AddEventListenerOptions | EventListenerOptions,
  ): this {
    return this.$(_el => {
      const el = mods.shadow ? _el : filterShadow(_el)
      el.addEventListener(event, e => {
        if (mods.prevent) e.preventDefault()
        if (mods.stop) e.stopPropagation()
        handler(e)
      }, options)
    })
  }
  dispatch(name: string, detail: any, opts: CustomEventInit = {}) {
    return this.$(el => {
      const event = new CustomEvent(name, { detail, ...opts })
      filterShadow(el).dispatchEvent(event)
    })
  }
  attr(name: string, val: string | number | boolean): this {
    return this.$(_el => {
      const el = filterShadow(_el)
      el.setAttribute(name, val === false ? '' : String(val))
    })
  }
  attr$(name: string): (strings: TemplateStringsArray, ...keys: State<string>[]) => this {
    return (strings, ...keys) => this.$(() => {
      let val = ''
      strings.forEach((str, i) => {
        const state = keys[i]
        this.attr(name, val += str)
        if (!state) return
        const start = val.length
        state.sub((next, prev) => {
          const left = val.slice(0, start)
          const right = val.slice(start + prev.length)
          this.attr(name, val = `${left}${next}${right}`)
        })
      })
    })
  }
  text(strings: TemplateStringsArray, ...keys: State<string>[]): this {
    return this.$(el => {
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
    return this.$(el => {
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
    if (this.name === 'fragment') {
      this.chain.forEach(m => apply(parent, m))
      return parent
    }
    const el = this.el = this.el || document.createElement(this.name)
    this.chain.forEach(m => apply(el, m))
    this.chain.length = 0
    return parent.appendChild(el)
  }
}

export const shorthand = (name: string) => (...effects: Effect[]) =>
  new MaryElement(name, effects)

export const div = shorthand('div')
export const h1 = shorthand('h1')
export const style = shorthand('style')
export const fragment = shorthand('fragment')
