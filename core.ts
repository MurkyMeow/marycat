import { State } from './state'

type Middleware
  = string
  | number
  | boolean
  | State<any>
  | MaryElement
  | ((el: HTMLElement) => Node | void)

const getKey = (a: Middleware): any =>
  a instanceof MaryElement && a._key || a

export class MaryElement {
  el?: HTMLElement
  _key?: any

  constructor(
    public name: string,
    private chain: Middleware[],
  ) {}

  $(...args: Middleware[]): this {
    if (this.el) this.apply(args);
    else this.chain.push(...args)
    return this
  }
  key(val: string): this {
    this._key = val
    return this
  }
  style(
    prop: Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>,
    val: string
  ): this {
    return this.$(el => el.style.setProperty(<string>prop, val))
  }
  on(event: string, handler: (e: Event) => any): this {
    return this.$(el => el.addEventListener(event, handler))
  }
  attr(name: string, val: any): this {
    return this.$(el => el.setAttribute(name, val))
  }
  attr$(name: string): (strings: TemplateStringsArray, ...keys: State<any>[]) => this {
    return (strings, ...keys) => this.$(el => {
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
  private applyPlain(str: string): Node | undefined {
    const [prefix, rest] = [str[0], str.slice(1)]
    const el = this.el!
    switch (prefix) {
      case '.': el.classList.add(rest); break
      case '#': el.setAttribute('id', rest); break
      case '@': el.setAttribute('name', rest); break
      default: return el.appendChild(new Text(str))
    }
  }
  private applyObserved(state: State<Middleware | Middleware[]>): Node[] {
    const el = this.el!
    const hook = el.appendChild(new Comment(''))
    const nodes: Node[] = []
    const lookup = new Map<any, Node[]>()
    state.sub((val, prevVal) => {
      const next = ([] as Middleware[]).concat(val)
      const prev = ([] as Middleware[]).concat(prevVal)
      prev.forEach(x => {
        const key = getKey(x)
        if (next.find(y => key === getKey(y))) return
        const oldNodes = lookup.get(key)
        if (oldNodes) {
          lookup.delete(key)
          oldNodes.forEach(node => el.removeChild(node))
        }
      })
      let curr: Node = hook
      next.forEach(x => {
        const key = getKey(x)
        const nodes = lookup.get(key) ||
          this.apply(x).filter(_=>_) as Node[]
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
  apply(middleware: Middleware | Middleware[]): (Node | undefined)[] {
    if (!this.el) {
      throw Error(`Cant apply a middleware to a not mounted element`)
    }
    if (middleware === null) return []
    if (Array.isArray(middleware)) {
      const res: (Node | undefined)[] = []
      return res.concat(...middleware.map(m => this.apply(m)))
    }
    if (middleware instanceof MaryElement) {
      return [middleware.mount(this.el)]
    }
    if (middleware instanceof State) {
      return this.applyObserved(middleware)
    }
    switch (typeof middleware) {
      case 'number': return [
        this.el.appendChild(new Text(middleware.toString()))
      ]
      case 'boolean':
        return []
      case 'string':
        return [this.applyPlain(middleware)]
      case 'function':
        return [middleware(this.el) || undefined]
      default:
        console.trace('Unexpected child:', middleware)
        return []
    }
  }
  mount(parent: Element): HTMLElement {
    this.el = document.createElement(this.name)
    this.chain.forEach(m => this.apply(m))
    return parent.appendChild(this.el)
  }
}

const shorthand = (name: string) => (...args: Middleware[]) =>
  new MaryElement(name, args)

export const div = shorthand('div')
