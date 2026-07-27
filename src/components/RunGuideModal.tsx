import React, { useState } from 'react';
import { Language } from '../types';
import { Monitor, X, Terminal, CheckCircle2, Copy, Download, Play, ExternalLink } from 'lucide-react';

interface RunGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const RunGuideModal: React.FC<RunGuideModalProps> = ({ isOpen, onClose, lang }) => {
  const isEs = lang === 'es';
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-100">
                {isEs ? '¿Cómo probar y ejecutar en tu PC?' : 'How to Run & Test on Your PC'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEs ? 'Guía paso a paso para ejecutar el instalador y tus servidores localmente' : 'Step-by-step guide to run the installer and servers locally'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requirements */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 font-display uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isEs ? 'Requisitos Previos en tu PC' : 'Prerequisites on Your PC'}
          </h3>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-slate-200">Node.js (v18+)</strong>: {isEs ? 'Necesario para ejecutar la interfaz web localmente.' : 'Required to run the web interface locally.'}
            </li>
            <li>
              <strong className="text-slate-200">Java 17 / 21</strong>: {isEs ? 'Necesario para ejecutar el archivo server.jar de Minecraft.' : 'Required to execute Minecraft server.jar files.'}
            </li>
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs">
          {/* Step 1: Export or Download */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 font-display flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">1</span>
                {isEs ? 'Descargar / Exportar el Proyecto' : 'Download / Export the Project'}
              </span>
            </div>
            <p className="text-slate-400">
              {isEs
                ? 'Haz clic en el menú superior derecho de la pantalla y selecciona "Export to ZIP" o "Export to GitHub" para descargar todos los archivos a tu ordenador.'
                : 'Click top right menu in AI Studio and select "Export to ZIP" or "Export to GitHub" to save code to your PC.'}
            </p>
          </div>

          {/* Step 2: Install dependencies */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 font-display flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">2</span>
                {isEs ? 'Instalar dependencias y abrir el panel' : 'Install dependencies & run web panel'}
              </span>
              <button
                onClick={() => copyText('npm install && npm run dev', 'cmd1')}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 font-mono"
              >
                {copiedCmd === 'cmd1' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd === 'cmd1' ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}
              </button>
            </div>
            <p className="text-slate-400">{isEs ? 'Abre la terminal en la carpeta descargada y ejecuta:' : 'Open terminal in folder and run:'}</p>
            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-850 font-mono text-emerald-400 text-xs">
              npm install{"\n"}npm run dev
            </pre>
            <p className="text-slate-500 text-[11px]">
              {isEs ? 'Abre ' : 'Open '}
              <span className="font-mono text-slate-300">http://localhost:3000</span>
              {isEs ? ' en tu navegador para crear y administrar tus servidores.' : ' in your browser.'}
            </p>
          </div>

          {/* Step 3: Run Minecraft Server & Playit */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 font-display flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">3</span>
                {isEs ? 'Iniciar el Servidor de Minecraft y Playit.gg' : 'Start Minecraft Server & Playit.gg'}
              </span>
            </div>
            <p className="text-slate-400">
              {isEs
                ? 'Ve a la carpeta del servidor creado (ej. servers/MyMinecraftServer) y ejecuta:'
                : 'Go to your server folder (e.g. servers/MyMinecraftServer) and run:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">En Windows:</span>
                <span className="text-emerald-400">Doble clic en start.bat</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">En Linux / Mac:</span>
                <span className="text-emerald-400">./start.sh</span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              {isEs
                ? 'Si tienes Playit.gg activado, en la consola de comandos verás el enlace de Playit para invitar a tus amigos con IP pública.'
                : 'If Playit.gg is enabled, the command console will display your Playit link for public play!'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            {isEs ? '¡Entendido!' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};
