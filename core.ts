import { State } from './state'

type Middleware
  = string
  | number
  | boolean
  | ((el: HTMLElement) => any)

export class MaryElement {
  private el?: HTMLElement;

  constructor(
    public name: string,
    private chain: Middleware[],
  ) {}

  $(...args: Middleware[]): this {
    this.chain.push(...args)
    return this
  }
  on(event: string, handler: (e: Event) => any): this {
    return this.$(el => el.addEventListener(event, handler))
  }
  attr(name: string, val: any): this {
    return this.$(el => el.setAttribute(name, val))
  }
  style(
    prop: Exclude<keyof CSSStyleDeclaration, 'length' | 'parentRule'>,
    val: string
  ): this {
    return this.$(el => el.style[prop] = val)
  }
  // private observed(state: State<MaryElement>) {
  //   const nodes = [this.applyPlain('')]
  //   state.sub(next => {
  //     // keep the first element to insert nodes after it
  //     while (nodes.length > 1) nodes.pop()!.remove()
  //     const nextNodes = [].concat(this.apply(next))
  //     nextNodes.forEach((node, i) => {
  //       const previous = nextNodes[i - 1] || nodes.pop()
  //       previous.after(node)
  //       nodes.push(node)
  //       if (i === 0) previous.remove()
  //     })
  //   })
  // }
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
  apply(middleware: Middleware): void {
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
