# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
interface ProfileProps {
  name: string
  age: string
}
function render(host, {
  name = Attr(String),
  age = Attr(Number),
}: Props<ProfileProps>) {
  return host.$(
    div().text`Name - ${name}, age - ${age}`
  )
}

const profile = customElement('mary-profile', render)

profile()
  .prop('name', 'Mary')
  .prop('age', 9)
  .prop('age', '9') // type error 🎉
  .prop('aage', 9) // type error 🎉
  .mount(document.body)
```
