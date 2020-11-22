import qs from 'querystring'
import type { ParsedUrlQueryInput } from 'querystring'

import type { HttpError } from './context'


/**
 * Exclude from values of object `T` those types that are assignable to `U`.
 */
export type ValuesExclude<T extends object, U> = {
  [K in keyof T]: Exclude<T[K], U>
}

/**
 * Tests if `value` is truthy and returns it. When it's not truthy, `Error` with `message`
 * is thrown.
 *
 * @throws if `value` is not truthy.
 */
export function assert <T> (value: T | undefined | null | false | 0 | '', message: string): T {
  if (!value) {
    throw Error(message)
  }
  return value
}

/**
 * Converts camelCase `str` into snake_case.
 *
 * Note: It works correctly with ASCII characters only!
 */
export function camelToSnake (str: string): string {
  // For shorter strings, this implementation is more efficient than using regex.
  const strLen = str.length
  let res = ''

  for (let i = 0; i < strLen; i++) {
    const char = str[i]
    res += (char > 'A' && char < 'Z') ? '_' + char.toLowerCase() : char
  }
  return res
}

type FormatCookieOpts = {
  cookiePath: string,
  insecure?: boolean,
}

/**
 * Formats a cookie for `Set-Cookie` header.
 *
 * @param name The cookie name.
 * @param value The cookie value.
 * @param maxAge Number of seconds until the cookie expires.
 * @param opts An object with:
 *   - `cookiePath` - `Path` attribute
 *   - `insecure` - if `true`, `SameSite=Strict; Secure` will **not** be set
 * @param extra Any extra attributes as string that will be appended to the cookie value.
 * @returns A cookie string.
 */
export function formatCookie (
  name: string,
  value: string,
  maxAge: number,
  opts: FormatCookieOpts,
  extra: string = '',
): string {
  const securityAttrs = opts.insecure ? '' : '; SameSite=Strict; Secure'
  return `${name}=${value}; Path=${opts.cookiePath}; Max-Age=${maxAge}${securityAttrs};${extra}`
}

/**
 * Formats a cookie for `Set-Cookie` header that will clear (remove) the named cookie.
 *
 * @param name The cookie name.
 * @param opts An object with:
 *   - `cookiePath` - `Path` attribute
 *   - `insecure` - if `true`, `SameSite=Strict; Secure` will **not** be set
 * @returns A cookie string.
 */
export function formatCookieClear (name: string, opts: FormatCookieOpts): string {
  return formatCookie(name, '', 0, opts)
}

/**
 * Returns `true` if `value` is `'true'`.
 */
export const parseBoolean = (value: string): boolean => value === 'true'

/**
 * Converts the given `body` into a JSON.
 *
 * @throws {TypeError} if `body` is unset or not a valid UTF8 string.
 * @throws {SyntaxError} if `body` is not a valid JSON.
 */
export function parseJsonBody (body?: NjsByteString): object {
  if (body == null) {
    throw TypeError('requestBody has not been read')
  }
  const str = body?.toUTF8()
  if (str == null) {
    throw TypeError('requestBody is not a valid UTF8 string')
  }
  return JSON.parse(str)
}

/**
 * Parses `Accept` header and returns the most preferred media type from the list
 * of supportedTypes.
 *
 * Note: This function is extremely simplified, it does not support q-values,
 * suffixes, charsets etc. It just compares naked media type without parameters
 * and returns the first match.
 */
export function preferredMediaType <T extends readonly string[]> (
  acceptQuery: string,
  supportedTypes: T,
): T[number] {
  for (let type of acceptQuery.split(',')) {
    type = substrBefore(type, ';').trim()
    if (supportedTypes.includes(type)) {
      return type
    }
  }
  return supportedTypes[0]
}

/**
 * Returns a random alphanumeric string of the specified `length`.
 */
export function random (length = 8, radix = 32): string {
  let res = ''
  while (length--) {
    res += Math.floor(Math.random() * radix).toString(radix)
  }
  return res
}

/**
 * Returns a rejected Promise with object containing the given properties.
 */
export function reject (status: number, title: string, detail?: string, headers?: NginxHeadersOut): Promise<never> {
  return Promise.reject({ status, title, detail, headers } as HttpError)
}

/**
 * Renders the given `template` with parameters enclosed in double curly braces:
 * `{{ varName }}`.
 */
export function renderTemplate (template: string, params: Record<string, unknown>): string {
  return template.replace(
    /\{\{\s*([A-Za-z0-9_$]+)\s*\}\}/g,
    (_, varName: string) => String(params[varName] ?? ''),
  )
}

/**
 * Constructs URL from given `uri` (without query string and fragment) and `query` object.
 */
export function url (uri: string, query: ParsedUrlQueryInput): string {
  return `${uri}?${qs.stringify(query)}`
}

function substrBefore (str: string, searchStr: string): string {
  const idx = str.indexOf(searchStr)
  return idx > 0 ? str.slice(idx) : str
}
