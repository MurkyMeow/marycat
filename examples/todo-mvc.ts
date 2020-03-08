import * as m from '../src/index'
import * as h from './bindings'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface TodoProps {
  todo: m.State<Todo>
  onDestroy: () => void
  onSetText: (arg: string) => void
  onCompleted: (arg: boolean) => void
}

function viewTodo(props: TodoProps) {
  const editing = new m.State(false)
  const { todo } = props

  return h.li([m.cx`${todo._.completed.map(v => v ? 'completed' : '')}`],
    h.div([m.cx`view`],
      h.input([
        m.cx`toggle`,
        m.attr('type')`checkbox`,
        m.attr('checked')`${todo._.completed}`,
        m.on('change', e => props.onCompleted(e.currentTarget.checked))
      ]),
      h.label([m.text`${todo._.text}`, m.on('dblclick', () => editing.v = true)]),
      h.button([m.cx`destroy`, m.on('click', props.onDestroy)]),
    ),
    h.input([
      m.cx`edit`,
      m.attr('value')`${todo._.text}`,
      m.on('input', e => props.onSetText(e.currentTarget.value)),
    ]),
  )
}

function app() {
  const todos = new m.State<Todo[]>([
    { id: Math.random(), text: 'Create a TodoMVC template', completed: false },
    { id: Math.random(), text: 'Rule the web', completed: true },
  ])

  const currentFilter = new m.State<'All' | 'Active' | 'Completed'>('All')

  const filters = [
    { href: '#/', text: 'All' },
    { href: '#/active', text: 'Active' },
    { href: '#/completed', text: 'Completed' },
  ] as const

  window.addEventListener('hashchange', () => {
    const filter = filters.find(x => x.href === window.location.hash)
    if (filter) currentFilter.v = filter.text
  })

  return m.frag([],
    h.section([m.cx`todoapp`],
      h.header([m.cx`header`],
        h.h1([m.text`Todos`]),
        h.input([m.cx`new-todo`, m.attr('placeholder')`What needs to be done?`, m.attr('autofocus')``]),
      )
    ),
    h.section([m.cx`main`],
      h.input([m.id`toggle-all`, m.cx`toggle-all`, m.attr('type')`checkbox`]),
      h.label([m.attr('for')`toggle-all`, m.text`Mark all as complete`]),
      h.ul([m.cx`todo-list`],
        m.repeat(todos, todo => todo.id, todo => viewTodo({
          todo,
          onDestroy: () => todos.v = todos.v.filter(x => x.id !== todo.v.id),
          onSetText: e => todos.v = todos.v.map(x => x.id === x.id ? { ...x, text: e.detail } : x),
          onCompleted: e => todos.v = todos.v.map(x => x.id === x.id ? { ...x, completed: e.detail } : x),
        }))
      )
    ),
    h.footer([m.cx`footer`],
      h.span([m.cx`todo-count`],
        h.strong([m.text`${todos.map(v => v.length)}`]),
        m.text` item left`,
      ),
      h.ul([m.cx`filters`],
        ...filters.map(x => h.li([],
          h.a([
            m.cx`${currentFilter.map(v => v === x.text ? 'selected' : '' as string)}`,
            m.attr('href')`${x.href}`,
            m.text`${x.text}`,
          ]),
        ))
      ),
      h.button([m.cx`clear-completed`, m.text`Clear completed`])
    ),
    h.footer([m.cx`info`],
      h.p([m.text`Double-click to edit a todo`]),
      h.p([m.text`Created by `],
        h.a([m.attr('href')`http://todomvc.com`, m.text`MurkyMeow`]),
      ),
      h.p([m.text`Part of `],
        h.a([m.attr('href')`http://todomvc.com`, m.text`TodoMVC`])
      )
    )
  )
}

app()(document.body)
