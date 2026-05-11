"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';
import { ShieldCheck, GitBranch, Save, Rocket, Wand2, Key, Copy, Check, CloudUpload, Code } from 'lucide-react';

export default function RepoSection() {
  const { showToast } = useToast();
  const [isCheckingPath, setIsCheckingPath] = useState(false);
  const [isCheckingGit, setIsCheckingGit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const portalRoot = typeof document === 'undefined' ? null : document.body;

  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; type: 'init' | 'deploy' | 'upload' | 'ssh' | null }>({
    isOpen: false,
    type: null
  });

  // 区分当前展示的 SSH 公钥用途。
  const [sshConfig, setSshConfig] = useState<{ key: string, type: 'static' | 'source' }>({ key: "", type: "static" });

  const [deployData, setDeployData] = useState({
    blogPath: "",
    staticRepoUrl: "",    // 静态部署仓库
    staticBranch: "gh-pages", // 静态部署分支
    sourceRepoUrl: "",    // 源码同步仓库
    sourceBranch: "main"      // 源码同步分支
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const config = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/config`);
        if (res.ok) {
          const data = await res.json();
          setDeployData({
            blogPath: data.blogPath || "",
            staticRepoUrl: data.staticRepoUrl || data.repoUrl || "",
            staticBranch: data.staticBranch || data.repoBranch || "gh-pages",
            sourceRepoUrl: data.sourceRepoUrl || "",
            sourceBranch: data.sourceBranch || "main"
          });
          if (data.blogPath) localStorage.setItem('targetBlogPath', data.blogPath);
        }
      } catch { console.error("加载配置失败"); }
    };
    fetchConfig();
  }, []);

  const testPathConnection = async () => {
    if (!deployData.blogPath) { showToast("路径不能为空！", "warning"); return; }
    setIsCheckingPath(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/sync/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(data.message, "error");
    } catch { showToast("无法连接后端服务", "error"); }
    setIsCheckingPath(false);
  };

  const testGitConnection = async () => {
    if (!deployData.blogPath) { showToast("请先配置物理路径！", "warning"); return; }
    setIsCheckingGit(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(data.message, "error");
    } catch { showToast("后端服务未响应", "error"); }
    setIsCheckingGit(false);
  };

  // 传入 type 区分请求静态部署或源码同步的公钥。
  const handleGetSSH = async (type: 'static' | 'source') => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/ssh/key?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setSshConfig({ key: data.key, type });
        setModalConfig({ isOpen: true, type: 'ssh' });
      } else {
        showToast(data.message, "error");
      }
    } catch { showToast("获取 SSH 公钥失败", "error"); }
  };

  const executeInitEnv = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsInitializing(true);
    showToast("正在初始化部署环境...", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployData)
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(`初始化失败: ${data.message}`, "error");
    } catch { showToast("后端服务未响应", "error"); }
    setIsInitializing(false);
  };

  const executeDeploy = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsDeploying(true);
    showToast("正在编译并推送静态站点...", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
      else showToast(`部署失败: ${data.message}`, "error");
    } catch { showToast("部署请求失败", "error"); }
    setIsDeploying(false);
  };

  const executeUploadSource = async () => {
    setModalConfig({ isOpen: false, type: null });
    setIsUploading(true);
    showToast("正在同步源码到 Vercel 触发仓库...", "info");
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/deploy/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: deployData.blogPath })
      });
      const data = await res.json();
      if (data.success) showToast("源码同步成功，Vercel 将开始自动构建", "success");
      else showToast(`源码同步失败: ${data.message}`, "error");
    } catch { showToast("源码上传请求失败", "error"); }
    setIsUploading(false);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      const res = await fetch(`http://127.0.0.1:${config.api_port}/api/deploy/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployData)
      });
      const data = await res.json();
      if (data.success) showToast(data.message, "success");
    } catch { showToast("保存失败", "error"); }
    setIsSaving(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sshConfig.key);
    setIsCopied(true);
    showToast("已复制到剪贴板", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Rocket size={20} /> 部署管理</h2>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-3">
               <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"><ShieldCheck size={14} className="text-indigo-500" /> 1. 本地博客路径</label>
               <button onClick={testPathConnection} disabled={isCheckingPath} className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-bold hover:bg-indigo-500/20 transition-colors">
                 {isCheckingPath ? "检测中..." : "检测路径"}
               </button>
            </div>
            <input type="text" value={deployData.blogPath} onChange={e => setDeployData({...deployData, blogPath: e.target.value})} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500" placeholder="E:/Project/personalBlogweb" />
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex justify-between items-center mb-4">
               <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase flex items-center gap-1"><GitBranch size={14} className="text-emerald-500" /> 2. Git 仓库配置</label>
               <button onClick={testGitConnection} disabled={isCheckingGit} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-bold hover:bg-emerald-500/20 transition-colors">
                 {isCheckingGit ? "检测中..." : "校验 Git 环境"}
               </button>
            </div>

            {/* 静态部署配置区 */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mb-4 relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1"><Rocket size={12}/> 静态站点仓库</h4>
                <button onClick={(e) => { e.preventDefault(); handleGetSSH('static'); }} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all">
                  <Key size={12} /> 获取静态部署公钥
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">SSH 仓库地址</label>
                  <input type="text" value={deployData.staticRepoUrl} onChange={e => setDeployData({...deployData, staticRepoUrl: e.target.value})} className="w-full bg-white dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-700/50 rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono focus:ring-2 focus:ring-emerald-500" placeholder="git@github.com:..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">目标分支</label>
                  <input type="text" value={deployData.staticBranch} onChange={e => setDeployData({...deployData, staticBranch: e.target.value})} className="w-full bg-white dark:bg-slate-900/50 border border-emerald-200/50 dark:border-emerald-700/50 rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono focus:ring-2 focus:ring-emerald-500" placeholder="gh-pages" />
                </div>
              </div>
            </div>

            {/* 源码同步配置区 */}
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl mb-6 relative">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1"><Code size={12}/> 源码触发仓库</h4>
                <button onClick={(e) => { e.preventDefault(); handleGetSSH('source'); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black hover:bg-blue-500 hover:text-white transition-all">
                  <Key size={12} /> 获取源码同步公钥
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">SSH 仓库地址</label>
                  <input type="text" value={deployData.sourceRepoUrl} onChange={e => setDeployData({...deployData, sourceRepoUrl: e.target.value})} className="w-full bg-white dark:bg-slate-900/50 border border-blue-200/50 dark:border-blue-700/50 rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono focus:ring-2 focus:ring-blue-500" placeholder="git@github-source:..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">源码分支</label>
                  <input type="text" value={deployData.sourceBranch} onChange={e => setDeployData({...deployData, sourceBranch: e.target.value})} className="w-full bg-white dark:bg-slate-900/50 border border-blue-200/50 dark:border-blue-700/50 rounded-xl px-4 py-2 text-xs mt-1 outline-none font-mono focus:ring-2 focus:ring-blue-500" placeholder="main" />
                </div>
              </div>
            </div>

            {/* 操作按钮区 */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex flex-col gap-3">
               <button onClick={() => setModalConfig({isOpen: true, type: 'init'})} disabled={isInitializing} className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-sm font-black shadow-sm active:scale-95 transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/50">
                  <Wand2 size={18} className={isInitializing ? "animate-spin" : ""} /> {isInitializing ? "初始化中..." : "初始化部署环境"}
               </button>

               <div className="flex gap-3 flex-col md:flex-row">
                 <button onClick={() => setModalConfig({isOpen: true, type: 'deploy'})} disabled={isDeploying || isUploading} className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/30 active:scale-95 transition-all hover:bg-emerald-600">
                    <Rocket size={18} className={isDeploying ? "animate-bounce" : ""} /> {isDeploying ? "发布中..." : "编译并发布静态站点"}
                 </button>

                 <button onClick={() => setModalConfig({isOpen: true, type: 'upload'})} disabled={isDeploying || isUploading} className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-600">
                    <CloudUpload size={18} className={isUploading ? "animate-pulse" : ""} /> {isUploading ? "同步中..." : "同步源码到 Vercel"}
                 </button>
               </div>
            </div>
          </div>

          <button onClick={handleSaveConfig} disabled={isSaving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all hover:shadow-2xl hover:-translate-y-1">
            <Save size={18} className="inline mr-2" /> {isSaving ? "正在保存..." : "保存部署配置"}
          </button>
        </div>
      </motion.section>

      {/* 弹窗挂载点 */}
      {portalRoot && createPortal(
        <AnimatePresence>
          {modalConfig.isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalConfig({ isOpen: false, type: null })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />

              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">

                {modalConfig.type === 'ssh' && (
                  <>
                        <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><Key className="text-amber-500" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                          {sshConfig.type === 'static' ? '静态部署' : '源码同步'}公钥已生成
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">请将此公钥配置到对应 GitHub 仓库的 Deploy Keys 中，并按用途授予写入权限。</p>

                        <div className="relative group mb-8">
                            <div className="w-full bg-slate-900 dark:bg-black rounded-2xl p-4 text-[10px] font-mono text-emerald-400 text-left break-all h-32 overflow-y-auto custom-scrollbar border border-white/10 select-all">
                                {sshConfig.key}
                            </div>
                            <button onClick={copyToClipboard} className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white">
                                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-left bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">1</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">复制上方公钥内容</p>
                            </div>
                            <div className="flex items-center gap-3 text-left bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">2</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex-1">前往该 GitHub 仓库的 Settings -&gt; Deploy keys 页面</p>
                            </div>
                            <div className="flex items-center gap-3 text-left bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">3</div>
                                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">添加该公钥并<strong className="text-indigo-500 ml-1">勾选 Allow write access</strong></p>
                            </div>
                        </div>
                        <button onClick={() => setModalConfig({isOpen: false, type: null})} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black uppercase">我已完成配置</button>
                  </>
                )}

                {modalConfig.type === 'init' && (
                    <>
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><Wand2 className="text-indigo-500" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">初始化部署环境？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">将初始化 Git、配置静态仓库，并安装静态发布依赖。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeInitEnv} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">确认执行</button>
                        </div>
                    </>
                )}

                {modalConfig.type === 'deploy' && (
                    <>
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><Rocket className="text-emerald-500" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">执行编译并部署？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">打包前端静态文件，并推送至已配置的静态站点仓库。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeDeploy} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">确认执行</button>
                        </div>
                    </>
                )}

                {modalConfig.type === 'upload' && (
                    <>
                        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><CloudUpload className="text-blue-500" size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">同步源码至 Vercel？</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">将本地源代码提交并推送到源码仓库，自动触发 Vercel 构建。</p>
                        <div className="flex gap-3">
                            <button onClick={() => setModalConfig({isOpen: false, type: null})} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors hover:bg-slate-200">取消</button>
                            <button onClick={executeUploadSource} className="flex-1 py-4 bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/30 active:scale-95 transition-all">开始同步</button>
                        </div>
                    </>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </>
  );
}
