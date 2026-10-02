import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, Home, User, Lock, Edit2, Plus, ArrowLeft, Check, Sparkles } from 'lucide-react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } 
    catch (error) { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {}
  };
  return [storedValue, setValue];
}

const AVATAR_ITEMS = [
  { id: 'top_pink', name: 'Pink Top', cost: 10, category: 'Tops', icon: '👚', render: <path d="M70,120 L130,120 L125,180 L75,180 Z" fill="#ff99cc" /> },
  { id: 'dress_party', name: 'Party Dress', cost: 40, category: 'Dresses', icon: '✨', render: <path d="M70,120 L130,120 L140,250 L60,250 Z" fill="#cc66ff" /> },
  { id: 'tiara', name: 'Princess Tiara', cost: 50, category: 'Headwear', icon: '👑', render: <path d="M85,45 L115,45 L110,30 L100,40 L90,30 Z" fill="#ffd700" /> },
  { id: 'sunglasses', name: 'Sunglasses', cost: 15, category: 'Accessories', icon: '🕶️', render: <g><rect x="85" y="65" width="12" height="8" fill="#000"/><rect x="103" y="65" width="12" height="8" fill="#000"/><path d="M97,69 L103,69" stroke="#000" strokeWidth="2"/></g> }
];

const FURNITURE_ITEMS = [
  { id: 'bed', name: 'Bed', cost: 20, icon: '🛏️' }, { id: 'wardrobe', name: 'Closet', cost: 30, icon: '🚪' },
  { id: 'sofa', name: 'Sofa', cost: 25, icon: '🛋️' }, { id: 'tv', name: 'TV', cost: 40, icon: '📺' },
  { id: 'bathtub', name: 'Bathtub', cost: 35, icon: '🛁' }, { id: 'toilet', name: 'Toilet', cost: 15, icon: '🚽' },
  { id: 'fridge', name: 'Fridge', cost: 30, icon: '🧊' }, { id: 'table', name: 'Dining Table', cost: 25, icon: '🪑' }
];

export default function App() {
  const [coins, setCoins] = useLocalStorage('v_coins', 0);
  const [weeks, setWeeks] = useLocalStorage('v_weeks', []);
  const [activeWeekId, setActiveWeekId] = useLocalStorage('v_act_week', null);
  
  const [ownedAvatar, setOwnedAvatar] = useLocalStorage('v_own_av', []);
  const [equippedAvatar, setEquippedAvatar] = useLocalStorage('v_eq_av', []);
  
  const [ownedFurniture, setOwnedFurniture] = useLocalStorage('v_own_furn', []);
  const [placedFurniture, setPlacedFurniture] = useLocalStorage('v_pl_furn', []);

  const [view, setView] = useState('game'); 
  const [leftTab, setLeftTab] = useState('house'); 
  const [avatarTab, setAvatarTab] = useState('shop');
  const [houseTab, setHouseTab] = useState('shop');
  
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); 
  const [pinInput, setPinInput] = useState('');
  const [editingWeek, setEditingWeek] = useState(null);
  const [weekNameInput, setWeekNameInput] = useState('');
  const [wordsInput, setWordsInput] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [savedCoins, setSavedCoins] = useState(0);

  const activeWeek = useMemo(() => weeks.find(w => w.id === activeWeekId), [weeks, activeWeekId]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; window.speechSynthesis.speak(u);
    }
  };

  const generateQuestion = () => {
    if (!activeWeek || !activeWeek.words || activeWeek.words.length === 0) return setCurrentQuestion(null);
    const wordObj = activeWeek.words[Math.floor(Math.random() * activeWeek.words.length)];
    const types = ['translate_en_sv', 'translate_sv_en', 'spell', 'sentence'];
    setCurrentQuestion({ ...wordObj, type: types[Math.floor(Math.random() * types.length)] });
    setUserAnswer(''); setFeedback(null);
  };

  useEffect(() => { if (view === 'game' && !currentQuestion && activeWeek) generateQuestion(); }, [view, activeWeek, currentQuestion]);

  const checkAnswer = (e) => {
    e.preventDefault(); if (!currentQuestion) return;
    const ans = userAnswer.trim().toLowerCase();
    const isCorrect = (currentQuestion.type === 'translate_en_sv') ? ans === currentQuestion.swe.toLowerCase() : ans === currentQuestion.eng.toLowerCase();
    if (isCorrect) {
      setCoins(c => c + 1); setFeedback({ type: 'success', text: 'Correct! +1 💖' }); speak("Good job!");
      setTimeout(() => generateQuestion(), 1500);
    } else {
      setFeedback({ type: 'error', text: `Almost! The answer is: ${currentQuestion.type === 'translate_en_sv' ? currentQuestion.swe : currentQuestion.eng}` }); speak("Try again");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); const itemId = e.dataTransfer.getData('item_id');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 25; const y = e.clientY - rect.top - 25;
    const existing = placedFurniture.find(p => p.instanceId === itemId);
    if (existing) {
      setPlacedFurniture(placedFurniture.map(p => p.instanceId === itemId ? { ...p, x, y } : p));
    } else {
      setPlacedFurniture([...placedFurniture, { instanceId: Date.now().toString(), baseId: itemId, x, y }]);
      setOwnedFurniture(ownedFurniture.filter(id => id !== itemId));
    }
  };

  return (
    <div className="h-screen w-screen bg-pink-50 flex flex-col font-sans overflow-hidden">
      <div className="h-16 flex items-center justify-between bg-white px-6 border-b-2 border-pink-100 shrink-0">
        <h1 className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-fuchsia-600">✨ Vocab Star</h1>
        <div className="flex items-center space-x-6">
          <div className="bg-pink-100 px-5 py-2 rounded-full text-pink-600 font-bold">💖 {coins}</div>
          <button onClick={() => view === 'game' ? setView('parent_login') : setView('game')} className="p-2 bg-pink-100 text-pink-600 rounded-xl">
            {view === 'game' ? <Lock size={22} /> : <Home size={22} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {view === 'game' && (
          <div className="w-1/2 flex flex-col bg-white rounded-3xl border-4 border-pink-200 overflow-hidden h-full">
            <div className="flex border-b-4 border-pink-100 shrink-0">
              <button onClick={() => setLeftTab('avatar')} className={`flex-1 py-3 font-bold ${leftTab === 'avatar' ? 'bg-pink-100 text-pink-600' : 'text-pink-300'}`}>Myself</button>
              <button onClick={() => setLeftTab('house')} className={`flex-1 py-3 font-bold ${leftTab === 'house' ? 'bg-pink-100 text-pink-600' : 'text-pink-300'}`}>My House</button>
            </div>

            {leftTab === 'house' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 bg-blue-50 relative border-b-4 border-pink-200 grid grid-cols-2 grid-rows-2" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                  <div className="border-r-4 border-b-4 border-pink-200 bg-pink-50 p-2 text-pink-300 font-bold">Bedroom</div>
                  <div className="border-b-4 border-pink-200 bg-blue-100 p-2 text-blue-300 font-bold">Bathroom</div>
                  <div className="border-r-4 border-pink-200 bg-yellow-50 p-2 text-yellow-300 font-bold">Living Room</div>
                  <div className="bg-green-50 p-2 text-green-300 font-bold">Kitchen</div>
                  {placedFurniture.map(item => {
                    const base = FURNITURE_ITEMS.find(f => f.id === item.baseId);
                    return base ? (
                      <div key={item.instanceId} draggable onDragStart={e => e.dataTransfer.setData('item_id', item.instanceId)}
                           onDoubleClick={() => { setPlacedFurniture(placedFurniture.filter(p => p.instanceId !== item.instanceId)); setOwnedFurniture([...ownedFurniture, item.baseId]); }}
                           className="absolute text-5xl cursor-move hover:scale-110 select-none" style={{ left: item.x, top: item.y }}>
                        {base.icon}
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="h-48 bg-white flex flex-col shrink-0">
                  <div className="flex border-b-2 border-pink-100">
                    <button onClick={() => setHouseTab('shop')} className={`flex-1 py-2 font-bold ${houseTab === 'shop' ? 'bg-pink-50 text-pink-600' : 'text-pink-300'}`}>Shop</button>
                    <button onClick={() => setHouseTab('storage')} className={`flex-1 py-2 font-bold ${houseTab === 'storage' ? 'bg-pink-50 text-pink-600' : 'text-pink-300'}`}>Storage</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {houseTab === 'shop' ? (
                      <div className="grid grid-cols-4 gap-2">
                        {FURNITURE_ITEMS.map(item => (
                          <button key={item.id} disabled={coins < item.cost} onClick={() => { setCoins(c => c - item.cost); setOwnedFurniture([...ownedFurniture, item.id]); }}
                                  className={`p-2 rounded-xl border flex flex-col items-center ${coins >= item.cost ? 'border-pink-200 bg-pink-50' : 'opacity-50'}`}>
                            <span className="text-2xl">{item.icon}</span><span className="text-xs font-bold mt-1">💖 {item.cost}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2 p-2">
                        {ownedFurniture.map((id, i) => {
                          const base = FURNITURE_ITEMS.find(f => f.id === id);
                          return base ? <div key={i} draggable onDragStart={e => e.dataTransfer.setData('item_id', id)} className="bg-white border-2 border-pink-200 w-16 h-16 rounded-xl flex justify-center items-center text-4xl">{base.icon}</div> : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {leftTab === 'avatar' && (
              <div className="flex-1 flex flex-row overflow-hidden">
                <div className="w-1/2 bg-gradient-to-b from-pink-50 to-white flex items-center justify-center border-r-2 border-pink-100">
                  <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-lg">
                    <path d="M70,50 Q40,150 50,220 Q60,240 75,200 Z" fill="#f4d03f" />
                    <path d="M130,50 Q160,150 150,220 Q140,240 125,200 Z" fill="#f4d03f" />
                    <path d="M85,220 L80,350 L95,350 L95,220 Z" fill="#ffccb3" />
                    <path d="M115,220 L120,350 L105,350 L105,220 Z" fill="#ffccb3" />
                    <path d="M70,130 L50,210 L60,210 L75,140 Z" fill="#ffccb3" />
                    <path d="M130,130 L150,210 L140,210 L125,140 Z" fill="#ffccb3" />
                    <path d="M75,120 L125,120 L120,180 L80,180 Z" fill="#ffccb3" />
                    <path d="M75,120 L125,120 L120,150 L80,150 Z" fill="#fff" /> 
                    <path d="M80,180 L120,180 L115,220 L85,220 Z" fill="#b3d9ff" /> 
                    <circle cx="100" cy="75" r="28" fill="#ffccb3" />
                    <circle cx="88" cy="72" r="4" fill="#3399ff" /> <circle cx="112" cy="72" r="4" fill="#3399ff" />
                    <path d="M93,86 Q100,92 107,86" fill="none" stroke="#ff6699" strokeWidth="2" />
                    <path d="M75,55 Q100,30 125,55 Q135,70 125,90 Q125,45 100,45 Q75,45 75,90 Q65,70 75,55 Z" fill="#fce068" />
                    {AVATAR_ITEMS.filter(i => equippedAvatar.includes(i.id)).map(i => <g key={i.id}>{i.render}</g>)}
                  </svg>
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="flex border-b-2 border-pink-100 shrink-0">
                    <button onClick={() => setAvatarTab('shop')} className={`flex-1 py-2 font-bold ${avatarTab === 'shop' ? 'bg-pink-50 text-pink-600' : 'text-pink-300'}`}>Shop</button>
                    <button onClick={() => setAvatarTab('wardrobe')} className={`flex-1 py-2 font-bold ${avatarTab === 'wardrobe' ? 'bg-pink-50 text-pink-600' : 'text-pink-300'}`}>Wardrobe</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                    {avatarTab === 'shop' ? AVATAR_ITEMS.map(item => (
                      <button key={item.id} disabled={coins < item.cost || ownedAvatar.includes(item.id)} onClick={() => { setCoins(c => c - item.cost); setOwnedAvatar([...ownedAvatar, item.id]); }}
                              className={`p-2 rounded-xl border flex flex-col items-center ${coins >= item.cost && !ownedAvatar.includes(item.id) ? 'border-pink-200 bg-pink-50' : 'opacity-50'}`}>
                        <span className="text-2xl">{item.icon}</span><span className="text-xs font-bold mt-1">💖 {item.cost}</span>
                      </button>
                    )) : AVATAR_ITEMS.filter(i => ownedAvatar.includes(i.id)).map(item => (
                      <button key={item.id} onClick={() => equippedAvatar.includes(item.id) ? setEquippedAvatar(equippedAvatar.filter(id => id !== item.id)) : setEquippedAvatar([...equippedAvatar, item.id])}
                              className={`p-2 rounded-xl border flex flex-col items-center ${equippedAvatar.includes(item.id) ? 'bg-pink-200 border-pink-400' : 'bg-white border-pink-100'}`}>
                        <span className="text-2xl">{item.icon}</span><span className="text-xs font-bold mt-1">Equip</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'game' && (
          <div className="w-1/2 flex flex-col bg-white rounded-3xl border-4 border-pink-200 p-6 justify-center items-center">
            {!activeWeek ? <p className="text-pink-400 font-bold text-xl">Ask an adult to create words!</p> : currentQuestion && (
              <>
                <p className="text-pink-400 font-bold mb-4 uppercase">{currentQuestion.type}</p>
                <h2 className="text-4xl font-extrabold text-pink-600 mb-8">{currentQuestion.eng} / {currentQuestion.swe}</h2>
                <form onSubmit={checkAnswer} className="w-full max-w-md">
                  <input type="text" value={userAnswer} onChange={e => setUserAnswer(e.target.value)} placeholder="Type answer..." className="w-full p-4 text-center text-xl border-4 border-pink-100 rounded-2xl mb-4 bg-pink-50" />
                  <button type="submit" className="w-full py-4 bg-pink-500 text-white font-bold text-xl rounded-2xl shadow-md">Answer</button>
                </form>
                {feedback && <div className={`mt-4 p-4 rounded-xl font-bold w-full max-w-md text-center ${feedback.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>{feedback.text}</div>}
              </>
            )}
          </div>
        )}

        {view === 'parent_login' && (
          <div className="flex-1 flex items-center justify-center bg-white rounded-3xl border-4 border-pink-200">
            <form onSubmit={e => { e.preventDefault(); if(pinInput === '6768') { setView('parent_dash'); setPinInput(''); } }} className="flex flex-col items-center">
              <h2 className="text-2xl font-bold text-pink-600 mb-6">Föräldraläge</h2>
              <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} placeholder="Kod (6768)" className="p-4 border-4 border-pink-100 rounded-2xl mb-4 text-center" />
              <button className="px-8 py-4 bg-pink-500 text-white font-bold rounded-2xl">Lås upp</button>
            </form>
          </div>
        )}

        {view === 'parent_dash' && (
          <div className="flex-1 flex flex-col bg-white rounded-3xl border-4 border-pink-200 p-6">
            <h2 className="text-2xl font-bold text-pink-600 mb-4">Dina Veckor</h2>
            <button onClick={() => { if(!testMode) { setSavedCoins(coins); setCoins(9999); setTestMode(true); } else { setCoins(savedCoins); setTestMode(false); } }} className="mb-4 bg-red-500 text-white p-2 rounded">
              {testMode ? 'Stäng av Testläge' : 'Aktivera Testläge (9999 coins)'}
            </button>
            <button onClick={() => { const w = { id: Date.now().toString(), name: 'Ny Vecka', words: [{eng: 'cat', swe: 'katt'}] }; setWeeks([...weeks, w]); setActiveWeekId(w.id); }} className="bg-green-500 text-white p-4 rounded-xl">Skapa Exempelvecka</button>
          </div>
        )}
      </div>
    </div>
  );
}