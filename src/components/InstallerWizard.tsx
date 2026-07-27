import React, { useState, useEffect } from 'react';
import { SoftwareType, Language } from '../types';
import { SOFTWARES, SoftwareCard } from './SoftwareCard';
import { Terminal, Download, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Cpu, HardDrive, Layers, Server } from 'lucide-react';

interface InstallerWizardProps {
  lang: Language;
  onServerCreated: (serverName: string) => void;
}

export const InstallerWizard: React.FC<InstallerWizardProps> = ({ lang, onServerCreated }) => {
  const isEs = lang === 'es';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [software, setSoftware] = useState<SoftwareType>('paper');
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versionSearch, setVersionSearch] = useState<string>('');
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const [serverName, setServerName] = useState<string>('MyMinecraftServer');
  const [ram, setRam] = useState<number>(4);
  const [installPlayit, setInstallPlayit] = useState<boolean>(true);
  const [playitSecretKey, setPlayitSecretKey] = useState<string>('');

  const [installing, setInstalling] = useState<boolean>(false);
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [installError, setInstallError] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  // Fetch version list when software changes
  useEffect(() => {
    fetchVersions(software);
  }, [software]);

  const fetchVersions = async (sw: SoftwareType) => {
    setLoadingVersions(true);
    setVersionError(null);
    try {
      const res = await fetch(`/api/versions/${sw}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load versions');

      let rawVers: string[] = [];
      if (Array.isArray(data.versions)) {
        rawVers = data.versions.map((v: any) => (typeof v === 'string' ? v : v.id));
      }

      if (rawVers.length === 0) {
        rawVers = ['26.2', '26.1', '25.4', '25.2', '1.21.4', '1.21.3', '1.21.1', '1.20.6', '1.20.4', '1.19.4', '1.18.2', '1.16.5', '1.12.2'];
      }

      setVersions(rawVers);
      setSelectedVersion(rawVers[0] || '26.2');
    } catch (err: any) {
      setVersionError(err.message || 'Error loading version list');
      setVersions(['26.2', '26.1', '25.4', '25.2', '1.21.4', '1.21.3', '1.21.1', '1.20.6', '1.20.4', '1.19.4', '1.18.2', '1.16.5', '1.12.2']);
      setSelectedVersion('26.2');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleStartInstallation = async () => {
    if (!serverName.trim()) return;

    setStep(4);
    setInstalling(true);
    setInstallLogs([`[${new Date().toLocaleTimeString()}] Inicializando proceso de instalación...`]);
    setInstallError(null);
    setInstallSuccess(false);

    try {
      const res = await fetch('/api/servers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serverName.trim(),
          software,
          version: selectedVersion,
          ram,
          installPlayit,
          playitSecretKey: playitSecretKey.trim(),
        }),
      });

      const data = await res.json();

      if (data.logs && Array.isArray(data.logs)) {
        setInstallLogs(data.logs);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Server installation failed');
      }

      setInstallSuccess(true);
      onServerCreated(data.serverName || serverName);
    } catch (err: any) {
      setInstallError(err.message || 'Installation process encountered an error');
    } finally {
      setInstalling(false);
    }
  };

  const filteredVersions = versions.filter((v) =>
    v.toLowerCase().includes(versionSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Wizard Progress Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
          {[
            { id: 1, title: isEs ? '1. Software' : '1. Software', icon: Layers },
            { id: 2, title: isEs ? '2. Versión' : '2. Version', icon: RefreshCw },
            { id: 3, title: isEs ? '3. Configuración' : '3. Settings', icon: Cpu },
            { id: 4, title: isEs ? '4. Instalación' : '4. Installation', icon: Terminal },
          ].map((s) => {
            const Icon = s.icon;
            const active = step === s.id;
            const completed = step > s.id;

            return (
              <button
                key={s.id}
                disabled={step === 4 && installing}
                onClick={() => {
                  if (s.id < step || (s.id === 2 && selectedVersion) || (s.id === 3 && selectedVersion)) {
                    setStep(s.id as any);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-semibold'
                    : completed
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                    active
                      ? 'bg-emerald-500 text-slate-950'
                      : completed
                      ? 'bg-slate-800 text-emerald-400'
                      : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  {completed ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <div className="hidden sm:block overflow-hidden truncate">
                  <span className="text-xs block font-display truncate">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: SELECT SOFTWARE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-100">
                {isEs ? 'Selecciona el Software del Servidor' : 'Select Server Software'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isEs
                  ? 'Elige entre Vanilla oficial, motores optimizados para plugins o plataformas de mods.'
                  : 'Choose between official Vanilla, optimized plugin engines, or modding platforms.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOFTWARES.map((sw) => (
              <SoftwareCard
                key={sw.id}
                software={sw}
                selected={software === sw.id}
                onSelect={(id) => setSoftware(id)}
                lang={lang}
              />
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              id="wizard-next-step1"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              {isEs ? 'Continuar a Selección de Versión' : 'Continue to Version Selection'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT VERSION */}
      {step === 2 && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
                <span>{isEs ? 'Versión para' : 'Version for'}</span>
                <span className="text-emerald-400 uppercase font-mono">{software}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isEs ? 'Lista de versiones obtenidas en tiempo real directamente de la API oficial.' : 'Live list fetched directly from official APIs.'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                id="version-search-input"
                type="text"
                placeholder={isEs ? 'Buscar versión (ej. 1.21)...' : 'Search version (e.g. 1.21)...'}
                value={versionSearch}
                onChange={(e) => setVersionSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
              />
              <button
                id="reload-versions-btn"
                onClick={() => fetchVersions(software)}
                disabled={loadingVersions}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loadingVersions ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {loadingVersions ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400 font-mono">
                {isEs ? 'Cargando lista de versiones desde el servidor...' : 'Fetching available versions from API...'}
              </p>
            </div>
          ) : versionError ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{versionError} - Usando versiones estándar en su lugar.</span>
            </div>
          ) : null}

          {!loadingVersions && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-80 overflow-y-auto pr-2">
              {filteredVersions.map((ver) => {
                const isSelected = selectedVersion === ver;
                return (
                  <button
                    key={ver}
                    id={`ver-btn-${ver}`}
                    onClick={() => setSelectedVersion(ver)}
                    className={`py-3 px-3 rounded-xl border text-center font-mono text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    {ver}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              {isEs ? 'Atrás' : 'Back'}
            </button>

            <button
              id="wizard-next-step2"
              disabled={!selectedVersion}
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isEs ? 'Configurar Servidor' : 'Configure Server'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONFIGURE SERVER NAME & RAM */}
      {step === 3 && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-display font-bold text-slate-100">
              {isEs ? 'Configuración Básica' : 'Basic Configuration'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isEs ? 'Asigna el nombre de la carpeta y los recursos de memoria RAM.' : 'Assign server directory name and memory resources.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                {isEs ? 'Nombre del Servidor' : 'Server Name'}
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="server-name-input"
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="MyServer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {isEs ? 'Se creará en la ruta: ' : 'Created at path: '}
                <span className="font-mono text-slate-400">servers/{serverName || 'MyServer'}</span>
              </p>
            </div>

            {/* RAM Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  {isEs ? 'Asignación de Memoria RAM (GB)' : 'RAM Memory Allocation (GB)'}
                </label>
                <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {ram} GB
                </span>
              </div>

              {/* RAM Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[2, 4, 8, 16].map((r) => (
                  <button
                    key={r}
                    id={`ram-preset-${r}`}
                    onClick={() => setRam(r)}
                    className={`py-2 rounded-xl font-mono text-xs border transition-all ${
                      ram === r
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {r} GB
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                id="ram-slider"
                type="range"
                min="1"
                max="32"
                value={ram}
                onChange={(e) => setRam(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Playit.gg Option Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start gap-4">
              <input
                id="install-playit-checkbox"
                type="checkbox"
                checked={installPlayit}
                onChange={(e) => setInstallPlayit(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
              <div className="space-y-1">
                <label htmlFor="install-playit-checkbox" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono">
                    PLAYIT.GG
                  </span>
                  {isEs ? 'Incluir soporte para Túneles de Playit.gg' : 'Include Playit.gg Tunnel Support'}
                </label>
                <p className="text-xs text-slate-400">
                  {isEs
                    ? 'Descarga el ejecutable de Playit.gg (Linux/Windows) y configura los scripts de inicio para abrir un túnel público gratis sin abrir puertos.'
                    : 'Downloads Playit.gg agent binaries and updates start scripts to easily open a free public tunnel without port forwarding.'}
                </p>
              </div>
            </div>

            {installPlayit && (
              <div className="pt-2 border-t border-slate-850 space-y-1.5 pl-8">
                <label className="text-[11px] font-mono font-semibold text-slate-300 flex items-center justify-between">
                  <span>{isEs ? 'Playit Secret Key (Recomendado / Opcional):' : 'Playit Secret Key (Recommended / Optional):'}</span>
                  <a
                    href="https://playit.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline text-[10px] font-sans"
                  >
                    {isEs ? 'Obtener en playit.gg' : 'Get at playit.gg'}
                  </a>
                </label>
                <input
                  type="text"
                  value={playitSecretKey}
                  onChange={(e) => setPlayitSecretKey(e.target.value)}
                  placeholder={isEs ? 'Pega tu Secret Key de Playit.gg aquí (o déjala vacía si vas a usar el claim URL al iniciar)' : 'Paste your Playit Secret Key here (or leave blank to use claim URL on first launch)'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Installation Summary Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider">
              {isEs ? 'Resumen de Instalación' : 'Installation Summary'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Software</span>
                <span className="font-mono text-emerald-400 font-bold uppercase">{software}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{isEs ? 'Versión' : 'Version'}</span>
                <span className="font-mono text-slate-200">{selectedVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">EULA</span>
                <span className="font-mono text-emerald-400 font-bold">Autocombinada (eula=true)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Script</span>
                <span className="font-mono text-slate-200">start.sh (-Xmx{ram}G)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              {isEs ? 'Atrás' : 'Back'}
            </button>

            <button
              id="start-installation-btn"
              onClick={handleStartInstallation}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-display font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              {isEs ? 'Instalar Servidor Ahora' : 'Install Server Now'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INSTALLATION CONSOLE LOGS */}
      {step === 4 && (
        <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-100">
                  {installing
                    ? isEs ? 'Instalando Servidor...' : 'Installing Server...'
                    : installSuccess
                    ? isEs ? '¡Instalación Completada!' : 'Installation Complete!'
                    : isEs ? 'Error en Instalación' : 'Installation Error'}
                </h2>
                <p className="text-xs text-slate-400">
                  {serverName} • {software.toUpperCase()} {selectedVersion}
                </p>
              </div>
            </div>

            {installSuccess && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isEs ? 'Listo' : 'Ready'}
              </span>
            )}
          </div>

          {/* Console Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1.5 h-80 overflow-y-auto shadow-inner">
            {installLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed flex items-start gap-2">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={log.includes('Error') || log.includes('❌') ? 'text-rose-400 font-bold' : log.includes('🎉') || log.includes('correctamente') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
            {installing && (
              <div className="flex items-center gap-2 text-emerald-400 pt-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isEs ? 'Descargando y configurando archivos...' : 'Downloading and creating files...'}</span>
              </div>
            )}
          </div>

          {/* Result Actions */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setStep(1)}
              disabled={installing}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isEs ? 'Crear Otro Servidor' : 'Create Another Server'}
            </button>

            {installSuccess && (
              <button
                id="manage-created-server-btn"
                onClick={() => onServerCreated(serverName)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isEs ? 'Gestionar Servidor' : 'Manage Server'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
