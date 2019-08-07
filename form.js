import { el } from './core.js'

export const form = el('form', {
  bind(state) {
    state.v = state.v || {}
    this.input(e => {
      state.v[e.target.getAttribute('name')] = e.target.value
    })
    this($el => {
      requestAnimationFrame(() => { // wait until all the inputs are mounted
        state.sub(next => {
          const $inputs = [...$el] // yes, the form can be spread like this
          $inputs.forEach(x => x.value = next[x.getAttribute('name')] || '')
        })
      })
    })
    return this
  },
})

export const input = el('input', {
  attrs: [
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
  validity(state) {
    this($el => state.sub(v => $el.setCustomValidity(v || '')))
    return this
  },
})
