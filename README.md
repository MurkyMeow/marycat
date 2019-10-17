# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
function renderProfile(host: VirtualNode, {
  name = Attr(''),
  age = Attr(0),
}) {
  return host.$(
    div().text`Name - ${name}, age - ${age}`
  )
}
const profile = customElement('mary-profile', renderProfile)

profile()
  .prop('name', 'Mary')
  .prop('age', 9)
  .prop('age', '9') // type error 🎉
  .prop('aage', 9) // type error 🎉
  .mount(document.body)
```
