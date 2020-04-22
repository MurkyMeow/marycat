# Marycat

Web components that are

- functional
- strongly typed
- truly reactive (render function is called only once)

```ts
interface Props {
  name: string
  photo: string
  age: number
}

const Profile = customElement<Props>('mary-profile', ({ host, props }) => {
  return host
  (img(cx`profile-photo`)
    (attr('src')`/${props.photo}`))
  )
  (div()
    (div(cx`profile-name`)(text`${props.name}`))
    (div(cx`profile-age`)(text`${props.age}`))
  )
  (button(text`Add ${props.name} to friends`))
})

const Profile = customElement<Props>('mary-profile', ({ host, props }) => {
  return host(
  img(cx`profile-photo`, attr('src')`/${props.photo}`),
  div(
    div(cx`profile-name`, text`${props.name}`),
    div(cx`profile-name`, text`${props.name}`),
  ),
  button(text`Add ${props.name} to friends`),
})

mount(document.body, (
  Profile({ name: 'Mary', age: 9 })
))
```

## Typed Custom Events

```ts
interface Props {
  count: number
}
interface Events {
  change: CustomEvent<number>
}

const Counter = customElement<Props, Events>('mary-counter', ({ host, props }) => {
  const handleClick = () => {
    host(dispatch('change', props.count.v + 1))
    host(dispatch('change', props.count.v + '')) // type error
    host(dispatch('changee', props.count.v + 1)) // type error
  }
  return host
  (button(text`${props.count}`)
    (on('click', handleClick))
  )
})

Counter({ count: 0 })
  // error: number is not assignable to string 🎉
  (on('change', e => document.title = e.detail))
```

### But that's not all!

```ts
const app = (
div()
  (div()
    (Counter({ count: 0 }))
  )
)

app
  // The right types are inferred even when the event listener
  // is defined on the component's parent
  (on('change', e => console.log(e.detail + 123)))

  // e.currentTarget is inferred as HTMLDivElement 🎉
  (on('load', e => e.currentTarget))
```
