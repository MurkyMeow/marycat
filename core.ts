import { State } from './state'

type Middleware
  = string
  | number
  | boolean
  | ((el: HTMLElement) => any)

export class MaryElement {
  el?: HTMLElement;

  constructor(
    public name: string,
    private chain: Middleware[],
  ) {}

  $(...args: Middleware[]): this {
    if (this.el) this.apply(args);
    else this.chain.push(...args)
    return this
  }
  style(
    prop: Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>,
    val: string
  ): this {
    return this.$(el => el.style[prop] = val)
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
  private applyPlain(str: string): void {
    const [prefix, rest] = [str[0], str.slice(1)]
    const el = this.el!
    switch (prefix) {
      case '.': return el.classList.add(rest)
      case '#': return el.setAttribute('id', rest)
      case '@': return el.setAttribute('name', rest)
      default: el.appendChild(document.createTextNode(str))
    }
  }
  apply(middleware: Middleware | Middleware[]): void {
    if (!this.el) {
      throw Error(`Cant apply a middleware to a not mounted element`)
    }
    if (middleware === null) return
    if (Array.isArray(middleware)) {
      return middleware.forEach(m => this.apply(m))
    }
    if (middleware instanceof MaryElement) {
      return void middleware.mount(this.el)
    }
    // if (middleware instanceof State) {
    //   return this.observed(middleware)
    // }
    switch (typeof middleware) {
      case 'number':
      case 'boolean': return this.el.append(
        document.createTextNode(middleware.toString())
      )
      case 'string': return this.applyPlain(middleware)
      case 'function': return middleware(this.el)
      default: console.trace(`Unexpected child: ${middleware}`)
    }
  }
  mount(parent: Element): HTMLElement {
    this.el = document.createElement(this.name)
    this.chain.forEach(m => this.apply(m))
    return parent.appendChild(this.el)
  }
}

export const div = (...args: Middleware[]) => new MaryElement('div', args)
