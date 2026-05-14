"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  KeyRound,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  Sliders,
  Sparkles,
} from 'lucide-react';

type GeminiStatus = {
  status: string;
  runtime?: string;
  provider: string;
  model: string;
  keyConfigured: boolean;
  promptConfigured: boolean;
  maxOutputTokens: number;
  temperature: number;
  production?: Partial<GeminiStatus> & {
    reachable?: boolean;
    error?: string;
  };
};

type GeminiTestResult = {
  ok: boolean;
  message: string;
  details?: string;
};

type GeminiConfig = {
  modelId: string;
  systemPrompt: string;
  maxOutputTokens: number;
  temperature: number;
};

type AICatSectionProps = {
  formData: {
    geminiConfig?: Record<string, unknown>;
  };
  handleUpdate: (field: string, value: unknown) => void;
  pushToQueue: (label: string, key?: string, value?: unknown) => void;
};

const defaultGeminiConfig: GeminiConfig = {
  modelId: 'gemini-2.5-flash-lite',
  systemPrompt: '',
  maxOutputTokens: 150,
  temperature: 0.85,
};
const productionChatUrl = 'https://personalblogweb.vercel.app/api/chat';

function normalizeGeminiConfig(value?: Record<string, unknown>): GeminiConfig {
  return {
    modelId: typeof value?.modelId === 'string' ? value.modelId : defaultGeminiConfig.modelId,
    systemPrompt: typeof value?.systemPrompt === 'string' ? value.systemPrompt : defaultGeminiConfig.systemPrompt,
    maxOutputTokens:
      typeof value?.maxOutputTokens === 'number' ? value.maxOutputTokens : defaultGeminiConfig.maxOutputTokens,
    temperature: typeof value?.temperature === 'number' ? value.temperature : defaultGeminiConfig.temperature,
  };
}

export default function AICatSection({ formData, handleUpdate, pushToQueue }: AICatSectionProps) {
  // 防止 undefined
  const config = normalizeGeminiConfig(formData.geminiConfig);

  // 🌟 核心防崩魔法：将系统提示词的状态独立出来
  const [localPrompt, setLocalPrompt] = useState('');
  const [geminiStatus, setGeminiStatus] = useState<GeminiStatus | null>(null);
  const [productionStatus, setProductionStatus] = useState<Partial<GeminiStatus> & { reachable?: boolean; error?: string } | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testTarget, setTestTarget] = useState<'production' | 'local'>('production');
  const [testMessage, setTestMessage] = useState('请用一句话确认 Gemini 小助手已经可以正常工作。');
  const [testResult, setTestResult] = useState<GeminiTestResult | null>(null);

  const loadGeminiStatus = useCallback(async () => {
    setIsStatusLoading(true);
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' });
      const data = await res.json();
      setGeminiStatus(data);
    } catch {
      setGeminiStatus(null);
    }

    try {
      const productionRes = await fetch(productionChatUrl, { cache: 'no-store' });
      const productionData = await productionRes.json();
      setProductionStatus({
        ...productionData,
        reachable: productionRes.ok,
      });
    } catch (error) {
      setProductionStatus({
        reachable: false,
        error: error instanceof Error ? error.message : '无法连接线上接口',
      });
    } finally {
      setIsStatusLoading(false);
    }
  }, []);

  const testGemini = async () => {
    if (!testMessage.trim()) {
      setTestResult({ ok: false, message: '测试内容不能为空。' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(testTarget === 'production' ? productionChatUrl : '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTestResult({
          ok: false,
          message: data.userMessage || data.details || 'Gemini 测试失败。',
          details: data.details,
        });
        await loadGeminiStatus();
        return;
      }

      setTestResult({
        ok: true,
        message: data.reply || 'Gemini 已返回响应。',
      });
      await loadGeminiStatus();
    } catch (error) {
      setTestResult({
        ok: false,
        message: error instanceof Error ? error.message : '无法连接小助手接口。',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 初始化时，如果后端传来的是安全转义的 \n，我们把它还原成真实的换行，让文本框正常显示
  useEffect(() => {
    setLocalPrompt(config.systemPrompt.replace(/\\n/g, '\n'));
  }, [config.systemPrompt]);

  useEffect(() => {
    loadGeminiStatus();
  }, [loadGeminiStatus]);

  const updateConfig = (key: keyof GeminiConfig, value: GeminiConfig[keyof GeminiConfig]) => {
    handleUpdate('geminiConfig', { ...config, [key]: value });
  };

  // 🌟 拦截文本框输入
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const realText = e.target.value;
    setLocalPrompt(realText); // 文本框里保持真实的物理换行，方便你阅读和编辑

    // ⚠️ 传给父组件和队列时，强行把物理换行替换为单行字面量 "\\n"
    // 这样 Python 写文件时就是安全的： systemPrompt: "第一行\n第二行" (不会断裂)
    const safeTextForBackend = realText.replace(/\n/g, '\\n');
    updateConfig('systemPrompt', safeTextForBackend);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
      className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
    >
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/40 dark:border-slate-700/50">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
            <Bot className="text-indigo-500" size={28} /> AI 助手配置中心
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-400" /> 配置管理端 AI 助手的回复方式
          </p>
        </div>
        <button
          onClick={() => pushToQueue('AI 助手配置')}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 text-sm"
        >
          <Save size={16} /> 暂存至队列
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-3xl border border-white/50 dark:border-slate-700/50 bg-white/45 dark:bg-slate-800/45 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                <KeyRound size={14} className="text-indigo-500" />
                Gemini Runtime Status
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/55 dark:bg-slate-950/30 p-4">
                  <p className="mb-3 text-[11px] font-black uppercase text-slate-400">本地管理端</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${
                      geminiStatus?.keyConfigured
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {geminiStatus?.keyConfigured ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {geminiStatus?.keyConfigured ? 'Key 已配置' : 'Key 未配置'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-[11px] font-black text-blue-600 dark:text-blue-400">
                      <Cpu size={13} />
                      {geminiStatus?.model || config.modelId || 'gemini-2.5-flash-lite'}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/55 dark:bg-slate-950/30 p-4">
                  <p className="mb-3 text-[11px] font-black uppercase text-slate-400">线上 Vercel</p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${
                      productionStatus?.keyConfigured
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {productionStatus?.keyConfigured ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {productionStatus?.keyConfigured ? 'Key 已配置' : 'Key 未配置'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${
                      productionStatus?.reachable
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {productionStatus?.reachable ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {productionStatus?.reachable ? '接口可达' : '接口异常'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-[11px] font-black text-blue-600 dark:text-blue-400">
                      <Cpu size={13} />
                      {productionStatus?.model || 'gemini-2.5-flash-lite'}
                    </span>
                  </div>
                  {productionStatus?.error && (
                    <p className="mt-2 text-[11px] font-bold text-rose-500">{productionStatus.error}</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-400 leading-relaxed">
                本地状态读取管理端 dev server；线上状态由管理端服务端检测 Vercel。API Key 只从环境变量 <span className="font-mono">GEMINI_API_KEY</span> 读取，不会写入公开配置或提交到仓库。
              </p>
            </div>

            <button
              type="button"
              onClick={loadGeminiStatus}
              disabled={isStatusLoading}
              className="self-start inline-flex items-center gap-2 rounded-2xl bg-slate-900/5 dark:bg-white/10 px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-white/20 disabled:opacity-60 transition-colors"
            >
              <RefreshCw size={14} className={isStatusLoading ? 'animate-spin' : ''} />
              刷新状态
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-white/55 dark:bg-slate-950/30 border border-white/50 dark:border-slate-700/50 p-4">
            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">
              发送测试探针
            </label>
            <div className="mb-3 inline-flex rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 p-1">
              <button
                type="button"
                onClick={() => setTestTarget('production')}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition-colors ${
                  testTarget === 'production'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                }`}
              >
                测线上 Vercel
              </button>
              <button
                type="button"
                onClick={() => setTestTarget('local')}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition-colors ${
                  testTarget === 'local'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                }`}
              >
                测本地管理端
              </button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="flex-1 bg-white/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="输入一条测试消息"
              />
              <button
                type="button"
                onClick={testGemini}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 disabled:opacity-60 transition-colors"
              >
                {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isTesting ? '测试中...' : '测试 Gemini'}
              </button>
            </div>

            {testResult && (
              <div className={`mt-4 rounded-2xl border p-4 text-sm leading-relaxed ${
                testResult.ok
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              }`}>
                <p className="font-bold">{testResult.message}</p>
                {testResult.details && (
                  <p className="mt-2 text-[11px] opacity-80 break-words">{testResult.details}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 模型 ID */}
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-3">
            <Cpu size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> 模型核心引擎 (Model ID)
          </label>
          <input
            type="text"
            value={config.modelId}
            onChange={(e) => updateConfig('modelId', e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-3.5 px-5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
            placeholder="例如: gemini-2.5-flash-lite"
          />
          <p className="text-[11px] text-slate-400 mt-2 ml-1">推荐使用默认的轻量级模型，响应速度最快。</p>
        </div>

        {/* System Prompt */}
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300 mb-3">
            <MessageSquareText size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" /> 灵魂 Prompt (性格设定)
          </label>
          <textarea
            value={localPrompt} // 🌟 绑定本地的安全显示状态
            onChange={handlePromptChange} // 🌟 使用我们写的拦截函数
            className="w-full bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl py-4 px-5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[200px] resize-y font-medium text-sm leading-relaxed custom-scrollbar"
            placeholder="输入 AI 的性格、行为模式和约束..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Max Tokens */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
                <Sliders size={16} className="text-slate-400" /> 最大回复字数 (Tokens)
              </label>
              <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{config.maxOutputTokens}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={config.maxOutputTokens}
              onChange={(e) => updateConfig('maxOutputTokens', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Temperature */}
          <div className="group">
            <div className="flex justify-between items-center mb-3">
              <label className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
                <Sparkles size={16} className="text-slate-400" /> 模型发散度 (Temperature)
              </label>
              <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{config.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={config.temperature}
              onChange={(e) => updateConfig('temperature', Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-2">数值越大，回复越发散；数值越小越稳定严谨。</p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
