import test from 'tape'
import { MaryComponent, Props, Attr, customElement, div } from '../index'

test('create web component', assert => {
  interface TestProps {
    p1: boolean
    p2: string
    p3: { name: string }
  }
  const test = customElement('mary-test', (host, {
    p1 = Attr('p1', Boolean),
    p2 = Attr('p2', String),
    p3 = Attr('p3'),
  }: Props<TestProps>) => {
    return host
    .$(div(p1))
    .$(div(p2))
    .$(div()
      .$(p3._('name'))
    )
  })
  const instance = test()
  const el = <MaryComponent>instance.mount(document.head)
  assert.ok(customElements.get('mary-test'), 'The component is not registered')
  assert.equal(el.children.length, 3, 'Not all children are rendered')
  const [p1, p2, p3] = el.root.children
  assert.test('set props', _assert => {
    _assert.plan(3)
    instance
      .prop('p1', true)
      .prop('p2', 'hello')
      .prop('p3', { name: 'Mary' })
    _assert.equal(p1.textContent, 'true')
    _assert.equal(p2.textContent, 'hello')
    _assert.equal(p3.textContent, 'Mary')
  })
  assert.test('respond to prop updates', _assert => {
    _assert.plan(2)
    el.setAttribute('p1', 'false')
    el.setAttribute('p2', 'world')
    _assert.equal(p1.textContent, 'false')
    _assert.equal(p2.textContent, 'world')
  })
})
