export const sampleHarData = {
  log: {
    version: '1.2',
    creator: {
      name: 'Chrome DevTools / WebInspector',
      version: '130.0.0.0'
    },
    browser: {
      name: 'Google Chrome',
      version: '130.0.6723.70'
    },
    pages: [
      {
        startedDateTime: '2026-10-29T10:15:30.000Z',
        id: 'page_1',
        title: 'DevCrate Developer Dashboard',
        pageTimings: {
          onContentLoad: 85.2,
          onLoad: 240.6
        }
      }
    ],
    entries: [
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.050Z',
        time: 142.6,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://api.devcrate.app/v1/user/profile?includeRoles=true&source=web',
          httpVersion: 'HTTP/2.0',
          cookies: [
            { name: 'session_token', value: 'sess_9938a1fe48c90b', path: '/', domain: 'api.devcrate.app', httpOnly: true, secure: true },
            { name: 'theme', value: 'dark', path: '/', domain: 'api.devcrate.app' }
          ],
          headers: [
            { name: 'Accept', value: 'application/json, text/plain, */*' },
            { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.profile_token' },
            { name: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
            { name: 'Referer', value: 'https://devcrate.app/dashboard' },
            { name: 'Accept-Language', value: 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7' }
          ],
          queryString: [
            { name: 'includeRoles', value: 'true' },
            { name: 'source', value: 'web' }
          ],
          headersSize: 420,
          bodySize: 0
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'cache-control', value: 'private, max-age=60' },
            { name: 'server', value: 'cloudflare' },
            { name: 'cf-ray', value: '8d28a3810f92419c-SJC' },
            { name: 'content-length', value: '382' }
          ],
          content: {
            size: 382,
            compression: 140,
            mimeType: 'application/json',
            text: JSON.stringify({
              status: 'success',
              user: {
                id: 'usr_984124',
                username: 'alex_developer',
                email: 'alex@devcrate.app',
                nickname: 'Alex Developer',
                role: 'admin',
                permissions: ['tools:read', 'tools:execute', 'settings:write'],
                plan: 'pro_tier',
                createdAt: '2026-01-15T08:00:00Z'
              }
            }, null, 2)
          },
          redirectURL: '',
          headersSize: 260,
          bodySize: 242
        },
        timings: {
          blocked: 1.5,
          dns: 4.2,
          connect: 16.8,
          ssl: 22.4,
          send: 0.8,
          wait: 78.4,
          receive: 18.5
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.220Z',
        time: 198.4,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'POST',
          url: 'https://api.devcrate.app/v1/auth/session',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Accept', value: 'application/json' },
            { name: 'Origin', value: 'https://devcrate.app' },
            { name: 'User-Agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
          ],
          queryString: [],
          postData: {
            mimeType: 'application/json',
            text: JSON.stringify({
              email: 'alex@devcrate.app',
              clientPlatform: 'web-desktop',
              rememberMe: true,
              timestamp: 1793218530
            }, null, 2)
          },
          headersSize: 310,
          bodySize: 128
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          cookies: [
            {
              name: 'refresh_token',
              value: 'rfr_776100ab12f',
              path: '/v1/auth',
              domain: 'api.devcrate.app',
              expires: '2026-12-01T00:00:00.000Z',
              httpOnly: true,
              secure: true,
              sameSite: 'Lax'
            }
          ],
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'set-cookie', value: 'refresh_token=rfr_776100ab12f; Path=/v1/auth; Domain=api.devcrate.app; Secure; HttpOnly; SameSite=Lax' },
            { name: 'x-auth-id', value: 'auth_session_9281' }
          ],
          content: {
            size: 215,
            compression: 0,
            mimeType: 'application/json',
            text: JSON.stringify({
              code: 0,
              message: 'Authentication successful',
              accessToken: 'eyJh...token...xyz',
              expiresIn: 7200,
              tokenType: 'Bearer'
            }, null, 2)
          },
          redirectURL: '',
          headersSize: 320,
          bodySize: 215
        },
        timings: {
          blocked: 0.8,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 1.2,
          wait: 182.5,
          receive: 13.9
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.430Z',
        time: 58.2,
        serverIPAddress: '172.67.142.9',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://static.devcrate.app/assets/css/main.bundle.css',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Accept', value: 'text/css,*/*;q=0.1' },
            { name: 'User-Agent', value: 'Mozilla/5.0' },
            { name: 'Accept-Encoding', value: 'gzip, deflate, br' }
          ],
          queryString: [],
          headersSize: 210,
          bodySize: 0
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'text/css; charset=utf-8' },
            { name: 'content-encoding', value: 'gzip' },
            { name: 'cache-control', value: 'public, max-age=31536000, immutable' },
            { name: 'etag', value: '"w/39b1a-82fa"' }
          ],
          content: {
            size: 4890,
            compression: 3650,
            mimeType: 'text/css',
            text: `:root {
  --color-primary: #3b82f6;
  --color-bg: #09090b;
  --font-mono: 'JetBrains Mono', monospace;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: var(--color-bg);
}
.devcrate-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}`
          },
          redirectURL: '',
          headersSize: 220,
          bodySize: 1240
        },
        timings: {
          blocked: 1.1,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.4,
          wait: 42.1,
          receive: 14.6
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.500Z',
        time: 32.1,
        serverIPAddress: '172.67.142.9',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://static.devcrate.app/assets/images/logo.svg',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Accept', value: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' },
            { name: 'User-Agent', value: 'Mozilla/5.0' }
          ],
          queryString: [],
          headersSize: 190,
          bodySize: 0
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'image/svg+xml' },
            { name: 'cache-control', value: 'public, max-age=86400' }
          ],
          content: {
            size: 780,
            compression: 0,
            mimeType: 'image/svg+xml',
            text: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="20" fill="#2563eb" />
  <path d="M25 35 L50 20 L75 35 L50 50 Z" fill="#93c5fd" opacity="0.9" />
  <path d="M25 35 L50 50 L50 80 L25 65 Z" fill="#60a5fa" />
  <path d="M75 35 L50 50 L50 80 L75 65 Z" fill="#3b82f6" />
</svg>`
          },
          redirectURL: '',
          headersSize: 180,
          bodySize: 780
        },
        timings: {
          blocked: 0.5,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.3,
          wait: 22.4,
          receive: 8.9
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.550Z',
        time: 92.4,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://api.devcrate.app/v1/notifications?unread=true&limit=10&page=1',
          httpVersion: 'HTTP/2.0',
          cookies: [
            { name: 'session_token', value: 'sess_9938a1fe48c90b' }
          ],
          headers: [
            { name: 'Accept', value: 'application/json' },
            { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1Ni...xyz' }
          ],
          queryString: [
            { name: 'unread', value: 'true' },
            { name: 'limit', value: '10' },
            { name: 'page', value: '1' }
          ],
          headersSize: 280,
          bodySize: 0
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'x-total-count', value: '2' }
          ],
          content: {
            size: 298,
            compression: 0,
            mimeType: 'application/json',
            text: JSON.stringify({
              total: 2,
              items: [
                { id: 'ntf_1', title: 'New release v0.2.0 is out', type: 'system', read: false },
                { id: 'ntf_2', title: 'Security audit complete: 0 vulnerabilities', type: 'security', read: false }
              ]
            }, null, 2)
          },
          redirectURL: '',
          headersSize: 210,
          bodySize: 298
        },
        timings: {
          blocked: 0.6,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.5,
          wait: 74.2,
          receive: 17.1
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.660Z',
        time: 45.3,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://api.devcrate.app/v0/profile',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Accept', value: 'application/json' }
          ],
          queryString: [],
          headersSize: 180,
          bodySize: 0
        },
        response: {
          status: 301,
          statusText: 'Moved Permanently',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'location', value: 'https://api.devcrate.app/v1/user/profile' },
            { name: 'content-length', value: '0' }
          ],
          content: {
            size: 0,
            mimeType: 'text/plain',
            text: ''
          },
          redirectURL: 'https://api.devcrate.app/v1/user/profile',
          headersSize: 195,
          bodySize: 0
        },
        timings: {
          blocked: 0.4,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.3,
          wait: 39.8,
          receive: 4.8
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.720Z',
        time: 65.8,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'GET',
          url: 'https://api.devcrate.app/v1/documents/missing_doc_9921',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Accept', value: 'application/json' }
          ],
          queryString: [],
          headersSize: 220,
          bodySize: 0
        },
        response: {
          status: 404,
          statusText: 'Not Found',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'x-error-code', value: 'ERR_DOC_NOT_FOUND' }
          ],
          content: {
            size: 112,
            mimeType: 'application/json',
            text: JSON.stringify({
              error: 'NotFound',
              message: 'The requested document "missing_doc_9921" does not exist',
              statusCode: 404
            }, null, 2)
          },
          redirectURL: '',
          headersSize: 210,
          bodySize: 112
        },
        timings: {
          blocked: 0.7,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.4,
          wait: 56.2,
          receive: 8.5
        }
      },
      {
        pageref: 'page_1',
        startedDateTime: '2026-10-29T10:15:30.800Z',
        time: 210.5,
        serverIPAddress: '104.21.32.18',
        connection: '443',
        request: {
          method: 'POST',
          url: 'https://api.devcrate.app/v1/payment/checkout',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Idempotency-Key', value: 'idem_894129841' }
          ],
          queryString: [],
          postData: {
            mimeType: 'application/json',
            text: JSON.stringify({
              orderId: 'ord_19042',
              amount: 19900,
              currency: 'USD'
            }, null, 2)
          },
          headersSize: 260,
          bodySize: 85
        },
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          httpVersion: 'HTTP/2.0',
          cookies: [],
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'x-trace-id', value: 'trc_994821a_us_west' }
          ],
          content: {
            size: 145,
            mimeType: 'application/json',
            text: JSON.stringify({
              error: 'PaymentGatewayTimeout',
              message: 'Downstream payment provider failed to respond within 200ms',
              traceId: 'trc_994821a_us_west'
            }, null, 2)
          },
          redirectURL: '',
          headersSize: 240,
          bodySize: 145
        },
        timings: {
          blocked: 0.5,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.6,
          wait: 198.2,
          receive: 11.2
        }
      }
    ]
  }
};
