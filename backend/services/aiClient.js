const axios = require('axios');
const FormData = require('form-data');

const baseURL = (process.env.AI_SERVICE_URL || '').replace(/\/$/, '');
const secret = process.env.AI_SERVICE_SECRET || '';

/** Node → FastAPI; RAG + LLM can exceed 2m on cold start / CPU / long context. */
const queryTimeoutMs = Number(process.env.AI_QUERY_TIMEOUT_MS || 300000);
const summarizeTimeoutMs = Number(process.env.AI_SUMMARIZE_TIMEOUT_MS || 300000);

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (secret) h['X-Internal-Secret'] = secret;
  return h;
}

function assertConfigured() {
  if (!baseURL) {
    const err = new Error('AI_SERVICE_URL is not configured');
    err.statusCode = 503;
    throw err;
  }
}

/**
 * Fire-and-forget safe wrapper: logs only status/message, never body.
 * @param {object} payload IngestEvent shape for FastAPI /events/
 */
function ingestEvent(payload) {
  if (!baseURL) return Promise.resolve();
  return axios
    .post(`${baseURL}/events/`, payload, { headers: headers(), timeout: 20000 })
    .catch((e) => {
      console.error('[ai] ingest failed:', e.response?.status || e.message);
    });
}

async function queryRag(body) {
  assertConfigured();
  const { data } = await axios.post(`${baseURL}/ai/`, body, {
    headers: headers(),
    timeout: queryTimeoutMs,
  });
  return data;
}

async function summarizeMeetingTranscript(body) {
  assertConfigured();
  const { data } = await axios.post(`${baseURL}/summarize/meeting`, body, {
    headers: headers(),
    timeout: summarizeTimeoutMs,
  });
  return data;
}

/**
 * Local faster-whisper STT on the AI backend (multipart).
 * @param {{ buffer: Buffer, filename: string, contentType?: string, language?: string|null }} opts
 */
async function transcribeMeetingAudioMultipart(opts) {
  assertConfigured();
  const form = new FormData();
  form.append('file', opts.buffer, {
    filename: opts.filename || 'audio.webm',
    contentType: opts.contentType || 'application/octet-stream',
  });
  if (opts.language && opts.language !== 'mixed') {
    form.append('language', opts.language);
  }
  const h = {
    ...form.getHeaders(),
  };
  if (secret) h['X-Internal-Secret'] = secret;
  const { data } = await axios.post(`${baseURL}/transcribe/audio`, form, {
    headers: h,
    timeout: Number(process.env.AI_TRANSCRIBE_TIMEOUT_MS || 600000),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return data;
}

function isAiConfigured() {
  return Boolean(baseURL);
}

module.exports = {
  ingestEvent,
  queryRag,
  summarizeMeetingTranscript,
  transcribeMeetingAudioMultipart,
  isAiConfigured,
};
