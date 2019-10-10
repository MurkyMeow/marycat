# Marycat

Web components that are

- functional
- truly reactive
- strongly typed

```ts
function render(
  host: MaryElement,
  name: State<string> = Attr('name', String),
  age: State<number> = Attr('age', Number),
) {
  return host.$(
    div().text`Name - ${name}, age - ${age}`
  )
}

const profile = customElement('mary-profile', render)

profile()
  .prop('name', 'Mary')
  .prop('age', 9)
  .prop('age', '9') // type error 🎉
  .prop('aage', 9) // type error 🎊
  .mount(document.body)
```
