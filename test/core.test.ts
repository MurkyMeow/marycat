import { assert } from 'chai'
import * as m from '../src/index'
import { div } from '../examples/bindings'

describe('core', function() {
  it('mount an element', function() {
    const el = div([])
    const $el = el(document.head)
    assert.strictEqual($el.nodeName, 'DIV')
  })

  it('add middlewares', function() {
    const el = div([
      el => el.setAttribute('hidden', 'true'),
      el => el.textContent = 'foo',
    ])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('hidden'), 'true')
    assert.strictEqual($el.textContent, 'foo')
  })

  it('append children', function() {
    const el = div([],
      div([]),
      div([]),
    )
    const $el = el(document.head)
    assert.strictEqual($el.children.length, 2)
  })

  it('set multiple attributes', function() {
    const obj = { id: 'foo', hidden: true, 'data-stuff': 1234 }
    const el = div(m.attrs(obj))
    const $el = el(document.head)
    Object.entries(obj).forEach(([key, val]) => {
      assert.strictEqual($el.getAttribute(key), val.toString())
    })
  })

  it('set common attributes with their shorthands', function() {
    const el = div([m.name`baz`, m.cx`qux`])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('name'), 'baz')
    assert.strictEqual($el.getAttribute('class'), 'qux')
  })

  it('set text', function() {
    const el = div([m.text`foobar`])
    const $el = el(document.head)
    assert.strictEqual($el.textContent, 'foobar')
  })

  it('set style properties', function() {
    const el = div([
      m.style('color')`red`,
      m.style('font-size')`12px`,
    ])
    const $el = el(document.head)
    assert.strictEqual($el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register events', function() {
    let count = 0
    const el = div([
      m.on('click', () => count += 2),
      m.on('click', () => count += 3),
    ])
    const $el = el(document.head)
    $el.click()
    assert.strictEqual(count, 5)
  })
})
