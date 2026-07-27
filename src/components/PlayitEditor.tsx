import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { Globe, Download, Save, ExternalLink, Key, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PlayitEditorProps {
  serverName: string;
  hasPlayit: boolean;
  playitToml: string;
  onRefresh: () => void;
  lang: Language;
}

export const PlayitEditor: React.FC<PlayitEditorProps> = ({
  serverName,
  hasPlayit,
  playitToml,
  onRefresh,
  lang,
}) => {
  const isEs = lang === 'es';

  const [rawToml, setRawToml] = useState<string>(playitToml || `# Playit.gg Configuration\nsecret_key = ""\n`);
  
  // Extract secret key from TOML
  const extractKey = (toml: string): string => {
    const match = toml.match(/secret_key\s*=\s*["']?([^"'\r\n]+)["']?/i);
    return match ? match[1].trim() : '';
  };

  const [secretKeyInput, setSecretKeyInput] = useState<string>(extractKey(playitToml || ''));

  useEffect(() => {
    setRawToml(playitToml || `# Playit.gg Configuration\nsecret_key = ""\n`);
    setSecretKeyInput(extractKey(playitToml || ''));
  }, [playitToml]);

  const currentKey = extractKey(rawToml);
  const isConfiguredWithKey = hasPlayit && currentKey.length > 0;

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [settingUp, setSettingUp] = useState<boolean>(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  const handleSetupPlayit = async () => {
    setSettingUp(true);
    setSetupMessage(null);
    try {
      const res = await fetch(`/api/servers/${serverName}/playit/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKeyInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al configurar Playit.gg');
      setSetupMessage(isEs ? '¡Ejecutables y scripts de Playit.gg instalados correctamente!' : 'Playit.gg binaries installed successfully!');
      onRefresh();
    } catch (err: any) {
      setSetupMessage(`Error: ${err.message}`);
    } finally {
      setSettingUp(false);
    }
  };

  const handleSaveSecretKeyOnly = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/servers/${serverName}/playit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKeyInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar la Secret Key');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToml = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/servers/${serverName}/playit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawToml }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar playit.toml');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
              <span>Túneles de Playit.gg</span>
              {isConfiguredWithKey ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {isEs ? 'INSTALADO Y CONFIGURADO' : 'INSTALLED & CONFIGURED'}
                </span>
              ) : hasPlayit ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {isEs ? 'FALTA SECRET KEY' : 'SECRET KEY REQUIRED'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold">
                  {isEs ? 'NO INSTALADO' : 'NOT INSTALLED'}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isEs
                ? 'Acceso público para tu servidor sin abrir puertos en el router. Requiere colocar la Secret Key de Playit.gg.'
                : 'Free public domain tunnel without opening router ports. Requires setting your Playit.gg Secret Key.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasPlayit ? (
            <button
              id="install-playit-btn"
              onClick={handleSetupPlayit}
              disabled={settingUp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {settingUp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {settingUp ? (isEs ? 'Instalando Playit...' : 'Installing Playit...') : (isEs ? 'Instalar Playit.gg' : 'Install Playit.gg')}
            </button>
          ) : (
            <a
              href="https://playit.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-indigo-400 text-xs font-mono transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>playit.gg</span>
            </a>
          )}
        </div>
      </div>

      {setupMessage && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 font-mono ${
          setupMessage.startsWith('Error')
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{setupMessage}</span>
        </div>
      )}

      {/* Secret Key Input Card */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-display uppercase tracking-wider">
            <Key className="w-4 h-4" />
            <span>{isEs ? 'Clave Secreta de Playit (Secret Key)' : 'Playit Secret Key'}</span>
          </div>

          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isEs ? '¡Guardado!' : 'Saved!'}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {isEs
            ? 'Ingresa la Secret Key proporcionada por Playit.gg para vincular este servidor a tu dominio público.'
            : 'Enter the Secret Key provided by Playit.gg to link this server to your public domain.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={secretKeyInput}
            onChange={(e) => setSecretKeyInput(e.target.value)}
            placeholder={isEs ? 'Ej: 12345678-abcd-ef01-2345-6789abcdef01' : 'E.g., 12345678-abcd-ef01-2345-6789abcdef01'}
            className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
          />

          <button
            id="save-secret-key-btn"
            onClick={handleSaveSecretKeyOnly}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-display font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEs ? 'Guardar Secret Key' : 'Save Secret Key'}</span>
          </button>
        </div>
      </div>

      {/* Guide & Steps Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-display">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono">1</span>
            {isEs ? 'Consigue una Secret Key' : 'Get a Secret Key'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isEs
              ? 'Entra a playit.gg, crea un agente o inicia tu servidor para abrir el enlace claim (https://playit.gg/claim/...).'
              : 'Visit playit.gg to create an agent or open the claim URL (https://playit.gg/claim/...) generated on first launch.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-display">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono">2</span>
            {isEs ? 'Pega la Secret Key' : 'Paste Secret Key'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isEs
              ? 'Pega la Secret Key arriba y haz clic en Guardar Secret Key. Se guardará directamente en playit.toml.'
              : 'Paste your Secret Key above and click Save Secret Key. It will be stored in playit.toml.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs font-display">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-mono">3</span>
            {isEs ? '¡Servidor Público Listo!' : 'Public Server Ready!'}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isEs
              ? 'Al ejecutar start.sh o start.bat en tu PC, Playit se conectará automáticamente usando tu Secret Key.'
              : 'When running start.sh or start.bat, Playit will connect automatically using your Secret Key.'}
          </p>
        </div>
      </div>

      {/* Editor for playit.toml */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            playit.toml (Avanzado / Advanced)
          </label>
        </div>

        <textarea
          id="playit-toml-textarea"
          value={rawToml}
          onChange={(e) => setRawToml(e.target.value)}
          rows={6}
          placeholder="# playit.toml secret_key"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
        />

        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-slate-500">
            {isEs
              ? 'Puedes editar el archivo completo playit.toml manualmente aquí.'
              : 'Edit the complete playit.toml configuration file manually here.'}
          </p>

          <button
            id="save-playit-toml-btn"
            onClick={handleSaveToml}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-xs transition-all disabled:opacity-50 border border-slate-700"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar playit.toml' : 'Save playit.toml')}
          </button>
        </div>
      </div>
    </div>
  );
};
