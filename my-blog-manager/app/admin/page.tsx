"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Images, Inbox, LayoutDashboard, Rocket, Settings, X } from 'lucide-react';
import { siteConfig } from '../../siteConfig';

export default function AdminDashboard() {
  // 当前选中的功能模块
  const [activeTab, setActiveTab] = useState('dashboard');

  const [operations] = useState<Array<{ id: number; text: string; time: string }>>([]);

  // 控制操作箱的展开与折叠
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);

  // 左侧导航菜单配置
  const menuItems = [
    { id: 'dashboard', name: '控制台', icon: LayoutDashboard },
    { id: 'posts', name: '文章管理', icon: FileText },
    { id: 'gallery', name: '图库管理', icon: Images },
    { id: 'settings', name: '系统设置', icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-10 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto relative z-10">

      {/* ==========================================
          1. 左侧中枢导航栏
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 shrink-0 flex flex-col gap-6"
      >
        {/* 个人名片区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 flex flex-col items-center shadow-lg">
          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <img src={siteConfig.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800" />
          </div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wider">{siteConfig.authorName}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold tracking-[0.2em] uppercase">CMS Administrator</p>
        </div>

        {/* 导航菜单区 */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-4 shadow-lg flex flex-col gap-2">
          {menuItems.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm
                ${activeTab === id 
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 translate-x-2' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:translate-x-1'}
              `}
            >
              <Icon size={18} />
              {name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ==========================================
          2. 右侧工作区
          ========================================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col gap-6"
      >
        {/* 顶部操作面板 (包含红点消息和部署按钮) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl h-20 px-6 flex items-center justify-between shadow-lg relative">

          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            {menuItems.find(m => m.id === activeTab)?.name}
          </h1>

          <div className="flex items-center gap-4">
            {/* 操作箱图标与红点 */}
            <div className="relative">
              <button
                onClick={() => setIsOpBoxOpen(!isOpBoxOpen)}
                className="w-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-xl hover:bg-white dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Inbox size={20} />
              </button>
              {operations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white items-center justify-center">
                    {operations.length}
                  </span>
                </span>
              )}

              {/* 操作箱下拉列表 */}
              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-16 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex justify-between items-center">
                      待同步操作列表
                      <span className="text-xs text-slate-400 font-normal hover:text-indigo-500 cursor-pointer">清空</span>
                    </h3>

                    {operations.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">暂无待处理操作</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                        {operations.map(op => (
                          <div key={op.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center group">
                            <span className="text-sm text-slate-700 dark:text-slate-200 truncate pr-2">{op.text}</span>
                            <button className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={16} strokeWidth={2.4} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 一键部署按钮 */}
            <button disabled={operations.length === 0} className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none hover:from-indigo-600 hover:to-purple-600 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95">
              <Rocket size={18} /> {operations.length === 0 ? '无待发布内容' : '发布待处理内容'}
            </button>
          </div>
        </div>

        {/* 核心内容渲染区 (根据 Tab 动态切换) */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 min-h-[500px] shadow-lg">

          {activeTab === 'dashboard' && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-4 pt-20">
              <LayoutDashboard size={56} />
              <p className="font-bold tracking-widest text-sm">后台管理已就绪</p>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="text-slate-500 text-center pt-20">请使用文章编辑页面管理草稿和文章。</div>
          )}

          {activeTab === 'gallery' && (
            <div className="text-slate-500 text-center pt-20">请使用图库页面管理相册和图片。</div>
          )}

          {activeTab === 'settings' && (
            <div className="text-slate-500 text-center pt-20">请使用设置页面管理站点配置。</div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
