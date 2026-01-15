import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function CoursePlayer() {
  const { moduleId } = useParams(); 
  const navigate = useNavigate();
  
  const [steps, setSteps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMcq, setSelectedMcq] = useState(null);
  const [completing, setCompleting] = useState(false);

  // Coding Workbench States
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(`import java.util.*;

public class Solution {
  public static void main(String[] args) {
    Scanner in = new Scanner(System.in);
    // Write your code here
  }
}`);
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('Terminal idle. Enter input and run code.');
  const [testCases, setTestCases] = useState([{ id: 1, input: "", expected: "" }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [teacherTestCases, setTeacherTestCases] = useState([]); // Hidden test cases from teacher

  const token = localStorage.getItem('token');

  // Language specifications for Piston API
  const languageSpecs = {
    java: { name: "java", version: "15.0.2" },
    python: { name: "python", version: "3.10.0" },
    javascript: { name: "javascript", version: "18.15.0" },
    cpp: { name: "c++", version: "10.2.0" }
  };

  const fetchModuleContent = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/student/module/${moduleId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSteps(data);
        
        // Check if there's a coding problem and load starter code
        const codingStep = data.find(step => step.step_type === 'coding');
        if (codingStep && codingStep.mcq_data) {
          const problemData = codingStep.mcq_data;
          setCode(problemData.starterCode?.java || code);
          setTeacherTestCases(problemData.testCases || []);
          
          // Show only non-hidden test cases to students
          const visibleTestCases = (problemData.testCases || [])
            .filter(tc => !tc.isHidden)
            .map(tc => ({ id: tc.id, input: tc.input, expected: tc.expected }));
          
          if (visibleTestCases.length > 0) {
            setTestCases(visibleTestCases);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load module content", err);
    } finally {
      setLoading(false);
    }
  }, [moduleId, token, code]);

  const handleCompleteModule = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/student/module/${moduleId}/complete`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        alert('🎉 Module completed! Great job!');
        navigate('/dashboard');
      } else {
        throw new Error('Failed to mark complete');
      }
    } catch (err) {
      console.error("Failed to complete module:", err);
      alert('Could not mark module as complete. Please try again.');
      setCompleting(false);
    }
  };

  // --- RUN TEST (Manual) ---
  const runTest = async () => {
    if (!userInput.trim()) {
      setOutput("> ERROR: Input required. Please type a value in the STDIN box.");
      return;
    }

    setIsProcessing(true);
    setOutput("> Executing...");
    
    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          language: languageSpecs[language].name,
          version: languageSpecs[language].version,
          files: [{ content: code }], 
          stdin: userInput 
        }),
      });
      
      const data = await res.json();
      const finalOutput = data.run.stderr || data.run.stdout || data.run.output || "> No output returned.";
      setOutput(finalOutput);
    } catch (err) { 
      setOutput("> Execution failed: " + err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  // --- SUBMIT SOLUTION (Grading) ---
  const handleSubmit = async () => {
    // Use teacher's test cases if available, otherwise use student's test cases
    const finalTestCases = teacherTestCases.length > 0 ? teacherTestCases : testCases;
    
    if (finalTestCases.length === 0 || finalTestCases.every(tc => !tc.input && !tc.expected)) {
      alert("⚠️ No test cases available for grading.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/student/submit-code`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          moduleId, 
          code, 
          language: languageSpecs[language].name, 
          testCases: finalTestCases 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // THE SCORE POPUP
        alert(`🏆 SUBMISSION SUCCESSFUL\n\nTests Passed: ${data.passed}/${data.total}\nFinal Score: ${data.score}%`);
        navigate('/dashboard');
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) { 
      alert("Server connection failed: " + err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchModuleContent();
  }, [fetchModuleContent, navigate, token]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-emerald-500 font-bold">Loading Learning Path...</div>;
  if (steps.length === 0) return <div className="h-screen flex flex-col items-center justify-center gap-4">
    <p className="text-slate-500 italic">No content found for this module.</p>
    <button onClick={() => navigate('/courses')} className="text-emerald-600 font-bold underline">Go Back</button>
  </div>;

  const currentStep = steps[currentIndex];
  const progressPercent = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#fdfdfd] font-sans text-slate-800 p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP NAVIGATION */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-medium transition-colors text-sm"
          >
            ← Back to Hub
          </button>
          
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-1 bg-slate-100 rounded-full mb-16 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* DYNAMIC CONTENT AREA */}
        {currentStep.step_type === 'coding' ? (
          // CODING WORKBENCH VIEW
          <div className="space-y-6">
            {/* Problem Description */}
            {currentStep.mcq_data?.description && (
              <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-blue-100">
                <h2 className="text-xs font-black text-blue-600 uppercase mb-3 tracking-widest">📋 Problem Statement</h2>
                <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {currentStep.mcq_data.description}
                </p>
              </div>
            )}

            <header className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
              <h1 className="text-xl font-black italic uppercase">
                Coding <span className="text-emerald-500">Evaluator</span>
              </h1>
              <div className="flex gap-3">
                <select 
                  value={language} 
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    // Load starter code for selected language
                    if (currentStep.mcq_data?.starterCode?.[newLang]) {
                      setCode(currentStep.mcq_data.starterCode[newLang]);
                    }
                  }} 
                  className="bg-slate-100 p-2 rounded-xl text-xs font-bold"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">Node.js</option>
                  <option value="cpp">C++</option>
                </select>
                <button 
                  onClick={runTest} 
                  disabled={isProcessing}
                  className="px-6 py-2 bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 disabled:opacity-50"
                >
                  Run Code
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isProcessing} 
                  className="px-8 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Submit Solution"}
                </button>
              </div>
            </header>

            <div className="grid grid-cols-12 gap-6 h-[75vh]">
              {/* SIDEBAR: TEST CASES */}
              <div className="col-span-3 space-y-4 overflow-y-auto">
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                  <p className="text-xs font-black text-blue-700 uppercase mb-2">📊 Test Cases</p>
                  <p className="text-xs text-blue-600">
                    {teacherTestCases.length > 0 
                      ? `${teacherTestCases.filter(tc => !tc.isHidden).length} visible, ${teacherTestCases.filter(tc => tc.isHidden).length} hidden`
                      : `${testCases.length} test cases`}
                  </p>
                </div>
                
                {teacherTestCases.length === 0 && (
                  <button 
                    onClick={() => setTestCases([...testCases, { id: Date.now(), input: "", expected: "" }])} 
                    className="w-full bg-emerald-500 text-white p-3 rounded-xl font-bold text-xs hover:bg-emerald-600"
                  >
                    + Add Test Case
                  </button>
                )}
                
                {(teacherTestCases.length > 0 ? teacherTestCases.filter(tc => !tc.isHidden) : testCases).map((tc, i) => (
                  <div key={tc.id} className="bg-white p-4 rounded-2xl border relative shadow-sm">
                    {teacherTestCases.length === 0 && (
                      <button 
                        onClick={() => setTestCases(testCases.filter(t => t.id !== tc.id))} 
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                    <p className="text-[10px] font-black text-slate-400 mb-2">
                      {teacherTestCases.length > 0 ? 'SAMPLE ' : ''}CASE #{i+1}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-1">Input:</p>
                        {teacherTestCases.length > 0 ? (
                          <pre className="p-2 bg-slate-50 rounded text-xs font-mono">{tc.input}</pre>
                        ) : (
                          <input 
                            placeholder="Input" 
                            className="w-full p-2 bg-slate-50 rounded border text-xs" 
                            value={tc.input} 
                            onChange={(e) => setTestCases(testCases.map(t => t.id === tc.id ? {...t, input: e.target.value} : t))} 
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-1">Expected:</p>
                        {teacherTestCases.length > 0 ? (
                          <pre className="p-2 bg-slate-50 rounded text-xs font-mono">{tc.expected}</pre>
                        ) : (
                          <input 
                            placeholder="Expected Output" 
                            className="w-full p-2 bg-slate-50 rounded border text-xs" 
                            value={tc.expected} 
                            onChange={(e) => setTestCases(testCases.map(t => t.id === tc.id ? {...t, expected: e.target.value} : t))} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {teacherTestCases.filter(tc => tc.isHidden).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                    <p className="text-xs font-black text-purple-700 uppercase">🔒 Hidden Test Cases</p>
                    <p className="text-xs text-purple-600 mt-2">
                      {teacherTestCases.filter(tc => tc.isHidden).length} additional test cases will be used for grading
                    </p>
                  </div>
                )}
              </div>

              {/* CENTER: EDITOR & STDIN */}
              <div className="col-span-6 flex flex-col gap-4">
                <div className="flex-[2] bg-white rounded-3xl shadow-xl border overflow-hidden flex flex-col">
                  <div className="px-6 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    Code Editor
                  </div>
                  <textarea 
                    value={code} 
                    onChange={(e) => setCode(e.target.value)} 
                    className="flex-1 p-6 font-mono text-sm outline-none resize-none" 
                    spellCheck="false" 
                  />
                </div>
                
                <div className={`flex-1 bg-white rounded-3xl border-2 overflow-hidden flex flex-col shadow-md ${!userInput.trim() ? 'border-amber-100' : 'border-emerald-100'}`}>
                  <div className="px-6 py-2 bg-emerald-50 text-[10px] font-black text-emerald-700 uppercase flex justify-between">
                    <span>Single Run Input (STDIN)</span>
                    {!userInput.trim() && <span className="text-amber-500">Input Required</span>}
                  </div>
                  <textarea 
                    value={userInput} 
                    onChange={(e) => setUserInput(e.target.value)} 
                    className="flex-1 p-4 font-mono text-xs outline-none" 
                    placeholder="Type test input here..." 
                  />
                </div>
              </div>

              {/* RIGHT: TERMINAL */}
              <div className="col-span-3 bg-[#0f172a] rounded-[2rem] border-[6px] border-[#1e293b] p-6 text-emerald-400 font-mono text-xs overflow-y-auto shadow-2xl">
                <div className="text-slate-500 mb-4 border-b border-slate-800 pb-2">SYSTEM OUTPUT</div>
                <pre className="whitespace-pre-wrap">{output}</pre>
              </div>
            </div>
          </div>
        ) : (
          // REGULAR MODULE VIEW
          <article className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
            <header>
              <h1 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                {currentStep.step_type.toUpperCase()} LESSON
              </h1>
            </header>

            {/* TYPE 1: TEXT LESSON */}
            {currentStep.step_type === 'text' && (
              <div className="text-lg text-slate-600 leading-relaxed border-l-4 border-emerald-100 pl-6 py-2 whitespace-pre-wrap">
                {currentStep.content_text}
              </div>
            )}

            {/* TYPE 2: VIDEO LINK */}
            {currentStep.step_type === 'video' && (
              <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-slate-50">
                <iframe 
                  width="100%" 
                  className="aspect-video"
                  src={currentStep.content_text.replace("watch?v=", "embed/")} 
                  title="Video lesson"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* TYPE 3: MCQ QUIZ */}
            {currentStep.step_type === 'mcq' && (
              <div className="space-y-4 bg-slate-50 p-8 rounded-[2rem]">
                <p className="font-bold text-xl mb-6">{currentStep.mcq_data?.question || currentStep.content_text}</p>
                {['a', 'b', 'c', 'd'].map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setSelectedMcq(opt.toUpperCase())}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold ${
                      selectedMcq === opt.toUpperCase() 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-white bg-white hover:border-slate-200'
                    }`}
                  >
                    <span className="uppercase mr-4 opacity-30">{opt}</span>
                    {currentStep.mcq_data?.[opt] || "Option " + opt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* TYPE 4: CODING EXAMPLE */}
            {currentStep.step_type === 'code' && (
              <div className="bg-slate-900 rounded-2xl p-8 my-10 relative group shadow-2xl">
                 <div className="absolute top-4 right-6 text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">
                  Interactive Logic
                </div>
                <pre className="font-mono text-sm text-emerald-400 overflow-x-auto">
                  <code>{currentStep.content_text}</code>
                </pre>
              </div>
            )}
          </article>
        )}

        {/* NAVIGATION BUTTONS */}
        {currentStep.step_type !== 'coding' && (
          <div className="flex justify-between items-center mt-16 pt-8 border-t border-slate-50 max-w-3xl mx-auto">
            <button
              disabled={currentIndex === 0}
              onClick={() => { setCurrentIndex(currentIndex - 1); setSelectedMcq(null); }}
              className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0"
            >
              ← Previous Topic
            </button>
            
            <button
              onClick={() => {
                if (currentIndex < steps.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setSelectedMcq(null); 
                } else {
                  handleCompleteModule();
                }
              }}
              disabled={completing}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? 'Completing...' : currentIndex === steps.length - 1 ? '✓ Complete Module' : 'Next Topic →'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CoursePlayer;
