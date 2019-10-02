import { State } from './state'

export type Effect
  = string
  | number
  | boolean
  | State<any>
  | MaryElement
  | ((el: Element | ShadowRoot) => Node | void)

const getKey = (a: Effect): any =>
  a instanceof MaryElement && a._key || a

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

function applyObserved(el: Element | ShadowRoot, state: State<Effect | Effect[]>): Node[] {
  const hook = el.appendChild(new Comment(''))
  const nodes: Node[] = []
  const lookup = new Map<any, Node[]>()
  state.sub((val, prevVal) => {
    const next = ([] as Effect[]).concat(val)
    const prev = ([] as Effect[]).concat(prevVal)
    prev.forEach(x => {
      const key = getKey(x)
      if (next.find(y => key === getKey(y))) return
      const oldNodes = lookup.get(key)
      if (!oldNodes) return
      lookup.delete(key)
      oldNodes.forEach(node => el.removeChild(node))
    })
    let curr: Node = hook
    next.forEach(x => {
      const key = getKey(x)
      const nodes = lookup.get(key) ||
        apply(el, x).filter(_=>_) as Node[]
      lookup.set(key, nodes)
      nodes.forEach(node => {
        el.insertBefore(node, curr)
        if ([node, hook].includes(curr)) curr = curr.nextSibling!
      })
    })
    nodes.length = 0
    lookup.forEach(x => nodes.push(...x))
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
    case 'number':
      return [el.appendChild(new Text(effect.toString()))]
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
  _key?: any

  constructor(
    public name: string,
    private chain: Effect[],
  ) {}

  $(...effects: Effect[]): this {
    if (this.el) apply(this.el, effects)
    else this.chain.push(...effects)
    return this
  }
  key(val: string): this {
    this._key = val
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
    handler: (e: Event) => any,
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
  emit(name: string, detail: any, opts: CustomEventInit = {}) {
    return this.$(el => {
      const event = new CustomEvent(name, { detail, ...opts })
      filterShadow(el).dispatchEvent(event)
    })
  }
  attr(name: string, val: any): this {
    return this.$(el => {
      filterShadow(el).setAttribute(name, val)
    })
  }
  attr$(name: string): (strings: TemplateStringsArray, ...keys: State<any>[]) => this {
    return (strings, ...keys) => this.$(_el => {
      const el = filterShadow(_el)
      const attr = document.createAttribute(name)
      el.setAttributeNode(attr)
      strings.forEach((str, i) => {
        const state = keys[i]
        attr.value += str
        if (!state) return
        const start = attr.value.length
        state.sub((next, prev) => {
          const left = attr.value.slice(0, start)
          const right = attr.value.slice(start + String(prev).length)
          attr.value = `${left}${next}${right}`
        })
      })
    })
  }
  text$(strings: TemplateStringsArray, ...keys: State<any>[]): this {
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
  mount(parent: Element | ShadowRoot): Element | ShadowRoot {
    if (this.name === 'fragment') {
      this.chain.forEach(m => apply(parent, m))
      return parent
    }
    const el = this.el = document.createElement(this.name)
    this.chain.forEach(m => apply(el, m))
    return parent.appendChild(el)
  }
}

const shorthand = (name: string) => (...effects: Effect[]) =>
  new MaryElement(name, effects)

export const div = shorthand('div')
export const fragment = shorthand('fragment')
