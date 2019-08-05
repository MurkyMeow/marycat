import { State, get } from '../state.js'

describe('state', function() {
  it('notifies state subscribers', function() {
    const state = new State(25)
    const values = []
    state.sub(v => values[0] = v)
    state.sub(v => values[1] = v)
    expect(values).to.have.members([25, 25])
    state.v = 'foo'
    expect(values).to.have.members(['foo', 'foo'])
  })

  it('makes derivation', function() {
    const state = new State('xxx')
    const len = state.after(v => v.length)
    expect(len.v).to.equal(3)
    state.v = 'xxxxx'
    expect(len.v).to.equal(5)
  })

  describe('get', function() {
    const state = new State('foo')
    const state2 = new State('bar')
    const $node = mount(
      div(get`state=${state};state2=${state2}`)
    )
    it('applies initial values', function() {
      expect($node.textContent).to.equal('state=foo;state2=bar')
    })
    it('applies state changes', function() {
      state.v = 'baz'
      expect($node.textContent).to.equal('state=baz;state2=bar')
      state2.v = 'qux'
      expect($node.textContent).to.equal('state=baz;state2=qux')
    })
  })

  describe('logical', function() {
    const first = new State(true)
    const second = new State(false)
    it('or', function() {
      expect(first.or(second).v).to.equal(first.v || second.v)
    })
    it('and', function() {
      expect(first.and(second).v).to.equal(first.v && second.v)
    })
  })

  describe('primitive comparators', function() {
    const state = new State(25)
    it('gt', function() {
      expect(state.gt(10).v).to.equal(state.v > 10)
      expect(state.gt(25).v).to.equal(state.v > 25)
    })
    it('lt', function() {
      expect(state.lt(30).v).to.equal(state.v < 30)
      expect(state.lt(25).v).to.equal(state.v < 25)
    })
    it('ge', function() {
      expect(state.ge(30).v).to.equal(state.v >= 30)
      expect(state.ge(25).v).to.equal(state.v >= 25)
    })
    it('le', function() {
      expect(state.le(10).v).to.equal(state.v <= 10)
      expect(state.le(25).v).to.equal(state.v <= 25)
    })
    it('eq', function() {
      expect(state.eq(25).v).to.equal(state.v === 25)
      expect(state.eq('abcd').v).to.equal(state.v === 'abcd')
    })
  })

  describe('state comparators', function() {
    const first = new State(25)
    const second = new State(10)
    it('compares two states', function() {
      expect(first.gt(second).v).to.equal(first.v > second.v)
      expect(first.lt(second).v).to.equal(first.v < second.v)
      expect(first.eq(second).v).to.equal(first.v === second.v)
    })
  })
})
describe('wrapped state', function() {
  describe('flat', function() {
    const state = new State({ foo: 1, bar: 2 }).wrap()
    it('wraps fields', function() {
      expect(state.foo.v).to.equal(1)
      expect(state.bar.v).to.equal(2)
    })
    it('reassigns individual fields', function() {
      state.foo = 5
      state.bar = 10
      expect(state.foo.v).to.equal(5)
      expect(state.bar.v).to.equal(10)
    })
    it('reassigns the whole object', function() {
      state.v = { foo: 'h', bar: 'w' }
      expect(state.foo.v).to.equal('h')
      expect(state.bar.v).to.equal('w')
    })
  })
  describe('nested', function() {
    const state2 = new State({
      bar: { baz: 2 },
    })
    state2.wrap()
    it('wraps nested fields', function() {
      expect(state2.bar.baz.v).to.equal(2)
    })
    it('reassigns a nested field', function() {
      state2.bar.baz = 3
      expect(state2.bar.baz.v).to.equal(3)
    })
    it('reassigns a branch', function() {
      state2.bar = { baz: 4 }
      expect(state2.bar.baz.v).to.equal(4)
    })
  })
})
