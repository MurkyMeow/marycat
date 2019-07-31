import { el } from './core.js'

export const form = el('form', {
  bind(state) {
    state.v = state.v || {}
    this.input(e => state.v[e.target.name] = e.target.value)
    this($el => state.sub(next => {
      const $inputs = [...$el]
      $inputs.forEach(x => x.value = next[x.name] || '')
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
