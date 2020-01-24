import { id, cx, text, attr, frag, on, dispatch, State, repeat, pipeNode } from '../src/index'

import {
  a, button, div, footer, h1,
  header, input, p, section, strong,
  label, ul, li, span,
} from './bindings'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface TodoEvents {
  setCompleted: CustomEvent<boolean>
  setText: CustomEvent<string>
  destroy: CustomEvent<void>
}

function viewTodo(todo: State<Todo>) {
  const editing = new State(false)

  const host = pipeNode<HTMLLIElement, TodoEvents>(document.createElement('li'))

  return host(cx`${todo._.completed.map(v => v ? 'completed' : '' as string)}`)
  (div(cx`view`)
    (input(cx`toggle`, attr('type')`checkbox`)
      (attr('checked')`${todo._.completed}`)
      (on('change', e => host(dispatch('setCompleted', e.currentTarget.checked))))
    )
    (label(text`${todo._.text}`)
      (on('dblclick', () => editing.v = true))
    )
    (button(cx`destroy`)
      (on('click', () => host(dispatch('destroy', undefined))))
    )
  )
  (input(cx`edit`, attr('value')`${todo._.text}`)
    (on('input', e => host(dispatch('setText', e.currentTarget.value))))
  )
}

function app() {
  const todos = new State<Todo[]>([
    {
      id: Math.random(),
      text: 'Create a TodoMVC template',
      completed: false,
    },
    {
      id: Math.random(),
      text: 'Rule the web',
      completed: true,
    },
  ])

  const currentFilter = new State<'All' | 'Active' | 'Completed'>('All')

  const filters = [
    { href: '#/', text: 'All' },
    { href: '#/active', text: 'Active' },
    { href: '#/completed', text: 'Completed' },
  ] as const

  window.addEventListener('hashchange', () => {
    const filter = filters
      .find(x => x.href === window.location.hash)
    if (filter) currentFilter.v = filter.text
  })

  return frag()
  (section(cx`todoapp`)
    (header(cx`header`)
      (h1(text`Todos`))
      (input(cx`new-todo`, attr('placeholder')`What needs to be done?`, attr('autofocus')``))
    )
  )
  (section(cx`main`)
    (input(id`toggle-all`, cx`toggle-all`, attr('type')`checkbox`))
    (label(attr('for')`toggle-all`, text`Mark all as complete`))
    (ul(cx`todo-list`)
      (repeat(todos, todo => todo.id, todo =>
        (viewTodo(todo)
          (on('destroy', () => todos.v = todos.v.filter(x => x.id !== todo.v.id)))
          (on('setText', e => todos.v = todos.v.map(x => x.id === x.id ? { ...x, text: e.detail } : x)))
          (on('setCompleted', e => todos.v = todos.v.map(x => x.id === x.id ? { ...x, completed: e.detail } : x)))
        )
      ))
    )
  )
  (footer(cx`footer`)
    (span(cx`todo-count`)
      (strong(text`${todos.map(v => v.length)}`))
      (text` item left`)
    )
    (ul(cx`filters`)
      (...filters.map(x =>
        (li()
          (a(cx`${currentFilter.map(v => v === x.text ? 'selected' : '' as string)}`, attr('href')`${x.href}`, text`${x.text}`))
        )
      ))
    )
    (button(cx`clear-completed`, text`Clear completed`))
  )
  (footer(cx`info`)
    (p(text`Double-click to edit a todo`))
    (p(text`Created by `)
      (a(attr('href')`http://todomvc.com`, text`MurkyMeow`))
    )
    (p(text`Part of `)
      (a(attr('href')`http://todomvc.com`, text`TodoMVC`))
    )
  )
}

document.body.append(app().__node)
