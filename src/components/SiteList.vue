<template>
  <div class="site-list">
    <SiteCard
      v-for="s in sites"
      :key="s.id"
      :site="s"
      :now="now"
      @edit="$emit('edit', $event)"
      @share="$emit('share', $event)"
      @delete="$emit('delete', $event)"
      @advance="$emit('advance', $event)"
    />
  </div>
</template>

<script setup>
import SiteCard from './SiteCard.vue'

defineProps({
  sites: { type: Array, required: true },
  now: { type: Number, required: true }
})
defineEmits(['edit', 'share', 'delete', 'advance'])
</script>

<style scoped>
.site-list {
  padding: 4px 0 90px;
}
</style>
