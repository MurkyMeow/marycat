import { webc } from '../index.js'

describe('webc', function() {
  const comp = webc({
    name: 'mary-test',
    props: {
      p1: false,
      p2: '',
      p3: [],
    },
    render: (h, { p1, p2, p3 }) => (h
      (span(p1))
      (span(p2))
      (span(p3))
    ),
  })
  const instance = comp().p1(true).p2('hello').p3([1, 2, 3])
  const $el = mount(instance)
  const [p1, p2, p3] = $el.shadowRoot.children
  it('was registered', function() {
    expect(customElements.get('mary-test')).to.exist
  })
  it('rendered its children', function() {
    expect($el.shadowRoot.children).to.have.lengthOf(3)
  })
  it('has initial props applied', function() {
    expect(p1.textContent).to.equal('true')
    expect(p2.textContent).to.equal('hello')
    expect(p3.textContent).to.equal('123')
  })
  it('responds to prop updates', function() {
    $el.setAttribute('p1', 'false')
    $el.setAttribute('p2', 'world')
    $el.p3 = [3, 2, 1]
    expect(p1.textContent).to.equal('false')
    expect(p2.textContent).to.equal('world')
    expect(p3.textContent).to.equal('321')
  })
  // Do i need this?
  it.skip('updates props via instance methods', function() {
    instance.p1('foobar')
    expect(p1.textContent).to.equal('foobar')
  })
})
