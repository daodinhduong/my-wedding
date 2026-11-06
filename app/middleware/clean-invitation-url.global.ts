export default defineNuxtRouteMiddleware((to) => {
  const legacyInvitation = to.path.match(/^\/(?:nha-trai|nha-gai)(?:\/([^/]+))?\/?$/)
  if (legacyInvitation) {
    return navigateTo({ path: legacyInvitation[1] ? `/${legacyInvitation[1]}` : '/', query: to.query }, { replace: true, redirectCode: 301 })
  }
  const isInvitation = to.name === 'id' || /^\/bao-hy(?:\/[^/]+)?\/?$/.test(to.path)
  if (to.hash && (to.path === '/' || isInvitation)) {
    return navigateTo({ path: to.path, query: to.query, hash: '' }, { replace: true })
  }
})
