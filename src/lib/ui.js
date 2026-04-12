export function showToast(msg, type = 'default') {
  let t = document.getElementById('global-toast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'global-toast'
    t.className = 'toast'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.className = `toast show \${type}`
  clearTimeout(t._timeout)
  t._timeout = setTimeout(() => t.classList.remove('show'), 2800)
}
