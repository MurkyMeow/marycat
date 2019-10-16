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
    assert.equal(len.v, state.v.length)
    state.v = 'xxxx'
    assert.equal(len.v, state.v.length)
  })

  it('mount a stateful element', function() {
    const state = new State(div())
    const el = div()
      .$(state)
      .mount(document.head)
    assert.equal(el.firstChild && el.firstChild.nodeName, 'DIV')
    state.v = h1()
    assert.equal(el.firstChild && el.firstChild.nodeName, 'H1')
  })

  it('set a reactive attribute', function() {
    const state = new State('foo')
    const el = <Element>div()
      .attr$('class')`__${state}__`
      .mount(document.head)
    assert.equal(el.className, '__foo__')
    state.v = 'bar'
    assert.equal(el.className, '__bar__')
  })

  it('logical operators', function() {
    const first = new State(true)
    const second = new State(false)
    assert.equal(first.or(second).v, first.v || second.v, 'OR is working')
    assert.equal(first.and(second).v, first.v && second.v, 'AND is working')
  })

  it('compare to primitive', function() {
    const state = new State(25)

    assert.equal(state.gt(10).v, state.v > 10)
    assert.equal(state.gt(25).v, state.v > 25)

    assert.equal(state.lt(30).v, state.v < 30)
    assert.equal(state.lt(25).v, state.v < 25)

    assert.equal(state.ge(30).v, state.v >= 30)
    assert.equal(state.ge(25).v, state.v >= 25)

    assert.equal(state.le(10).v, state.v <= 10)
    assert.equal(state.le(25).v, state.v <= 25)

    assert.equal(state.eq(25).v, state.v === 25)
    assert.equal(state.eq(0).v, state.v === 0)
  })

  it('compare to other state', function() {
    const first = new State(25)
    const second = new State(10)
    assert.equal(first.gt(second).v, first.v > second.v)
    assert.equal(first.lt(second).v, first.v < second.v)
    assert.equal(first.eq(second).v, first.v === second.v)
  })

  it('field reference', function() {
    const state = new State({ foo: 1 })
    const foo = state._.foo
    assert.equal(foo.v, state.v.foo)
    state.v = { foo: 123 }
    assert.equal(foo.v, state.v.foo)
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
    assert.equal(el.children.length, 2)
    assert.equal(el.children[0].textContent, 'then')
    assert.equal(el.children[1].textContent, 'then2')
    cond.v = false
    assert.equal(el.children[0].textContent, 'else')
  })

  it('keyed array rendering', function() {
    const items = new State(['a', 'b', 'c'])
    const el = div()
      .$(items.map(arr =>
        arr.map(x => div(x).key(x))
      ))
      .mount(document.head)
    const check = (msg?: string) => items.v.forEach((item, i) => {
      assert.equal(el.children[i].textContent, item, msg)
    })
    check()
    items.v = [...items.v].reverse()
    check('reversing the order works')
    items.v = items.v.filter((_, i) => i !== 1)
    check('removing an item works')
    items.v = [...items.v, 'd', 'e']
    check('adding items works')
  })
})
