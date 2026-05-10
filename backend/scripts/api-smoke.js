/**
 * HTTP smoke tests for the Express API (+ optional FastAPI health).
 *
 * Usage (from the `backend` folder):
 *   npm run smoke
 *
 * Loads `backend/.env` so `PORT` matches your running server (e.g. 3000 vs 5000).
 *
 * Optional — full authenticated checks (use YOUR real Collabrix account):
 *   - Email + password must match a user that exists in your DB and is email-verified
 *     (same as logging in on the website).
 *   PowerShell example (replace with your values):
 *     $env:SMOKE_EMAIL="you@yourdomain.com"
 *     $env:SMOKE_PASSWORD="YourActualPassword"
 *     npm run smoke
 *
 * Overrides:
 *   API_BASE=http://127.0.0.1:3000
 *   AI_BASE=http://127.0.0.1:8001
 */

const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const port = process.env.PORT || 5000;
const API_BASE = (process.env.API_BASE || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const AI_BASE = (process.env.AI_BASE || 'http://127.0.0.1:8001').replace(/\/$/, '');

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' });
  const tag = ok ? 'OK  ' : 'FAIL';
  console.log(`${tag}  ${name}${detail ? ` — ${detail}` : ''}`);
}

function cookieHeaderFromLoginResponse(loginRes) {
  const raw = loginRes.headers['set-cookie'];
  if (!raw) return '';
  const parts = Array.isArray(raw) ? raw : [raw];
  return parts.map((c) => c.split(';')[0]).filter(Boolean).join('; ');
}

async function requestPublic() {
  try {
    const r = await axios.get(`${API_BASE}/`, { validateStatus: () => true, timeout: 8000 });
    record('GET /', r.status === 200, `status ${r.status}`);
  } catch (e) {
    record('GET /', false, e.message);
    return false;
  }

  const me401 = await axios.get(`${API_BASE}/api/users/me`, { validateStatus: () => true, timeout: 8000 });
  record('GET /api/users/me (no auth)', me401.status === 401, `status ${me401.status}`);

  const loginMissing = await axios.post(
    `${API_BASE}/api/auth/login`,
    {},
    { validateStatus: () => true, timeout: 8000 },
  );
  record('POST /api/auth/login (empty body)', loginMissing.status === 400, `status ${loginMissing.status}`);

  const oid = '507f1f77bcf86cd799439011';
  const authRequired = [
    ['GET', `/api/spaces`],
    ['GET', `/api/spaces/${oid}`],
    ['GET', `/api/projects/space/${oid}`],
    ['GET', `/api/projects/${oid}`],
    ['GET', `/api/tasks/project/${oid}`],
    ['GET', `/api/tasks/${oid}`],
    ['GET', `/api/history/space/${oid}`],
    ['GET', `/api/history/project/${oid}`],
    ['GET', `/api/history/task/${oid}`],
    ['GET', `/api/history/user/${oid}`],
    ['GET', `/api/meetings?projectId=${oid}`],
    ['GET', `/api/meetings/${oid}`],
    ['GET', `/api/chats`],
    ['GET', `/api/time-entries/active`],
    ['POST', `/api/ai/query`],
    ['POST', `/api/auth/logout`],
    ['POST', `/api/meetings/create`],
    ['POST', `/api/tasks`],
    ['POST', `/api/ai/summarize`],
    ['POST', `/api/meetings/${oid}/audio`],
    ['PATCH', `/api/meetings/${oid}/transcript`],
    ['POST', `/api/auth/refresh`],
  ];
  for (const [method, url] of authRequired) {
    const name = `${method} ${url.split('?')[0]} (no auth → 401)`;
    try {
      const r = await axios({ method, url: `${API_BASE}${url}`, data: method === 'POST' ? {} : undefined, validateStatus: () => true, timeout: 8000 });
      const okAuth = r.status === 401 || (url === '/api/auth/refresh' && (r.status === 402 || r.status === 403));
      record(name, okAuth, `status ${r.status}`);
    } catch (e) {
      record(name, false, e.message);
    }
  }

  return true;
}

async function requestAiHealth() {
  try {
    const r = await axios.get(`${AI_BASE}/health/`, { validateStatus: () => true, timeout: 5000 });
    record('GET AI /health/', r.status === 200, `status ${r.status} (${AI_BASE})`);
  } catch (e) {
    record('GET AI /health/', false, e.message);
  }
  try {
    const r = await axios.get(`${AI_BASE}/`, { validateStatus: () => true, timeout: 5000 });
    record('GET AI /', r.status === 200, `status ${r.status}`);
  } catch (e) {
    record('GET AI /', false, e.message);
  }
}

async function requestAuthenticated() {
  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    console.log('\n(Skip authenticated bundle: set SMOKE_EMAIL and SMOKE_PASSWORD)');
    return;
  }

  const loginRes = await axios.post(
    `${API_BASE}/api/auth/login`,
    { email, password },
    { validateStatus: () => true, timeout: 15000 },
  );
  if (loginRes.status !== 200) {
    record(
      'POST /api/auth/login',
      false,
      `status ${loginRes.status} ${JSON.stringify(loginRes.data).slice(0, 200)}`,
    );
    return;
  }
  record('POST /api/auth/login', true, `status ${loginRes.status}`);

  const cookie = cookieHeaderFromLoginResponse(loginRes);
  if (!cookie) {
    record('Login cookies', false, 'no Set-Cookie');
    return;
  }

  const client = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    validateStatus: () => true,
    headers: { Cookie: cookie },
  });

  const me = await client.get('/api/users/me');
  record('GET /api/users/me', me.status === 200, `status ${me.status}`);
  const userId = me.data?._id;
  if (!userId) record('GET /api/users/me (body)', false, 'missing _id');

  const spaces = await client.get('/api/spaces');
  record('GET /api/spaces', spaces.status === 200, `status ${spaces.status} count=${Array.isArray(spaces.data) ? spaces.data.length : '?'}`);
  const spaceId = Array.isArray(spaces.data) && spaces.data[0]?._id;

  if (spaceId) {
    const s1 = await client.get(`/api/spaces/${spaceId}`);
    record('GET /api/spaces/:id', s1.status === 200, `status ${s1.status}`);

    const histS = await client.get(`/api/history/space/${spaceId}`);
    record('GET /api/history/space/:spaceId', histS.status === 200 || histS.status === 404, `status ${histS.status}`);
  } else {
    record('GET /api/spaces/:id', false, 'no space to test');
  }

  if (spaceId) {
    const projs = await client.get(`/api/projects/space/${spaceId}`);
    record('GET /api/projects/space/:spaceId', projs.status === 200, `status ${projs.status}`);
    const projectId = Array.isArray(projs.data) && projs.data[0]?._id;

    if (projectId) {
      const p1 = await client.get(`/api/projects/${projectId}`);
      record('GET /api/projects/:id', p1.status === 200, `status ${p1.status}`);

      const tasks = await client.get(`/api/tasks/project/${projectId}`);
      record('GET /api/tasks/project/:projectId', tasks.status === 200, `status ${tasks.status}`);

      const histP = await client.get(`/api/history/project/${projectId}`);
      record('GET /api/history/project/:projectId', histP.status === 200 || histP.status === 404, `status ${histP.status}`);

      const meet = await client.get('/api/meetings', { params: { projectId } });
      record('GET /api/meetings', meet.status === 200, `status ${meet.status}`);

      const aiQ = await client.post('/api/ai/query', {
        projectId,
        query: 'What tasks exist in this project?',
      });
      record(
        'POST /api/ai/query',
        aiQ.status === 200 || aiQ.status === 503,
        `status ${aiQ.status}${aiQ.status === 503 ? ' (AI_SERVICE_URL unset or AI down)' : ''}`,
      );

      const aiSum = await client.post('/api/ai/summarize', {
        projectId,
        text: 'Short test note for summarize endpoint.',
      });
      record(
        'POST /api/ai/summarize',
        aiSum.status === 200 || aiSum.status === 503,
        `status ${aiSum.status}`,
      );
    } else {
      record('GET /api/projects/:id', false, 'no project to test');
    }
  }

  if (userId) {
    const histU = await client.get(`/api/history/user/${userId}`);
    record('GET /api/history/user/:userId', histU.status === 200 || histU.status === 404, `status ${histU.status}`);
  }

  const chats = await client.get('/api/chats');
  record('GET /api/chats', chats.status === 200, `status ${chats.status}`);

  const timer = await client.get('/api/time-entries/active');
  record('GET /api/time-entries/active', timer.status === 200, `status ${timer.status}`);

  const refresh = await client.post('/api/auth/refresh', {}, { headers: { Cookie: cookie } });
  record('POST /api/auth/refresh', refresh.status === 200 || refresh.status === 401, `status ${refresh.status}`);

  const logout = await client.post('/api/auth/logout');
  record('POST /api/auth/logout', logout.status === 200, `status ${logout.status}`);
}

async function main() {
  console.log(`API_BASE=${API_BASE}`);
  console.log(`AI_BASE=${AI_BASE}\n`);

  const ok = await requestPublic();
  await requestAiHealth();
  await requestAuthenticated();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n— Summary: ${results.length - failed.length}/${results.length} passed —`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  failed: ${f.name} ${f.detail}`));
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
