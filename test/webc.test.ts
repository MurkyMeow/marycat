import { assert } from 'chai'
import { State, defAttr, customElement, PipeFn, mount } from '../src/index'
import { div } from '../examples/bindings'

describe('webc', function() {
  function renderTest(host: PipeFn<ShadowRoot>, {
    p1 = defAttr(false),
    p2 = defAttr(''),
    p3 = defAttr({ name: '' }),
  }): PipeFn<ShadowRoot> {
    return host
    (div()(p1.string))
    (div()(p2))
    (div()(p3._.name))
  }
  const test = customElement('mary-test', renderTest)

  const instance = test.new()
  const [el] = mount(document.head, instance)
  const [p1, p2, p3] = el.root.children

  it('create web component', function() {
    assert.ok(
      customElements.get('mary-test'), 'The component is not registered'
    )
    assert.strictEqual(
      el.root.children.length, 3, 'Not all children are rendered'
    )
  })

  it('set props', async function() {
    instance
      (test.prop('p1', true))
      (test.prop('p2', 'hello'))
      (test.prop('p3', { name: 'Mary' }))
    // MutationObserver appears to be asynchronous
    await new Promise(_ => requestAnimationFrame(_))
    assert.strictEqual(p1.textContent, 'true')
    assert.strictEqual(p2.textContent, 'hello')
    assert.strictEqual(p3.textContent, 'Mary')
  })

  it('respond to prop updates', async function() {
    el.removeAttribute('p1')
    el.setAttribute('p2', 'world')
    await new Promise(_ => requestAnimationFrame(_))
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
