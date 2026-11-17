<!-- `prerender: true` in routeRules -->
<template>
  <div>
    <ZoneReport />
    <form
      method="post"
      action="/posted"
    >
      <button
        type="submit"
        data-testid="post"
      >
        Post a form
      </button>
    </form>
  </div>
</template>
