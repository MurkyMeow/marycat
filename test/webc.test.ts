import { assert } from 'chai'
import * as m from '../src/index'
import * as d from '../src/dom'
import * as h from '../examples/bindings'

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

  const Test = m.customElement<Props, Events>('mary-test', ({ host, props }) => {
    return (
      host([d.on('click', e => e.currentTarget.emit('disturb', TEST_MESSAGE))],
        m.shadow([],
          h.div([d.text`${props.p1}`]),
          h.div([d.text`${props.p2}`]),
          h.div([d.text`${props.p3._.name}`]),
        )
      )
    )
  })

  const instance = Test({ p1: false, p2: '', p3: { name: '' } })

  it('create web component', function() {
    const el = instance()(document.head)
    assert.ok(customElements.get('mary-test'), 'The component is not registered')
    assert.strictEqual(el.renderRoot.children.length, 3, 'Not all children are rendered')
  })

  it('set props', async function() {
    const el = instance()(document.head)
    const [p1, p2, p3] = el.renderRoot.children

    const { props } = el
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
    const el = instance()(document.head)
    const [p1, p2] = el.renderRoot.children
    el.setAttribute('p1', 'false')
    el.setAttribute('p2', 'world')
    await new Promise(requestAnimationFrame)
    assert.strictEqual(p1.textContent, 'false')
    assert.strictEqual(p2.textContent, 'world')
  })

  it('listen to a custom event', function() {
    let text = ''
    const el = instance([
      d.on('disturb', e => text = e.detail),
    ])(document.head)
    el.click()
    assert.strictEqual(text, TEST_MESSAGE)
  })
})
