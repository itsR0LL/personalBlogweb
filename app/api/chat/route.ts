// app/api/chat/route.ts
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

const jsonHeaders = { 'Content-Type': 'application/json' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

export async function POST(req: Request) {
  const modelId = siteConfig.geminiConfig.modelId || 'gemini-2.5-flash-lite';
  console.log(`[chat] Gemini request start: ${modelId}`);

  try {
    const { message } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      console.error('[chat] GEMINI_API_KEY is missing');
      return json({
        error: 'GEMINI_API_KEY missing',
        details: 'Set GEMINI_API_KEY in Vercel Environment Variables to enable the blog assistant.',
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
      return json({
        error: `Gemini request failed: ${response.status}`,
        details: data.error?.message || '未知错误',
      }, response.status);
    }

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim() || '助手暂时没有生成回复。';

    console.log('[chat] Gemini reply generated');
    return json({ reply, provider: 'gemini', model: modelId });
  } catch (error: any) {
    console.error('[chat] Runtime error:', error.message);
    return json({ error: error.message }, 500);
  }
}

export async function GET() {
  return json({
    status: 'Ready',
    provider: 'gemini',
    model: siteConfig.geminiConfig.modelId || 'gemini-2.5-flash-lite',
  });
}
