import React, { useState, useRef, useEffect } from 'react';
import { Send, FileSpreadsheet, Download, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { generateExcelStructure } from './services/geminiService';
import { createAndDownloadExcel } from './services/excelService';
import VoiceInput from './components/VoiceInput';
import { ExcelSchema } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState<ExcelSchema | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setGeneratedSchema(null);
    setStatusMessage('Analysing your request (Sinhala/English)...');

    try {
      // Step 1: Gemini AI Processing
      const schema = await generateExcelStructure(inputText);
      setStatusMessage('Designing Excel structure...');
      setGeneratedSchema(schema);
      
      // Step 2: Excel File Generation
      setStatusMessage('Building .xlsx file...');
      await createAndDownloadExcel(schema);
      
      setStatusMessage('Done! Download started.');
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Sinhala Excel AI
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500 hidden sm:block">
            Powered by Gemini 2.5
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Excel Sheets from <br/>
            <span className="text-indigo-600">Natural Language</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Just describe what you need in <span className="font-semibold text-slate-800">Sinhala</span> or English. 
            We'll instantly create a formatted Excel file for you.
          </p>
          <div className="bg-blue-50 text-blue-800 text-sm py-2 px-4 rounded-full inline-block border border-blue-100">
            Example: "ගිය මාසේ වියදම් ටික හදාගන්න Excel එකක් හදලා දෙන්න."
          </div>
        </div>

        {/* Input Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group transition-all hover:shadow-2xl">
          <div className="p-1">
             <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe your Excel file here... (e.g., 'Create a student attendance sheet for 30 students')"
              className="w-full p-6 text-lg bg-transparent border-none outline-none resize-none min-h-[150px] placeholder:text-slate-300"
              disabled={isLoading}
            />
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               {/* Voice Input Button */}
               <VoiceInput onTranscript={handleVoiceTranscript} isProcessing={isLoading} />
               <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                 Click mic to speak in Sinhala
               </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-95
                ${isLoading || !inputText.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:from-indigo-500 hover:to-purple-500'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status & Results Area */}
        <div className="w-full mt-8 space-y-4">
          
          {/* Loading Status */}
          {isLoading && (
             <div className="flex items-center justify-center gap-3 text-indigo-600 animate-pulse bg-indigo-50 p-4 rounded-xl border border-indigo-100">
               <Loader2 className="w-5 h-5 animate-spin" />
               <span className="font-medium">{statusMessage}</span>
             </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-semibold">Generation Failed</h3>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Success Result */}
          {generatedSchema && !isLoading && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Success! File Generated.</h3>
                  <p className="text-emerald-700 text-sm mt-1">{generatedSchema.summary}</p>
                  <p className="text-xs text-emerald-500 mt-2 font-mono bg-white/50 px-2 py-1 rounded w-fit">
                    {generatedSchema.filename}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => createAndDownloadExcel(generatedSchema)}
                className="flex items-center gap-2 bg-white text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm font-semibold shrink-0"
              >
                <Download className="w-5 h-5" />
                Download Again
              </button>
            </div>
          )}
        </div>

        {/* Features / Footer */}
        {!generatedSchema && !isLoading && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center w-full max-w-4xl">
             <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="text-3xl mb-2">🇱🇰</div>
                <h3 className="font-bold text-slate-700">Sinhala Friendly</h3>
                <p className="text-sm text-slate-500 mt-1">Understands local context and language nuances.</p>
             </div>
             <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold text-slate-700">Instant Design</h3>
                <p className="text-sm text-slate-500 mt-1">Smart formatting, formulas, and mock data included.</p>
             </div>
             <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-slate-700">Real Excel Files</h3>
                <p className="text-sm text-slate-500 mt-1">Generates standard .xlsx files ready for work.</p>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;