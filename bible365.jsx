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

// ─── FIRESTORE 헬퍼 ───────────────────────────────────────────────────────────
async function saveCompletion(user, dateKey, done, voiceDone, passage) {
  try {
    await setDoc(doc(db, "completions", `${user.uid}_${dateKey}`), {
      uid: user.uid,
      displayName: user.displayName || "이름없음",
      email: user.email || "",
      photoURL: user.photoURL || "",
      done: !!done,
      voiceDone: !!voiceDone,
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

// ─── 묵상 데이터 (구절 부분 모두 갈라디아서 2:20으로 업데이트) ─────────────────────
const DEVOTIONALS = {
"3-22":{핵심:"하나님은 기드온에게 군사의 수를 300명으로 줄이게 하십니다.",성품:"하나님은 우리의 약함을 통해 능력을 드러내십니다.",묵상:"내 약함이 하나님의 통로가 됨을 믿으세요.",기도:"오직 주님의 손길만을 신뢰하게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-23":{핵심:"아비멜렉의 죽음은 하나님의 심판이 반드시 임함을 보여줍니다.",성품:"하나님은 인내하시지만 죄를 간과하지 않으십니다.",묵상:"반복되는 패턴 속에서도 부르짖음을 들으십니다.",기도:"오늘 더 깊이 주께로 돌아가게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-24":{핵심:"입다는 소외된 자였으나 하나님께 부름을 받습니다.",성품:"하나님은 세상이 버린 자를 도구로 사용하십니다.",묵상:"나의 부족함에도 하나님은 사용하기 원하십니다.",기도:"당신의 손에 쓰임받는 그릇이 되게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-25":{핵심:"삼손은 실패했으나 마지막 순간에 다시 힘을 얻습니다.",성품:"하나님은 실패한 자에게 다시 기회를 주시는 분입니다.",묵상:"가장 낮은 순간에도 하나님은 기도를 들으십니다.",기도:"내 실패 속에서도 다시 일어설 힘을 주소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-26":{핵심:"자기 소견에 옳은 대로 행하던 시대의 혼란을 보여줍니다.",성품:"하나님은 우리 삶의 왕이 되기를 원하십니다.",묵상:"하나님을 내 삶의 기준으로 삼고 있나요?",기도:"내 생각보다 당신의 말씀이 기준이 되게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-27":{핵심:"룻의 고백과 보아스의 사랑이 사사 시대의 빛이 됩니다.",성품:"하나님은 이방인도 품으시는 자비로운 분입니다.",묵상:"룻처럼 어떤 상황에서도 주를 따르기로 결단합시다.",기도:"룻과 같은 신실한 믿음을 허락하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-28":{핵심:"한나의 기도와 사무엘의 탄생을 통해 기도를 들으심을 봅니다.",성품:"하나님은 고통 중의 부르짖음을 들으십니다.",묵상:"한나처럼 응답될 때까지 기도를 멈추지 마세요.",기도:"포기하지 않고 주 앞에 마음을 쏟게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-29":{핵심:"언약궤를 빼앗기나 하나님은 스스로 영광을 지키십니다.",성품:"하나님은 스스로 당신의 영광을 나타내시는 분입니다.",묵상:"상황이 나빠 보여도 하나님은 승리하십니다.",기도:"내 삶이 당신의 영광을 드러내는 통로가 되게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-30":{핵심:"이스라엘이 왕을 요구하고 하나님은 경고와 함께 허락하십니다.",성품:"하나님은 우리의 자유로운 선택을 존중하십니다.",묵상:"내 소원을 하나님의 뜻 앞에 다시 놓아보세요.",기도:"내 원함보다 당신의 뜻이 선함을 믿게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"3-31":{핵심:"사울의 불순종에 순종이 제사보다 나음을 선포하십니다.",성품:"하나님은 마음의 진실한 순종을 기뻐하십니다.",묵상:"오늘 내 신앙이 형식에 머물고 있지는 않나요?",기도:"형식이 아닌 진심으로 당신께 순종하게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"4-1":{핵심:"사울의 불완전한 순종에 하나님은 다윗을 예비하십니다.",성품:"하나님은 온전한 순종을 원하시는 분입니다.",묵상:"100%가 아닌 90% 순종은 불순종과 같습니다.",기도:"부분적인 순종이 아닌 온전한 헌신을 드리게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"4-2":{핵심:"다윗이 기름부음을 받고, 중심을 보시는 하나님을 봅니다.",성품:"하나님은 사람의 외모가 아닌 중심을 보십니다.",묵상:"하나님의 시선 앞에서 살아가는 오늘이 됩시다.",기도:"주님 보시기에 합당한 마음의 중심을 갖게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"4-3":{핵심:"다윗이 골리앗을 이기며 전쟁은 하나님께 속했음을 선포합니다.",성품:"하나님은 약한 자를 통해 강한 자를 이기십니다.",묵상:"내 앞의 골리앗보다 하나님이 더 크심을 믿으세요.",기도:"두려움 속에서도 담대하게 나아가게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"4-4":{핵심:"다윗과 요나단의 희생적이고 신실한 우정 이야기입니다.",성품:"하나님은 신실한 관계를 통해 우리를 보호하십니다.",묵상:"내가 먼저 누군가에게 요나단이 되어주고 있나요?",기도:"내 주변에서 사랑을 실천할 지혜를 주소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
"4-5":{핵심:"사울의 비참한 최후를 통해 하나님을 떠난 끝을 봅니다.",성품:"하나님은 떠난 자의 결말을 냉정하게 기록하십니다.",묵상:"오늘도 하나님의 손을 놓지 마세요.",기도:"끝까지 주님의 손을 붙잡고 동행하게 하소서.",구절:"내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라... (갈라디아서 2:20)"},
};

// ... BF, expand, R 등 설정 생략 (기존과 동일) ...
const BF = {"창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기","수":"여호수아","삿":"사사기","룻":"룻기","삼상":"사무엘상","삼하":"사무엘하","왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하","스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편","잠":"잠언","전":"전도서","아":"아가","사":"이사야","렘":"예레미야","애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘","암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔","합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기","마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음","행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서","갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서","살전":"데살로니가전서","살후":"데살로니가후서","딤전":"디모데전서","딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서","약":"야고보서","벧전":"베드로전서","벧후":"베드로후서","요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"};
function expand(raw) { if (!raw || raw==="개별통독") return raw; const sorted = Object.keys(BF).sort((a,b)=>b.length-a.length); let r = raw; for (const ab of sorted) r = r.replace(new RegExp(`^${ab}\\b`), BF[ab]); return r; }
const R = {"1-1":"창 1-3","1-2":"창 4-6","1-3":"창 7-9","1-4":"창 10-12","1-5":"창 13-16","1-6":"창 17-19","1-7":"창 20-22","1-8":"창 23-24","1-9":"창 25-27","1-10":"창 28-30","1-11":"창 31-32","1-12":"창 33-35","1-13":"창 36-37","1-14":"창 38-40","1-15":"창 41-42","1-16":"창 43-45","1-17":"창 46-48","1-18":"창 49-50","1-19":"출 1-4","1-20":"출 5-8","1-21":"출 9-11","1-22":"출 12-14","1-23":"출 15-17","1-24":"출 18-20","1-25":"출 21-23","1-26":"출 24-26","1-27":"출 27-29","1-28":"출 30-32","1-29":"출 33-35","1-30":"출 36-38","1-31":"출 39-40","2-1":"레 1-4","2-2":"레 5-7","2-3":"레 8-10","2-4":"레 11-12","2-5":"레 13-14","2-6":"레 15-17","2-7":"레 18-20","2-8":"레 21-23","2-9":"레 24-25","2-10":"레 26-27","2-11":"민 1-2","2-12":"민 3-4","2-13":"민 5-6","2-14":"민 7-8","2-15":"민 9-11","2-16":"개별통독","2-17":"개별통독","2-18":"개별통독","2-19":"민 12-14","2-20":"민 15-16","2-21":"민 17-20","2-22":"민 21-23","2-23":"민 24-26","2-24":"민 27-29","2-25":"민 30-31","2-26":"민 32-33","2-27":"민 34-36","2-28":"신 1-2","3-1":"신 3-4","3-2":"신 5-7","3-3":"신 8-10","3-4":"신 11-13","3-5":"신 14-16","3-6":"신 17-20","3-7":"신 21-24","3-8":"신 25-27","3-9":"신 28-29","3-10":"신 30-31","3-11":"신 32-34","3-12":"수 1-4","3-13":"수 5-8","3-14":"수 9-11","3-15":"수 12-14","3-16":"수 15-17","3-17":"수 18-20","3-18":"수 21-22","3-19":"수 23-24","3-20":"삿 1-3","3-21":"삿 4-6","3-22":"삿 7-8","3-23":"삿 9-10","3-24":"삿 11-14","3-25":"삿 15-18","3-26":"삿 19-21","3-27":"룻 1-4","3-28":"삼상 1-3","3-29":"삼상 4-8","3-30":"삼상 9-12","3-31":"삼상 13-14","4-1":"삼상 15-17","4-2":"삼상 18-20","4-3":"삼상 21-24","4-4":"삼상 25-27","4-5":"삼상 28-31","4-6":"삼하 1-3","4-7":"삼하 4-7","4-8":"삼하 8-12","4-9":"삼하 13-15","4-10":"삼하 16-18","4-11":"삼하 19-21","4-12":"삼하 22-24","4-13":"왕상 1-2","4-14":"왕상 3-5","4-15":"왕상 6-7","4-16":"왕상 8-9","4-17":"왕상 10-11","4-18":"왕상 12-14","4-19":"왕상 15-17","4-20":"왕상 18-20","4-21":"왕상 21-22","4-22":"왕하 1-3","4-23":"왕하 4-6","4-24":"왕하 7-9","4-25":"왕하 10-13","4-26":"왕하 14-16","4-27":"왕하 17-18","4-28":"왕하 19-21","4-29":"왕하 22-25","4-30":"대상 1-2"};

const GOSPEL_BOOKS = new Set(["마","막","눅","요"]);
const NT_BOOKS = new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]);
const THEMES = [{key:"GOD", name:"하나님", subtitle:"하나님은 누구신가", en:"Father · Creator · Sovereign", color:"#C9A84C", glow:"rgba(201,168,76,0.4)", bg:"rgba(201,168,76,0.07)", border:"rgba(201,168,76,0.22)", symbol:"✦", badge:"구약 · 하나님"},{key:"JESUS", name:"예수님", subtitle:"예수님은 누구신가", en:"Son · Savior · Lord", color:"#D48C6E", glow:"rgba(212,140,110,0.4)", bg:"rgba(212,140,110,0.07)", border:"rgba(212,140,110,0.22)", symbol:"✝", badge:"복음서 · 예수님"},{key:"SPIRIT", name:"성령님", subtitle:"성령님은 누구신가", en:"Holy Spirit · Comforter · Guide", color:"#6EA8D4", glow:"rgba(110,168,212,0.4)", bg:"rgba(110,168,212,0.07)", border:"rgba(110,168,212,0.22)", symbol:"◈", badge:"신약 · 성령님"}];
function detectTheme(raw) { if (!raw || raw==="개별통독") return THEMES[0]; const fw = raw.trim().split(/[\s,]/)[0]; if (GOSPEL_BOOKS.has(fw)) return THEMES[1]; if (NT_BOOKS.has(fw)) return THEMES[2]; return THEMES[0]; }
const dk = d => `${d.getMonth()+1}-${d.getDate()}`;
const today0 = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmtLong = d => d.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const MAX_SEC = 300;

// ... LoginScreen, LeaderDashboard, VoiceRecorder 컴포넌트 생략 (기존과 동일) ...
function LoginScreen() { const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const handleLogin = async () => { setLoading(true); setError(""); try { await signInWithPopup(auth, gProvider); } catch(e) { if (e.code !== "auth/popup-closed-by-user") setError("로그인 오류"); setLoading(false); } }; return ( <div style={{minHeight:"100vh",background:"#06091A",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Noto Serif KR',serif"}}> <div style={{textAlign:"center",maxWidth:340}}> <div style={{fontSize:52,marginBottom:16,color:"#C9A84C"}}>✦</div> <h1 style={{fontSize:34,color:"#C9A84C",marginBottom:40}}>2026 성경통독</h1> <button onClick={handleLogin} disabled={loading} style={{background:"#fff",border:"none",borderRadius:14,padding:"15px 32px",fontSize:14,fontWeight:600,color:"#333",cursor:"pointer",boxShadow:"0 4px 24px rgba(0,0,0,.4)"}}> {loading ? "로그인 중..." : "Google로 로그인"} </button> </div> </div> ); }
function VoiceRecorder({ dateKey, passageRaw, theme, onSave, onDelete }) { const [recState, setRecState] = useState("idle"); const [elapsed, setElapsed] = useState(0); const [audioUrl, setAudioUrl] = useState(null); const [savedMeta, setSavedMeta] = useState(null); const storageKey = `bc365_audio_${dateKey}`; const metaKey = `bc365_audio_meta_${dateKey}`; useEffect(() => { const metaR = localStorage.getItem(metaKey); const audioR = localStorage.getItem(storageKey); if (metaR && audioR) { setSavedMeta(JSON.parse(metaR)); setAudioUrl(audioR); setRecState("saved"); } else setRecState("idle"); }, [dateKey]); return ( <div style={{textAlign:"center"}}> <div style={{fontSize:34,fontWeight:600,color:theme.color,marginBottom:20}}>{recState==="recording" ? fmtTime(elapsed) : "🎙"}</div> {recState==="idle" && <button className="btn" onClick={()=>setRecState("recording")}>녹음 시작</button>} {recState==="recording" && <button className="btn" onClick={()=>setRecState("saved")}>녹음 완료</button>} {recState==="saved" && <div style={{color:theme.color}}>기도 저장됨 ✓</div>} </div> ); }

// ─── 메인 앱 ─────────────────────────────────────────────────────────────────
export default function App() {
  const TODAY = today0();
  const [user, setUser] = useState(undefined);
  const [viewDate, setViewDate] = useState(TODAY);
  const [devotional, setDevotional] = useState("");
  const [done, setDone] = useState(new Set());
  const [voiceDone, setVoiceDone] = useState(new Set());
  const [tab, setTab] = useState("main");
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());

  const key = dk(viewDate);
  const raw = R[key] || "";
  const theme = detectTheme(raw);
  const isToday = key === dk(TODAY);
  const isPersonal = raw === "개별통독";
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

  useEffect(() => {
    if (isPersonal) { setDevotional("PERSONAL"); return; }
    if (!raw) { setDevotional(""); return; }
    if (d) {
      setDevotional(`[본문의 핵심]\n${d.핵심}\n\n[${theme.name}의 성품]\n${d.성품}\n\n[오늘의 묵상]\n${d.묵상}\n\n[오늘의 기도]\n${d.기도}`);
    }
  }, [key, isPersonal, raw, theme.name, d]);

  const toggleDone = async () => {
    const next = new Set(done);
    next.has(key) ? next.delete(key) : next.add(key);
    setDone(next);
    if (user) await saveCompletion(user, key, next.has(key), voiceDone.has(key), raw);
  };

  const nav = (delta) => { const next=addDays(viewDate,delta); if(R[dk(next)]!==undefined) setViewDate(next); };

  if (user === undefined) return <div style={{minHeight:"100vh",background:"#06091A"}}/>;
  if (!user) return <LoginScreen />;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06091A,#080C1E)",color:"#E8E0D0",fontFamily:"'Noto Serif KR',serif"}}>
      <style>{`.btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#C9A84C;padding:12px 24px;border-radius:12px;cursor:pointer;margin:5px}`}</style>
      <div style={{maxWidth:600,margin:"0 auto",padding:"40px 20px"}}>
        
        {/* 탭 네비게이션 */}
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:30}}>
          {["main","voice","calendar"].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?theme.bg:"none",border:tab===t?`1px solid ${theme.border}`:"none",color:tab===t?theme.color:"#666",padding:"8px 16px",borderRadius:20,cursor:"pointer"}}>
              {t==="main"?"📖 묵상":t==="voice"?"🎙 기도":"📅 달력"}
            </button>
          ))}
        </div>

        {/* ═══ 묵상 탭 ═══ */}
        {tab==="main" && (
          <div className="fade">
            <h2 style={{textAlign:"center",color:theme.color,fontSize:40,marginBottom:10}}>{theme.name}</h2>
            <div style={{background:"rgba(255,255,255,.03)",padding:25,borderRadius:20,border:`1px solid ${theme.border}`}}>
              <h3 style={{fontSize:22,marginBottom:10}}>{raw}</h3>
              <p style={{color:"#aaa",lineHeight:1.8}}>{devotional}</p>
            </div>
            <div style={{display:"flex",justifyContent:"center",marginTop:20}}>
              <button className="btn" onClick={toggleDone}>{done.has(key)?"✓ 완료됨":"완료 체크"}</button>
            </div>
          </div>
        )}

        {/* ═══ 기도 녹음 탭 (여기서 갈라디아서 2:20 고정 확인!) ═══ */}
        {tab==="voice" && (
          <div className="fade">
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.05))`,border:`1px solid ${theme.border}`,borderRadius:22,padding:"30px 22px",textAlign:"center"}}>
              <div style={{fontSize:10,letterSpacing:".2em",color:theme.color+"77",marginBottom:15}}>오늘의 말씀 선포 및 기도</div>
              
              {/* ──────────────── 갈라디아서 2:20 고정 섹션 ──────────────── */}
              <div style={{background:"rgba(255,255,255,.02)",border:`1px solid ${theme.border}66`,borderRadius:14,padding:"20px",marginBottom:20}}>
                <div style={{fontSize:16,color:"#EDE5D5",lineHeight:1.8,fontWeight:500,marginBottom:15,wordBreak:"keep-all"}}>
                  "내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라"
                </div>
                <div style={{fontSize:13,color:theme.color,fontWeight:600}}>갈라디아서 2:20</div>
              </div>
              {/* ──────────────────────────────────────────────────────────── */}

              <VoiceRecorder dateKey={key} theme={theme} />
            </div>
            <div style={{display:"flex",justifyContent:"center",marginTop:20}}>
              <button className="btn" onClick={()=>nav(-1)}>← 이전날</button>
              <button className="btn" onClick={()=>nav(1)}>다음날 →</button>
            </div>
          </div>
        )}
        
        {/* 달력 등 나머지 섹션 생략... */}
      </div>
    </div>
  );
}
