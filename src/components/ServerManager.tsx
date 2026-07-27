import React, { useState } from 'react';
import { ServerSummary, Language } from '../types';
import { Server, Settings, Users, FileCode, Trash2, HardDrive, ShieldCheck, Play, Folder, RefreshCw, Plus, Terminal, Square, Radio } from 'lucide-react';

interface ServerManagerProps {
  servers: ServerSummary[];
  loading: boolean;
  onRefresh: () => void;
  onSelectServer: (serverName: string, activeSubTab: 'script' | 'properties' | 'ops' | 'playit') => void;
  onDeleteServer: (serverName: string) => void;
  onNewServer: () => void;
  onStartServer?: (serverName: string) => void;
  onStopServer?: (serverName: string) => void;
  lang: Language;
}

export const ServerManager: React.FC<ServerManagerProps> = ({
  servers,
  loading,
  onRefresh,
  onSelectServer,
  onDeleteServer,
  onNewServer,
  onStartServer,
  onStopServer,
  lang,
}) => {
  const isEs = lang === 'es';
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [actionServer, setActionServer] = useState<string | null>(null);

  const handleStart = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setActionServer(name);
    try {
      const res = await fetch(`/api/servers/${name}/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al iniciar servidor');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionServer(null);
    }
  };

  const handleStop = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setActionServer(name);
    try {
      const res = await fetch(`/api/servers/${name}/stop`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al detener servidor');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionServer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            {isEs ? 'Servidores Instalados' : 'Installed Servers'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEs ? 'Gestiona la configuración, operadores y scripts de inicio de tus servidores de Minecraft.' : 'Manage configuration, ops, and startup scripts for your Minecraft servers.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            id="refresh-servers-btn"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            {isEs ? 'Actualizar' : 'Refresh'}
          </button>

          <button
            id="new-server-btn"
            onClick={onNewServer}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {isEs ? 'Nuevo Servidor' : 'New Server'}
          </button>
        </div>
      </div>

      {/* Servers List Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">
            {isEs ? 'Cargando directorio de servidores...' : 'Scanning servers directory...'}
          </p>
        </div>
      ) : servers.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-slate-200">
              {isEs ? 'No se encontraron servidores' : 'No servers found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {isEs ? 'Todavía no has creado ningún servidor. Haz clic en "Nuevo Servidor" para comenzar el asistente interactivo.' : 'You have not created any servers yet. Click "New Server" to launch the installer.'}
            </p>
          </div>
          <button
            onClick={onNewServer}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {isEs ? 'Crear Primer Servidor' : 'Create First Server'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servers.map((srv) => (
            <div
              key={srv.name}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/30 border border-emerald-500/30 text-emerald-400">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-100 text-lg truncate max-w-[180px]">
                        {srv.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                        servers/{srv.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-slate-800 font-semibold">
                      {srv.ramAllocated} GB RAM
                    </span>
                    {srv.status === 'running' || srv.isRunning ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        ONLINE
                      </span>
                    ) : srv.status === 'starting' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-spin" />
                        INICIANDO
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-500 border border-slate-800 font-semibold">
                        OFFLINE
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Start / Console Row */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {srv.status === 'running' || srv.isRunning ? (
                    <button
                      id={`srv-stop-btn-${srv.name}`}
                      onClick={(e) => handleStop(e, srv.name)}
                      disabled={actionServer === srv.name}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-display font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{isEs ? 'Detener' : 'Stop'}</span>
                    </button>
                  ) : (
                    <button
                      id={`srv-start-btn-${srv.name}`}
                      onClick={(e) => handleStart(e, srv.name)}
                      disabled={actionServer === srv.name || srv.status === 'starting'}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{srv.status === 'starting' ? (isEs ? 'Iniciando...' : 'Starting...') : (isEs ? 'Iniciar Servidor' : 'Start Server')}</span>
                    </button>
                  )}

                  <button
                    id={`srv-console-btn-${srv.name}`}
                    onClick={() => onSelectServer(srv.name, 'script')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-display font-bold text-xs transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{isEs ? 'Consola Live' : 'Live Console'}</span>
                  </button>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-4 gap-1.5 py-3 border-y border-slate-800/80 mb-4 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-300 truncate">
                    <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${srv.hasEula ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>EULA</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 truncate">
                    <Settings className={`w-3.5 h-3.5 shrink-0 ${srv.hasProps ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Props</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${srv.hasStartScript ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Script</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      srv.hasPlayit && srv.hasPlayitKey
                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                        : srv.hasPlayit
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                    }`} />
                    <span className={
                      srv.hasPlayit && srv.hasPlayitKey
                        ? 'text-emerald-400 font-bold'
                        : srv.hasPlayit
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-500'
                    }>
                      {srv.hasPlayit && srv.hasPlayitKey ? 'Playit: OK' : srv.hasPlayit ? 'Playit: Sin Key' : 'Playit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id={`srv-props-btn-${srv.name}`}
                    onClick={() => onSelectServer(srv.name, 'properties')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:border-slate-700 text-xs font-medium transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {isEs ? 'Propiedades' : 'Properties'}
                  </button>

                  <button
                    id={`srv-ops-btn-${srv.name}`}
                    onClick={() => onSelectServer(srv.name, 'ops')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:text-emerald-400 hover:border-slate-700 text-xs font-medium transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {isEs ? 'Operadores' : 'Ops (OP)'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`srv-script-btn-${srv.name}`}
                    onClick={() => onSelectServer(srv.name, 'script')}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-slate-700 text-xs font-medium transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {isEs ? 'Scripts' : 'Scripts'}
                  </button>

                  <button
                    id={`srv-playit-btn-${srv.name}`}
                    onClick={() => onSelectServer(srv.name, 'playit')}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs font-medium transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Playit
                  </button>

                  {deletingName === srv.name ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDeleteServer(srv.name);
                          setDeletingName(null);
                        }}
                        className="px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                      >
                        {isEs ? 'Sí' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setDeletingName(null)}
                        className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                      >
                        {isEs ? 'No' : 'No'}
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`srv-delete-btn-${srv.name}`}
                      onClick={() => setDeletingName(srv.name)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
                      title={isEs ? 'Eliminar Servidor' : 'Delete Server'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
