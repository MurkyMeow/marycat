import { assert } from 'chai'
import * as m from '../src/index'
import * as h from '../examples/bindings'

describe('core', function() {
  it('mount an element', function() {
    const el = h.div()
    const $el = el(document.head)
    assert.strictEqual($el.nodeName, 'DIV')
  })

  it('add middlewares', function() {
    const el = h.div([
      el => el.setAttribute('hidden', 'true'),
      el => el.textContent = 'foo',
    ])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('hidden'), 'true')
    assert.strictEqual($el.textContent, 'foo')
  })

  it('append children', function() {
    const el = h.div([],
      h.div(),
      h.div(),
    )
    const $el = el(document.head)
    assert.strictEqual($el.children.length, 2)
  })

  it('set multiple attributes', function() {
    const obj = { id: 'foo', hidden: true, 'data-stuff': 1234 }
    const el = h.div(m.attrs(obj))
    const $el = el(document.head)
    Object.entries(obj).forEach(([key, val]) => {
      assert.strictEqual($el.getAttribute(key), val.toString())
    })
  })

  it('set common attributes with their shorthands', function() {
    const el = h.div([m.name`baz`, m.cx`qux`])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('name'), 'baz')
    assert.strictEqual($el.getAttribute('class'), 'qux')
  })

  it('set text', function() {
    const el = h.div([m.text`foobar`])
    const $el = el(document.head)
    assert.strictEqual($el.textContent, 'foobar')
  })

  it('set style properties', function() {
    const el = h.div([
      m.style('color')`red`,
      m.style('font-size')`12px`,
    ])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register events', function() {
    let count = 0
    const el = h.div([
      m.on('click', () => count += 2),
      m.on('click', () => count += 3),
    ])
    el(document.head).click()
    assert.strictEqual(count, 5)
  })

  // no assertions here, just checking if it compiles
  it('subscribes to a bubbling event', function() {
    // `encrypted` is specific to the `audio` element
    // if i pull out this element it shouldn't compile
    h.div([m.on('encrypted', e => e.initData)],
      h.div([],
        h.audio(),
      ),
    )
  })
})
