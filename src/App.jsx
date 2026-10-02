import React, { useState, useEffect, useMemo } from 'react';

// Single-file React vocabulary game
export default function App() {
  const [coins, setCoins] = useState(() => {
    try { return JSON.parse(localStorage.getItem('v_coins') || '0'); } catch { return 0; }
  });
  const [weeks, setWeeks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('v_weeks') || '[]'); } catch { return []; }
  });
  const [activeWeekId, setActiveWeekId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('v_act_week') || 'null'); } catch { return null; }
  });

  const [view, setView] = useState('game'); 
  const [pinInput, setPinInput] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => { localStorage.setItem('v_coins', JSON.stringify(coins)); }, [coins]);
  useEffect(() => { localStorage.setItem('v_weeks', JSON.stringify(weeks)); }, [weeks]);
  useEffect(() => { localStorage.setItem('v_act_week', JSON.stringify(activeWeekId)); }, [activeWeekId]);

  const activeWeek = useMemo(() => weeks.find(w => w.id === activeWeekId), [weeks, activeWeekId]);

  const generateQuestion = () => {
    if (!activeWeek || !activeWeek.words || activeWeek.words.length === 0) return setCurrentQuestion(null);
    const wordObj = activeWeek.words[Math.floor(Math.random() * activeWeek.words.length)];
    setCurrentQuestion({ ...wordObj, type: 'translate_sv_en' });
    setUserAnswer(''); setFeedback(null);
  };

  useEffect(() => { if (view === 'game' && !currentQuestion && activeWeek) generateQuestion(); }, [view, activeWeek, currentQuestion]);

  const checkAnswer = (e) => {
    e.preventDefault();
    if (!currentQuestion) return;
    if (userAnswer.trim().toLowerCase() === currentQuestion.eng.toLowerCase()) {
      setCoins(c => c + 1);
      setFeedback({ type: 'success', text: 'Rätt! +1 💖' });
      setTimeout(() => generateQuestion(), 1200);
    } else {
      setFeedback({ type: 'error', text: `Rätt svar var: ${currentQuestion.eng}` });
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <h1 style={{ color: '#d63384', margin: 0 }}>✨ Vocab Star</h1>
        <div>
          <span style={{ fontWeight: 'bold', fontSize: 18, marginRight: 15 }}>💖 {coins}</span>
          <button onClick={() => setView(view === 'game' ? 'login' : 'game')} style={{ padding: '8px 15px', borderRadius: 10, border: 'none', background: '#f8d7da', cursor: 'pointer' }}>
            {view === 'game' ? 'Förälder' : 'Spelet'}
          </button>
        </div>
      </header>

      {view === 'game' && (
        <main style={{ border: '3px solid #f8d7da', borderRadius: 20, padding: 30, background: '#fff' }}>
          {!activeWeek ? (
            <p>Inga glosor inlagda än! Be en vuxen lägga till ord i föräldraläget.</p>
          ) : currentQuestion && (
            <form onSubmit={checkAnswer}>
              <h2>Vad heter "{currentQuestion.swe}" på engelska?</h2>
              <input 
                type="text" 
                value={userAnswer} 
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Skriv på engelska..."
                style={{ padding: 12, fontSize: 18, width: '80%', borderRadius: 10, border: '2px solid #ccc', marginBottom: 15, textAlign: 'center' }}
              />
              <br />
              <button type="submit" style={{ padding: '12px 25px', fontSize: 18, borderRadius: 10, border: 'none', background: '#d63384', color: '#fff', cursor: 'pointer' }}>Svara</button>
            </form>
          )}
          {feedback && <p style={{ marginTop: 15, fontWeight: 'bold', color: feedback.type === 'success' ? 'green' : 'red' }}>{feedback.text}</p>}
        </main>
      )}

      {view === 'login' && (
        <div style={{ border: '3px solid #f8d7da', borderRadius: 20, padding: 30 }}>
          <h2>Föräldraläge</h2>
          <form onSubmit={e => { e.preventDefault(); if (pinInput === '6768') setView('parent'); }}>
            <input 
              type="password" 
              placeholder="Kod (6768)" 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)}
              style={{ padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #ccc', marginBottom: 10, textAlign: 'center' }}
            />
            <br />
            <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#d63384', color: '#fff' }}>Lås upp</button>
          </form>
        </div>
      )}

      {view === 'parent' && (
        <div style={{ border: '3px solid #f8d7da', borderRadius: 20, padding: 30, textAlign: 'left' }}>
          <h2>Hantera Glosor</h2>
          <button onClick={() => setCoins(9999)} style={{ marginBottom: 15, padding: 8, background: '#ffc107', border: 'none', borderRadius: 5 }}>Ge 9999 Coins (Test)</button>
          <br />
          <button onClick={() => {
            const w = { id: Date.now().toString(), name: 'Vecka 1', words: [{ eng: 'cat', swe: 'katt' }, { eng: 'dog', swe: 'hund' }] };
            setWeeks([...weeks, w]);
            setActiveWeekId(w.id);
          }} style={{ padding: 10, background: '#198754', color: '#fff', border: 'none', borderRadius: 8 }}>
            + Lägg till Exempelvecka (katt/hund)
          </button>
        </div>
      )}
    </div>
  );
}
