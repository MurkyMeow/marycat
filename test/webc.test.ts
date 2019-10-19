import { assert } from 'chai'
import { VirtualNodeFn, MaryElement, State, Attr, customElement, div } from '../src/index'

describe('webc', function() {
  function renderTest(host: VirtualNodeFn, {
    p1 = Attr(false),
    p2 = Attr(''),
    p3 = Attr({ name: '' }),
  }) {
    return host
    (div()(p1.string))
    (div()(p2))
    (div()(p3._.name))
  }
  const test = customElement('mary-test', renderTest)

  const instance = test()
  const el = <MaryElement>instance.mount(document.head)
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
      .prop('p1', true)
      .prop('p2', 'hello')
      .prop('p3', { name: 'Mary' })
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
    instance.prop('p2', state)
    assert.strictEqual(p2.textContent, state.v, 'Initial value is not set')
    state.v = 'qqqq'
    assert.strictEqual(p2.textContent, state.v, 'Updates are not captured')
  })
})
