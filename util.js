export function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
export function debounce(fn) {
  let frame
  return (...args) => {
    if (frame) return
    frame = requestAnimationFrame(() => (fn(...args), frame = null))
  }
}
