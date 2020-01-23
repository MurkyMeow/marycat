import { assert } from 'chai'
import { State, zip$, mount, attr, style, repeat, watch, text } from '../src/index'
import { div, h3 } from '../examples/bindings'

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

  it('make a derivation', function() {
    const state = new State('xx')
    const len = state.map(x => x.length)
    assert.strictEqual(len.v, state.v.length)
    state.v = 'xxxx'
    assert.strictEqual(len.v, state.v.length)
  })

  it('make a template derivation', function() {
    const state1 = new State('foo')
    const state2 = new State('bar')
    const plain = '>>'
    const template = zip$`__${state1}-${state2}${plain}`
    assert.strictEqual(template.v, `__foo-bar>>`)
    state1.v = 'qux'
    assert.strictEqual(template.v, `__qux-bar>>`)
    state2.v = 'qwer'
    assert.strictEqual(template.v, `__qux-qwer>>`)
  })

  it('observe an element', function() {
    const state = new State(div())
    const [el] = mount(document.head, div(watch(state)))
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'DIV')
    state.v = h3()
    assert.strictEqual(el.firstElementChild && el.firstElementChild.nodeName, 'H3')
  })

  it('set a reactive attribute', function() {
    const state = new State('foo')
    const [el] = mount(document.head, div()
      (attr('class')`${state}`)
    )
    assert.strictEqual(el.className, 'foo')
    state.v = 'bar'
    assert.strictEqual(el.className, 'bar')
  })

  it('set a reactive attribute with template', function() {
    const state = new State('active')
    const [el] = mount(document.head, div()
      (attr('class')`type--${state}`)
    )
    assert.strictEqual(el.className, 'type--active')
    state.v = 'disabled'
    assert.strictEqual(el.className, 'type--disabled')
  })

  it('set a reactive style rule', function() {
    const state = new State('red')
    const [el] = mount(document.head, div()
      (style('color')`${state}`)
    )
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
    const [el] = mount(document.head,
      (div()
        (watch(cond.map(v => v ? [
          div(text`then`),
          div(text`then2`),
        ] : [
          div(text`else`),
        ])))
      )
    )
    assert.strictEqual(el.children.length, 2)
    assert.strictEqual(el.children[0].textContent, 'then')
    assert.strictEqual(el.children[1].textContent, 'then2')
    cond.v = false
    assert.strictEqual(el.children.length, 1)
    assert.strictEqual(el.children[0].textContent, 'else')
  })

  it('keyed array rendering', function() {
    const items = new State(['a', 'b', 'c'])
    const [el] = mount(document.head, div()
      (repeat(items, x => x, (x, i) =>
        div()(text`${i.string} - ${x}`)
      ))
    )
    const check = (msg?: string): void => items.v.forEach((item, i) => {
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
