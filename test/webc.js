import { get, webc, assert } from '../index.js'

describe('webc', function() {
  const comp = webc({
    name: 'mary-test',
    props: {
      p1: false,
      p2: '',
      p3: [],
    },
    fun: (h, { p1, p2, p3 }) => (h
      (span(p1))
      (span(p2))
      (span(p3))
    ),
  })
  const instance = comp().p1(true).p2('hello').p3([1, 2, 3])
  const $el = mount(instance)
  const [p1, p2, p3] = $el.shadowRoot.children
  it('checks if component is registered', function() {
    assert(customElements.get('mary-test'), 'The component is not registered')
  })
  it('checks if children are mounted', function() {
    assert($el.shadowRoot.children.length === 3)
  })
  it('checks if props are set', function() {
    assert(p1.textContent === 'true')
    assert(p2.textContent === 'hello')
    assert(p3.textContent === '123')
  })
  it('checks if prop updates are applied', function() {
    $el.setAttribute('p1', 'false')
    $el.setAttribute('p2', 'world')
    $el.p3 = [3, 2, 1]
    assert(p1.textContent === 'false')
    assert(p2.textContent === 'world')
    assert(p3.textContent === '321')
  })
  // Do i need this?
  it.skip('checks if props can be updated with methods', function() {
    instance.p1('foobar')
    assert(p1.textContent === 'foobar')
  })
})
