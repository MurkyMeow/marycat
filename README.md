# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
function renderProfile(host: VirtualNodeFn, {
  name = Attr(''),
  photo = Attr(''),
  age = Attr(0),
}) {
  return host
  (img('.profile-photo').attr('src', zip$`/${photo}`))
  (div()
    (div('profile-name')(name))
    (div('profile-age')(age))
  )
  (button()(zip$`Add ${name} to friends`))
}
const profile = customElement('mary-profile', renderProfile)

profile()
  .prop('name', 'Mary')
  .prop('age', 9)
  .prop('age', '9') // type error 🎉
  .prop('aage', 9) // type error 🎉
  .mount(document.body)
```
