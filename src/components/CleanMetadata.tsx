import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Download, Shield } from 'lucide-react';

export default function CleanMetadata() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; downloadUrl?: string; error?: string } | null>(null);

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const progressInterval = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.random() * 20 : p));
    }, 400);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/process/clean-metadata`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        setResult({ success: true, downloadUrl: `${apiUrl}${data.downloadUrl}` });
      } else {
        setResult({ success: false, error: data.error || 'Erro no processamento' });
      }
    } catch (err) {
      clearInterval(progressInterval);
      setResult({ success: false, error: 'Erro de conexão com o servidor' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#161B29] border border-slate-800 rounded-3xl p-6 md:p-10">
        <div className="mb-6 flex gap-4 items-start">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Limpeza Profunda de Metadados</h2>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              Remove EXIF, tags de localização, dispositivo de gravação e metadados de software. Este processo tenta manter os streams originais para ser mais rápido (sem re-encoding total).
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="relative group">
          <label className={`flex flex-col items-center justify-center w-full h-40 border border-dashed rounded-3xl cursor-pointer transition-colors ${
            file ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800 bg-[#161B29] hover:border-blue-500/50 hover:bg-slate-800/30'
          }`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <CheckCircle2 className="w-10 h-10 text-blue-400 mb-2" />
              ) : (
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-2 group-hover:bg-blue-500/20 transition-colors">
                  <UploadCloud className="w-8 h-8" />
                </div>
              )}
              <p className="mb-1 text-sm text-slate-300 font-medium">
                {file ? file.name : <><span className="font-semibold text-blue-400">Clique para upload</span> ou arraste</>}
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="video/mp4,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-white hover:bg-blue-50 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-xl font-bold transition-all w-full md:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Limpando...
              </>
            ) : (
              'Remover Metadados'
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-blue-400 font-medium">
              <span>Limpando Metadados...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && !isProcessing && (
        <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
          result.success ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'
        }`}>
          {result.success ? (
            <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          )}
          <div className="flex-1">
            <h3 className={`font-medium ${result.success ? 'text-blue-400' : 'text-red-400'}`}>
              {result.success ? 'Metadados Removidos com Sucesso!' : 'Falha no Processamento'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {result.success 
                ? 'Todos os rastros (EXIF, authoring software, timecodes) foram apagados do arquivo.' 
                : result.error}
            </p>
            {result.success && result.downloadUrl && (
              <a 
                href={result.downloadUrl}
                download
                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-white hover:bg-slate-200 text-black font-bold rounded-xl transition-colors"
              >
                <Download className="w-5 h-5" />
                Baixar Mídia Limpa
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
