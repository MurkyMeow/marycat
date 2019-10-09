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
  return host.$(div().text`Name - ${name}, age - ${age}`)
}

const profile = customElement('mary-profile', {
  observed: ['name', 'age'], render,
})

profile()
  .attr('name', 'Mary') // TODO make this <<strongly typed>>
  .attr('age', 9)
  .mount(document.body)
```
