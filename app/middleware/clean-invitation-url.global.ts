export default defineNuxtRouteMiddleware((to) => {
  const isInvitation = /^\/(?:nha-trai|nha-gai|bao-hy)(?:\/[^/]+)?\/?$/.test(to.path)
  if (to.hash && (to.path === '/' || isInvitation)) {
    return navigateTo({ path: to.path, query: to.query, hash: '' }, { replace: true })
  }
})
