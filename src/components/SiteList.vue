<template>
  <div class="site-list">
    <SiteCard
      v-for="(s, index) in sites"
      :key="s.id"
      :site="s"
      :now="now"
      :style="{ '--i': index }"
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
@media (min-width: 768px) {
  .site-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 16px 12px 96px;
    align-items: start;
  }
}
</style>
