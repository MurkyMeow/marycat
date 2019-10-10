import test from 'tape'
import { State, div, h1 } from '../index'

test('notify state subscribers', assert => {
  assert.plan(2)
  const state = new State(25)
  const values: number[] = []
  state.sub(v => values[0] = v)
  state.sub(v => values[1] = v)
  assert.isEquivalent(values, [25, 25])
  state.v = 9
  assert.isEquivalent(values, [9, 9])
})

test('make derivation', assert => {
  assert.plan(2)
  const state = new State('xx')
  const len = state.map(x => x.length)
  assert.equal(len.v, state.v.length)
  state.v = 'xxxx'
  assert.equal(len.v, state.v.length)
})

test('mount a stateful element', assert => {
  assert.plan(2)
  const state = new State(div())
  const el = div()
    .$(state)
    .mount(document.head)
  assert.equal(el.firstChild && el.firstChild.nodeName, 'DIV')
  state.v = h1()
  assert.equal(el.firstChild && el.firstChild.nodeName, 'H1')
})

test('set a reactive attribute', assert => {
  assert.plan(2)
  const state = new State('foo')
  const el = <Element>div()
    .attr$('class')`__${state}__`
    .mount(document.head)
  assert.equal(el.className, '__foo__')
  state.v = 'bar'
  assert.equal(el.className, '__bar__')
})

test('logical operators', assert => {
  assert.plan(2)
  const first = new State(true)
  const second = new State(false)
  assert.equal(first.or(second).v, first.v || second.v, 'OR not working')
  assert.equal(first.and(second).v, first.v && second.v, 'AND not working')
})

test('compare to primitive', assert => {
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
  assert.end()
})

test('compare to other state', assert => {
  const first = new State(25)
  const second = new State(10)
  assert.equal(first.gt(second).v, first.v > second.v)
  assert.equal(first.lt(second).v, first.v < second.v)
  assert.equal(first.eq(second).v, first.v === second.v)
  assert.end()
})

test('primitive property reference', assert => {
  assert.plan(2)
  const state = new State({ foo: 1 })
  const foo = state._('foo')
  assert.equal(foo.v, state.v.foo)
  foo.v = 123
  assert.equal(foo.v, state.v.foo)
})

test('stateful property reference', assert => {
  assert.plan(2)
  const state = new State({ foo: 1, bar: 2 })
  const key = new State('foo') as State<'foo' | 'bar'>
  const ref = state._(key)
  assert.equal(ref.v, state.v[key.v])
  key.v = 'bar'
  assert.equal(ref.v, state.v[key.v])
})

test('conditional rendering', assert => {
  assert.plan(4)
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

test('keyed array rendering', assert => {
  const items = new State(['a', 'b', 'c'])
  const el = div()
    .$(items.map(arr =>
      arr.map(x => div(x))
    ))
    .mount(document.head)
  const check = (msg?: string) => items.v.forEach((item, i) => {
    assert.equal(el.children[i].textContent, item, msg)
  })
  check()
  items.v = [...items.v].reverse()
  check('reversed array rendered incorrectly')
  items.v = items.v.filter((_, i) => i !== 1)
  check('removing an item causes problems')
  items.v = [...items.v, 'd', 'e']
  check('adding items causes problems')
  assert.end()
})
