<script setup lang="ts">
// A fixed instant, so each zone shows its own wall-clock time and hour class.
const instant = new Date('2026-06-01T12:00:00Z')
const timeZone = useTimeZone()

function part(type: Intl.DateTimeFormatPartTypes): string {
  return (
    new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone.value,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .find((entry) => entry.type === type)?.value ?? ''
  )
}

const wallClock = computed(() => `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`)
const hour = computed(() => part('hour'))
</script>

<template>
  <section>
    <p data-testid="zone">
      {{ timeZone }}
    </p>
    <p data-testid="wall-clock" :class="`hour-${hour}`">
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
