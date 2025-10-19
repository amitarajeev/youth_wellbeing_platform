export function useAnnouncer() {
  function announce (msg = '') {
    const n = document.getElementById('sr-announcer')
    if (!n) return
    n.textContent = ''       // flush so SR reads again
    requestAnimationFrame(() => { n.textContent = msg })
  }
  return { announce }
}
