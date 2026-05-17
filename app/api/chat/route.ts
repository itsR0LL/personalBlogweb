// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

type AiProvider = 'gemini' | 'openai-compatible';

type AiRuntimeConfig = {
  provider: AiProvider;
  providerLabel: string;
  model: string;
  apiKey: string;
  keyName: string;
  baseUrl?: string;
  maxOutputTokens: number;
  temperature: number;
  systemPrompt: string;
};

const baseJsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DEFAULT_GEMINI_MODEL_ID = 'gemini-2.5-flash-lite';
const DEFAULT_OPENAI_COMPATIBLE_MODEL_ID = 'Qwen/Qwen3-8B';
const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = 'https://api.siliconflow.cn/v1';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const MAX_MESSAGE_CHARS = 2000;
const UPSTREAM_TIMEOUT_MS = 20_000;

const rateBuckets = new Map<string, { windowStart: number; count: number }>();

function getAllowedOrigin(req?: Request) {
  const origin = req?.headers.get('origin') || '';
  if (!origin) return '';
  if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
  if (origin === 'http://www.muchuan.online:18080') return origin;
  if (origin === 'https://r0lldehome.asia' || origin === 'https://www.r0lldehome.asia') return origin;
  return '';
}

function getJsonHeaders(req?: Request) {
  const headers: Record<string, string> = { ...baseJsonHeaders };
  const allowedOrigin = getAllowedOrigin(req);
  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers.Vary = 'Origin';
  }
  return headers;
}

function json(data: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(data), { status, headers: getJsonHeaders(req) });
}

function trimEnv(name: string) {
  return (process.env[name] || '').trim();
}

function normalizeProvider(value: string): AiProvider | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'gemini') return 'gemini';
  if (normalized === 'openai-compatible' || normalized === 'openai') return 'openai-compatible';
  return null;
}

function getProvider(): AiProvider {
  const explicitProvider = normalizeProvider(trimEnv('AI_PROVIDER'));
  if (explicitProvider) return explicitProvider;

  if (trimEnv('AI_API_KEY') || trimEnv('OPENAI_API_KEY') || trimEnv('AI_BASE_URL') || trimEnv('OPENAI_BASE_URL')) {
    return 'openai-compatible';
  }

  return 'gemini';
}

function getRuntimeConfig(): AiRuntimeConfig {
  const provider = getProvider();
  const maxOutputTokens = siteConfig.geminiConfig.maxOutputTokens;
  const temperature = siteConfig.geminiConfig.temperature;
  const systemPrompt = siteConfig.geminiConfig.systemPrompt;

  if (provider === 'openai-compatible') {
    const apiKey = trimEnv('AI_API_KEY') || trimEnv('OPENAI_API_KEY');
    return {
      provider,
      providerLabel: 'OpenAI-compatible',
      model: trimEnv('AI_MODEL') || trimEnv('OPENAI_MODEL') || DEFAULT_OPENAI_COMPATIBLE_MODEL_ID,
      apiKey,
      keyName: trimEnv('AI_API_KEY') ? 'AI_API_KEY' : 'OPENAI_API_KEY',
      baseUrl: trimEnv('AI_BASE_URL') || trimEnv('OPENAI_BASE_URL') || DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
      maxOutputTokens,
      temperature,
      systemPrompt,
    };
  }

  return {
    provider,
    providerLabel: 'Gemini',
    model: trimEnv('AI_MODEL') || siteConfig.geminiConfig.modelId || DEFAULT_GEMINI_MODEL_ID,
    apiKey: trimEnv('GEMINI_API_KEY'),
    keyName: 'GEMINI_API_KEY',
    maxOutputTokens,
    temperature,
    systemPrompt,
  };
}

function getClientKey(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return req.headers.get('cf-connecting-ip') || forwardedFor || 'unknown-client';
}

function checkRateLimit(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { windowStart: now, count: 1 });
    return { limited: false, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function explainProviderError(provider: AiProvider, status: number, rawMessage?: string) {
  const providerName = provider === 'openai-compatible' ? 'AI 服务' : 'Gemini';
  if (status === 400) return '请求格式或模型参数不正确，请检查模型 ID、Prompt 和回复参数。';
  if (status === 401 || status === 403) return `${providerName} API Key 无效、权限不足，或该模型没有开通访问权限。`;
  if (status === 404) return `当前 ${providerName} 模型不存在或暂不可用，请检查模型 ID。`;
  if (status === 429) return `${providerName} 免费额度或请求频率已达到限制，请稍后再试。`;
  if (status >= 500) return `${providerName} 服务端暂时不可用，请稍后再试。`;
  return rawMessage || `${providerName} 请求失败，请检查网络、Key 和模型配置。`;
}

function extractGeminiReply(data: any) {
  return data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();
}

function extractOpenAiCompatibleReply(data: any) {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

async function requestGemini(config: AiRuntimeConfig, message: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: config.systemPrompt }],
      },
      contents: [{
        parts: [{ text: message }],
      }],
      generationConfig: {
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
      },
    }),
  });

  const data = await readJsonSafe(response);
  return { response, data, reply: extractGeminiReply(data) };
}

async function requestOpenAiCompatible(config: AiRuntimeConfig, message: string) {
  const baseUrl = (config.baseUrl || DEFAULT_OPENAI_COMPATIBLE_BASE_URL).replace(/\/+$/, '');
  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: message },
    ],
    max_tokens: config.maxOutputTokens,
    temperature: config.temperature,
    stream: false,
  };

  if (baseUrl.includes('siliconflow.cn')) {
    body.enable_thinking = false;
  }

  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await readJsonSafe(response);
  return { response, data, reply: extractOpenAiCompatibleReply(data) };
}

export async function POST(req: Request) {
  const config = getRuntimeConfig();
  const respond = (data: unknown, status = 200) => json(data, status, req);
  console.log(`[chat] ${config.provider} request start: ${config.model}`);

  try {
    const rateLimit = checkRateLimit(req);
    if (rateLimit.limited) {
      return respond({
        error: 'RATE_LIMITED',
        details: `请求过于频繁，请约 ${rateLimit.retryAfterSeconds} 秒后再试。`,
        userMessage: '请求太频繁了，请稍后再试。',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      }, 429);
    }

    const { message } = await req.json();

    if (typeof message !== 'string' || !message.trim()) {
      return respond({
        error: 'EMPTY_MESSAGE',
        details: '消息不能为空。',
      }, 400);
    }

    if (message.length > MAX_MESSAGE_CHARS) {
      return respond({
        error: 'MESSAGE_TOO_LONG',
        details: `消息不能超过 ${MAX_MESSAGE_CHARS} 个字符。`,
        userMessage: '消息太长了，请压缩后再发送。',
      }, 400);
    }

    if (!config.apiKey) {
      console.error(`[chat] ${config.keyName} is missing`);
      return respond({
        error: `${config.keyName} missing`,
        details:
          config.provider === 'openai-compatible'
            ? '请在当前运行环境配置 AI_API_KEY。硅基流动可使用 AI_BASE_URL=https://api.siliconflow.cn/v1 与 AI_MODEL=Qwen/Qwen3-8B。'
            : '请在当前运行环境配置 GEMINI_API_KEY。',
        keyConfigured: false,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
      }, 500);
    }

    const result =
      config.provider === 'openai-compatible'
        ? await requestOpenAiCompatible(config, message.trim())
        : await requestGemini(config, message.trim());

    if (!result.response.ok) {
      const rawMessage = result.data.error?.message || result.data.message || '未知错误';
      console.error(`[chat] ${config.provider} request failed:`, JSON.stringify({
        status: result.response.status,
        message: rawMessage,
      }));
      return respond({
        error: `${config.provider} request failed: ${result.response.status}`,
        details: rawMessage,
        userMessage: explainProviderError(config.provider, result.response.status, rawMessage),
        keyConfigured: true,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
      }, result.response.status);
    }

    const reply = result.reply || '助手暂时没有生成回复。';
    console.log(`[chat] ${config.provider} reply generated`);
    return respond({
      reply,
      provider: config.provider,
      providerLabel: config.providerLabel,
      model: config.model,
      baseUrl: config.baseUrl,
      keyConfigured: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown runtime error';
    console.error('[chat] Runtime error:', message);
    return respond({
      error: 'RUNTIME_ERROR',
      details: message,
      userMessage: '小助手接口运行异常，请检查服务日志和网络状态。',
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
    }, 500);
  }
}

export async function GET(req: Request) {
  const config = getRuntimeConfig();
  return json({
    status: 'Ready',
    provider: config.provider,
    providerLabel: config.providerLabel,
    model: config.model,
    baseUrl: config.baseUrl,
    keyConfigured: Boolean(config.apiKey),
    keyName: config.keyName,
    promptConfigured: Boolean(config.systemPrompt),
    maxOutputTokens: config.maxOutputTokens,
    temperature: config.temperature,
    checkedAt: new Date().toISOString(),
  }, 200, req);
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: getJsonHeaders(req) });
}
