import { assert } from 'chai'
import { mount, style, on, dispatch, cx, name, attrs, text } from '../src/index'
import { div } from '../examples/bindings'

describe('core', function() {
  it('mount an element', function() {
    const [el] = mount(document.head, div())
    assert.strictEqual(el.nodeName, 'DIV')
  })

  it('add middlewares', function() {
    const [el] = mount(document.head, div()
      ((el: HTMLDivElement) => el.setAttribute('hidden', 'true'))
      ((el: HTMLDivElement) => el.textContent = 'foo')
    )
    assert.strictEqual(el.getAttribute('hidden'), 'true')
    assert.strictEqual(el.textContent, 'foo')
  })

  it('append children', function() {
    const [el] = mount(document.head, div()
      (div())
      (div())
    )
    assert.strictEqual(el.children.length, 2)
  })

  it('set multiple attributes', function() {
    const obj = { id: 'foo', hidden: true, 'data-stuff': 1234 }
    const [el] = mount(document.head, div()
      (...attrs(obj))
    )
    Object.entries(obj).forEach(([key, val]) => {
      assert.strictEqual(el.getAttribute(key), val.toString())
    })
  })

  it('set common attributes with their shorthands', function() {
    const [el] = mount(document.head, div(name`baz`, cx`qux`))
    assert.strictEqual(el.getAttribute('name'), 'baz')
    assert.strictEqual(el.getAttribute('class'), 'qux')
  })

  it('set text', function() {
    const [el] = mount(document.head, div()(text`foobar`))
    assert.strictEqual(el.textContent, 'foobar')
  })

  it('set style properties', function() {
    const [el] = mount(document.body, div() 
      (style('color')`red`)
      (style('font-size')`12px`)
    )
    assert.strictEqual(el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register events', function() {
    let count = 0
    const [el] = mount(document.head, div()
      (on('click', () => count += 2))
      (on('click', () => count += 3))
    )
    el.click()
    assert.strictEqual(count, 5)
  })

  it('dispatch an event', function() {
    let catchedEvent: Event | undefined
    const child = div()
    mount(document.head, div()
      (child)
      (on('timeupdate', e => catchedEvent = e))
    )
    // FIXME this is so goofy
    child(dispatch('timeupdate', new Event('timeupdate'), { bubbles: true }))
    assert.strictEqual(catchedEvent?.type, 'timeupdate')
  })
})
