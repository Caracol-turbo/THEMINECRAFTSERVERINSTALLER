import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InstallerWizard } from './components/InstallerWizard';
import { ServerManager } from './components/ServerManager';
import { PropertiesEditor } from './components/PropertiesEditor';
import { OpsEditor } from './components/OpsEditor';
import { TerminalViewer } from './components/TerminalViewer';
import { PlayitEditor } from './components/PlayitEditor';
import { RunGuideModal } from './components/RunGuideModal';
import { ServerSummary, ServerDetail, Language, OpEntry } from './types';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('es');
  const [activeTab, setActiveTab] = useState<'installer' | 'servers' | 'editor'>('installer');
  const [activeSubTab, setActiveSubTab] = useState<'script' | 'properties' | 'ops' | 'playit'>('script');
  const [showRunGuide, setShowRunGuide] = useState<boolean>(false);

  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [loadingServers, setLoadingServers] = useState<boolean>(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const [selectedServerName, setSelectedServerName] = useState<string | null>(null);
  const [selectedServerDetail, setSelectedServerDetail] = useState<ServerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Fetch server list on mount
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoadingServers(true);
    setServerError(null);
    try {
      const res = await fetch('/api/servers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to list servers');
      setServers(data.servers || []);

      // If we have servers and none selected, default select first
      if (data.servers && data.servers.length > 0 && !selectedServerName) {
        setSelectedServerName(data.servers[0].name);
      }
    } catch (err: any) {
      setServerError(err.message || 'Error connecting to backend');
    } finally {
      setLoadingServers(false);
    }
  };

  // Fetch details for selected server
  useEffect(() => {
    if (selectedServerName) {
      fetchServerDetail(selectedServerName);
    }
  }, [selectedServerName]);

  const fetchServerDetail = async (name: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/servers/${name}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch server detail');
      setSelectedServerDetail(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleServerCreated = async (serverName: string) => {
    await fetchServers();
    setSelectedServerName(serverName);
    setActiveTab('servers');
  };

  const handleDeleteServer = async (name: string) => {
    try {
      const res = await fetch(`/api/servers/${name}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete server');
      if (selectedServerName === name) {
        setSelectedServerName(null);
        setSelectedServerDetail(null);
      }
      await fetchServers();
    } catch (err: any) {
      alert(`Error deleting server: ${err.message}`);
    }
  };

  const handleSaveProperties = async (propsData: Record<string, string> | string) => {
    if (!selectedServerName) return;
    const res = await fetch(`/api/servers/${selectedServerName}/properties`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: propsData }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update properties');
    }
    await fetchServerDetail(selectedServerName);
  };

  const handleSaveOps = async (opsData: OpEntry[]) => {
    if (!selectedServerName) return;
    const res = await fetch(`/api/servers/${selectedServerName}/ops`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops: opsData }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update ops');
    }
    await fetchServerDetail(selectedServerName);
  };

  const handleSelectServerForEditing = (serverName: string, subTab: 'properties' | 'ops' | 'script' | 'playit') => {
    setSelectedServerName(serverName);
    setActiveSubTab(subTab);
    setActiveTab('editor');
  };

  const isEs = lang === 'es';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverCount={servers.length}
        onOpenRunGuide={() => setShowRunGuide(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Banner */}
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
            <button
              onClick={fetchServers}
              className="px-3 py-1 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 font-mono"
            >
              Retry
            </button>
          </div>
        )}

        {/* TAB 1: INSTALLER WIZARD */}
        {activeTab === 'installer' && (
          <InstallerWizard lang={lang} onServerCreated={handleServerCreated} />
        )}

        {/* TAB 2: SERVERS LIST MANAGER */}
        {activeTab === 'servers' && (
          <ServerManager
            servers={servers}
            loading={loadingServers}
            onRefresh={fetchServers}
            onSelectServer={handleSelectServerForEditing}
            onDeleteServer={handleDeleteServer}
            onNewServer={() => setActiveTab('installer')}
            lang={lang}
          />
        )}

        {/* TAB 3: CONFIG & OPS EDITOR */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Server Selector Dropdown & Subtabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('servers')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    {isEs ? 'Servidor Seleccionado' : 'Selected Server'}
                  </label>
                  <select
                    id="editor-server-select"
                    value={selectedServerName || ''}
                    onChange={(e) => setSelectedServerName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-display font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 mt-0.5"
                  >
                    {servers.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.ramAllocated}GB RAM)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-tabs selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center flex-wrap">
                <button
                  id="editor-subtab-script"
                  onClick={() => setActiveSubTab('script')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeSubTab === 'script' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    selectedServerDetail?.status === 'running'
                      ? 'bg-emerald-950 animate-pulse'
                      : selectedServerDetail?.status === 'starting'
                      ? 'bg-amber-400'
                      : 'bg-slate-600'
                  }`} />
                  {isEs ? 'Consola en Vivo & Control' : 'Live Console & Control'}
                </button>
                <button
                  id="editor-subtab-props"
                  onClick={() => setActiveSubTab('properties')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSubTab === 'properties' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  server.properties
                </button>
                <button
                  id="editor-subtab-ops"
                  onClick={() => setActiveSubTab('ops')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSubTab === 'ops' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ops.json
                </button>
                <button
                  id="editor-subtab-playit"
                  onClick={() => setActiveSubTab('playit')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeSubTab === 'playit' ? 'bg-indigo-600 text-white font-semibold' : 'text-indigo-400 hover:text-indigo-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Playit.gg
                </button>
              </div>
            </div>

            {/* Sub-tab content */}
            {loadingDetail ? (
              <div className="py-20 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-400 font-mono">
                  {isEs ? 'Cargando datos del servidor...' : 'Reading server files...'}
                </p>
              </div>
            ) : !selectedServerDetail ? (
              <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm font-mono">
                {isEs ? 'Selecciona un servidor para editar sus archivos.' : 'Select a server to edit configuration.'}
              </div>
            ) : (
              <>
                {activeSubTab === 'script' && (
                  <TerminalViewer
                    serverName={selectedServerDetail.name}
                    startScript={selectedServerDetail.startScript}
                    eula={selectedServerDetail.eula}
                    files={selectedServerDetail.files}
                    isRunning={selectedServerDetail.isRunning}
                    status={selectedServerDetail.status}
                    onRefreshDetail={() => fetchServerDetail(selectedServerDetail.name)}
                    lang={lang}
                  />
                )}

                {activeSubTab === 'properties' && (
                  <PropertiesEditor
                    serverName={selectedServerDetail.name}
                    properties={selectedServerDetail.properties}
                    rawProperties={selectedServerDetail.rawProperties}
                    onSave={handleSaveProperties}
                    lang={lang}
                  />
                )}

                {activeSubTab === 'ops' && (
                  <OpsEditor
                    serverName={selectedServerDetail.name}
                    ops={selectedServerDetail.ops}
                    onSave={handleSaveOps}
                    lang={lang}
                  />
                )}

                {activeSubTab === 'playit' && (
                  <PlayitEditor
                    serverName={selectedServerDetail.name}
                    hasPlayit={selectedServerDetail.hasPlayit}
                    playitToml={selectedServerDetail.playitToml}
                    onRefresh={() => fetchServerDetail(selectedServerDetail.name)}
                    lang={lang}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Run Guide Modal */}
      <RunGuideModal
        isOpen={showRunGuide}
        onClose={() => setShowRunGuide(false)}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        Minecraft Server Installer • {isEs ? 'Basado en Caracol-turbo/Minecraft-server-installer' : 'Based on Caracol-turbo/Minecraft-server-installer'}
      </footer>
    </div>
  );
}
