import assert from './support/assert'
import { useOAuthServer } from './support/hooks'
import { describe, useSharedSteps } from './support/mocha'
import commonSteps from './steps'

import { Cookie, Session } from '../src/constants'


describe('Authorize', () => {
  const { given, when, then, and } = useSharedSteps({
    ...commonSteps,
    "I make a request to a secured page": async (ctx) => {
      ctx.resp = await ctx.client.get(`${ctx.proxyUrl}/secured/index.html`)
    },
    "I should get the requested page": ({ resp }) => {
      assert(resp.statusCode === 200)
      assert(resp.body.includes('<title>/secured/index.html</title>'))
    },
  })

  useOAuthServer()

  describe('with no access token', () => {

    describe('with no refresh token', () => {
      given("I'm not logged in (no session and cookies exist)")

      when("I make a request to a secured page")

      then("the proxy should redirect me to $oauth_server_url/authorize", ({ resp, oauthServerUrl }) => {
        assert(resp.statusCode === 303)
        assert(resp.headers.location!.split('?')[0] === `${oauthServerUrl}/authorize`)
      })
    })

    describe('with an invalid refresh token', () => {
      given("I'm logged in (session and cookies are set)")

      and("access token has expired", ({ client }) => {
        client.cookies.remove(Cookie.AccessToken)
      })

      and("refresh token is invalid", async ({ nginx }) => {
        await nginx.variables.set(Session.RefreshToken, 'invalid-refresh-token')
      })

      when("I make a request to a secured page")

      then("the response status should be {status}", 401)

      and("session variable {varName} should be cleared", Session.RefreshToken)
    })

    describe('with a valid refresh token', () => {
      given("I'm logged in (session and cookies are set)")

      and("access token has expired", (ctx) => {
        ctx.client.cookies.remove(Cookie.AccessToken)
      })

      when("I make a request to a secured page")

      then("I should get the requested page")

      and("the response should set cookie {cookieName}", Cookie.AccessToken)
    })
  })


  describe('with an unknown access token', () => {
    given("I have an invalid (unknown) access token", ({ client, proxyUrl }) => {
      client.cookies.set(Cookie.AccessToken, '0a1e3021-8c69-44a9-a136-0768a0aeb2ad', proxyUrl)
    })

    when("I make a request to a secured page")

    then("the response status should be {status}", 401)

    and("cookie {cookieName} should be cleared", Cookie.AccessToken)
  })


  describe('with a valid access token', () => {
    given("I'm logged in (session and cookies are set)")

    when("I make a request to a secured page")

    then("I should get the requested page")
  })
})
