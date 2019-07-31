import { el } from './core.js'

export const form = el('form', {
  bind(state) {
    state.v = state.v || {}
    this.input(e => {
      state.v[e.target.getAttrute('name')] = e.target.value
    })
    this($el => state.sub(next => {
      const $inputs = [...$el] // yes, the form can be spread like this
      $inputs.forEach(x => x.value = next[x.getAttrute('name')] || '')
    }))
    return this
  },
})

export const input = el('input', {
  _attrs: [
    'type', 'value',
    'placeholder', 'required',
    'autocomplete', 'autofocus',
    'disabled', 'readonly',
  ],
  bind(state) {
    this($el => state.sub(next => $el.value = next))
    this.input(e => state.v = e.target.value)
    return this
  },
})
