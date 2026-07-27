import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import {
  Terminal,
  Play,
  Square,
  RotateCw,
  Send,
  FileCode,
  CheckCircle2,
  Copy,
  Trash2,
  AlertTriangle,
  Radio,
  Power,
  ChevronDown,
  ChevronUp,
  Folder,
  ShieldCheck,
  Zap,
  Globe,
  ExternalLink,
  Link2
} from 'lucide-react';

interface TerminalViewerProps {
  serverName: string;
  startScript: string;
  eula: string;
  files: string[];
  isRunning?: boolean;
  status?: 'stopped' | 'starting' | 'running' | 'stopping';
  onRefreshDetail?: () => void;
  lang: Language;
}

export const TerminalViewer: React.FC<TerminalViewerProps> = ({
  serverName,
  startScript,
  eula,
  files,
  isRunning: initialIsRunning,
  status: initialStatus,
  onRefreshDetail,
  lang,
}) => {
  const isEs = lang === 'es';

  const [logs, setLogs] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'stopped' | 'starting' | 'running' | 'stopping'>(
    initialStatus || 'stopped'
  );
  const [commandInput, setCommandInput] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [claimCopied, setClaimCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [showFilesSection, setShowFilesSection] = useState<boolean>(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Extract claim link from logs if present
  const detectedClaimUrl = React.useMemo(() => {
    for (let i = logs.length - 1; i >= 0; i--) {
      const line = logs[i];
      const match = line.match(/(https?:\/\/(?:www\.)?playit\.gg\/claim\/[^\s"'\)>]+)/i) ||
                    line.match(/(https?:\/\/(?:www\.)?playit\.gg\/[^\s"'\)>]+)/i);
      if (match) {
        return match[1];
      }
    }
    return null;
  }, [logs]);

  // Poll server status and logs
  const fetchLogsAndStatus = async () => {
    try {
      const res = await fetch(`/api/servers/${serverName}/logs`);
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs || []);
      if (data.status) {
        setCurrentStatus(data.status);
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
    }
  };

  useEffect(() => {
    fetchLogsAndStatus();
    const interval = setInterval(fetchLogsAndStatus, 1500);
    return () => clearInterval(interval);
  }, [serverName]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleStartServer = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverName}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar servidor');
      setCurrentStatus('starting');
      fetchLogsAndStatus();
      if (onRefreshDetail) onRefreshDetail();
    } catch (err: any) {
      alert(err.message || 'Error al iniciar servidor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopServer = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverName}/stop`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al detener servidor');
      setCurrentStatus('stopping');
      fetchLogsAndStatus();
      if (onRefreshDetail) onRefreshDetail();
    } catch (err: any) {
      alert(err.message || 'Error al detener servidor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartServer = async () => {
    setActionLoading(true);
    try {
      await fetch(`/api/servers/${serverName}/stop`, { method: 'POST' });
      setCurrentStatus('stopping');
      setTimeout(async () => {
        await fetch(`/api/servers/${serverName}/start`, { method: 'POST' });
        setCurrentStatus('starting');
        fetchLogsAndStatus();
        if (onRefreshDetail) onRefreshDetail();
        setActionLoading(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message);
      setActionLoading(false);
    }
  };

  const handleSendCommand = async (cmdToSend?: string) => {
    const targetCmd = cmdToSend !== undefined ? cmdToSend : commandInput;
    if (!targetCmd.trim()) return;

    try {
      const res = await fetch(`/api/servers/${serverName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: targetCmd }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar comando');
      }
      if (cmdToSend === undefined) {
        setCommandInput('');
      }
      setTimeout(fetchLogsAndStatus, 300);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(startScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickCommands = [
    { label: 'list', cmd: 'list' },
    { label: 'help', cmd: 'help' },
    { label: isEs ? 'Día (time)' : 'Daytime', cmd: 'time set day' },
    { label: 'OP Jugador', cmd: 'op ' },
    { label: isEs ? 'Modo Creativo' : 'Creative Mode', cmd: 'gamemode creative @a' },
    { label: isEs ? 'Anunciar Servidor' : 'Say Hello', cmd: 'say ¡Servidor Minecraft listo para jugar!' },
  ];

  return (
    <div className="space-y-6">
      {/* Control Panel Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${
              currentStatus === 'running'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : currentStatus === 'starting' || currentStatus === 'stopping'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Power className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-bold text-slate-100">{serverName}</h2>
                {currentStatus === 'running' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    EN EJECUCIÓN (ONLINE)
                  </span>
                )}
                {currentStatus === 'starting' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                    <Radio className="w-3 h-3 animate-spin" />
                    INICIANDO...
                  </span>
                )}
                {currentStatus === 'stopping' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
                    DETENIENDO...
                  </span>
                )}
                {currentStatus === 'stopped' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-mono font-bold">
                    DETENIDO (OFFLINE)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isEs
                  ? 'Consola de comandos y control de ejecución directa desde la interfaz.'
                  : 'Live terminal console and process controls directly from the web GUI.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentStatus === 'stopped' ? (
              <button
                id="start-server-gui-btn"
                onClick={handleStartServer}
                disabled={actionLoading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isEs ? 'Iniciar Servidor' : 'Start Server'}</span>
              </button>
            ) : (
              <>
                <button
                  id="restart-server-gui-btn"
                  onClick={handleRestartServer}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-slate-700 font-display font-bold text-xs transition-all disabled:opacity-50"
                  title={isEs ? 'Reiniciar Servidor' : 'Restart Server'}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isEs ? 'Reiniciar' : 'Restart'}</span>
                </button>

                <button
                  id="stop-server-gui-btn"
                  onClick={handleStopServer}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{isEs ? 'Detener Servidor' : 'Stop Server'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Playit Claim Link Banner */}
        {detectedClaimUrl && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/60 rounded-2xl p-5 shadow-2xl space-y-3 my-2 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2 text-indigo-200 font-bold font-display text-sm">
                <Globe className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
                <span>{isEs ? '🔗 ¡Enlace de Reclamación de Playit.gg Detectado!' : '🔗 Playit.gg Agent Claim Link Detected!'}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/40 shrink-0">
                PASO REQUERIDO PARA TÚNEL
              </span>
            </div>

            <p className="text-xs text-indigo-200/90 leading-relaxed">
              {isEs
                ? 'Copia el siguiente enlace y pégalo en la barra de búsqueda de tu navegador para reclamar el agente en Playit.gg y crear tu túnel de conexión gratuito:'
                : 'Copy the link below and paste it into your browser search bar to claim the agent on Playit.gg and create your public connection tunnel:'}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <div className="relative w-full flex-1">
                <input
                  type="text"
                  readOnly
                  value={detectedClaimUrl}
                  className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-2.5 font-mono text-xs text-indigo-300 select-all focus:outline-none shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="copy-playit-claim-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(detectedClaimUrl);
                    setClaimCopied(true);
                    setTimeout(() => setClaimCopied(false), 2000);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all shrink-0"
                >
                  {claimCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{claimCopied ? (isEs ? '¡Copiado!' : 'Copied!') : (isEs ? 'Copiar Enlace' : 'Copy Link')}</span>
                </button>

                <a
                  href={detectedClaimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/50 text-indigo-300 hover:text-white font-display font-bold text-xs transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{isEs ? 'Abrir en Navegador' : 'Open in Browser'}</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Console Window */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider">
                {isEs ? 'Consola en Vivo / Terminal output' : 'Live Server Console'}
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                ({logs.length} {isEs ? 'líneas' : 'lines'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                  autoScroll
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {isEs ? 'Auto-desplazar' : 'Auto-scroll'}: {autoScroll ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 text-xs transition-colors"
                title={isEs ? 'Copiar Consola' : 'Copy Logs'}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setLogs([])}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs transition-colors"
                title={isEs ? 'Limpiar pantalla' : 'Clear Screen'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 h-80 overflow-y-auto space-y-1 shadow-inner leading-relaxed">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                <Terminal className="w-8 h-8 text-slate-700" />
                <p>
                  {isEs
                    ? 'La consola está vacía. Haz clic en "Iniciar Servidor" arriba para ver la salida del proceso en tiempo real.'
                    : 'Console is empty. Click "Start Server" above to launch the process and monitor logs.'}
                </p>
              </div>
            ) : (
              logs.map((line, idx) => {
                const isClaimLine = line.includes('playit.gg') || line.includes('claim');
                const isErr = line.includes('[ERROR]') || line.includes('[STDERR]') || line.includes('Exception');
                const isSys = line.includes('GUI') || line.includes('SYSTEM') || line.includes('PLAYIT');
                const isWarn = line.includes('WARN');

                // Check for URLs inside line to render as interactive links
                const urlMatch = line.match(/(https?:\/\/[^\s"'\)>]+)/gi);

                return (
                  <div
                    key={idx}
                    className={`whitespace-pre-wrap break-all ${
                      isClaimLine
                        ? 'text-indigo-300 bg-indigo-950/60 p-1.5 rounded border border-indigo-500/40 font-bold my-1'
                        : isErr
                        ? 'text-rose-400 bg-rose-500/5 px-1 rounded'
                        : isSys
                        ? 'text-indigo-300 font-bold'
                        : isWarn
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {urlMatch ? (
                      line.split(/(https?:\/\/[^\s"'\)>]+)/gi).map((part, pIdx) => {
                        if (part.match(/^https?:\/\//i)) {
                          return (
                            <a
                              key={pIdx}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 hover:text-white underline font-bold transition-all border border-indigo-400/50 mx-1 my-0.5 shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link2 className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                              <span>{part}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                            </a>
                          );
                        }
                        return <span key={pIdx}>{part}</span>;
                      })
                    ) : (
                      line
                    )}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Command Input Bar */}
          <div className="space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCommand();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-emerald-500 font-bold">
                  &gt;
                </span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  disabled={currentStatus === 'stopped'}
                  placeholder={
                    currentStatus === 'stopped'
                      ? isEs
                        ? 'Inicia el servidor para enviar comandos...'
                        : 'Start the server to send console commands...'
                      : isEs
                      ? 'Escribe un comando de Minecraft (ej: list, op tu_usuario, say Hola)...'
                      : 'Enter Minecraft console command (e.g. list, op player, say hello)...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={currentStatus === 'stopped' || !commandInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 shrink-0 shadow-lg shadow-emerald-500/10"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isEs ? 'Enviar' : 'Send'}</span>
              </button>
            </form>

            {/* Quick Command Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-mono text-slate-500 mr-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                {isEs ? 'Atajos:' : 'Quick:'}
              </span>
              {quickCommands.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={currentStatus === 'stopped'}
                  onClick={() => {
                    if (item.cmd.endsWith(' ')) {
                      setCommandInput(item.cmd);
                    } else {
                      handleSendCommand(item.cmd);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors disabled:opacity-40"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Files & Script Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <button
          onClick={() => setShowFilesSection(!showFilesSection)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-display font-bold text-slate-100">
              {isEs ? 'Script de Inicio (start.sh) y Archivos Locales' : 'Startup Script & Local Files'}
            </h3>
          </div>
          {showFilesSection ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showFilesSection && (
          <div className="pt-4 border-t border-slate-800 space-y-6">
            {/* start.sh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  start.sh
                </label>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 text-xs font-mono transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? (isEs ? '¡Copiado!' : 'Copied!') : (isEs ? 'Copiar Script' : 'Copy Script')}
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed shadow-inner">
                {startScript || '# start.sh'}
              </pre>
            </div>

            {/* EULA & Directory files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  eula.txt
                </label>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                  {eula || 'eula=true'}
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
                  <Folder className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Archivos Encontrados en la Carpeta' : 'Directory Files'}
                </label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 max-h-40 overflow-y-auto space-y-1">
                  {files.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-emerald-500">📄</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
