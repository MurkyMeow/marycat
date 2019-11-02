# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
function viewProfile(host: PipeFn<ShadowRoot>, {
  name = defAttr(''),
  photo = defAttr(''),
  age = defAttr(0),
}) {
  return host
  (img('.profile-photo')
    (attr('src', zip$`/${photo}`))
  )
  (div()
    (div('.profile-name')(name))
    (div('.profile-age')(age))
  )
  (button()(zip$`Add ${name} to friends`))
}
const profile = customElement('mary-profile', viewProfile)

mount(document.body,
  (profile.new()
    (profile.prop('name', 'Mary'))
    (profile.prop('age', 9))

    (profile.prop('age', '9')) // type error
    (profile.prop('aage', 9)) // type error
  )
)
```

## Typed Custom Events

```ts
type CounterDispatch =
  TypedDispatch<{ change: number }>

function viewCounter(host: PipeFn<ShadowRoot>, {
  count = defAttr(0),
}, dispatch: CounterDispatch) {
  count.sub(val => {
    host(dispatch('change', val))
    host(dispatch('change', val + '')) // type error
    host(dispatch('changeee', val)) // type error
  })
  return host
  (button(count)(on('click', () => count.v++)))
}

const counter = customElement('mary-counter', viewCounter)

counter.new()
  // typeof e => CustomEvent<number>
  (counter.on('change', e => e.detail))
  // error: number is not assignable to string 🎉
  (counter.on('change', e => document.title = e.detail))
```
