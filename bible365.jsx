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

// ─── 묵상 데이터 (원본 데이터 유지) ──────────────────────────────────────────────
const DEVOTIONALS = {
"3-22":{핵심:"하나님은 기드온에게 군사의 수를 300명으로 줄이게 하십니다...",성품:"하나님은 우리의 약함을 통해 당신의 크신 능력을 온전히 드러내시는 전능하신 구원자이십니다.",묵상:"가진 것이 적어 두려우신가요? 하나님은 300명으로도 대군을 이기십니다.",기도:"오직 주님의 크신 손길만을 신뢰하며 나아가게 하소서.",구절:"그들과 같이 우리도 복음 전함을 받은 자이나... (히브리서 4:2)"},
"3-23":{핵심:"아비멜렉이 맷돌에 맞아 죽는 장면은 하나님의 심판이 반드시 임한다는 것을 보여줍니다...",성품:"하나님은 오래 참으시는 분이지만 결코 죄를 영원히 간과하지 않으십니다.",묵상:"내 삶에도 반복되는 패턴이 있나요?",기도:"오늘 더 깊이 주께로 돌아가게 하소서.",구절:"이스라엘 자손이 여호와께 부르짖어 이르되... (사사기 10:10)"},
"3-24":{핵심:"입다는 기생의 아들로 쫓겨났지만 위기 앞에 다시 부름을 받습니다.",성품:"하나님은 버려진 자, 소외된 자를 부르시는 분입니다.",묵상:"하나님은 세상이 버린 입다를 부르셨습니다.",기도:"부족함에도 불구하고 당신의 손에 쓰임받는 그릇으로 만들어 주소서.",구절:"이에 여호와의 영이 입다에게 임하시니 (사사기 11:29)"},
"3-25":{핵심:"삼손은 하나님의 신이 임한 나실인이었지만, 욕망으로 인해 갈등합니다.",성품:"하나님은 실패한 자에게도 다시 기회를 주시는 분입니다.",묵상:"내 삶에서 가장 낮고 수치스러운 순간에도 하나님은 들으십니다.",기도:"내 실패와 수치 속에서도 나의 부르짖음을 들으시고 힘을 주소서.",구절:"삼손이 여호와께 부르짖어 이르되 주 여호와여 구하옵나니 나를 생각하옵소서 (사사기 16:28)"},
"3-26":{핵심:"사사기 후반부는 이스라엘의 영적 혼란을 보여줍니다.",성품:"하나님은 우리 삶의 왕이 되기를 원하시는 분입니다.",묵상:"오늘 내 삶에서 각기 자기 소견에 옳은 대로 행하는 영역은 어디인가요?",기도:"나의 왕이신 하나님, 당신의 말씀이 내 삶의 기준이 되게 하소서.",구절:"그 때에 이스라엘에 왕이 없으므로 사람이 각기 자기의 소견에 옳은 대로 행하였더라 (사사기 21:25)"},
"3-27":{핵심:"룻기는 사사 시대의 혼란 속에서 피어난 신실함의 이야기입니다.",성품:"하나님은 이방인도 품으시는 분입니다.",묵상:"어디를 가든 함께하겠다는 룻의 고백처럼 신실함으로 나아갑시다.",기도:"룻처럼 어떤 상황에서도 주님을 따르는 믿음을 허락하소서.",구절:"어머니의 백성이 나의 백성이 되고 어머니의 하나님이 나의 하나님이 되시리니 (룻기 1:16)"},
"3-28":{핵심:"한나의 간절한 기도와 사무엘의 탄생은 하나님이 기도를 들으시는 분임을 보여줍니다.",성품:"하나님은 고통 중에 부르짖는 기도를 들으시는 분입니다.",묵상:"오래 기도했지만 아직 응답이 없는 것이 있나요?",기도:"한나처럼 포기하지 않고 당신 앞에 내 마음을 쏟아내게 하소서.",구절:"여호와는 죽이기도 하시고 살리기도 하시며... (사무엘상 2:6)"},
"3-29":{핵심:"언약궤를 빼앗기고 엘리와 그 아들들이 죽는 비극이 일어납니다. 그러나 하나님은 스스로 영광을 지키십니다.",성품:"하나님은 스스로 당신의 영광을 지키시는 분입니다.",묵상:"때로 상황이 마치 하나님이 패배하신 것처럼 보일 때가 있습니다.",기도:"어떤 상황에서도 당신의 이름이 높임 받게 하소서.",구절:"여호와의 손이 아스돗 사람에게 엄중히 더하사 (사무엘상 5:6)"},
"3-30":{핵심:"사무엘이 마지막 사사로 이스라엘을 이끄는 동안 백성은 왕을 요구합니다.",성품:"하나님은 인간의 자유를 존중하시되 그 결과도 경험하게 하시는 분입니다.",묵상:"오늘 내 소원을 하나님의 뜻 앞에 다시 놓으며 순종을 고백합니다.",기도:"지혜로우신 하나님, 내 계획을 당신께 맡기게 하소서.",구절:"여호와께서는 그의 크신 이름을 위해서라도 자기 백성을 버리지 아니하실 것이요 (사무엘상 12:22)"},
"3-31":{핵심:"사울의 불순종에 사무엘은 '순종이 제사보다 낫다'고 선포합니다.",성품:"하나님은 외적인 종교 행위보다 마음의 순종을 기뻐하시는 분입니다.",묵상:"오늘 내 신앙이 형식에 머물고 있지는 않나요?",기도:"마음을 보시는 하나님, 진심으로 당신께 순종하는 삶을 살게 하소서.",구절:"여호와의 구원은 사람이 많고 적음에 달리지 아니하였느니라 (사무엘상 14:6)"},
"4-1":{핵심:"사울은 아말렉을 완전히 진멸하지 않습니다. 하나님은 다윗을 예비하십니다.",성품:"하나님은 완전한 순종을 원하시는 분입니다.",묵상:"부분적인 순종이 아닌 온전한 헌신으로 당신을 따르게 하소서.",기도:"완전히 내어드리지 못한 것이 무엇인지 묻게 하소서.",구절:"순종이 제사보다 낫고 듣는 것이 숫양의 기름보다 나으니 (사무엘상 15:22)"},
"4-2":{핵심:"다윗이 기름부음을 받습니다. 하나님은 중심을 보느니라고 하십니다.",성품:"하나님은 중심을 보시는 분입니다.",묵상:"아무도 알아주지 않는 곳에서도 하나님은 내 중심을 보고 계십니다.",기도:"사람의 시선이 아니라 하나님의 시선 앞에서 살게 하소서.",구절:"사람은 외모를 보거니와 나 여호와는 중심을 보느니라 (사무엘상 16:7)"},
"4-3":{핵심:"다윗은 골리앗 앞에 나아가 돌 다섯 개와 물매로 거인을 쓰러뜨립니다.",성품:"하나님은 약한 자를 통해 강한 자를 이기시는 분입니다.",묵상:"내 삶에서 골리앗 같은 두려움이 있나요?",기도:"내 앞의 두려운 것보다 당신이 더 크심을 믿게 하소서.",구절:"전쟁은 여호와께 속한 것인즉 그가 너희를 우리 손에 넘기시리라 (사무엘상 17:47)"},
"4-4":{핵심:"다윗과 요나단의 우정은 성경에서 가장 아름다운 관계 중 하나입니다.",성품:"하나님은 우정과 사랑을 통해 당신의 백성을 보호하시는 분입니다.",묵상:"내 주변에서 희생적 사랑을 실천할 기회를 찾아보세요.",기도:"내가 먼저 다른 이를 위해 나를 낮추는 삶을 살게 하소서.",구절:"요나단은 다윗을 사랑하므로 그와 더불어 언약을 맺었으며 (사무엘상 18:3)"},
"4-5":{핵심:"사울의 마지막은 비참합니다. 하나님을 떠난 왕의 끝을 보여줍니다.",성품:"하나님은 끝까지 기다리시는 분이지만 떠난 자의 결말을 막지는 않으십니다.",묵상:"오늘 하나님의 음성에 마음을 여세요.",기도:"사울처럼 하나님을 떠나지 않게 하시고 끝까지 주를 붙잡게 하소서.",구절:"여호와께서 너를 떠나 네 대적이 되셨거늘 (사무엘상 28:16)"},
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

// ... LoginScreen, LeaderDashboard, VoiceRecorder 생략 (기존과 동일) ...
function LoginScreen() { const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const handleLogin = async () => { setLoading(true); try { await signInWithPopup(auth, gProvider); } catch(e) { setError("로그인 오류"); setLoading(false); } }; return ( <div style={{minHeight:"100vh",background:"#06091A",display:"flex",alignItems:"center",justifyContent:"center"}}> <button onClick={handleLogin} style={{padding:"15px 32px",borderRadius:14,cursor:"pointer"}}>{loading?"로그인 중...":"Google 로그인"}</button> </div> ); }
function VoiceRecorder({ dateKey, theme, onSave }) { return ( <div style={{textAlign:"center",padding:"20px 0"}}><button className="btn" onClick={onSave}>🎙 녹음하기</button></div> ); }

// ─── 메인 앱 ─────────────────────────────────────────────────────────────────
export default function App() {
  const TODAY = today0();
  const [user, setUser] = useState(undefined);
  const [viewDate, setViewDate] = useState(TODAY);
  const [tab, setTab] = useState("main");
  const [done, setDone] = useState(new Set());
  const [voiceDone, setVoiceDone] = useState(new Set());

  const key = dk(viewDate);
  const raw = R[key] || "";
  const theme = detectTheme(raw);
  const d = DEVOTIONALS[key];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); if(u) loadUserCompletions(u.uid).then(res=>{setDone(res.done); setVoiceDone(res.voiceDone);}); });
    return () => unsub();
  }, []);

  const toggleDone = async () => {
    const next = new Set(done); next.has(key)?next.delete(key):next.add(key); setDone(next);
    if(user) await saveCompletion(user, key, next.has(key), voiceDone.has(key), raw);
  };

  if (user === undefined) return <div style={{minHeight:"100vh",background:"#06091A"}}/>;
  if (!user) return <LoginScreen />;

  return (
    <div style={{minHeight:"100vh",background:"#06091A",color:"#E8E0D0",fontFamily:"'Noto Serif KR',serif"}}>
      <style>{`.btn{background:rgba(255,255,255,.05);border:1px solid ${theme.border};color:${theme.color};padding:10px 20px;border-radius:10px;cursor:pointer}`}</style>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px"}}>
        
        {/* 탭 전환 */}
        <div style={{display:"flex",gap:10,justifyContent:"center",margin:"20px 0"}}>
          <button onClick={()=>setTab("main")} style={{color:tab==="main"?theme.color:"#555"}}>📖 묵상</button>
          <button onClick={()=>setTab("voice")} style={{color:tab==="voice"?theme.color:"#555"}}>🎙 기도</button>
        </div>

        {/* ═══ 묵상 탭 (날짜별 본문 정상 출력) ═══ */}
        {tab==="main" && (
          <div>
            <h2 style={{textAlign:"center",color:theme.color}}>{raw}</h2>
            <div style={{background:"rgba(255,255,255,.03)",padding:20,borderRadius:15,marginTop:20}}>
              <p style={{fontSize:14,lineHeight:1.8}}>{d ? d.핵심 : "본문 내용을 묵상해보세요."}</p>
              {d && <div style={{marginTop:15,padding:10,borderLeft:`2px solid ${theme.color}`,color:"#8A7E6E",fontSize:13}}>{d.구절}</div>}
            </div>
            <div style={{textAlign:"center",marginTop:20}}><button className="btn" onClick={toggleDone}>{done.has(key)?"✓ 완료됨":"완료 체크"}</button></div>
          </div>
        )}

        {/* ═══ 기도 탭 (말씀 선포만 갈라디아서 2:20 고정) ═══ */}
        {tab==="voice" && (
          <div>
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.05))`,border:`1px solid ${theme.border}`,borderRadius:22,padding:"30px 22px",textAlign:"center"}}>
              <div style={{fontSize:10,letterSpacing:".2em",color:theme.color+"77",marginBottom:15}}>오늘의 말씀 선포 및 기도</div>
              
              {/* ──────────────── 탭 내부에서만 갈라디아서 2:20 고정 ──────────────── */}
              <div style={{background:"rgba(255,255,255,.02)",border:`1px solid ${theme.border}66`,borderRadius:14,padding:"20px",marginBottom:20}}>
                <div style={{fontSize:16,color:"#EDE5D5",lineHeight:1.8,fontWeight:500,marginBottom:15,wordBreak:"keep-all"}}>
                  "내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라"
                </div>
                <div style={{fontSize:13,color:theme.color,fontWeight:600}}>갈라디아서 2:20</div>
                <div style={{fontSize:12,color:theme.color+"99",marginTop:10}}>이 구절을 소리 내어 선포한 후 기도를 시작하세요.</div>
              </div>
              {/* ──────────────────────────────────────────────────────────── */}

              <VoiceRecorder dateKey={key} theme={theme} onSave={()=>{const v=new Set(voiceDone);v.add(key);setVoiceDone(v);}}/>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
