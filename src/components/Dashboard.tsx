import React from 'react';
import { Activity, FileVideo, ShieldCheck, Zap } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Arquivos Processados', value: '1,284', icon: FileVideo, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Metadados Limpos', value: '856', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Hashes Alterados', value: '428', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Taxa de Sucesso', value: '99.8%', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          return (
            <div key={i} className="bg-[#161B29] p-5 rounded-2xl border border-slate-800">
              <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold ${stat.color === 'text-emerald-400' ? 'text-emerald-400' : 'text-white'}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#161B29] rounded-2xl border border-slate-800 overflow-hidden flex-1 flex flex-col">
        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Atividade Recente</h3>
        </div>
        <div className="divide-y divide-slate-800/50 overflow-auto">
          {[
            { name: 'campanha_vsl_01.mp4', action: 'Camuflagem + Metadados', time: '10 min atrás', status: 'Concluído', size: '24.8 MB', hash: 'f4e2...d9a1' },
            { name: 'criativo_fb_teste.jpg', action: 'Limpeza de Metadados', time: '2 horas atrás', status: 'Concluído', size: '1.2 MB', hash: 'a8b9...c3d4' },
            { name: 'video_vendas_final.mp4', action: 'Camuflagem', time: '5 horas atrás', status: 'Processando', size: '112.5 MB', hash: '---' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 px-6 bg-[#161B29]">
              <div className="flex items-center gap-4 flex-1">
                <div>
                  <div className="text-sm font-medium text-slate-300">{item.name}</div>
                  <div className="text-xs text-slate-500 hidden sm:block">{item.action}</div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-8 text-right flex-1 justify-end">
                <div className="text-xs font-mono text-slate-500 w-24 text-left">{item.hash}</div>
                <div className="text-sm text-slate-300 w-20 text-left">{item.size}</div>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                <div className="text-right">
                  <div className="flex items-center justify-end">
                    <span className={`px-2 py-1 text-[10px] rounded uppercase font-bold ${
                      item.status === 'Concluído' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">{item.time}</div>
                </div>
                <button className={`text-xs font-bold ${item.status === 'Concluído' ? 'text-emerald-500' : 'text-slate-600'}`}>
                  {item.status === 'Concluído' ? 'Baixar' : 'Aguardar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
