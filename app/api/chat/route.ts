// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

const jsonHeaders = { 'Content-Type': 'application/json' };
const DEFAULT_MODEL_ID = 'gemini-2.5-flash-lite';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function getModelId() {
  return siteConfig.geminiConfig.modelId || DEFAULT_MODEL_ID;
}

function getApiKey() {
  return (process.env.GEMINI_API_KEY || '').trim();
}

function explainGeminiError(status: number, rawMessage?: string) {
  if (status === 400) return '请求格式或模型参数不正确，请检查模型 ID、Prompt 和回复参数。';
  if (status === 401 || status === 403) return 'Gemini API Key 无效、权限不足，或该 Key 未启用 Gemini API。';
  if (status === 404) return '当前 Gemini 模型不存在或暂不可用，请检查模型 ID。';
  if (status === 429) return 'Gemini 免费额度或请求频率已达到限制，请稍后再试。';
  if (status >= 500) return 'Gemini 服务端暂时不可用，请稍后再试。';
  return rawMessage || 'Gemini 请求失败，请检查网络、Key 和模型配置。';
}

export async function POST(req: Request) {
  const modelId = getModelId();
  console.log(`[chat] Gemini request start: ${modelId}`);

  try {
    const { message } = await req.json();
    const apiKey = getApiKey();

    if (typeof message !== 'string' || !message.trim()) {
      return json({
        error: 'EMPTY_MESSAGE',
        details: '消息不能为空。',
      }, 400);
    }

    if (!apiKey) {
      console.error('[chat] GEMINI_API_KEY is missing');
      return json({
        error: 'GEMINI_API_KEY missing',
        details: '请在本地环境或 Vercel Environment Variables 中配置 GEMINI_API_KEY。',
        keyConfigured: false,
      }, 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: siteConfig.geminiConfig.systemPrompt }],
        },
        contents: [{
          parts: [{ text: message }],
        }],
        generationConfig: {
          maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
          temperature: siteConfig.geminiConfig.temperature,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[chat] Gemini request failed:', JSON.stringify(data));
      const rawMessage = data.error?.message || '未知错误';
      return json({
        error: `Gemini request failed: ${response.status}`,
        details: rawMessage,
        userMessage: explainGeminiError(response.status, rawMessage),
        keyConfigured: true,
      }, response.status);
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim() || '助手暂时没有生成回复。';

    console.log('[chat] Gemini reply generated');
    return json({ reply, provider: 'gemini', model: modelId, keyConfigured: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown runtime error';
    console.error('[chat] Runtime error:', message);
    return json({
      error: 'RUNTIME_ERROR',
      details: message,
      userMessage: '小助手接口运行异常，请检查服务日志和网络状态。',
    }, 500);
  }
}

export async function GET() {
  const apiKey = getApiKey();
  return json({
    status: 'Ready',
    provider: 'gemini',
    model: getModelId(),
    keyConfigured: Boolean(apiKey),
    promptConfigured: Boolean(siteConfig.geminiConfig.systemPrompt),
    maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
    temperature: siteConfig.geminiConfig.temperature,
  });
}
