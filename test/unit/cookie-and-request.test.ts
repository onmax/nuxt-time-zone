import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cookieValue } from '../../src/runtime/shared/cookie.ts'
import { getRequestTimeZone } from '../../src/runtime/server/utils/time-zone.ts'

void describe('cookieValue', () => {
  void it('strips a matching RFC 6265 quoted-string before decoding', () => {
    assert.equal(cookieValue('tz="Europe%2FMadrid"', 'tz'), 'Europe/Madrid')
  })

  void it('keeps an unquoted encoded value', () => {
    assert.equal(cookieValue('tz=Europe%2FMadrid', 'tz'), 'Europe/Madrid')
  })
})

void describe('getRequestTimeZone', () => {
  void it('reads the live Node cookie on a Nitro v2 nuxt/server event whose Web headers are a snapshot', () => {
    const nodeHeaders: { cookie?: string } = { cookie: 'tz=Europe%2FMadrid' }
    const event = {
      __is_event__: true,
      node: { req: { headers: nodeHeaders } },
      req: { headers: new Headers({ cookie: 'tz=Europe%2FMadrid' }) },
    }

    assert.equal(getRequestTimeZone(event), 'Europe/Madrid')
    delete nodeHeaders.cookie
    assert.equal(getRequestTimeZone(event), 'UTC')
  })

  void it('reads a Nitro v2 cookie header sent as several values', () => {
    const event = {
      __is_event__: true,
      node: { req: { headers: { cookie: ['other=example', 'tz=Europe%2FMadrid'] } } },
    }
    assert.equal(getRequestTimeZone(event), 'Europe/Madrid')
  })

  void it('reads Web Headers on a Nitro v3 h3 event, whose node getter may be undefined or stale', () => {
    class H3Event {
      static __is_event__ = true
      req = { headers: new Headers({ cookie: 'tz=America%2FNew_York' }) }
      readonly runtimeNode?: { req: { headers: { cookie?: string } } }
      constructor(runtimeNode?: { req: { headers: { cookie?: string } } }) {
        this.runtimeNode = runtimeNode
      }
      get node() {
        return this.runtimeNode
      }
    }

    assert.equal(getRequestTimeZone(new H3Event()), 'America/New_York')
    assert.equal(
      getRequestTimeZone(new H3Event({ req: { headers: { cookie: 'tz=Europe%2FMadrid' } } })),
      'America/New_York',
    )
  })
})
