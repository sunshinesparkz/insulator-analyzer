import React, { useState, useRef, useCallback } from 'react';
import { AnalysisResult, AnalysisStatus } from './types';
import { analyzeInsulatorImage } from './services/geminiService';
import { saveInspectionResult } from './services/databaseService';
import { CameraIcon, UploadIcon, AlertIcon, IdentificationIcon } from './components/Icons';
import { Spinner } from './components/Spinner';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    mimeType: file.type,
    data: await base64EncodedDataPromise,
  };
};

const getStatusColorClasses = (status: AnalysisStatus): string => {
  switch (status) {
    case AnalysisStatus.Normal:
      return 'border-green-500 bg-green-500/10 text-green-400';
    case AnalysisStatus.Flashover:
      return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
    case AnalysisStatus.Broken:
      return 'border-red-500 bg-red-500/10 text-red-400';
    case AnalysisStatus.NotAnInsulator:
      return 'border-purple-500 bg-purple-500/10 text-purple-400';
    default:
      return 'border-gray-500 bg-gray-500/10 text-gray-400';
  }
};

const InitialState: React.FC<{ onSelect: (mode: 'camera' | 'upload') => void }> = ({ onSelect }) => (
  <div className="text-center p-8 border-2 border-dashed border-gray-600 rounded-2xl bg-gray-800/50 flex flex-col items-center justify-center h-full min-h-[300px] md:min-h-[400px]">
    <h2 className="text-2xl font-bold text-sky-400 mb-2">Insulator Analyzer Pro</h2>
    <p className="text-gray-400 mb-6 max-w-sm">
      ถ่ายภาพหรืออัปโหลดรูปภาพลูกถ้วยไฟฟ้าเพื่อวิเคราะห์สถานะ
    </p>
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
      <button onClick={() => onSelect('camera')} className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-sky-500">
        <CameraIcon className="w-6 h-6" />
        <span>ถ่ายภาพ</span>
      </button>
      <button onClick={() => onSelect('upload')} className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">
        <UploadIcon className="w-6 h-6" />
        <span>อัปโหลดไฟล์</span>
      </button>
    </div>
  </div>
);

const ConfidenceBar: React.FC<{ label: string; score: number; color: string }> = ({ label, score, color }) => (
    <div className="flex items-center gap-3">
        <span className="w-24 text-gray-300 font-medium">{label}</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
        </div>
        <span className="w-12 text-right font-semibold text-white">{score.toFixed(1)}%</span>
    </div>
);

const ResultDisplay: React.FC<{ result: AnalysisResult; imagePreviewUrl: string; onReset: () => void; }> = ({ result, imagePreviewUrl, onReset }) => {
    const colorClasses = getStatusColorClasses(result.status);

    return (
        <div className="space-y-6">
            <div className="w-full overflow-hidden rounded-2xl border-2 border-gray-700">
                 <img src={imagePreviewUrl} alt="Analyzed Object" className="w-full h-auto object-contain max-h-[400px]" />
            </div>

            {result.status === AnalysisStatus.NotAnInsulator ? (
                 <div className={`p-6 border-2 rounded-2xl ${colorClasses} text-center`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <IdentificationIcon className="w-8 h-8"/>
                        <h3 className="text-2xl font-bold">{result.status}</h3>
                    </div>
                    <p className="text-lg text-gray-200">
                        วัตถุในภาพถูกระบุว่าเป็น: <span className="font-semibold text-purple-300">{result.objectType}</span>
                    </p>
                    <p className="text-gray-400 mt-1">{result.description}</p>
                 </div>
            ) : (
                <>
                    <div className={`p-6 border-2 rounded-2xl ${colorClasses}`}>
                        <span className={`px-4 py-1.5 text-base font-bold rounded-full ${colorClasses.replace('border-', 'bg-').replace('/10', '')} text-gray-900`}>
                            ผลการวิเคราะห์: {result.status}
                        </span>
                        <p className="text-lg text-gray-200 mt-4">{result.description}</p>
                    </div>

                    {result.confidenceScores && (
                        <div className="p-6 border-2 border-gray-700 rounded-2xl bg-gray-800/50">
                            <h4 className="text-lg font-bold text-sky-400 mb-4">ระดับความเชื่อมั่น</h4>
                            <div className="space-y-3">
                                <ConfidenceBar label={AnalysisStatus.Normal} score={result.confidenceScores.normal} color="bg-green-500" />
                                <ConfidenceBar label={AnalysisStatus.Flashover} score={result.confidenceScores.flashover} color="bg-yellow-500" />
                                <ConfidenceBar label={AnalysisStatus.Broken} score={result.confidenceScores.broken} color="bg-red-500" />
                            </div>
                        </div>
                    )}
                </>
            )}

             <button onClick={onReset} className="w-full px-6 py-3 font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400">
                วิเคราะห์ภาพใหม่
            </button>
        </div>
    );
}

export default function App() {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysis = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, mimeType } = await fileToGenerativePart(file);
      if (!data) {
          throw new Error("Could not read file data.");
      }
      
      // 1. Perform AI Analysis
      const analysisResult = await analyzeInsulatorImage(data, mimeType);
      setResult(analysisResult);

      // 2. Save result to Database (Fire and forget - don't await to block UI)
      saveInspectionResult(analysisResult).catch(err => {
          console.error("Background save failed:", err);
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Analysis Failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
      handleAnalysis(file);
    }
    // Reset file input value to allow re-uploading the same file
    event.target.value = '';
  }, [handleAnalysis]);

  const triggerFileInput = (mode: 'camera' | 'upload') => {
    if (fileInputRef.current) {
        if (mode === 'camera') {
            fileInputRef.current.setAttribute('capture', 'environment');
        } else {
            fileInputRef.current.removeAttribute('capture');
        }
        fileInputRef.current.click();
    }
  };

  const handleReset = () => {
    setImagePreviewUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-2xl mx-auto flex-grow flex flex-col justify-center">
        {!imagePreviewUrl && <InitialState onSelect={triggerFileInput} />}
        
        {imagePreviewUrl && (
            <div className="w-full">
                {isLoading && (
                    <div className="text-center p-8 border-2 border-dashed border-sky-600 rounded-2xl bg-gray-800/50 flex flex-col items-center justify-center min-h-[400px]">
                        <Spinner />
                        <p className="mt-4 text-sky-400 text-lg font-semibold animate-pulse">กำลังวิเคราะห์ภาพ...</p>
                        <p className="mt-1 text-gray-400">กรุณารอสักครู่ ระบบกำลังใช้โมเดลขั้นสูง</p>
                    </div>
                )}

                {error && !isLoading && (
                   <div className="p-6 border-2 border-red-500 rounded-2xl bg-red-500/10 text-red-400">
                        <div className="flex items-center gap-3">
                            <AlertIcon className="w-6 h-6 flex-shrink-0" />
                            <h3 className="text-lg font-bold">เกิดข้อผิดพลาด</h3>
                        </div>
                        <p className="mt-2 text-red-300">{error}</p>
                        <button onClick={handleReset} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors">
                            ลองอีกครั้ง
                        </button>
                    </div>
                )}
                
                {result && !isLoading && !error && (
                    <ResultDisplay result={result} imagePreviewUrl={imagePreviewUrl} onReset={handleReset} />
                )}
            </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </main>
      <footer className="w-full max-w-2xl mx-auto text-center py-4 mt-6">
        <p className="text-sm text-gray-500">Powered by Gemini Pro & Supabase</p>
      </footer>
    </div>
  );
}