import { State, get } from '../state.js'

describe('state', function() {
  it('ensures state callbacks are called', function() {
    const state = new State(25)
    const values = []
    state.sub(v => values[0] = v)
    state.sub(v => values[1] = v)
    assert(values.every(x => x === 25), 'Initial value is not applied')
    state.v = 'foo'
    assert(values.every(x => x === 'foo'), 'Value updates are not applied')
  })

  it('checks if `after` works', function() {
    const state = new State('xxx')
    const len = state.after(v => v.length)
    assert(len.v === 3)
    state.v = 'xxxxx'
    assert(len.v === 5, 'State updates are not captured')
  })

  it('ensures `get` works properly', function() {
    const state = new State('foo')
    const state2 = new State('bar')
    const $node = mount(
      div(get`state=${state};state2=${state2}`)
    )
    assert(
      $node.textContent === 'state=foo;state2=bar',
      'Initial values are not applied'
    )
    state.v = 'baz'
    state2.v = 'qux'
    assert(
      $node.textContent === 'state=baz;state2=qux',
      'State updates are not applied'
    )
  })

  it('checks if logical operators are working', function() {
    const a = new State(true)
    const b = new State(false)
    const or = a.or(b)
    const and = a.and(b)
    assert(or.v === true, 'OR is doing a wrong thing')
    assert(and.v === false, 'AND is doing a wrong thing')
  })

  it('checks if comparators work with primitives', function() {
    const state = new State(25)

    assert(state.gt(10).v === true)
    assert(state.gt(25).v === false)

    assert(state.lt(30).v === true)
    assert(state.lt(25).v === false)

    assert(state.ge(30).v === false)
    assert(state.ge(25).v === true)

    assert(state.le(10).v === false)
    assert(state.le(25).v === true)

    assert(state.eq(25).v === true)
    assert(state.eq('abcd').v === false)
  })

  it('checks if comparators work with states', function() {
    const a = new State(25)
    const b = new State(10)

    assert(a.gt(b).v === true)
    assert(a.lt(b).v === false)

    assert(b.gt(a).v === false)
    assert(b.lt(a).v === true)

    a.v = 5
    assert(a.gt(b).v === false)
    assert(a.lt(b).v === true)

    assert(b.gt(a).v === true)
    assert(b.lt(a).v === false)
  })
})
