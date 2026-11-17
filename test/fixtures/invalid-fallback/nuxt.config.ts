// Scenario 15: setup must reject a fallback zone Intl doesn't know.
export default {
  modules: ['../../../src/module'],
  timeZone: { fallback: 'Mars/Olympus_Mons' },
}
