import React from 'react';
import { Server, Globe, Shield, Terminal, Cpu } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  activeTab: 'installer' | 'servers' | 'editor';
  setActiveTab: (tab: 'installer' | 'servers' | 'editor') => void;
  serverCount: number;
  onOpenRunGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  serverCount,
  onOpenRunGuide,
}) => {
  const isEs = lang === 'es';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('installer')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <Server className="h-5 w-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-slate-100 tracking-tight">
                  Minecraft Server Installer
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEs ? 'Gestor e Instalador Automático' : 'Automated Server Manager & Installer'}
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              id="nav-tab-installer"
              onClick={() => setActiveTab('installer')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'installer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              {isEs ? 'Nuevo Servidor' : 'New Server'}
            </button>

            <button
              id="nav-tab-servers"
              onClick={() => setActiveTab('servers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'servers'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              {isEs ? 'Mis Servidores' : 'My Servers'}
              {serverCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'servers' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {serverCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-editor"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              {isEs ? 'Configuración' : 'Config Editor'}
            </button>
          </nav>

          {/* Controls Right */}
          <div className="flex items-center gap-3">
            {onOpenRunGuide && (
              <button
                id="run-on-pc-btn"
                onClick={onOpenRunGuide}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-medium transition-colors"
              >
                <span>💻</span>
                <span>{isEs ? 'Probar en PC' : 'Run on PC'}</span>
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
              <Globe className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                id="lang-es-btn"
                onClick={() => setLang('es')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  lang === 'es' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ES
              </button>
              <button
                id="lang-en-btn"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  lang === 'en' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
