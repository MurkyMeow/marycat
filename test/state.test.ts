import { assert } from 'chai'
import { State, div, h1 } from '../index'

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

  it('observe an element', function() {
    const state = new State(div())
    const el = div()
      .$(state)
      .mount(document.head)
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'DIV')
    state.v = h1()
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'H1')
  })

  it('set a reactive attribute', function() {
    const state = new State('foo')
    const el = <Element>div()
      .attr$('class')`__${state}__`
      .mount(document.head)
    assert.strictEqual(el.className, '__foo__')
    state.v = 'bar'
    assert.strictEqual(el.className, '__bar__')
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
      .$(cond.and([
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
        div().text`${i.string} - ${x}`
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
