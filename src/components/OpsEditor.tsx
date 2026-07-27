import React, { useState } from 'react';
import { OpEntry, Language } from '../types';
import { Users, UserPlus, Trash2, Shield, Save, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface OpsEditorProps {
  serverName: string;
  ops: OpEntry[];
  onSave: (ops: OpEntry[]) => Promise<void>;
  lang: Language;
}

export const OpsEditor: React.FC<OpsEditorProps> = ({ serverName, ops: initialOps, onSave, lang }) => {
  const isEs = lang === 'es';

  const [opsList, setOpsList] = useState<OpEntry[]>(initialOps || []);
  const [newOpName, setNewOpName] = useState<string>('');
  const [newOpLevel, setNewOpLevel] = useState<number>(4);
  const [bypassesLimit, setBypassesLimit] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAddOp = () => {
    if (!newOpName.trim()) return;
    const exists = opsList.some((o) => o.name.toLowerCase() === newOpName.trim().toLowerCase());
    if (exists) return;

    const newEntry: OpEntry = {
      name: newOpName.trim(),
      level: newOpLevel,
      bypassesPlayerLimit: bypassesLimit,
    };

    setOpsList((prev) => [...prev, newEntry]);
    setNewOpName('');
  };

  const handleRemoveOp = (index: number) => {
    setOpsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(opsList);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving ops.json');
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
            <Users className="w-5 h-5 text-emerald-400" />
            <span>{isEs ? 'Operadores del Servidor (ops.json)' : 'Server Operators (ops.json)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEs ? 'Servidor actual: ' : 'Current Server: '}
            <span className="font-mono text-emerald-400 font-bold">{serverName}</span>
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isEs ? '¡Lista de operadores guardada correctamente!' : 'Operators saved successfully!'}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Add OP Form */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          {isEs ? 'Añadir Nuevo Operador' : 'Add New Operator'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            id="new-op-name-input"
            type="text"
            placeholder={isEs ? 'Nombre del Jugador...' : 'Player Username...'}
            value={newOpName}
            onChange={(e) => setNewOpName(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />

          <select
            id="new-op-level-select"
            value={newOpLevel}
            onChange={(e) => setNewOpLevel(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value={1}>Nivel 1 (Ignorar Spawn Protection)</option>
            <option value={2}>Nivel 2 (Comandos /clear, /tp, /gamemode)</option>
            <option value={3}>Nivel 3 (Comandos /op, /kick, /ban)</option>
            <option value={4}>Nivel 4 (Administrador Total /stop)</option>
          </select>

          <button
            id="add-op-btn"
            onClick={handleAddOp}
            disabled={!newOpName.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            {isEs ? 'Añadir' : 'Add Operator'}
          </button>
        </div>
      </div>

      {/* Existing OPs List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 font-display uppercase tracking-wider">
          {isEs ? `Operadores Actuales (${opsList.length})` : `Current Operators (${opsList.length})`}
        </h3>

        {opsList.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800/80 rounded-xl text-slate-500 text-xs font-mono">
            {isEs ? 'No hay operadores configurados en ops.json.' : 'No operators configured in ops.json.'}
          </div>
        ) : (
          <div className="space-y-2">
            {opsList.map((op, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                    OP
                  </div>
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-100 block">{op.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Level {op.level}
                    </span>
                  </div>
                </div>

                <button
                  id={`remove-op-btn-${idx}`}
                  onClick={() => handleRemoveOp(idx)}
                  className="p-2 rounded-lg bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          id="save-ops-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
          {isEs ? 'Guardar Operadores' : 'Save Operators'}
        </button>
      </div>
    </div>
  );
};
