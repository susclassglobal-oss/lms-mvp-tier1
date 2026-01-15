import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CodingWorkbench() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Sustainable Classroom: Type your solution here\n\nfunction sayHello() {\n  console.log("Welcome to a sustainable future.");\n}\n\nsayHello();');
  const [output, setOutput] = useState('Your output will appear here after you run your code...');

  const handleRunCode = () => {
    setOutput(`> Environment: ${language}\n> Result: Welcome to a sustainable future.\n\nExecution complete. Well done!`);
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-sans text-slate-800 p-8 lg:p-12">
      
      {/* 1. MINIMAL NAVIGATION */}
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-medium transition-colors mb-10 text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Hub
        </button>

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Coding Workbench</h1>
            <p className="text-slate-500 mt-1">A quiet space to practice and grow your skills.</p>
          </div>
          
          {/* Subtle Environment Switcher */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </header>

        {/* 2. CALM WORKSPACE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* INSTRUCTIONS & EDITOR (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* The Challenge Box */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl">
              <h3 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-2">
                <span>🌱</span> Today's Mission
              </h3>
              <p className="text-sm text-emerald-800/80 leading-relaxed">
                Create a simple function that logs a message to the console. 
                Focus on the logic first—don't worry about making it perfect.
              </p>
            </div>

            {/* The Light Editor */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Code Editor</span>
                <button 
                  onClick={handleRunCode}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition-all active:scale-95"
                >
                  Run Code
                </button>
              </div>
              <textarea
                className="flex-1 p-8 font-mono text-sm leading-relaxed outline-none resize-none bg-white text-slate-700"
                spellCheck="false"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* OUTPUT & WELLBEING (Right 1 Column) */}
          <div className="space-y-6">
            
            {/* Output Panel */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-sm min-h-[250px] flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Console Output</h3>
              <pre className="font-mono text-xs text-emerald-400/90 whitespace-pre-wrap flex-1">
                {output}
              </pre>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
          Classroom Workspace • Focus Mode Active
        </footer>
      </div>
    </div>
  );
}

export default CodingWorkbench;