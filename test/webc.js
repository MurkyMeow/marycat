import { get, webc, assert } from '../index.js'

describe('webc', function() {
  const comp = webc({
    name: 'mary-test',
    props: { p1: false, p2: '' },
    fun: (h, { p1, p2 }) => (h
      (span(get`${p1}`))
      (span(get`${p2}`))
    ),
  })
  const instance = comp().p1(true).p2('hello')
  const $el = mount(instance)
  const [p1, p2] = $el.shadowRoot.children
  it('checks if component is registered', function() {
    assert(customElements.get('mary-test'), 'The component is not registered')
  })
  it('checks if children are mounted', function() {
    assert($el.shadowRoot.children.length === 2)
  })
  it('checks if props are set', function() {
    assert(p1.textContent === 'true')
    assert(p2.textContent === 'hello')
  })
  it('checks if prop updates are applied', function() {
    $el.setAttribute('p1', 'false')
    $el.setAttribute('p2', 'world')
    assert(p1.textContent === 'false')
    assert(p2.textContent === 'world')
  })
  // Do i need this?
  it.skip('checks if props can be updated with methods', function() {
    instance.p1('foobar')
    assert(p1.textContent === 'foobar')
  })
})
