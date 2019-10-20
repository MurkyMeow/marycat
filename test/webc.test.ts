import { assert } from 'chai'
import { MaryElement, State, defAttr, customElement, _, PipeFn, mount } from '../src/index'
import { div } from '../examples/bindings'

describe('webc', function() {
  function renderTest(host: PipeFn, {
    p1 = defAttr(false),
    p2 = defAttr(''),
    p3 = defAttr({ name: '' }),
  }) {
    return host
    (div()(p1.string))
    (div()(p2))
    (div()(p3._.name))
  }
  const test = customElement('mary-test', renderTest)

  const instance = test.new()
  const el = <MaryElement>mount(document.head, instance)
  const [p1, p2, p3] = el.root.children

  it('create web component', function() {
    assert.ok(
      customElements.get('mary-test'), 'The component is not registered'
    )
    assert.strictEqual(
      el.root.children.length, 3, 'Not all children are rendered'
    )
  })

  it('set props', function() {
    instance
      (test.prop('p1', true))
      (test.prop('p2', 'hello'))
      (test.prop('p3', { name: 'Mary' }))
    assert.strictEqual(p1.textContent, 'true')
    assert.strictEqual(p2.textContent, 'hello')
    assert.strictEqual(p3.textContent, 'Mary')
  })

  it('respond to prop updates', function() {
    el.removeAttribute('p1')
    el.setAttribute('p2', 'world')
    assert.strictEqual(p1.textContent, 'false')
    assert.strictEqual(p2.textContent, 'world')
  })

  it('observe a prop', function() {
    const state = new State('zzz')
    instance(test.prop('p2', state))
    assert.strictEqual(p2.textContent, state.v, 'Initial value is not set')
    state.v = 'qqqq'
    assert.strictEqual(p2.textContent, state.v, 'Updates are not captured')
  })
})
