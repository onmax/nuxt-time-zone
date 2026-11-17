import { COOKIE_ATTRIBUTES } from './runtime/shared/cookie'

/**
 * Runs first in `<head>`, before the body is parsed. When the page was rendered in another zone than the device's, it
 * writes the cookie and reloads, so the next response is rendered in the device's zone. It ships in every page, so it
 * stays small and never throws.
 *
 * It does nothing when:
 * - the server left out `data-time-zone`: `ssr: false`, a non-GET render, or prerendered HTML;
 * - the zones match, or the device reports no zone, or one Intl doesn't know;
 * - cookies are off, or the cookie doesn't read back (blocked, or a cross-site frame);
 * - sessionStorage is unavailable, since nothing could then stop a loop;
 * - this tab already reloaded once for the same rendered and device zones: cached HTML that keeps the old zone
 *   reloads at most once.
 */
export function headScript(cookieName: string): string {
  return `(function(){try{
var r=document.documentElement.getAttribute("data-time-zone"),d=Intl.DateTimeFormat().resolvedOptions().timeZone,s,k,c;
if(!r||!d||r===d||!navigator.cookieEnabled)return;
Intl.DateTimeFormat(void 0,{timeZone:d});
s=sessionStorage;k="nuxt-time-zone:"+r+">"+d;
if(s.getItem(k))return;
s.setItem(k,"1");
c=${JSON.stringify(`${cookieName}=`)}+encodeURIComponent(d);
document.cookie=c+${JSON.stringify(COOKIE_ATTRIBUTES)}+(location.protocol=="https:"?"; Secure":"");
if(("; "+document.cookie+";").indexOf("; "+c+";")<0)return;
location.reload()
}catch(e){}})()`.replace(/\n/g, '')
}
