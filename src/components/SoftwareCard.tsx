import React from 'react';
import { SoftwareInfo, SoftwareType } from '../types';
import { Check, Shield, Zap, Sparkles, Box, Wrench, Layers } from 'lucide-react';

export const SOFTWARES: SoftwareInfo[] = [
  {
    id: 'vanilla',
    name: 'Vanilla',
    tagline: 'Oficial de Mojang',
    description: 'El servidor oficial de Minecraft directamente mantenido por Mojang. Ideal para una experiencia 100% original sin modificaciones.',
    badge: 'Oficial',
    color: 'emerald',
    bgGradient: 'from-emerald-500/10 to-teal-900/20',
    borderColor: 'border-emerald-500/30',
    recommendedRam: 2,
  },
  {
    id: 'paper',
    name: 'Paper',
    tagline: 'Alto Rendimiento & Plugins',
    description: 'Bifurcación de Spigot optimizada para un rendimiento máximo. Elimina lag y soporta miles de plugins de Bukkit/Spigot/Paper.',
    badge: 'Recomendado',
    color: 'amber',
    bgGradient: 'from-amber-500/10 to-orange-900/20',
    borderColor: 'border-amber-500/30',
    recommendedRam: 3,
  },
  {
    id: 'purpur',
    name: 'Purpur',
    tagline: 'Ultra Personalizable',
    description: 'Basado en Paper con opciones de configuración avanzadas para mecánicas de juego, animales montables y optimización extrema.',
    badge: 'Avanzado',
    color: 'purple',
    bgGradient: 'from-purple-500/10 to-pink-900/20',
    borderColor: 'border-purple-500/30',
    recommendedRam: 3,
  },
  {
    id: 'fabric',
    name: 'Fabric',
    tagline: 'Modding Ligero & Moderno',
    description: 'Cargador de mods modular y muy ligero. Excelente compatibilidad con mods modernos de optimización (Sodium, Lithium) y contenido.',
    badge: 'Mods Ligeros',
    color: 'cyan',
    bgGradient: 'from-cyan-500/10 to-blue-900/20',
    borderColor: 'border-cyan-500/30',
    recommendedRam: 4,
  },
  {
    id: 'forge',
    name: 'Forge',
    tagline: 'El Estándar Tradicional de Mods',
    description: 'La plataforma de mods clásica más popular. Compatible con miles de grandes paquetes de mods (Modpacks) e instalaciones complejas.',
    badge: 'Modpacks',
    color: 'rose',
    bgGradient: 'from-rose-500/10 to-red-900/20',
    borderColor: 'border-rose-500/30',
    recommendedRam: 6,
  },
  {
    id: 'neoforge',
    name: 'NeoForge',
    tagline: 'La Evolución Moderna de Forge',
    description: 'Bifurcación moderna de Forge enfocada en mejor soporte para desarrolladores, estabilidad y compatibilidad con versiones recientes de Minecraft.',
    badge: 'Modding Nuevo',
    color: 'violet',
    bgGradient: 'from-violet-500/10 to-indigo-900/20',
    borderColor: 'border-violet-500/30',
    recommendedRam: 6,
  },
];

interface SoftwareCardProps {
  software: SoftwareInfo;
  selected: boolean;
  onSelect: (id: SoftwareType) => void;
  lang: 'es' | 'en';
}

export const SoftwareCard: React.FC<SoftwareCardProps> = ({ software, selected, onSelect, lang }) => {
  const getIcon = () => {
    switch (software.id) {
      case 'vanilla': return <Box className="h-6 w-6 text-emerald-400" />;
      case 'paper': return <Zap className="h-6 w-6 text-amber-400" />;
      case 'purpur': return <Sparkles className="h-6 w-6 text-purple-400" />;
      case 'fabric': return <Layers className="h-6 w-6 text-cyan-400" />;
      case 'forge': return <Wrench className="h-6 w-6 text-rose-400" />;
      case 'neoforge': return <Shield className="h-6 w-6 text-violet-400" />;
    }
  };

  return (
    <div
      id={`software-card-${software.id}`}
      onClick={() => onSelect(software.id)}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border bg-gradient-to-br ${software.bgGradient} ${
        selected
          ? `border-emerald-500 ring-2 ring-emerald-500/30 bg-slate-900 shadow-xl shadow-emerald-500/10 translate-y-[-2px]`
          : `border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-100 text-lg flex items-center gap-2">
              {software.name}
            </h3>
            <p className="text-xs text-slate-400">{software.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
            {software.badge}
          </span>
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            selected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-950/50'
          }`}>
            {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        {software.description}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>{lang === 'es' ? 'RAM Sugerida:' : 'Suggested RAM:'}</span>
        <span className="font-mono text-emerald-400 font-semibold">{software.recommendedRam} GB+</span>
      </div>
    </div>
  );
};
