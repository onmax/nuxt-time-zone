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

void describe('getRequestTimeZone on a Nitro v2-shaped event', () => {
  void it('reads the live Node cookie after event.headers was cached from an earlier value', () => {
    const nodeHeaders: Record<string, string | string[] | undefined> = {
      cookie: 'tz=Europe%2FMadrid',
    }
    const initial = nodeHeaders.cookie
    let cached: string | null = typeof initial === 'string' ? initial : null
    const event = {
      req: { headers: nodeHeaders },
      // h3 v1 caches the first Headers read; later Node rewrites do not update it.
      headers: {
        get(name: string) {
          return name.toLowerCase() === 'cookie' ? cached : null
        },
      },
    }

    assert.equal(getRequestTimeZone(event), 'Europe/Madrid')
    void event.headers.get('cookie')
    delete nodeHeaders.cookie
    // Stale Web Headers still hold the pre-delete value; the Node record must win.
    assert.equal(cached, 'tz=Europe%2FMadrid')
    assert.equal(getRequestTimeZone(event), 'UTC')
  })

  void it('still reads Web Headers when no request header collection exists', () => {
    const event = {
      headers: {
        get(name: string) {
          return name.toLowerCase() === 'cookie' ? 'tz=America%2FNew_York' : null
        },
      },
    }
    assert.equal(getRequestTimeZone(event), 'America/New_York')
  })
})
