import { State } from '../state.js'

describe('mount', function() {
  it('renders different nodes', function() {
    const $node = mount(
      div()
        (h3())
        (button())
        (article())
    )
    const { children } = $node
    expect($node.tagName).to.equal('DIV')
    expect(children.length).to.equal(3)
    expect(children[0].tagName).to.equal('H3')
    expect(children[1].tagName).to.equal('BUTTON')
    expect(children[2].tagName).to.equal('ARTICLE')
  })

  it('appends class names', function() {
    const $node = mount(div('.c1', '.c2')('.c3')('.c4'))
    const { classList } = $node
    expect([...classList]).to.have.members(['c1', 'c2', 'c3', 'c4'])
  })
  it('sets id and name', function() {
    const $node = mount(div('#foo')('@bar'))
    expect($node.getAttribute('id')).to.equal('foo')
    expect($node.getAttribute('name')).to.equal('bar')
  })
  it('sets style rules', function() {
    const $node = mount(
      div().style('backgroundColor', 'red').style('fontSize', '12px')
    )
    expect($node.getAttribute('style'))
      .to.equal('background-color: red; font-size: 12px;')
  })
  it('registers click events', function() {
    let count = 0
    const $node = mount(
      div()
        .click(() => count += 2)
        .click(() => count += 3)
    )
    $node.click()
    expect(count).to.equal(5)
  })

  it('emits a custom event', function() {
    let catched
    const child = div()
    mount
      (div().on('custom-evt', e => catched = e)
        (child)
      )
    child.emit('custom-evt', 1234, { bubbles: true })
    expect(catched.type).to.equal('custom-evt')
    expect(catched.detail).to.equal(1234)
  })
})
describe('reactive mount', function() {
  const state = new State(div())
  let mounting

  it('mounts a state-wrapped element', function() {
    mounting = mount(state)
    expect(mounting[0]).to.have.property('tagName', 'DIV')
  })
  it('responds to a state change', function() {
    state.v = h3()
    expect(mounting[0]).to.have.property('tagName', 'H3')
  })
})
describe('reactive attribute', function() {
  const state = new State('foo')
  let $el

  it('sets a reactive attribute', function() {
    $el = mount(div().attr('data-test', state))
    expect($el.getAttribute('data-test')).to.equal(state.v)
  })
  it('responds to the attribute change', function() {
    state.v = 'bar'
    expect($el.getAttribute('data-test')).to.equal(state.v)
  })
})
