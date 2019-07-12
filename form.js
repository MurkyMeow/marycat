import { el } from './core.js'

export const form = el('form', {
  _events: ['submit'],
  bind(state) {
    state.v = state.v || {}
    this.on('input', e => state.v[e.target.name] = e.target.value)
    this($el => state.sub(next => {
      const $inputs = [...$el]
      $inputs.forEach(x => x.value = next[x.name] || '')
    }))
    return this
  },
})

export const input = el('input', {
  _events: ['input'],
  _attrs: ['type', 'value', 'placeholder'],
  bind(state) {
    this($el => {
      state.sub(next => $el.value = next)
      this.input(() => state.v = $el.value)
    })
    return this
  },
})
