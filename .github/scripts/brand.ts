// Draws the brand from one mark, a globe with clock hands: a meridian and the equator on a round face, and the hands
// over them, the hour hand in green. One instant, read in the visitor's zone. It makes the logo, the favicons, the icons
// a phone and a shared link show, and the README banner, `useTimeZone()` set as a wordmark, in a light and a dark version, in .github/assets.
// Usage: pnpm brand (needs sharp)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

// Nuxt's design tokens (nuxt.com/design.md): true neutral surfaces and Nuxt green as the one accent, `green-500` in
// light mode and `green-400` in dark. Text follows Nuxt UI: highlighted for the name, muted and dimmed around it.
const light = {
  bg: '#ffffff', // white
  fg: '#171717', // neutral-900, text-highlighted
  muted: '#737373', // neutral-500, text-muted
  faint: '#a3a3a3', // neutral-400, text-dimmed
  lead: '#00c16a', // green-500
}
const dark = {
  bg: '#0a0a0a', // neutral-950, Nuxt black
  fg: '#ffffff', // white, text-highlighted
  muted: '#a3a3a3', // neutral-400, text-muted
  faint: '#737373', // neutral-500, text-dimmed
  lead: '#00dc82', // green-400, Nuxt green
}
type Theme = typeof light

// The mark, in a 128 box. Strokes are classes, so an SVG favicon can switch them with prefers-color-scheme.
const mark = `<ellipse class="grid" cx="64" cy="64" rx="18" ry="44" fill="none" stroke-width="4"/>
<path class="grid" d="M20 64 H108" stroke-width="4"/>
<circle class="rim" cx="64" cy="64" r="44" fill="none" stroke-width="7"/>
<path class="hand" d="M64 64 V34" stroke-width="7" stroke-linecap="round"/>
<path class="lead" d="M64 64 L86 76" stroke-width="8" stroke-linecap="round"/>
<circle class="pin" cx="64" cy="64" r="6"/>`

const style = (t: Theme) =>
  `.bg{fill:${t.bg}}.rim,.hand{stroke:${t.fg}}.grid{stroke:${t.faint};opacity:.55}.lead{stroke:${t.lead}}.pin{fill:${t.fg}}`

// The logo and favicons: the mark on a rounded tile, light by default and dark where the reader prefers it.
const logo = (size: number, rx = 28) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128" role="img" aria-labelledby="t">
<title id="t">nuxt-time-zone</title>
<style>${style(light)}@media (prefers-color-scheme:dark){${style(dark)}}</style>
<rect class="bg" width="128" height="128" rx="${rx}"/>
${mark}
</svg>
`
// A phone and a shared link round the corners themselves.
const tile = (size: number) => logo(size, 0)

const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// The banner is the API itself: the composable as a call, centred, and the package name under it.
const banner = (t: Theme) => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" role="img" aria-labelledby="t">
<title id="t">nuxt-time-zone: useTimeZone()</title>
<clipPath id="frame"><rect width="1280" height="400" rx="24"/></clipPath>
<g clip-path="url(#frame)">
<rect width="1280" height="400" fill="${t.bg}"/>
<text x="640" y="222" text-anchor="middle" font-family="${mono}" font-size="104" font-weight="600" letter-spacing="-3"><tspan fill="${t.muted}">use</tspan><tspan fill="${t.fg}">TimeZone</tspan><tspan fill="${t.lead}">()</tspan></text>
<text x="640" y="290" text-anchor="middle" font-family="${mono}" font-size="24" fill="${t.muted}">nuxt-time-zone</text>
</g>
</svg>
`

const write = (file: string, content: string | Buffer) => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  console.log(file)
}
const png = (source: string, size: number) =>
  sharp(Buffer.from(source), { density: 300 }).resize(size, size).png().toBuffer()

// An .ico is a directory of images, and each may be a whole PNG.
const ico = (images: [size: number, png: Buffer][]) => {
  const head = Buffer.alloc(6 + 16 * images.length)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(images.length, 4)
  let offset = head.length
  images.forEach(([size, data], i) => {
    const at = 6 + 16 * i
    head.writeUInt8(size, at)
    head.writeUInt8(size, at + 1)
    head.writeUInt16LE(1, at + 4)
    head.writeUInt16LE(32, at + 6)
    head.writeUInt32LE(data.length, at + 8)
    head.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([head, ...images.map(([, data]) => data)])
}

write('.github/assets/logo.svg', logo(64))
write('.github/assets/favicon.svg', logo(32))
write('.github/assets/favicon-32.png', await png(logo(32), 32))
write(
  '.github/assets/favicon.ico',
  ico(await Promise.all([16, 32, 48].map(async size => [size, await png(logo(size), size)] as [number, Buffer]))),
)
write('.github/assets/apple-touch-icon.png', await png(tile(180), 180))
write('.github/assets/logo-512.png', await png(tile(512), 512))
for (const [name, theme] of [['light', light], ['dark', dark]] as const) {
  const svg = banner(theme)
  write(`.github/assets/banner-${name}.svg`, svg)
  write(`.github/assets/banner-${name}.png`, await sharp(Buffer.from(svg), { density: 144 }).png().toBuffer())
}
