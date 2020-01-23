import { assert } from 'chai'
import { customElement, mount, on, dispatch, text } from '../src/index'
import { div } from '../examples/bindings'

describe('webc', function() {
  interface Props {
    p1: boolean
    p2: string
    p3: { name: string }
  }

  interface Events {
    disturb: CustomEvent<string>
  }

  const TEST_MESSAGE = 'you fail to amuse me'

  const Test = customElement<Props, Events>('mary-test', ({ host, props }) => {
    return host
    (on('click', () => host(dispatch('disturb', TEST_MESSAGE))))
    (div(text`${props.p1}`))
    (div(text`${props.p2}`))
    (div(text`${props.p3._.name}`))
  })

  const instance = Test({ p1: false, p2: '', p3: { name: '' } })
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
    const { props } = instance.__node
    props.p1.v = true
    props.p2.v = 'hello'
    props.p3.v = { name: 'Mary' }
    // MutationObserver appears to be asynchronous
    await new Promise(requestAnimationFrame)
    assert.strictEqual(p1.textContent, 'true')
    assert.strictEqual(p2.textContent, 'hello')
    assert.strictEqual(p3.textContent, 'Mary')
  })

  it('respond to prop updates', async function() {
    el.setAttribute('p1', 'false')
    el.setAttribute('p2', 'world')
    await new Promise(requestAnimationFrame)
    assert.strictEqual(p1.textContent, 'false')
    assert.strictEqual(p2.textContent, 'world')
  })

  it('listen to a custom event', function() {
    let text = ''
    instance(on('disturb', e => text = e.detail))
    el.click()
    assert.strictEqual(text, TEST_MESSAGE)
  })
})
