import React, { useState } from 'react';
import { useLogicStore } from '../../stores/useLogicStore';

export const WordProblemInput: React.FC = () => {
  const store = useLogicStore();
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<{ variables: Record<string, string>, expression: string, explanation: string } | null>(null);
  const [error, setError] = useState<{ message: string; isHttp404: boolean } | null>(null);

  const handleParse = async () => {
    if (!store.wordProblemStr.trim()) return;
    setLoading(true);
    setError(null);
    setParsedData(null);
    try {
      const res = await fetch('/api/parseLogic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: store.wordProblemStr })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const rawError = data?.error;
        const errorMsg = typeof rawError === 'string'
          ? rawError
          : rawError?.message || data?.message || `Server returned ${res.status}`;
        setError({ message: errorMsg, isHttp404: res.status === 404 });
        return;
      }
      if (!data || !data.variables || typeof data.variables !== 'object' || typeof data.expression !== 'string' || !data.expression.trim()) {
        setError({ message: 'Invalid response format from AI.', isHttp404: false });
        return;
      }
      setParsedData({
        variables: data.variables,
        expression: data.expression,
        explanation: typeof data.explanation === 'string' ? data.explanation : 'The logic expression was generated from the supplied description.'
      });
    } catch (err: any) {
      setError({ message: err.message || String(err), isHttp404: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (parsedData) {
      store.applyWordProblemLogic(parsedData.variables, parsedData.expression);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-surface-600 mb-2">Describe the logic problem in plain English. The AI will extract variables and derive the boolean expression.</p>
      <textarea
        className="w-full border p-3 rounded text-sm min-h-[100px]"
        placeholder="e.g. The alarm should sound if the door is open AND the system is armed, OR if the window is broken."
        value={store.wordProblemStr}
        onChange={e => store.setWordProblem(e.target.value)}
      />
      <button 
        onClick={handleParse} 
        disabled={loading || !store.wordProblemStr.trim()}
        className="self-start px-4 py-2 bg-surface-800 text-white font-medium rounded hover:bg-surface-700 disabled:opacity-50"
      >
        {loading ? 'Parsing...' : 'Interpret Problem'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 text-red-900 rounded-lg border border-red-200 text-sm shadow-sm">
          <div className="flex items-center gap-2 font-bold text-red-700 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error Processing Request
          </div>
          <div>{error.message}</div>
          {error.isHttp404 && (
            <div className="mt-3 pt-3 border-t border-red-200 text-red-800">
              <strong>Note:</strong> The Word Problem AI feature requires a serverless backend to securely call the Gemini API. It appears the endpoint (<code>/api/parseLogic</code>) is unreachable. 
              <br /><br />
              If you are testing locally via Vite (<code>npm run dev</code>) or hosting on GitHub Pages, this feature will not work. Please deploy to <strong>Netlify</strong> (which hosts the serverless function) or run locally using the Netlify CLI (<code>netlify dev</code>).
            </div>
          )}
        </div>
      )}

      {parsedData && (
        <div className="mt-4 p-4 border border-primary-200 bg-primary-50 rounded shadow-sm">
          <h4 className="font-bold text-primary-900 mb-3">AI Interpretation</h4>
          <div className="mb-3">
            <strong className="text-sm text-primary-800 block mb-1">Identified Variables:</strong>
            <ul className="list-disc pl-5 text-sm text-primary-900">
              {Object.entries(parsedData.variables).map(([k, v]) => (
                <li key={k}><strong>{k}</strong>: {v}</li>
              ))}
            </ul>
          </div>
          <div className="mb-3">
            <strong className="text-sm text-primary-800 block mb-1">Derived Expression:</strong>
            <p className="font-mono bg-white p-2 border rounded inline-block">{parsedData.expression}</p>
          </div>
          <div className="mb-4">
            <strong className="text-sm text-primary-800 block mb-1">Explanation:</strong>
            <p className="text-sm text-primary-900">{parsedData.explanation}</p>
          </div>
          
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-primary-600 text-white font-bold rounded hover:bg-primary-500 shadow-sm transition-transform active:scale-95"
          >
            Confirm & Simplify
          </button>
        </div>
      )}
    </div>
  );
};
