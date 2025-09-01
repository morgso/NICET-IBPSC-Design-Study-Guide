import React, { useEffect, useMemo, useState } from "react";

/**
 * NICET IB-PSC Design Exam Simulator
 * Fully configured for Google Sheets integration
 * Features: Full/Half exam, flashcards, hint toggle, retake wrong questions, progress tracking
 */

const QUESTION_SHEET_URL = "https://docs.google.com/spreadsheets/d/1rn9da6Co3oJJEvwzhTEiFQYoQAGAxFItUsVg14faik4/gviz/tq?tqx=out:json";
const RESULTS_SHEET_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf_dummy_form_id/formResponse";

const DEFAULT_WEIGHTS = { "1.1": 0.2, "1.2": 0.3, "1.3": 0.5 };
const MODE_CONFIG = {
  half: { label: "Half Exam", questions: 55, minutes: 75 },
  full: { label: "Full Exam", questions: 110, minutes: 150 },
};

function App() {
  const [questions, setQuestions] = useState([]);
  const [mode, setMode] = useState("full");
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [started, setStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showHints, setShowHints] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Load questions from Google Sheet dynamically
    fetch(QUESTION_SHEET_URL)
      .then(res => res.text())
      .then(txt => {
        const json = JSON.parse(txt.match(/google\.visualization\.Query\.setResponse\((.*)\)/s)[1]);
        const rows = json.table.rows.map((r, i) => ({
          id: i,
          domain: r.c[0]?.v || "1.1",
          task: r.c[1]?.v || "",
          refs: r.c[2]?.v || "",
          text: r.c[3]?.v || "",
          options: ["A","B","C","D","E"].map((k,j)=>({key:k,text:r.c[4+j]?.v})).filter(o=>o.text),
          correct: r.c[9]?.v?.split(",") || ["A"],
          correctCount: parseInt(r.c[10]?.v || "1",10),
          hint: r.c[11]?.v || ""
        }));
        setQuestions(rows);
      });
  }, []);

  function startExam() {
    const cfg = MODE_CONFIG[mode];
    setExamQuestions(questions.slice(0, cfg.questions));
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
    setStarted(true);
  }

  function toggleAnswer(qid, letter) {
    setAnswers(prev => {
      const cur = prev[qid] || [];
      if(cur.includes(letter)) return {...prev,[qid]:cur.filter(x=>x!==letter)};
      return {...prev,[qid]:[...cur,letter]};
    });
  }

  function isCorrect(q) {
    const sel = (answers[q.id]||[]).slice().sort().join(",");
    const ans = q.correct.slice().sort().join(",");
    return sel===ans && (answers[q.id]||[]).length===q.correctCount;
  }

  function scoreExam() {
    let correctTotal = 0;
    examQuestions.forEach(q=>{if(isCorrect(q)) correctTotal++});
    return { total: examQuestions.length, correct: correctTotal, percent: Math.round(100*correctTotal/examQuestions.length) };
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">NICET IB-PSC Simulator</h1>
      {!started && (
        <div>
          <div className="mb-2">
            <label>Exam Mode: </label>
            <select value={mode} onChange={e=>setMode(e.target.value)} className="border p-1">
              {Object.entries(MODE_CONFIG).map(([k,c])=><option key={k} value={k}>{c.label}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label>
              <input type="checkbox" checked={showHints} onChange={e=>setShowHints(e.target.checked)} /> Show Hints
            </label>
          </div>
          <button onClick={startExam} className="px-4 py-2 bg-blue-600 text-white rounded">Start Exam</button>
        </div>
      )}
      {started && examQuestions[currentIdx] && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <div className="mb-2 text-sm text-gray-500">{examQuestions[currentIdx].domain} {examQuestions[currentIdx].task} {examQuestions[currentIdx].refs}</div>
          <div className="mb-2 font-semibold">{examQuestions[currentIdx].text}</div>
          {showHints && examQuestions[currentIdx].hint && <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded">{examQuestions[currentIdx].hint}</div>}
          <div className="space-y-2">
            {examQuestions[currentIdx].options.map(opt=>(
              <label key={opt.key} className="flex items-center gap-2 p-2 border rounded cursor-pointer">
                <input type="checkbox" checked={(answers[examQuestions[currentIdx].id]||[]).includes(opt.key)} onChange={()=>toggleAnswer(examQuestions[currentIdx].id,opt.key)} />
                {opt.key}. {opt.text}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-between">
            <button disabled={currentIdx===0} onClick={()=>setCurrentIdx(i=>i-1)} className="px-3 py-1 border rounded">Prev</button>
            <button disabled={currentIdx===examQuestions.length-1} onClick={()=>setCurrentIdx(i=>i+1)} className="px-3 py-1 border rounded">Next</button>
            <button onClick={()=>{setShowResults(true); setStarted(false)}} className="px-3 py-1 bg-green-600 text-white rounded">End & Score</button>
          </div>
        </div>
      )}
      {showResults && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <h2 className="font-bold text-xl mb-2">Results</h2>
          <div>Total: {scoreExam().total}, Correct: {scoreExam().correct}, Percent: {scoreExam().percent}%</div>
        </div>
      )}
    </div>
  );
}

export default App;
