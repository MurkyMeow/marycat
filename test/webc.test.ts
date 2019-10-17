import { assert } from 'chai'
import { VirtualNode, MaryElement, Attr, customElement, div } from '../src/index'

describe('webc', function() {
  function renderTest(host: VirtualNode, {
    p1 = Attr(false),
    p2 = Attr(''),
    p3 = Attr({ name: '' }),
  }) {
    return host
    .$(div(p1.string))
    .$(div(p2))
    .$(div().$(p3._.name))
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
})
