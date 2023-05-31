import qs from 'querystring'

import type { RequestHandler } from '../'
import { Cookie, Session } from '../constants'
import { formatCookie } from '../utils'


export const logout: RequestHandler = ({ conf, getCookie, log, req, send, vars }) => {
  if (req.method !== 'POST' && !conf.insecure) {
    return send(405, undefined, { Allow: 'POST always' })
  }
  const nextUri = req.args.nextUri ? qs.unescape(req.args.nextUri) : conf.cookiePath

  log.info?.(`logout: logging out user ${getCookie(Cookie.Username)}`)

  vars[Session.IdToken] = undefined
  vars[Session.RefreshToken] = undefined

  return send(303, nextUri, {
    'Set-Cookie': [
      formatCookie(Cookie.AccessToken, '', 0, conf),  // delete cookie
      formatCookie(Cookie.SessionId, '', 0, conf),  // delete cookie
      formatCookie(Cookie.Username, '', 0, conf),  // delete cookie
    ],
  })
}
