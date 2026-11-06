export default defineNuxtRouteMiddleware((to) => {
  const { inviter, ...query } = to.query
  const legacyInvitation = to.path.match(/^\/(?:nha-trai|nha-gai|bao-hy)(?:\/([^/]+))?\/?$/)
  if (legacyInvitation) {
    return navigateTo({ path: legacyInvitation[1] ? `/${legacyInvitation[1]}` : '/', query }, { replace: true, redirectCode: 301 })
  }
  const isInvitation = to.name === 'id'
  if ((to.hash || inviter !== undefined) && (to.path === '/' || isInvitation)) {
    return navigateTo({ path: to.path, query, hash: '' }, { replace: true })
  }
})
