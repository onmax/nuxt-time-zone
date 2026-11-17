// Draws the brand from one mark, a globe with clock hands: a meridian and the equator on a round face, and the hands
// over them, the hour hand in green. One instant, read in the visitor's zone. It makes the logo, the favicons, the icons
// a phone and a shared link show, and the README banner in a light and a dark version, in .github/assets.
// Usage: pnpm brand (needs sharp)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

// Picked in oklch and written as hex, because librsvg, which renders the PNGs, doesn't read oklch().
// Contrast is WCAG 2 against each theme's background, or the panel where noted.
const light = {
  bg: '#f6f5f1', // oklch(0.97 0.006 100)
  panel: '#e9e8e1', // oklch(0.93 0.01 100)
  fg: '#14201b', // oklch(0.23 0.02 165), 15.4:1
  muted: '#46534d', // oklch(0.43 0.02 165), 7.4:1
  faint: '#56645e', // oklch(0.49 0.02 165), 5.1:1 on the panel
  lead: '#126b47', // oklch(0.47 0.1 160), 5.3:1 on the panel, Nuxt's green darkened to read on paper
}
const dark = {
  bg: '#0f1612', // oklch(0.19 0.012 165)
  panel: '#171f1b', // oklch(0.23 0.014 165)
  fg: '#f6f5f1', // oklch(0.97 0.006 100), 16.8:1
  muted: '#b7c0bc', // oklch(0.8 0.012 165), 9.9:1
  faint: '#89928d', // oklch(0.65 0.012 165), 5.3:1 on the panel
  lead: '#3cde93', // oklch(0.8 0.17 158), 9.7:1 on the panel, close to Nuxt's green
}
type Theme = typeof light

// The mark, in a 128 box. Strokes are classes, so an SVG favicon can switch them with prefers-color-scheme.
const mark = `<circle class="rim" cx="64" cy="64" r="44" fill="none" stroke-width="7"/>
<ellipse class="grid" cx="64" cy="64" rx="18" ry="44" fill="none" stroke-width="4"/>
<path class="grid" d="M20 64 H108" stroke-width="4"/>
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

const font = 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Helvetica, Arial, sans-serif'
const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// On the right, the API the way VueUse shows one: the call, and what it returns as a comment. The page and the server
// route read the same zone.
type Token = [text: string, role?: 'key' | 'fn' | 'str' | 'note']
const code: Token[][] = [
  [['// app/pages/index.vue', 'note']],
  [['const ', 'key'], ['timeZone = '], ['useTimeZone', 'fn'], ['()']],
  [['timeZone.value '], ['// \'Europe/Madrid\'', 'str']],
  [],
  [['// server/api/today.get.ts', 'note']],
  [['getRequestTimeZone', 'fn'], ['(event)']],
  [['// \'Europe/Madrid\'', 'str']],
]
const panel = (t: Theme) => {
  const fill = { key: t.muted, fn: t.fg, str: t.lead, note: t.faint }
  return code
    .map((line, i) => line.length === 0
      ? ''
      : `<text x="848" y="${112 + i * 34}" xml:space="preserve">${line
        .map(([text, role]) => `<tspan fill="${role ? fill[role] : t.muted}"${role === 'fn' ? ' font-weight="600"' : ''}>${text}</tspan>`)
        .join('')}</text>`)
    .filter(Boolean)
    .join('\n')
}

// The mark and name on the left, a line and the config under them; the code on the right.
const banner = (t: Theme) => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" role="img" aria-labelledby="t">
<title id="t">nuxt-time-zone: times in the visitor's time zone, from the first server render</title>
<style>${style(t)}</style>
<clipPath id="frame"><rect width="1280" height="400" rx="24"/></clipPath>
<g clip-path="url(#frame)">
<rect width="1280" height="400" fill="${t.bg}"/>
<rect x="800" y="0" width="480" height="400" fill="${t.panel}"/>
<g font-family="${mono}" font-size="18">
${panel(t)}
</g>
<g transform="translate(66 62) scale(.66)">
${mark}
</g>
<text x="168" y="140" fill="${t.fg}" font-family="${font}" font-size="72" font-weight="700" letter-spacing="-2.5">nuxt-time-zone</text>
<text x="80" y="204" fill="${t.muted}" font-family="${font}" font-size="27">Times in the visitor's time zone,</text>
<text x="80" y="240" fill="${t.muted}" font-family="${font}" font-size="27">from the first server render.</text>
<g font-family="${mono}" font-size="22">
<text x="80" y="326" fill="${t.faint}">modules: [<tspan fill="${t.lead}">'nuxt-time-zone'</tspan>]</text>
</g>
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
