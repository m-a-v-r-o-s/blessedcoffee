// One-time Google sign-in that produces the refresh token reply.mjs runs on.
//
//   node reviews/auth.mjs ~/Downloads/client_secret_XXXX.json
//
// The JSON is the "Desktop app" OAuth client downloaded from Google Cloud
// (project akosds-business-profile). Open the printed link, sign in as the
// account that manages the Blessed Coffee profile, allow access. The script
// then prints the three values to store as GitHub secrets.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node reviews/auth.mjs <path to client_secret_*.json>');
  process.exit(1);
}
const { client_id, client_secret } = JSON.parse(readFileSync(file, 'utf8')).installed;
const state = randomBytes(16).toString('hex');

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname !== '/') return res.writeHead(404).end();
  if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
    res.end(`Sign-in failed: ${url.searchParams.get('error') || 'bad state'}`);
    return;
  }
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      code: url.searchParams.get('code'),
      client_id,
      client_secret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await tokenRes.json();
  if (!data.refresh_token) {
    res.end('No refresh token returned, see the terminal.');
    console.error('Token exchange failed:', data);
  } else {
    res.end('Done. You can close this tab and go back to the terminal.');
    console.log('\nSet these as GitHub secrets (repo Settings > Secrets and variables > Actions):\n');
    console.log(`GOOGLE_CLIENT_ID      ${client_id}`);
    console.log(`GOOGLE_CLIENT_SECRET  ${client_secret}`);
    console.log(`GOOGLE_REFRESH_TOKEN  ${data.refresh_token}`);
  }
  server.close();
});

let redirectUri;
server.listen(0, '127.0.0.1', () => {
  redirectUri = `http://127.0.0.1:${server.address().port}`;
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.search = new URLSearchParams({
    client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent', // forces a refresh token even on a repeat sign-in
    state,
  });
  console.log(`Open this link in the browser signed into digitalaakos@gmail.com:\n\n${auth}\n`);
});
