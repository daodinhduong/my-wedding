<script setup lang="ts">
const props = defineProps<{ side: 'nha-trai' | 'nha-gai', announcement?: boolean }>()
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
    :side="props.side"
    :announcement="props.announcement"
    :guest-name="invitation.guestName"
    :sender-name="invitation.senderName"
    :invitation-id="String(route.params.id)"
  />
</template>
