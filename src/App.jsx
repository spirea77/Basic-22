import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";

// ─── FIREBASE 설정 (기존 설정 유지) ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyALaJMUPnc9Ik8JDUWMhWp8_O-Xk00jlv8",
  authDomain: "basie-22.firebaseapp.com",
  projectId: "basie-22",
  storageBucket: "basie-22.firebasestorage.app",
  messagingSenderId: "474838185685",
  appId: "1:474838185685:web:052572afc58d8d8e1c945c"
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const gProvider = new GoogleAuthProvider();

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const MAX_SEC = 300; // 5분
const SUCCESS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"; // 은은한 알림음

// ─── FIRESTORE 헬퍼 ───────────────────────────────────────────────────────────
async function saveCompletion(user, dateKey, done, voiceDone, passage) {
  try {
    await setDoc(doc(db, "completions", `${user.uid}_${dateKey}`), {
      uid: user.uid,
      displayName: user.displayName || "이름없음",
      email: user.email || "",
      photoURL: user.photoURL || "",
      done: !!done,
      voiceDone: !!voiceDone, // DB 필드명은 유지 (5분 묵상 완료 여부)
      dateKey,
      passage: passage || "",
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch(e) { console.error("저장 실패", e); }
}

async function loadUserCompletions(uid) {
  try {
    const snap = await getDocs(query(collection(db, "completions"), where("uid", "==", uid)));
    const done = new Set(), voiceDone = new Set();
    snap.forEach(d => {
      if (d.data().done) done.add(d.data().dateKey);
      if (d.data().voiceDone) voiceDone.add(d.data().dateKey);
    });
    return { done, voiceDone };
  } catch(e) { return { done: new Set(), voiceDone: new Set() }; }
}

// ─── 데이터 및 유틸 함수 (생략 없이 포함) ───────────────────────────────────────
const DEVOTIONALS = {
"1-1":{핵심:"태초에 하나님이 천지를 창조하셨습니다. 혼돈과 공허 가운데 하나님의 말씀이 임하자 빛이 생겨났습니다. 하나님은 모든 것을 보시고 '좋았더라'고 선언하셨습니다.",성품:"하나님은 창조주이시며 혼돈을 질서로, 공허를 충만으로 바꾸시는 분입니다.",묵상:"오늘 내 삶의 혼돈과 공허한 부분에 하나님의 말씀이 임하면 어떻게 변화될까요? 창조의 하나님이 오늘도 내 삶을 새롭게 창조하고 계십니다.",기도:"창조의 하나님, 오늘도 내 삶의 혼돈 가운데 당신의 빛을 비추시고 새로운 창조를 이루어 주소서.",구절:"태초에 하나님이 천지를 창조하시니라 (창세기 1:1)"},
// ... (기존 DEVOTIONALS 데이터가 들어가는 자리입니다. 용량상 일부만 예시로 둡니다.)
"3-29":{핵심:"언약궤를 빼앗기고 엘리와 그 아들들이 죽는 비극이 일어납니다. 그러나 하나님은 블레셋의 다곤 신전에서 스스로 당신의 영광을 지키십니다.",성품:"하나님은 스스로 당신의 영광을 지키시는 분입니다.",묵상:"상황이 패배처럼 보일 때도 하나님은 스스로의 영광을 지키심을 믿으세요.",기도:"영광의 하나님, 내 삶이 당신의 영광을 드러내는 통로가 되게 하소서.",구절:"여호와께서 길갈에서부터 보김에 이르러 이르시되... (사사기 2:1)"},
};

const BF = {"창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기","수":"여호수아","삿":"사사기","룻":"룻기","삼상":"사무엘상","삼하":"사무엘하","왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하","스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편","잠":"잠언","전":"전도서","아":"아가","사":"이사야","렘":"예레미야","애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘","암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔","합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기","마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음","행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서","갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서","살전":"데살로니가전서","살후":"데살로니가후서","딤전":"디모데전서","딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서","약":"야고보서","벧전":"베드로전서","벧후":"베드로후서","요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"};
function expand(raw) {
  if (!raw || raw==="개별통독") return raw;
  const sorted = Object.keys(BF).sort((a,b)=>b.length-a.length);
  let r = raw;
  for (const ab of sorted) r = r.replace(new RegExp(`^${ab}\\b`), BF[ab]);
  return r;
}

const R = {"1-1":"창 1-3","1-2":"창 4-6","3-29":"삼상 4-8","3-30":"삼상 9-12","3-31":"삼상 13-14" /* ... (기존 R 데이터) */ };

const GOSPEL_BOOKS = new Set(["마","막","눅","요"]);
const NT_BOOKS = new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]);
const THEMES = [
  {key:"GOD", name:"하나님", subtitle:"하나님은 누구신가", en:"Father · Creator · Sovereign", color:"#C9A84C", glow:"rgba(201,168,76,0.4)", bg:"rgba(201,168,76,0.07)", border:"rgba(201,168,76,0.22)", symbol:"✦", badge:"구약 · 하나님"},
  {key:"JESUS", name:"예수님", subtitle:"예수님은 누구신가", en:"Son · Savior · Lord", color:"#D48C6E", glow:"rgba(212,140,110,0.4)", bg:"rgba(212,140,110,0.07)", border:"rgba(212,140,110,0.22)", symbol:"✝", badge:"복음서 · 예수님"},
  {key:"SPIRIT", name:"성령님", subtitle:"성령님은 누구신가", en:"Holy Spirit · Comforter · Guide", color:"#6EA8D4", glow:"rgba(110,168,212,0.4)", bg:"rgba(110,168,212,0.07)", border:"rgba(110,168,212,0.22)", symbol:"◈", badge:"신약 · 성령님"},
];
function detectTheme(raw) {
  if (!raw || raw==="개별통독") return THEMES[0];
  const fw = raw.trim().split(/[\s,]/)[0];
  if (GOSPEL_BOOKS.has(fw)) return THEMES[1];
  if (NT_BOOKS.has(fw)) return THEMES[2];
  return THEMES[0];
}
const dk = d => `${d.getMonth()+1}-${d.getDate()}`;
const today0 = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmtLong = d => d.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, gProvider); } catch(e) { setLoading(false); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#06091A",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Noto Serif KR',serif"}}>
      <div style={{textAlign:"center",maxWidth:340,width:"100%"}}>
        <div style={{fontSize:52,marginBottom:16,color:"#C9A84C"}}>✦</div>
        <h1 style={{fontSize:34,color:"#C9A84C",marginBottom:8}}>2026 성경통독</h1>
        <p style={{fontSize:13,color:"#6A5E50",marginBottom:36,lineHeight:1.8}}>BASIC Community Church</p>
        <button onClick={handleLogin} disabled={loading} style={{background:"#fff",border:"none",borderRadius:14,padding:"15px 32px",cursor:"pointer",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:10,margin:"0 auto",boxShadow:"0 4px 24px rgba(0,0,0,.4)"}}>
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>
      </div>
    </div>
  );
}

// ─── LEADER DASHBOARD ─────────────────────────────────────────────────────────
function LeaderDashboard({ theme }) {
  const TODAY = today0();
  const [selDate, setSelDate] = useState(TODAY);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = dk(selDate);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "completions"), where("dateKey", "==", key));
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => d.data()));
      setLoading(false);
    });
    return () => unsub();
  }, [key]);

  const getColor = m => (m.done && m.voiceDone) ? "#4CAF81" : m.done ? "#C9A84C" : "#444";

  return (
    <div className="fade" style={{paddingTop:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button className="btn" onClick={()=>setSelDate(d=>addDays(d,-1))}>←</button>
        <div style={{textAlign:"center", color:"#EDE5D5"}}>{selDate.getMonth()+1}월 {selDate.getDate()}일 현황</div>
        <button className="btn" onClick={()=>setSelDate(d=>addDays(d,1))}>→</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {members.map(m => (
          <div key={m.uid} style={{background:"rgba(255,255,255,.03)", border:`1px solid ${getColor(m)}`, borderRadius:14, padding:12, display:"flex", alignItems:"center", gap:10}}>
             <img src={m.photoURL} width={30} height={30} style={{borderRadius:15}} alt=""/>
             <div style={{flex:1, fontSize:14, color:"#EDE5D5"}}>{m.displayName}</div>
             <div style={{fontSize:12, color:getColor(m)}}>{m.done && "📖"} {m.voiceDone && "⏳"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MEDITATION TIMER (NEW!) ─────────────────────────────────────────────────
function MeditationTimer({ dateKey, passageRaw, theme, onSave, isTimerDone, devotionalData }) {
  const [timerState, setTimerState] = useState(isTimerDone ? "finished" : "idle");
  const [timeLeft, setTimeLeft] = useState(MAX_SEC);
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio(SUCCESS_SOUND_URL));

  useEffect(() => {
    setTimerState(isTimerDone ? "finished" : "idle");
    setTimeLeft(MAX_SEC);
    return () => clearInterval(timerRef.current);
  }, [dateKey, isTimerDone]);

  const startTimer = () => {
    setTimerState("running");
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          audioRef.current.play(); // 알림음 재생
          setTimerState("finished");
          if (onSave) onSave(); // Firestore 자동 저장
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pct = ((MAX_SEC - timeLeft) / MAX_SEC) * 100;

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      {timerState === "idle" && (
        <div className="fade">
          <div style={{ fontSize: 13, color: "#6A5E50", marginBottom: 20 }}>아래 버튼을 누르면 5분 묵상이 시작됩니다.</div>
          <button onClick={startTimer} style={{ background: theme.color, border: "none", borderRadius: 100, padding: "16px 40px", color: "#08090F", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            ⏳ 5분 묵상 시작
          </button>
        </div>
      )}

      {timerState === "running" && (
        <div className="fade">
          <div style={{ fontSize: 48, fontWeight: 600, color: theme.color, marginBottom: 8 }}>{fmtTime(timeLeft)}</div>
          <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 100, height: 6, maxWidth: 260, margin: "0 auto 20px" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: theme.color, borderRadius: 100, transition: "width 1s linear" }} />
          </div>
          <p style={{ color: "#EDE5D5", fontStyle: "italic" }}>"잠잠히 하나님만 바라보는 시간..."</p>
        </div>
      )}

      {timerState === "finished" && (
        <div className="fade">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎊</div>
          <h2 style={{ color: theme.color, marginBottom: 10 }}>오늘도 승리했습니다!</h2>
          <p style={{ color: "#6A5E50" }}>5분간의 소중한 묵상을 마쳤습니다.</p>
          <button onClick={() => setTimerState("idle")} style={{ marginTop: 20, background: "none", border: `1px solid ${theme.color}`, color: theme.color, padding: "8px 16px", borderRadius: 8 }}>다시하기</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const TODAY = today0();
  const [user, setUser] = useState(undefined);
  const [viewDate, setViewDate] = useState(TODAY);
  const [done, setDone] = useState(new Set());
  const [voiceDone, setVoiceDone] = useState(new Set());
  const [tab, setTab] = useState("main");
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());

  const key = dk(viewDate);
  const raw = R[key] || "";
  const theme = detectTheme(raw);
  const d = DEVOTIONALS[key];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const { done: d2, voiceDone: v2 } = await loadUserCompletions(u.uid);
        setDone(d2); setVoiceDone(v2);
      }
    });
    return () => unsub();
  }, []);

  const handleFinishTimer = async () => {
    const nextV = new Set(voiceDone); nextV.add(key); setVoiceDone(nextV);
    const nextD = new Set(done); nextD.add(key); setDone(nextD);
    if (user) await saveCompletion(user, key, true, true, raw);
  };

  const toggleDone = async () => {
    const next = new Set(done);
    next.has(key) ? next.delete(key) : next.add(key);
    setDone(next);
    if (user) await saveCompletion(user, key, next.has(key), voiceDone.has(key), raw);
  };

  if (user === undefined) return <div style={{background:"#06091A", minHeight:"100vh"}}/>;
  if (!user) return <LoginScreen />;

  const TABS = [["main","📖 묵상"],["timer","⏳ 5분 묵상"],["calendar","📅 달력"],["leader","👑 현황판"]];

  return (
    <div style={{minHeight:"100vh",background:"#06091A",color:"#E8E0D0",fontFamily:"'Noto Serif KR',serif", paddingBottom:50}}>
      <style>{`.fade{animation:fadeUp .5s ease both} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .btn{background:rgba(255,255,255,.05); border:none; color:#9A8E7A; padding:8px 12px; border-radius:8px; cursor:pointer;}`}</style>
      
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px"}}>
        <header style={{textAlign:"center", marginBottom:30}}>
          <div style={{fontSize:10, color:"#3A3028", letterSpacing:".2em"}}>BASIC COMMUNITY CHURCH</div>
          <div style={{fontSize:14, marginTop:5}}>{fmtLong(viewDate)}</div>
        </header>

        <nav style={{display:"flex", gap:5, justifyContent:"center", marginBottom:20}}>
          {TABS.map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?theme.color:"none", border:tab===t?"none":`1px solid #333`, color:tab===t?"#000":"#6A5E50", padding:"8px 15px", borderRadius:20, cursor:"pointer", fontSize:12}}>
              {l}
            </button>
          ))}
        </nav>

        {tab==="main" && (
          <div className="fade">
            <div style={{textAlign:"center", marginBottom:30}}>
              <h1 style={{fontSize:60, color:theme.color, fontFamily:"'Cormorant Garamond',serif"}}>{theme.name}</h1>
              <div style={{background:theme.bg, border:`1px solid ${theme.border}`, padding:20, borderRadius:20, marginTop:20}}>
                <div style={{fontSize:24, fontWeight:700, marginBottom:10}}>{raw}</div>
                <div style={{fontSize:14, color:"#8A7E6E", lineHeight:1.8}}>{d?.핵심 || "말씀을 묵상하며 하나님을 만나는 시간입니다."}</div>
              </div>
            </div>
            <button onClick={toggleDone} style={{width:"100%", padding:15, borderRadius:15, background:done.has(key)?theme.color:"#111", border:"none", color:done.has(key)?"#000":"#fff", fontWeight:700, cursor:"pointer"}}>
              {done.has(key) ? "✓ 묵상 완료" : "묵상 완료 체크"}
            </button>
          </div>
        )}

        {tab==="timer" && (
          <div className="fade">
             <div style={{background:"rgba(255,255,255,.02)", border:`1px solid ${theme.border}`, padding:20, borderRadius:20}}>
               <div style={{textAlign:"center", marginBottom:15, fontSize:15, color:theme.color}}>"{d?.구절 || "오늘의 말씀을 기억하며..."}"</div>
               <MeditationTimer dateKey={key} passageRaw={raw} theme={theme} onSave={handleFinishTimer} isTimerDone={voiceDone.has(key)} devotionalData={d}/>
             </div>
          </div>
        )}

        {tab==="calendar" && (
          <div className="fade" style={{textAlign:"center"}}>
            <div style={{fontSize:20, marginBottom:20}}>2026년 {calMonth+1}월</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5}}>
              {/* 간단 달력 로직 */}
              {Array.from({length:31}).map((_, i) => {
                const dayKey = `${calMonth+1}-${i+1}`;
                const isD = done.has(dayKey);
                const isV = voiceDone.has(dayKey);
                return (
                  <div key={i} onClick={()=>{setViewDate(new Date(2026,calMonth,i+1)); setTab("main");}} style={{background:isD?"#C9A84C33":"#111", padding:10, borderRadius:8, fontSize:12, cursor:"pointer", border:dayKey===key?`1px solid ${theme.color}`:"none"}}>
                    {i+1}
                    <div style={{fontSize:8}}>{isV && "⏳"}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab==="leader" && <LeaderDashboard theme={theme}/>}

        <footer style={{marginTop:40, textAlign:"center", fontSize:10, color:"#333"}}>
           <button onClick={()=>signOut(auth)} style={{background:"none", border:"1px solid #333", color:"#333", padding:"5px 10px", borderRadius:5}}>로그아웃</button>
        </footer>
      </div>
    </div>
  );
}
