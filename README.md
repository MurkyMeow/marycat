# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
function renderProfile(host: VirtualNodeFn, {
  name = defAttr(''),
  photo = defAttr(''),
  age = defAttr(0),
}) {
  return host
  (img('.profile-photo')
    (attr('src', zip$`/${photo}`))
  )
  (div()
    (div('profile-name')(name))
    (div('profile-age')(age))
  )
  (button()(zip$`Add ${name} to friends`))
}
const profile = customElement('mary-profile', renderProfile)

mount(document.body,
  (profile.new()
    (profile.prop('name', 'Mary'))
    (profile.prop('age', 9))
    (profile.prop('age', '9')) // type error 🎉
    (profile.prop('aage', 9)) // type error 🎉
  )
)
```
