import { COOKIE_ATTRIBUTES } from './runtime/shared/cookie'

/**
 * Runs first in `<head>`, before the body is parsed. When the page was rendered in another zone than the device's, it
 * writes the cookie and reloads, so the next response is rendered in the device's zone. `window.stop()` first stops
 * the parser, so the browser never paints the body rendered in the old zone. It ships in every page, so it stays small
 * and never throws.
 *
 * It does nothing when:
 * - the server left out `data-time-zone`: `ssr: false`, a non-GET render, or prerendered HTML;
 * - the zones match, or the device reports no zone, or one Intl doesn't know;
 * - cookies are off, or the cookie doesn't read back (blocked, or a cross-site frame);
 * - sessionStorage is unavailable, since nothing could then stop a loop;
 * - this tab already reloaded for the same rendered and device zones and the cookie still holds the device's zone:
 *   the server ignored it, as cached HTML does, so another reload can't help;
 * - this tab already reloaded 3 times. A lost cookie or a new trip reloads again, up to that cap.
 */
export function headScript(cookieName: string): string {
  return `(function(){try{
var r=document.documentElement.getAttribute("data-time-zone"),d=Intl.DateTimeFormat().resolvedOptions().timeZone,s,k,n,c,h;
if(!r||!d||r===d||!navigator.cookieEnabled)return;
Intl.DateTimeFormat(void 0,{timeZone:d});
c=${JSON.stringify(`${cookieName}=`)}+encodeURIComponent(d);
h=function(){return("; "+document.cookie+";").indexOf("; "+c+";")>=0};
s=sessionStorage;k="nuxt-time-zone:"+r+">"+d;n=+s.getItem("nuxt-time-zone")||0;
if(s.getItem(k)&&h()||n>2)return;
s.setItem(k,"1");s.setItem("nuxt-time-zone",n+1);
document.cookie=c+${JSON.stringify(COOKIE_ATTRIBUTES)}+(location.protocol=="https:"?"; Secure":"");
if(!h())return;
window.stop();location.reload()
}catch(e){}})()`.replace(/\n/g, '')
}
