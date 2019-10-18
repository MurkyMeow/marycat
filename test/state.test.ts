import { assert } from 'chai'
import { State, div, h1, zipTemplate } from '../src/index'

describe('state', function() {
  it('notify state subscribers', function() {
    const state = new State(25)
    const values: number[] = []
    state.sub(v => values[0] = v)
    state.sub(v => values[1] = v)
    assert.includeMembers(values, [25, 25])
    state.v = 9
    assert.includeMembers(values, [9, 9])
  })

  it('make derivation', function() {
    const state = new State('xx')
    const len = state.map(x => x.length)
    assert.strictEqual(len.v, state.v.length)
    state.v = 'xxxx'
    assert.strictEqual(len.v, state.v.length)
  })

  it('make template derivation', function() {
    const state1 = new State('foo')
    const state2 = new State('bar')
    const template = zipTemplate`__${state1}-${state2}__`
    assert.strictEqual(template.v, `__foo-bar__`)
    state1.v = 'qux'
    assert.strictEqual(template.v, `__qux-bar__`)
    state2.v = 'qwer'
    assert.strictEqual(template.v, `__qux-qwer__`)
  })

  it('observe an element', function() {
    const state = new State(div())
    const el = div(state)
      .mount(document.head)
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'DIV')
    state.v = h1()
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'H1')
  })

  it('set a reactive attribute', function() {
    const state = new State('foo')
    const el = <Element>div()
      .attr('class', state)
      .mount(document.head)
    assert.strictEqual(el.className, 'foo')
    state.v = 'bar'
    assert.strictEqual(el.className, 'bar')
  })

  it('set a reactive attribute with template', function() {
    const state = new State('active')
    const el = <Element>div()
      .attr('class', zipTemplate`type--${state}`)
      .mount(document.head)
    assert.strictEqual(el.className, 'type--active')
    state.v = 'disabled'
    assert.strictEqual(el.className, 'type--disabled')
  })

  it('set a reactive style rule', function() {
    const state = new State('red')
    const el = <HTMLElement>div()
      .style('color', state)
      .mount(document.head)
    assert.strictEqual(el.style.color, state.v)
    state.v = 'green'
    assert.strictEqual(el.style.color, state.v)
  })

  it('logical operators', function() {
    const first = new State(true)
    const second = new State(false)
    assert.strictEqual(first.or(second).v, first.v || second.v, 'OR is not working')
    assert.strictEqual(first.and(second).v, first.v && second.v, 'AND is not working')
  })

  it('compare to primitive', function() {
    const state = new State(25)

    assert.strictEqual(state.gt(10).v, state.v > 10)
    assert.strictEqual(state.gt(25).v, state.v > 25)

    assert.strictEqual(state.lt(30).v, state.v < 30)
    assert.strictEqual(state.lt(25).v, state.v < 25)

    assert.strictEqual(state.ge(30).v, state.v >= 30)
    assert.strictEqual(state.ge(25).v, state.v >= 25)

    assert.strictEqual(state.le(10).v, state.v <= 10)
    assert.strictEqual(state.le(25).v, state.v <= 25)

    assert.strictEqual(state.eq(25).v, state.v === 25)
    assert.strictEqual(state.eq(0).v, state.v === 0)
  })

  it('compare to other state', function() {
    const first = new State(25)
    const second = new State(10)
    assert.strictEqual(first.gt(second).v, first.v > second.v)
    assert.strictEqual(first.lt(second).v, first.v < second.v)
    assert.strictEqual(first.eq(second).v, first.v === second.v)
  })

  it('field reference', function() {
    const state = new State({ foo: 1 })
    const foo = state._.foo
    assert.strictEqual(foo.v, state.v.foo)
    state.v = { foo: 123 }
    assert.strictEqual(foo.v, state.v.foo)
  })

  it('conditional rendering', function() {
    const cond = new State(true)
    const el = div()
      (cond.and([
        div('then'),
        div('then2'),
      ]).or(
        div('else')
      ))
      .mount(document.head)
    assert.strictEqual(el.children.length, 2)
    assert.strictEqual(el.children[0].textContent, 'then')
    assert.strictEqual(el.children[1].textContent, 'then2')
    cond.v = false
    assert.strictEqual(el.children[0].textContent, 'else')
  })

  it('keyed array rendering', function() {
    const items = new State(['a', 'b', 'c'])
    const el = div()
      .repeat(items, x => x, (x, i) =>
        div().text$`${i.string} - ${x}`
      )
      .mount(document.head)
    const check = (msg?: string) => items.v.forEach((item, i) => {
      assert.strictEqual(el.children[i].textContent, `${i} - ${item}`, msg)
    })
    check()
    items.v = [...items.v].reverse()
    check('reversing the order not working')
    items.v = items.v.filter((_, i) => i !== 1)
    check('removing an item not working')
    items.v = [...items.v, 'd', 'e']
    check('adding items not working')
  })
})
