import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";

// ─── FIREBASE 설정 ─────────────────────────────────────────────────────────────
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
const SUCCESS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"; 

// ─── FIRESTORE 헬퍼 ───────────────────────────────────────────────────────────
async function saveCompletion(user, dateKey, done, voiceDone, passage) {
  try {
    await setDoc(doc(db, "completions", `${user.uid}_${dateKey}`), {
      uid: user.uid,
      displayName: user.displayName || "이름없음",
      email: user.email || "",
      photoURL: user.photoURL || "",
      done: !!done,
      voiceDone: !!voiceDone, // 선포 완료 여부
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

// ─── 묵상 데이터 (1월-12월 전체) ──────────────────────────────────────────
// (박반장님이 가지고 계신 1년치 DEVOTIONALS 데이터를 이 자리에 넣으시면 됩니다.)
const DEVOTIONALS = {
"3-29":{핵심:"언약궤를 빼앗기고 엘리와 그 아들들이 죽는 비극이 일어납니다. 그러나 하나님은 블레셋의 다곤 신전에서 스스로 당신의 영광을 지키십니다.",성품:"하나님은 스스로 당신의 영광을 지키시는 분입니다. 다곤 신상이 엎드러진 것은 하나님의 주권이 모든 우상보다 높음을 선포합니다.",묵상:"때로 상황이 마치 하나님이 패배하신 것처럼 보일 때가 있습니다. 하지만 하나님은 스스로의 영광을 지키십니다.",기도:"영광의 하나님, 어떤 상황에서도 당신의 이름이 높임 받으며, 내 삶이 그 영광을 드러내는 통로가 되게 하소서.",구절:"그들과 같이 우리도 복음 전함을 받은 자이나 들은 바 그 말씀이 그들에게 유익하지 못한 것은 듣는 자가 믿음과 결부시키지 아니함이라 (히브리서 4:2)"},
// ... 나머지 데이터
};

const R = { /* 박반장님의 1년치 통독표 R 데이터를 이 자리에 넣으세요 */ };

const BF = {"창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기","수":"여호수아","삿":"사사기","룻":"룻기","삼상":"사무엘상","삼하":"사무엘하","왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하","스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편","잠":"잠언","전":"전도서","아":"아가","사":"이사야","렘":"예레미야","애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘","암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔","합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기","마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음","행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서","갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서","살전":"데살로니가전서","살후":"데살로니가후서","딤전":"디모데전서","딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서","약":"야고보서","벧전":"베드로전서","벧후":"베드로후서","요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"};
function expand(raw) {
  if (!raw || raw==="개별통독") return raw;
  const sorted = Object.keys(BF).sort((a,b)=>b.length-a.length);
  let r = raw;
  for (const ab of sorted) r = r.replace(new RegExp(`^${ab}\\b`), BF[ab]);
  return r;
}

const THEMES = [
  {key:"GOD", name:"하나님", subtitle:"하나님은 누구신가", en:"Father · Creator · Sovereign", color:"#C9A84C", glow:"rgba(201,168,76,0.4)", bg:"rgba(201,168,76,0.07)", border:"rgba(201,168,76,0.22)", symbol:"✦", badge:"구약 · 하나님"},
  {key:"JESUS", name:"예수님", subtitle:"예수님은 누구신가", en:"Son · Savior · Lord", color:"#D48C6E", glow:"rgba(212,140,110,0.4)", bg:"rgba(212,140,110,0.07)", border:"rgba(212,140,110,0.22)", symbol:"✝", badge:"복음서 · 예수님"},
  {key:"SPIRIT", name:"성령님", subtitle:"성령님은 누구신가", en:"Holy Spirit · Comforter · Guide", color:"#6EA8D4", glow:"rgba(110,168,212,0.4)", bg:"rgba(110,168,212,0.07)", border:"rgba(110,168,212,0.22)", symbol:"◈", badge:"신약 · 성령님"},
];

function detectTheme(raw) {
  if (!raw || raw==="개별통독") return THEMES[0];
  const fw = raw.trim().split(/[\s,]/)[0];
  const GOSPEL_BOOKS = new Set(["마","막","눅","요"]);
  const NT_BOOKS = new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]);
  if (GOSPEL_BOOKS.has(fw)) return THEMES[1];
  if (NT_BOOKS.has(fw)) return THEMES[2];
  return THEMES[0];
}
const dk = d => `${d.getMonth()+1}-${d.getDate()}`;
const today0 = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmtLong = d => d.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

// ─── 5분 선포 타이머 컴포넌트 ───────────────────────────────────────────────
function DeclarationTimer({ dateKey, theme, onSave, isDone }) {
  const [state, setState] = useState(isDone ? "finished" : "idle");
  const [timeLeft, setTimeLeft] = useState(MAX_SEC);
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio(SUCCESS_SOUND_URL));

  useEffect(() => {
    setState(isDone ? "finished" : "idle");
    setTimeLeft(MAX_SEC);
    return () => clearInterval(timerRef.current);
  }, [dateKey, isDone]);

  const start = () => {
    setState("running");
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          audioRef.current.play();
          setState("finished");
          if (onSave) onSave();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pct = ((MAX_SEC - timeLeft) / MAX_SEC) * 100;

  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      {state === "idle" && (
        <button onClick={start} style={{ background: theme.color, border: "none", borderRadius: 100, padding: "14px 36px", color: "#08090F", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
           🎙 선포 시작
        </button>
      )}
      {state === "running" && (
        <div>
          <div style={{ fontSize: 44, color: theme.color, marginBottom: 10 }}>{fmtTime(timeLeft)}</div>
          <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 100, height: 6, maxWidth: 240, margin: "0 auto 10px" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: theme.color, borderRadius: 100, transition: "width 1s linear" }} />
          </div>
        </div>
      )}
      {state === "finished" && (
        <div className="fade">
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎊</div>
          <h2 style={{ color: theme.color, fontSize: 22 }}>오늘도 승리했습니다!</h2>
        </div>
      )}
    </div>
  );
}

// ─── 메인 앱 ─────────────────────────────────────────────────────────────────
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

  if (user === undefined) return null;
  if (!user) return <LoginScreen />;

  return (
    <div style={{minHeight:"100vh",background:"#06091A",color:"#E8E0D0",fontFamily:"'Noto Serif KR',serif"}}>
      <style>{`.fade{animation:fadeUp .5s ease both} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} .btn{background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); color:#9A8E7A; padding:9px 16px; border-radius:8px; cursor:pointer;}`}</style>
      
      <div style={{maxWidth:660,margin:"0 auto",padding:"20px"}}>
        {/* 헤더 */}
        <header style={{display:"flex",justifyContent:"space-between",padding:"10px 0",alignItems:"center"}}>
          <div style={{fontSize:12,color:"#6A5E50"}}>{fmtLong(viewDate)}</div>
          <div style={{background:theme.bg, border:`1px solid ${theme.border}`, borderRadius:20, padding:"5px 12px", fontSize:10, color:theme.color}}>{theme.badge}</div>
        </header>

        {/* 탭 네비게이션 */}
        <nav style={{display:"flex", gap:10, justifyContent:"center", margin:"20px 0"}}>
          <button onClick={()=>setTab("main")} style={{background:tab==="main"?"rgba(255,255,255,.1)":"none", border:"none", color:tab==="main"?theme.color:"#5A5242", cursor:"pointer"}}>📖 묵상</button>
          <button onClick={()=>setTab("timer")} style={{background:tab==="timer"?"rgba(255,255,255,.1)":"none", border:"none", color:tab==="timer"?theme.color:"#5A5242", cursor:"pointer"}}>🎙 5분 선포</button>
          <button onClick={()=>setTab("calendar")} style={{background:tab==="calendar"?"rgba(255,255,255,.1)":"none", border:"none", color:tab==="calendar"?theme.color:"#5A5242", cursor:"pointer"}}>📅 달력</button>
        </nav>

        {/* ═══ 1. 묵상 탭 (이미지 1번 레이아웃) ═══ */}
        {tab==="main" && (
          <div className="fade">
            <h1 style={{fontSize:52, color:theme.color, textAlign:"center", fontFamily:"'Cormorant Garamond',serif", marginBottom:20}}>{theme.name}</h1>
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.06))`,border:`1px solid ${theme.border}`,borderRadius:20,padding:"20px",marginBottom:20, textAlign:"center"}}>
              <div style={{fontSize:10, color:theme.color+"88", marginBottom:10}}>오늘의 통독 본문</div>
              <div style={{fontSize:32, color:"#EDE5D5", fontWeight:700}}>{raw}</div>
              <div style={{fontSize:14, color:theme.color+"88", marginTop:5}}>{expand(raw)}</div>
            </div>

            {/* 묵상 박스들 (이미지 1번 스타일) */}
            {d && (
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                <SectionBox icon="◎" title="본문의 핵심" content={d.핵심} color={theme.color} />
                <SectionBox icon="✦" title={`${theme.name}의 성품`} content={d.성품} color={theme.color} />
                <SectionBox icon="☽" title="오늘의 묵상" content={d.묵상} color={theme.color} />
                <SectionBox icon="♡" title="오늘의 기도" content={d.기도} color={theme.color} />
              </div>
            )}

            <div style={{display:"flex", gap:10, marginTop:20}}>
              <button onClick={toggleDone} style={{flex:1, padding:15, borderRadius:15, background:done.has(key)?theme.color:"rgba(255,255,255,.05)", border:"none", color:done.has(key)?"#08090F":theme.color, fontWeight:600, cursor:"pointer"}}>
                {done.has(key)?"✓ 묵상 완료!":"묵상 완료 체크"}
              </button>
              <button onClick={()=>setTab("timer")} style={{flex:1, padding:15, borderRadius:15, background:"rgba(255,255,255,.05)", border:`1px solid ${theme.color}44`, color:theme.color, fontWeight:600, cursor:"pointer"}}>
                🎙 5분 선포
              </button>
            </div>
          </div>
        )}

        {/* ═══ 2. 선포 탭 (이미지 2번 레이아웃) ═══ */}
        {tab==="timer" && (
          <div className="fade">
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.05))`,border:`1px solid ${theme.border}`,borderRadius:22,padding:"30px 20px", textAlign:"center"}}>
              <div style={{fontSize:12, color:theme.color+"88", marginBottom:20}}>오늘의 말씀 선포 및 기도</div>
              <div style={{background:"rgba(255,255,255,.03)", border:`1px solid ${theme.border}66`, borderRadius:15, padding:25, marginBottom:25}}>
                <div style={{fontSize:18, color:"#EDE5D5", lineHeight:1.7, fontWeight:500}}>"{d?.구절 || "오늘의 말씀을 선포하세요."}"</div>
              </div>
              <DeclarationTimer dateKey={key} theme={theme} onSave={handleFinishTimer} isDone={voiceDone.has(key)} />
            </div>
            {/* 가이드 */}
            <div style={{marginTop:20, background:"rgba(255,255,255,.02)", padding:20, borderRadius:15}}>
              <div style={{fontSize:11, color:"#6A5E50", marginBottom:10}}>선포 가이드</div>
              {/* 이미지 2번 하단 가이드 내용들... */}
            </div>
          </div>
        )}

        {/* ═══ 3. 달력 및 현황 탭 (기존 유지) ═══ */}
        {tab==="calendar" && ( /* 기존 달력 코드 */ )}
        
      </div>
    </div>
  );
}

// ─── 공용 컴포넌트: 섹션 박스 ──────────────────────────────────────────────────
function SectionBox({ icon, title, content, color }) {
  return (
    <div style={{background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:14, padding:"16px", textAlign:"left"}}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
        <span style={{color:color, fontSize:14}}>{icon}</span>
        <span style={{fontSize:11, color:color+"BB", fontWeight:600}}>{title}</span>
      </div>
      <p style={{fontSize:14, color:"#C0B49A", lineHeight:1.8}}>{content}</p>
    </div>
  );
}

// ─── LOGIN SCREEN (간략) ───────────────────────────────────────────────────
function LoginScreen() {
  const handleLogin = async () => { try { await signInWithPopup(auth, gProvider); } catch(e) {} };
  return (
    <div style={{minHeight:"100vh",background:"#06091A",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:52,color:"#C9A84C",marginBottom:20}}>✦</div>
        <button onClick={handleLogin} style={{background:"#fff",border:"none",borderRadius:14,padding:"15px 32px",fontWeight:600,cursor:"pointer"}}>Google로 로그인</button>
      </div>
    </div>
  );
}
