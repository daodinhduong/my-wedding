<script setup lang="ts">
const route = useRoute()
const { data: invitation, error } = await useFetch(`/api/invitations/${encodeURIComponent(String(route.params.id))}`)
if (error.value || !invitation.value) {
  throw createError({ statusCode: error.value?.statusCode || 404, statusMessage: 'Không thể mở thiệp mời. Vui lòng kiểm tra lại đường dẫn.' })
}
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
</script>

<template>
  <WeddingInvitation
    v-if="invitation"
    :side="invitation.invitationSide === 'nha-gai' ? 'nha-gai' : 'nha-trai'"
    :two-meals="invitation.twoMeals"
    :announcement="invitation.deliveryType === 'announcement'"
    :guest-name="invitation.guestName"
    :inviter-role="invitation.inviterRole === 'parents' ? 'parents' : 'couple'"
    :personal-message="invitation.personalMessage"
    :invitation-id="String(route.params.id)"
  />
</template>
