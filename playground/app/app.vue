<template>
  <main>
    <h1>nuxt-time-zone</h1>
    <nav>
      <NuxtLink
        to="/"
        data-testid="nav-home"
      >
        Home
      </NuxtLink>
      ·
      <NuxtLink
        to="/other"
        data-testid="nav-other"
      >
        Other
      </NuxtLink>
      ·
      <NuxtLink to="/spa">
        ssr: false
      </NuxtLink>
      ·
      <NuxtLink to="/stale">
        Stale
      </NuxtLink>
      ·
      <NuxtLink to="/prerendered">
        Prerendered
      </NuxtLink>
    </nav>
    <NuxtPage />
  </main>
</template>
