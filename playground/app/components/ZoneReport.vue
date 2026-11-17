<script setup lang="ts">
// A fixed instant, so each zone shows its own wall-clock time and hour class.
const instant = new Date('2026-06-01T12:00:00Z')
const timeZone = useTimeZone()
const wallClock = computed(() => new Intl.DateTimeFormat('en-US', { timeZone: timeZone.value, dateStyle: 'medium', timeStyle: 'short' }).format(instant))
const hour = computed(() => new Intl.DateTimeFormat('en-US', { timeZone: timeZone.value, hour: '2-digit', hourCycle: 'h23' }).format(instant))
</script>

<template>
  <section>
    <p data-testid="zone">
      {{ timeZone }}
    </p>
    <p
      data-testid="wall-clock"
      :class="`hour-${hour}`"
    >
      {{ wallClock }}
    </p>
    <p>
      <NuxtTime
        data-testid="nuxt-time"
        :datetime="instant"
        locale="en-US"
        hour="2-digit"
        minute="2-digit"
        :hour12="false"
      />
    </p>
  </section>
</template>
