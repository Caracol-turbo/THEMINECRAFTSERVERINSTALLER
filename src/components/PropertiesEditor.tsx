import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { Save, Settings, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface PropertiesEditorProps {
  serverName: string;
  properties: Record<string, string>;
  rawProperties: string;
  onSave: (props: Record<string, string> | string) => Promise<void>;
  lang: Language;
}

export const PropertiesEditor: React.FC<PropertiesEditorProps> = ({
  serverName,
  properties: initialProperties,
  rawProperties: initialRawProperties,
  onSave,
  lang,
}) => {
  const isEs = lang === 'es';

  const [mode, setMode] = useState<'form' | 'raw'>('form');
  const [props, setProps] = useState<Record<string, string>>(initialProperties);
  const [rawProps, setRawProps] = useState<string>(initialRawProperties);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setProps(initialProperties);
    setRawProps(initialRawProperties);
  }, [initialProperties, initialRawProperties]);

  const updateProp = (key: string, value: string) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (mode === 'form') {
        await onSave(props);
      } else {
        await onSave(rawProps);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving server.properties');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>{isEs ? 'Editor de server.properties' : 'server.properties Editor'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEs ? 'Servidor actual: ' : 'Current Server: '}
            <span className="font-mono text-emerald-400 font-bold">{serverName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="props-mode-form"
            onClick={() => setMode('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'form' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {isEs ? 'Visual' : 'Visual Form'}
          </button>
          <button
            id="props-mode-raw"
            onClick={() => setMode('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === 'raw' ? 'bg-emerald-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {isEs ? 'Texto Plano' : 'Raw Text'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isEs ? '¡Cambios guardados en server.properties correctamente!' : 'server.properties saved successfully!'}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Form Mode */}
      {mode === 'form' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* MOTD */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">
              MOTD ({isEs ? 'Mensaje del Día' : 'Message of the Day'})
            </label>
            <input
              type="text"
              value={props['motd'] || ''}
              onChange={(e) => updateProp('motd', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Gamemode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Modo de Juego' : 'Gamemode'}</label>
            <select
              value={props['gamemode'] || 'survival'}
              onChange={(e) => updateProp('gamemode', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="survival">survival</option>
              <option value="creative">creative</option>
              <option value="adventure">adventure</option>
              <option value="spectator">spectator</option>
            </select>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Dificultad' : 'Difficulty'}</label>
            <select
              value={props['difficulty'] || 'easy'}
              onChange={(e) => updateProp('difficulty', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="peaceful">peaceful</option>
              <option value="easy">easy</option>
              <option value="normal">normal</option>
              <option value="hard">hard</option>
            </select>
          </div>

          {/* Server Port */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Puerto' : 'Server Port'}</label>
            <input
              type="number"
              value={props['server-port'] || '25565'}
              onChange={(e) => updateProp('server-port', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Max Players */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Máximo de Jugadores' : 'Max Players'}</label>
            <input
              type="number"
              value={props['max-players'] || '20'}
              onChange={(e) => updateProp('max-players', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Level Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Nombre del Mundo' : 'Level Name'}</label>
            <input
              type="text"
              value={props['level-name'] || 'world'}
              onChange={(e) => updateProp('level-name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* View Distance */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 block">{isEs ? 'Distancia de Visión (Chunks)' : 'View Distance'}</label>
            <input
              type="number"
              min="3"
              max="32"
              value={props['view-distance'] || '10'}
              onChange={(e) => updateProp('view-distance', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Toggle Switches */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
            {[
              { key: 'online-mode', label: 'Online Mode (Mojang Auth)' },
              { key: 'pvp', label: 'PVP Enabled' },
              { key: 'white-list', label: 'White List' },
              { key: 'allow-flight', label: 'Allow Flight' },
              { key: 'enable-command-block', label: 'Command Blocks' },
            ].map((toggle) => {
              const val = props[toggle.key] === 'true';
              return (
                <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">{toggle.label}</span>
                  <button
                    onClick={() => updateProp(toggle.key, val ? 'false' : 'true')}
                    className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                      val ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      val ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Raw Mode */
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400 block">server.properties</label>
          <textarea
            value={rawProps}
            onChange={(e) => setRawProps(e.target.value)}
            rows={16}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>
      )}

      {/* Save Action */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          id="save-properties-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
          {isEs ? 'Guardar Cambios' : 'Save Properties'}
        </button>
      </div>
    </div>
  );
};
