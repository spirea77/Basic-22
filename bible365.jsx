import { useState, useEffect, useCallback, useRef } from "react";

// ─── BOOK ABBREVIATION → FULL NAME ───────────────────────────────────────────
const BF = {
  "창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기",
  "수":"여호수아","삿":"사사기","룻":"룻기","삼상":"사무엘상","삼하":"사무엘하",
  "왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하",
  "스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편",
  "잠":"잠언","전":"전도서","아":"아가","사":"이사야","렘":"예레미야",
  "애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘",
  "암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔",
  "합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기",
  "마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음",
  "행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서",
  "갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서",
  "살전":"데살로니가전서","살후":"데살로니가후서","딤전":"디모데전서",
  "딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서",
  "약":"야고보서","벧전":"베드로전서","벧후":"베드로후서",
  "요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"
};
function expand(raw) {
  if (!raw || raw==="개별통독") return raw;
  const sorted = Object.keys(BF).sort((a,b)=>b.length-a.length);
  let r = raw;
  for (const ab of sorted) r = r.replace(new RegExp(`^${ab}\\b`), BF[ab]);
  return r;
}

// ─── 2026 BASIC COMMUNITY CHURCH 성경통독표 ──────────────────────────────────
const R = {
  "1-1":"창 1-3","1-2":"창 4-6","1-3":"창 7-9","1-4":"창 10-12","1-5":"창 13-16",
  "1-6":"창 17-19","1-7":"창 20-22","1-8":"창 23-24","1-9":"창 25-27","1-10":"창 28-30",
  "1-11":"창 31-32","1-12":"창 33-35","1-13":"창 36-37","1-14":"창 38-40","1-15":"창 41-42",
  "1-16":"창 43-45","1-17":"창 46-48","1-18":"창 49-50",
  "1-19":"출 1-4","1-20":"출 5-8","1-21":"출 9-11","1-22":"출 12-14","1-23":"출 15-17",
  "1-24":"출 18-20","1-25":"출 21-23","1-26":"출 24-26","1-27":"출 27-29","1-28":"출 30-32",
  "1-29":"출 33-35","1-30":"출 36-38","1-31":"출 39-40",
  "2-1":"레 1-4","2-2":"레 5-7","2-3":"레 8-10","2-4":"레 11-12","2-5":"레 13-14",
  "2-6":"레 15-17","2-7":"레 18-20","2-8":"레 21-23","2-9":"레 24-25","2-10":"레 26-27",
  "2-11":"민 1-2","2-12":"민 3-4","2-13":"민 5-6","2-14":"민 7-8","2-15":"민 9-11",
  "2-16":"개별통독","2-17":"개별통독","2-18":"개별통독",
  "2-19":"민 12-14","2-20":"민 15-16","2-21":"민 17-20","2-22":"민 21-23","2-23":"민 24-26",
  "2-24":"민 27-29","2-25":"민 30-31","2-26":"민 32-33","2-27":"민 34-36","2-28":"신 1-2",
  "3-1":"신 3-4","3-2":"신 5-7","3-3":"신 8-10","3-4":"신 11-13","3-5":"신 14-16",
  "3-6":"신 17-20","3-7":"신 21-24","3-8":"신 25-27","3-9":"신 28-29","3-10":"신 30-31",
  "3-11":"신 32-34","3-12":"수 1-4","3-13":"수 5-8","3-14":"수 9-11","3-15":"수 12-14",
  "3-16":"수 15-17","3-17":"수 18-20","3-18":"수 21-22","3-19":"수 23-24",
  "3-20":"삿 1-3","3-21":"삿 4-6","3-22":"삿 7-8","3-23":"삿 9-10","3-24":"삿 11-14",
  "3-25":"삿 15-18","3-26":"삿 19-21","3-27":"룻 1-4",
  "3-28":"삼상 1-3","3-29":"삼상 4-8","3-30":"삼상 9-12","3-31":"삼상 13-14",
  "4-1":"삼상 15-17","4-2":"삼상 18-20","4-3":"삼상 21-24","4-4":"삼상 25-27","4-5":"삼상 28-31",
  "4-6":"삼하 1-3","4-7":"삼하 4-7","4-8":"삼하 8-12","4-9":"삼하 13-15","4-10":"삼하 16-18",
  "4-11":"삼하 19-21","4-12":"삼하 22-24",
  "4-13":"왕상 1-2","4-14":"왕상 3-5","4-15":"왕상 6-7","4-16":"왕상 8-9","4-17":"왕상 10-11",
  "4-18":"왕상 12-14","4-19":"왕상 15-17","4-20":"왕상 18-20","4-21":"왕상 21-22",
  "4-22":"왕하 1-3","4-23":"왕하 4-6","4-24":"왕하 7-9","4-25":"왕하 10-13","4-26":"왕하 14-16",
  "4-27":"왕하 17-18","4-28":"왕하 19-21","4-29":"왕하 22-25","4-30":"대상 1-2",
  "5-1":"대상 3-5","5-2":"대상 6-7","5-3":"대상 8-10","5-4":"대상 11-13","5-5":"대상 14-16",
  "5-6":"대상 17-20","5-7":"대상 21-23","5-8":"대상 24-26","5-9":"대상 27-29",
  "5-10":"대하 1-5","5-11":"대하 6-8","5-12":"대하 9-12","5-13":"대하 13-17","5-14":"대하 18-20",
  "5-15":"대하 21-24","5-16":"대하 25-28","5-17":"대하 29-31","5-18":"대하 32-34","5-19":"대하 35-36",
  "5-20":"스 1-2","5-21":"스 3-6","5-22":"스 7-10",
  "5-23":"느 1-4","5-24":"느 5-7","5-25":"느 8-10","5-26":"느 11-13",
  "5-27":"에 1-5","5-28":"에 6-10",
  "5-29":"욥 1-4","5-30":"욥 5-7","5-31":"욥 8-11",
  "6-1":"욥 12-14","6-2":"욥 15-18","6-3":"욥 19-21","6-4":"욥 22-25","6-5":"욥 26-29",
  "6-6":"욥 30-31","6-7":"욥 32-34","6-8":"욥 35-37","6-9":"욥 38-39","6-10":"욥 40-42",
  "6-11":"시 1-8","6-12":"시 9-16","6-13":"시 17-20","6-14":"시 21-25","6-15":"시 26-31",
  "6-16":"시 32-35","6-17":"시 36-38","6-18":"시 39-44","6-19":"시 45-50","6-20":"시 51-57",
  "6-21":"시 58-65","6-22":"시 66-69","6-23":"시 70-73","6-24":"시 74-77","6-25":"시 78-79",
  "6-26":"시 80-85","6-27":"시 86-89","6-28":"시 90-95","6-29":"시 96-102","6-30":"시 103-105",
  "7-1":"시 106-107","7-2":"시 108-114","7-3":"시 115-118","7-4":"시 119","7-5":"시 120-131",
  "7-6":"시 132-138","7-7":"시 139-144","7-8":"시 145-150",
  "7-9":"잠 1-3","7-10":"잠 4-6","7-11":"잠 7-9","7-12":"잠 10-12","7-13":"잠 13-15",
  "7-14":"잠 16-18","7-15":"잠 19-21","7-16":"잠 22-24","7-17":"잠 25-27","7-18":"잠 28-31",
  "7-19":"전 1-4","7-20":"전 5-8","7-21":"전 9-12","7-22":"아 1-8",
  "7-23":"사 1-4","7-24":"사 5-8","7-25":"사 9-13","7-26":"사 14-18","7-27":"사 19-23",
  "7-28":"사 24-28","7-29":"사 29-32","7-30":"사 33-36","7-31":"사 37-40",
  "8-1":"사 41-43","8-2":"사 44-47","8-3":"사 48-51","8-4":"사 52-57","8-5":"사 58-62","8-6":"사 63-66",
  "8-7":"렘 1-3","8-8":"렘 4-6","8-9":"렘 7-9","8-10":"렘 10-12","8-11":"렘 13-16","8-12":"렘 17-20",
  "8-13":"렘 21-24","8-14":"렘 25-27","8-15":"렘 28-30","8-16":"렘 31-32","8-17":"렘 33-36",
  "8-18":"렘 37-40","8-19":"렘 41-44","8-20":"렘 45-48","8-21":"렘 49-50","8-22":"렘 51-52",
  "8-23":"애 1-2","8-24":"애 3-5",
  "8-25":"겔 1-5","8-26":"겔 6-9","8-27":"겔 10-12","8-28":"겔 13-15","8-29":"겔 16-17",
  "8-30":"겔 18-20","8-31":"겔 21-22",
  "9-1":"겔 23-25","9-2":"겔 26-28","9-3":"겔 29-32","9-4":"겔 33-35","9-5":"겔 36-38",
  "9-6":"겔 39-41","9-7":"겔 42-44","9-8":"겔 45-48",
  "9-9":"단 1-3","9-10":"단 4-6","9-11":"단 7-9","9-12":"단 10-12",
  "9-13":"호 1-7","9-14":"호 8-14","9-15":"욜 1-3","9-16":"암 1-5","9-17":"암 6-9",
  "9-18":"옵 1, 욘 1-4","9-19":"미 1-7","9-20":"나 1-3, 합 1-3","9-21":"습 1-3, 학 1-2",
  "9-22":"슥 1-5","9-23":"슥 6-10",
  "9-24":"개별통독","9-25":"개별통독","9-26":"개별통독",
  "9-27":"슥 11-14","9-28":"말 1-4","9-29":"마 1-4","9-30":"마 5-6",
  "10-1":"마 7-8","10-2":"마 9-10","10-3":"마 11-12","10-4":"마 13-14","10-5":"마 15-17",
  "10-6":"마 18-20","10-7":"마 21-22","10-8":"마 23-24","10-9":"마 25-26","10-10":"마 27-28",
  "10-11":"막 1-3","10-12":"막 4-6","10-13":"막 7-9","10-14":"막 10-12","10-15":"막 13-16",
  "10-16":"눅 1-2","10-17":"눅 3-5","10-18":"눅 6-7","10-19":"눅 8-9","10-20":"눅 10-11",
  "10-21":"눅 12-13","10-22":"눅 14-16","10-23":"눅 17-18","10-24":"눅 19-20",
  "10-25":"눅 21-22","10-26":"눅 23-24",
  "10-27":"요 1-3","10-28":"요 4-5","10-29":"요 6-7","10-30":"요 8-9","10-31":"요 10-11",
  "11-1":"요 12-13","11-2":"요 14-15","11-3":"요 16-18","11-4":"요 19-21",
  "11-5":"행 1-3","11-6":"행 4-6","11-7":"행 7-8","11-8":"행 9-10","11-9":"행 11-13",
  "11-10":"행 14-16","11-11":"행 17-19","11-12":"행 20-22","11-13":"행 23-25","11-14":"행 26-28",
  "11-15":"롬 1-3","11-16":"롬 4-6","11-17":"롬 7-9","11-18":"롬 10-12","11-19":"롬 13-16",
  "11-20":"고전 1-3","11-21":"고전 4-6","11-22":"고전 7-9","11-23":"고전 10-11",
  "11-24":"고전 12-14","11-25":"고전 15-16",
  "11-26":"고후 1-3","11-27":"고후 4-7","11-28":"고후 8-10","11-29":"고후 11-13","11-30":"갈 1-3",
  "12-1":"갈 4-6","12-2":"엡 1-3","12-3":"엡 4-6","12-4":"빌 1-4","12-5":"골 1-4",
  "12-6":"살전 1-5","12-7":"살후 1-3","12-8":"딤전 1-6","12-9":"딤후 1-4","12-10":"딛 1-3, 몬 1",
  "12-11":"히 1-4","12-12":"히 5-7","12-13":"히 8-10","12-14":"히 11-13","12-15":"약 1-5",
  "12-16":"벧전 1-5","12-17":"벧후 1-3","12-18":"요일 1-5","12-19":"요이, 요삼, 유",
  "12-20":"계 1-3","12-21":"계 4-7","12-22":"계 8-12","12-23":"계 13-17","12-24":"계 18-22",
  "12-25":"개별통독","12-26":"개별통독","12-27":"개별통독","12-28":"개별통독",
  "12-29":"개별통독","12-30":"개별통독","12-31":"개별통독",
};

const GOSPEL_BOOKS = new Set(["마","막","눅","요"]);
const NT_BOOKS = new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]);

const THEMES = [
  { key:"GOD",    name:"하나님", subtitle:"하나님은 누구신가", en:"Father · Creator · Sovereign",
    color:"#C9A84C", glow:"rgba(201,168,76,0.4)",   bg:"rgba(201,168,76,0.07)",   border:"rgba(201,168,76,0.22)",   symbol:"✦", badge:"구약 · 하나님",
    focus:"이 구약 본문에서 드러나는 하나님의 성품과 속성 — 창조주, 구원자, 언약의 하나님으로서의 모습" },
  { key:"JESUS",  name:"예수님", subtitle:"예수님은 누구신가", en:"Son · Savior · Lord",
    color:"#D48C6E", glow:"rgba(212,140,110,0.4)",  bg:"rgba(212,140,110,0.07)",  border:"rgba(212,140,110,0.22)",  symbol:"✝", badge:"복음서 · 예수님",
    focus:"이 복음서 본문에서 드러나는 예수님의 정체성과 사역 — 그분이 어떤 분이신지, 무엇을 하셨는지" },
  { key:"SPIRIT", name:"성령님", subtitle:"성령님은 누구신가", en:"Holy Spirit · Comforter · Guide",
    color:"#6EA8D4", glow:"rgba(110,168,212,0.4)",  bg:"rgba(110,168,212,0.07)",  border:"rgba(110,168,212,0.22)",  symbol:"◈", badge:"신약 · 성령님",
    focus:"이 신약 본문에서 드러나는 성령님의 역사와 성품 — 보혜사로서, 인도자로서, 능력의 원천으로서" },
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
const MAX_SEC = 300; // 5 minutes

// ─── VOICE RECORDER COMPONENT ────────────────────────────────────────────────
function VoiceRecorder({ dateKey, theme }) {
  const [recState, setRecState] = useState("idle"); // idle | recording | saved
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [savedMeta, setSavedMeta] = useState(null); // { duration, savedAt }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const uploadRef = useRef(null);

  const storageKey = `bc365_audio_${dateKey}`;
  const metaKey   = `bc365_audio_meta_${dateKey}`;

  // load saved audio for this date
  useEffect(() => {
    setAudioUrl(null); setSavedMeta(null); setLoading(true); setError("");
    (async () => {
      try {
        const metaR = await window.storage.get(metaKey);
        const audioR = await window.storage.get(storageKey);
        if (metaR?.value && audioR?.value) {
          setSavedMeta(JSON.parse(metaR.value));
          setAudioUrl(audioR.value); // base64 data URL
          setRecState("saved");
        } else {
          setRecState("idle");
        }
      } catch { setRecState("idle"); }
      setLoading(false);
    })();
  }, [dateKey]);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // prefer opus for small file size
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result;
          const dur = elapsed;
          setAudioUrl(dataUrl);
          setSavedMeta({ duration: dur, savedAt: new Date().toLocaleString("ko-KR"), size: Math.round(blob.size/1024) });
          try {
            await window.storage.set(storageKey, dataUrl);
            await window.storage.set(metaKey, JSON.stringify({ duration: dur, savedAt: new Date().toLocaleString("ko-KR"), size: Math.round(blob.size/1024) }));
            setRecState("saved");
          } catch {
            setError("저장 실패: 파일이 너무 큽니다 (5MB 제한). 더 짧게 녹음해주세요.");
            setRecState("idle");
          }
        };
        reader.readAsDataURL(blob);
      };
      mr.start(1000);
      mediaRef.current = mr;
      setElapsed(0);
      setRecState("recording");
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev+1 >= MAX_SEC) { stopRecording(); return prev+1; }
          return prev+1;
        });
      }, 1000);
    } catch(e) {
      setError("마이크 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  };

  // handle file upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) {
      setError("파일이 너무 큽니다. 4.5MB 이하만 업로드 가능합니다.");
      return;
    }
    setError(""); setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      const dur = 0;
      const meta = { duration: dur, savedAt: new Date().toLocaleString("ko-KR"), size: Math.round(file.size/1024), fileName: file.name };
      setAudioUrl(dataUrl); setSavedMeta(meta);
      try {
        await window.storage.set(storageKey, dataUrl);
        await window.storage.set(metaKey, JSON.stringify(meta));
        setRecState("saved");
      } catch {
        setError("저장 실패: 파일이 너무 큽니다.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const deleteAudio = async () => {
    if (!confirm("이 날의 녹음을 삭제할까요?")) return;
    try { await window.storage.delete(storageKey); await window.storage.delete(metaKey); } catch {}
    setAudioUrl(null); setSavedMeta(null); setRecState("idle"); setElapsed(0);
  };

  const pct = Math.min((elapsed / MAX_SEC) * 100, 100);
  const remaining = MAX_SEC - elapsed;

  if (loading) return (
    <div style={{padding:"24px 0",textAlign:"center"}}>
      <div style={{width:48,height:48,borderRadius:24,background:"rgba(255,255,255,.04)",margin:"0 auto 12px",animation:"pulse 1.4s ease infinite"}}/>
      <div style={{fontSize:12,color:"#3A3028"}}>불러오는 중…</div>
    </div>
  );

  return (
    <div>
      {/* State: idle — record or upload */}
      {recState === "idle" && (
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={{marginBottom:24}}>
            <div style={{width:88,height:88,borderRadius:44,background:`rgba(255,255,255,.04)`,border:`2px solid ${theme.border}`,margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .2s"}}
              onClick={startRecording}>
              <span style={{fontSize:32}}>🎙</span>
            </div>
            <button onClick={startRecording}
              style={{background:`linear-gradient(135deg,${theme.color},${theme.color}CC)`,border:"none",borderRadius:100,padding:"13px 32px",color:"#08090F",fontFamily:"'Noto Serif KR',serif",fontSize:14,fontWeight:600,cursor:"pointer",letterSpacing:".05em",boxShadow:`0 4px 22px ${theme.glow}50`}}>
              🎙 녹음 시작
            </button>
          </div>
          <div style={{fontSize:12,color:"#3A3028",marginBottom:16}}>— 또는 —</div>
          <button onClick={() => uploadRef.current?.click()}
            style={{background:"rgba(255,255,255,.04)",border:`1px solid ${theme.border}`,borderRadius:100,padding:"10px 24px",color:theme.color,fontFamily:"'Noto Serif KR',serif",fontSize:13,cursor:"pointer",letterSpacing:".04em"}}>
            📎 파일 업로드
          </button>
          <input ref={uploadRef} type="file" accept="audio/*" style={{display:"none"}} onChange={handleUpload}/>
          <div style={{fontSize:11,color:"#3A3028",marginTop:12}}>최대 5분 · 4.5MB 이하</div>
          {error && <div style={{marginTop:12,fontSize:12,color:"#E07070",background:"rgba(224,112,112,.1)",border:"1px solid rgba(224,112,112,.2)",borderRadius:10,padding:"10px 14px"}}>{error}</div>}
        </div>
      )}

      {/* State: recording */}
      {recState === "recording" && (
        <div style={{textAlign:"center",padding:"8px 0"}}>
          {/* Animated mic */}
          <div style={{position:"relative",width:88,height:88,margin:"0 auto 20px"}}>
            <div style={{position:"absolute",inset:0,borderRadius:44,background:`${theme.color}18`,animation:"ripple 1.2s ease infinite"}}/>
            <div style={{position:"absolute",inset:8,borderRadius:36,background:`${theme.color}25`,animation:"ripple 1.2s ease .3s infinite"}}/>
            <div style={{position:"absolute",inset:16,borderRadius:28,background:`linear-gradient(135deg,${theme.color}55,${theme.color}33)`,border:`2px solid ${theme.color}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:24}}>🎙</span>
            </div>
          </div>
          <div style={{fontSize:36,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:theme.color,marginBottom:4,letterSpacing:".06em"}}>{fmtTime(elapsed)}</div>
          <div style={{fontSize:12,color:"#5A5040",marginBottom:20}}>남은 시간 {fmtTime(remaining)}</div>
          {/* Progress bar */}
          <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:5,overflow:"hidden",marginBottom:24,maxWidth:280,margin:"0 auto 24px"}}>
            <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${theme.color}88,${theme.color})`,borderRadius:100,transition:"width .9s linear"}}/>
          </div>
          <button onClick={stopRecording}
            style={{background:"rgba(224,100,100,.15)",border:"1px solid rgba(224,100,100,.3)",borderRadius:100,padding:"12px 32px",color:"#E08080",fontFamily:"'Noto Serif KR',serif",fontSize:14,cursor:"pointer",letterSpacing:".05em"}}>
            ■ 녹음 완료
          </button>
        </div>
      )}

      {/* State: saved */}
      {recState === "saved" && audioUrl && (
        <div>
          {savedMeta && (
            <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${theme.border}`,borderRadius:14,padding:"14px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:12,color:theme.color,marginBottom:3,fontFamily:"'Noto Serif KR',serif"}}>
                  {savedMeta.fileName ? `📎 ${savedMeta.fileName}` : `🎙 ${savedMeta.duration ? fmtTime(savedMeta.duration) : "업로드 완료"}`}
                </div>
                <div style={{fontSize:11,color:"#4A4038"}}>{savedMeta.savedAt} · {savedMeta.size}KB</div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                <button onClick={() => uploadRef.current?.click()}
                  style={{background:"rgba(255,255,255,.04)",border:`1px solid ${theme.border}`,borderRadius:20,padding:"6px 14px",color:theme.color,fontFamily:"'Noto Serif KR',serif",fontSize:11,cursor:"pointer"}}>
                  교체
                </button>
                <button onClick={deleteAudio}
                  style={{background:"rgba(224,100,100,.1)",border:"1px solid rgba(224,100,100,.2)",borderRadius:20,padding:"6px 14px",color:"#E08080",fontFamily:"'Noto Serif KR',serif",fontSize:11,cursor:"pointer"}}>
                  삭제
                </button>
              </div>
              <input ref={uploadRef} type="file" accept="audio/*" style={{display:"none"}} onChange={handleUpload}/>
            </div>
          )}
          {/* Audio player */}
          <div style={{background:"rgba(255,255,255,.025)",border:`1px solid ${theme.border}`,borderRadius:16,padding:"16px 20px"}}>
            <div style={{fontSize:11,letterSpacing:".18em",color:theme.color+"77",textTransform:"uppercase",fontFamily:"'Cormorant Garamond',serif",marginBottom:12}}>기도 녹음 재생</div>
            <audio controls src={audioUrl}
              style={{width:"100%",height:44,borderRadius:22,outline:"none",accentColor:theme.color,filter:"brightness(0.9)"}}/>
          </div>
          {error && <div style={{marginTop:10,fontSize:12,color:"#E07070"}}>{error}</div>}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const TODAY = today0();
  const [viewDate, setViewDate] = useState(TODAY);
  const [devotional, setDevotional] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(new Set());
  const [tab, setTab] = useState("main"); // "main" | "voice" | "calendar"
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());

  const key = dk(viewDate);
  const raw = R[key] || "";
  const theme = detectTheme(raw);
  const isToday = key === dk(TODAY);
  const isPersonal = raw === "개별통독";
  const expanded = expand(raw);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get("bc365v2"); if(r?.value) setDone(new Set(JSON.parse(r.value))); } catch {}
    })();
  }, []);

  const generate = useCallback(async () => {
    if (isPersonal) { setDevotional("PERSONAL"); return; }
    if (!raw) { setDevotional(""); return; }
    setLoading(true); setDevotional("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{ role:"user", content:
`당신은 BASIC Community Church의 2026 성경통독 묵상 가이드입니다.
날짜: ${fmtLong(viewDate)}
오늘 통독 본문: ${expanded}
오늘의 묵상 초점: ${theme.focus}

아래 4개 섹션을 정확한 헤더와 함께 작성해주세요:

[본문의 핵심]
오늘 통독 범위의 핵심 내용을 2-3문장으로 요약해주세요.

[${theme.name}의 성품]
이 본문에서 구체적으로 드러나는 ${theme.name}의 성품 1-2가지를 설명해주세요. 반드시 본문의 특정 사건이나 말씀을 근거로 하세요.

[오늘의 묵상]
그 성품이 나의 오늘 삶에 주는 위로, 도전, 또는 소망을 2-3문장으로 나누어주세요.

[오늘의 기도]
이 말씀에 응답하는 진실된 한 문장의 기도를 작성해주세요.

한국어로, 복음 중심적이고 따뜻하며 깊이 있게 작성해주세요.`
          }]
        })
      });
      const data = await res.json();
      setDevotional(data.content?.find(c=>c.type==="text")?.text || "");
    } catch { setDevotional("[본문의 핵심]\n잠시 오류가 발생했습니다. 새로고침을 눌러주세요.\n\n[오늘의 기도]\n주님, 오늘도 말씀 앞에 서게 하소서."); }
    setLoading(false);
  }, [key]);

  useEffect(() => { generate(); }, [key]);

  const toggleDone = async () => {
    const next = new Set(done);
    next.has(key) ? next.delete(key) : next.add(key);
    setDone(next);
    try { await window.storage.set("bc365v2", JSON.stringify([...next])); } catch {}
  };

  const parseSections = (text) => {
    if (!text || text==="PERSONAL") return [];
    const heads = ["본문의 핵심",`${theme.name}의 성품`,"오늘의 묵상","오늘의 기도"];
    const icons = ["◎","✦","☽","♡"];
    return heads.map((h,i) => {
      const m = text.match(new RegExp(`\\[${h}\\]([\\s\\S]*?)(?=\\[|$)`));
      return m ? { label:h, icon:icons[i], content:m[1].trim() } : null;
    }).filter(Boolean);
  };
  const sections = parseSections(devotional);

  const buildCalendar = (m) => {
    const fd = new Date(2026,m,1).getDay();
    const ld = new Date(2026,m+1,0).getDate();
    const cells = [];
    for (let i=0;i<fd;i++) cells.push(null);
    for (let d=1;d<=ld;d++) {
      const dt=new Date(2026,m,d), k2=dk(dt), r2=R[k2]||"";
      cells.push({ d, k:k2, r2, dt, theme:detectTheme(r2), done:done.has(k2), isToday:k2===dk(TODAY), isView:k2===key });
    }
    return cells;
  };
  const calCells = buildCalendar(calMonth);
  const totalDays = Object.keys(R).filter(k2=>R[k2]&&R[k2]!=="개별통독").length;
  const doneDays = [...done].filter(k2=>R[k2]&&R[k2]!=="개별통독").length;
  const prog = totalDays>0 ? (doneDays/totalDays)*100 : 0;
  const nav = (delta) => { const next=addDays(viewDate,delta); if(R[dk(next)]!==undefined){setViewDate(next);setTab("main");} };
  const hasPrev = R[dk(addDays(viewDate,-1))]!==undefined;
  const hasNext = R[dk(addDays(viewDate, 1))]!==undefined;

  const TABS = [["main","📖 묵상"],["voice","🎙 기도 녹음"],["calendar","📅 달력"]];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06091A 0%,#080C1E 55%,#060818 100%)",color:"#E8E0D0",fontFamily:"'Noto Serif KR','Georgia',serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fade{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .hero-anim{animation:heroIn .9s cubic-bezier(.16,1,.3,1) both}
        @keyframes heroIn{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
        .shimmer{background:linear-gradient(90deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.09) 45%,rgba(255,255,255,.04) 90%);background-size:300% 100%;animation:sh 1.9s ease infinite;border-radius:6px}
        @keyframes sh{0%{background-position:100% 0}100%{background-position:-100% 0}}
        @keyframes ripple{0%{opacity:.6;transform:scale(1)}100%{opacity:0;transform:scale(1.7)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:.9}}
        .btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#9A8E7A;padding:9px 18px;border-radius:8px;cursor:pointer;font-family:'Noto Serif KR',serif;font-size:13px;letter-spacing:.03em;transition:all .2s}
        .btn:hover:not(:disabled){background:rgba(255,255,255,.09);color:#E8E0D0;border-color:rgba(255,255,255,.17)}
        .btn:disabled{opacity:.25;cursor:not-allowed}
        .tab-btn{background:none;border:none;padding:8px 14px;border-radius:20px;cursor:pointer;font-family:'Noto Serif KR',serif;font-size:12px;letter-spacing:.05em;transition:all .25s;white-space:nowrap}
        .cal-cell:hover{opacity:.8;transform:scale(1.04)}
        audio{accent-color:inherit}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.09);border-radius:3px}
      `}</style>

      <div style={{maxWidth:660,margin:"0 auto",padding:"0 20px"}}>

        {/* Header */}
        <header style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"26px 0 0",gap:12}}>
          <div>
            <div style={{fontSize:10,letterSpacing:".22em",color:"#3A3028",textTransform:"uppercase",marginBottom:4,fontFamily:"'Cormorant Garamond',serif"}}>BASIC Community Church · 2026 성경통독</div>
            <div style={{fontSize:13,color:"#6A5E50",lineHeight:1.5}}>{fmtLong(viewDate)}</div>
          </div>
          <div style={{flexShrink:0,background:`linear-gradient(135deg,${theme.bg},transparent)`,border:`1px solid ${theme.border}`,borderRadius:20,padding:"6px 14px",fontSize:11,color:theme.color,letterSpacing:".09em",fontFamily:"'Cormorant Garamond',serif",whiteSpace:"nowrap"}}>{theme.badge}</div>
        </header>

        <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0 0"}}>
          <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${theme.color}28)`}}/>
          <span style={{color:theme.color+"66",fontSize:14}}>{theme.symbol}</span>
          <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${theme.color}28)`}}/>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:4,justifyContent:"center",margin:"16px 0 0",overflowX:"auto",paddingBottom:2}}>
          {TABS.map(([t,l]) => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)}
              style={{color:tab===t?theme.color:"#5A5242",background:tab===t?theme.bg:"none",border:tab===t?`1px solid ${theme.border}`:"1px solid transparent",fontWeight:tab===t?600:400}}>
              {l}
            </button>
          ))}
        </div>

        {/* ═══ MAIN TAB ═══ */}
        {tab==="main" && (
          <div key={key} className="fade">
            <section style={{textAlign:"center",padding:"28px 0 20px",position:"relative"}}>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:260,height:260,background:`radial-gradient(ellipse,${theme.glow}18 0%,transparent 68%)`,pointerEvents:"none"}}/>
              <div style={{fontSize:10,letterSpacing:".28em",color:theme.color+"66",textTransform:"uppercase",marginBottom:10,fontFamily:"'Cormorant Garamond',serif"}}>{theme.subtitle}</div>
              <h1 className="hero-anim" style={{fontSize:"clamp(56px,12vw,80px)",fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:theme.color,letterSpacing:"-.02em",lineHeight:1,marginBottom:8,textShadow:`0 0 55px ${theme.glow}`}}>{theme.name}</h1>
              <div style={{fontSize:11,color:"#352E25",letterSpacing:".14em",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>{theme.en}</div>
            </section>

            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.06))`,border:`1px solid ${theme.border}`,borderRadius:20,padding:"20px 24px",marginBottom:12}}>
              <div style={{fontSize:10,letterSpacing:".22em",color:theme.color+"66",textTransform:"uppercase",marginBottom:10,fontFamily:"'Cormorant Garamond',serif"}}>오늘의 통독 본문</div>
              {isPersonal ? (
                <div>
                  <div style={{fontSize:22,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5",marginBottom:8}}>개별 통독의 날 ✦</div>
                  <div style={{fontSize:13,color:"#8A7E6E",lineHeight:1.85,fontWeight:300}}>오늘은 자유롭게 원하는 성경 본문을 읽는 날입니다. 최근 마음에 남았던 말씀, 혹은 더 깊이 묵상하고 싶은 본문을 선택해 읽어보세요.</div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:28,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5",marginBottom:4,lineHeight:1.3}}>{raw}</div>
                  <div style={{fontSize:13,color:theme.color+"88",marginBottom:14,letterSpacing:".04em"}}>{expanded}</div>
                  <div style={{borderLeft:`3px solid ${theme.color}40`,paddingLeft:16,fontSize:13,color:"#7A6E5A",lineHeight:1.75,fontWeight:300}}>오늘 이 본문을 통해 <strong style={{color:theme.color+"BB",fontWeight:500}}>{theme.name}</strong>이 어떤 분이신지 묵상해보세요.</div>
                </div>
              )}
            </div>

            {!isPersonal && (
              <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:20,padding:"20px 22px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{fontSize:10,letterSpacing:".2em",color:"#3A3028",textTransform:"uppercase",fontFamily:"'Cormorant Garamond',serif"}}>AI 묵상 가이드</div>
                  <button onClick={generate} disabled={loading} style={{background:"none",border:`1px solid ${theme.color}33`,color:theme.color+"88",padding:"4px 14px",borderRadius:20,cursor:loading?"not-allowed":"pointer",fontSize:11,opacity:loading?.45:1,transition:"all .2s"}}>
                    {loading?"생성 중…":"↻ 새로고침"}
                  </button>
                </div>
                {loading ? (
                  <div>{[88,72,80,0,65,75,0,70,82,0,60,74,0,55].map((w,i)=>w===0?<div key={i} style={{height:16}}/>:<div key={i} className="shimmer" style={{width:`${w}%`,height:13,marginBottom:9}}/>)}</div>
                ) : sections.length>0 ? (
                  <div>{sections.map(s=>(
                    <div key={s.label} style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"15px 17px",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                        <span style={{color:theme.color,fontSize:12}}>{s.icon}</span>
                        <span style={{fontSize:10,letterSpacing:".16em",color:theme.color+"BB",fontFamily:"'Cormorant Garamond',serif",textTransform:"uppercase",fontWeight:500}}>{s.label}</span>
                      </div>
                      <p style={{fontSize:14,color:"#C0B49A",lineHeight:1.95,fontWeight:300}}>{s.content}</p>
                    </div>
                  ))}</div>
                ) : null}
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:18,flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <button className="btn" onClick={()=>nav(-1)} disabled={!hasPrev}>← 이전</button>
                {!isToday && <button className="btn" onClick={()=>{setViewDate(TODAY);setTab("main");}} style={{borderColor:theme.color+"44",color:theme.color}}>오늘로</button>}
                <button className="btn" onClick={()=>nav(1)} disabled={!hasNext}>다음 →</button>
              </div>
              <button onClick={toggleDone}
                style={{border:"none",borderRadius:100,padding:"11px 24px",cursor:"pointer",fontFamily:"'Noto Serif KR',serif",fontSize:13,fontWeight:500,letterSpacing:".05em",transition:"all .3s cubic-bezier(.16,1,.3,1)",background:done.has(key)?`linear-gradient(135deg,${theme.color},${theme.color}CC)`:"rgba(255,255,255,.05)",color:done.has(key)?"#08090F":theme.color,border:done.has(key)?"none":`1px solid ${theme.color}44`,boxShadow:done.has(key)?`0 4px 24px ${theme.glow}50`:"none"}}>
                {done.has(key)?"✓ 완료!":"완료 체크"}
              </button>
            </div>

            {done.has(key) && (
            <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:18,padding:"16px 20px 18px",marginBottom:36}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                <span style={{fontSize:10,letterSpacing:".18em",color:"#3A3028",textTransform:"uppercase",fontFamily:"'Cormorant Garamond',serif"}}>2026 통독 진행률</span>
                <span style={{fontSize:13,color:theme.color,fontFamily:"'Cormorant Garamond',serif"}}>{doneDays} / {totalDays}일</span>
              </div>
              <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:4,overflow:"hidden"}}>
                <div style={{width:`${prog}%`,height:"100%",background:`linear-gradient(90deg,${theme.color}66,${theme.color})`,borderRadius:100,transition:"width .7s cubic-bezier(.16,1,.3,1)"}}/>
              </div>
            </div>
            )}
            {!done.has(key) && <div style={{marginBottom:36}}/>}
          </div>
        )}

        {/* ═══ VOICE TAB ═══ */}
        {tab==="voice" && (
          <div key={`voice-${key}`} className="fade" style={{paddingTop:8}}>
            {/* Date nav for voice */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"16px 0 20px",gap:8}}>
              <button className="btn" onClick={()=>nav(-1)} disabled={!hasPrev}>← 이전</button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5"}}>{viewDate.getMonth()+1}월 {viewDate.getDate()}일</div>
                <div style={{fontSize:12,color:theme.color,marginTop:2}}>{raw || "—"}</div>
              </div>
              <button className="btn" onClick={()=>nav(1)} disabled={!hasNext}>다음 →</button>
            </div>

            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.05))`,border:`1px solid ${theme.border}`,borderRadius:22,padding:"26px 24px",marginBottom:16}}>
              <div style={{textAlign:"center",marginBottom:22}}>
                <div style={{fontSize:10,letterSpacing:".25em",color:theme.color+"77",textTransform:"uppercase",fontFamily:"'Cormorant Garamond',serif",marginBottom:6}}>오늘의 기도 녹음</div>
                <div style={{fontSize:14,color:"#8A7E6E",lineHeight:1.7,fontWeight:300}}>말씀을 묵상한 후 마음에 올라오는<br/>기도를 5분간 녹음해보세요.</div>
              </div>
              <VoiceRecorder dateKey={key} theme={theme} />
            </div>

            {/* Tip */}
            <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:16,padding:"16px 20px",marginBottom:36}}>
              <div style={{fontSize:10,letterSpacing:".18em",color:"#3A3028",textTransform:"uppercase",fontFamily:"'Cormorant Garamond',serif",marginBottom:10}}>기도 가이드</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[["✦","찬양","오늘 본문에서 보이는 하나님의 성품을 고백"],["◎","감사","오늘 하루 받은 은혜를 구체적으로 감사"],["◈","회개","말씀 앞에 드러나는 나의 모습을 고백"],["♡","간구","오늘의 적용을 위한 도움을 구함"]].map(([sym,title,desc])=>(
                  <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <span style={{color:theme.color,fontSize:12,marginTop:2,flexShrink:0}}>{sym}</span>
                    <div>
                      <span style={{fontSize:12,color:theme.color+"CC",fontWeight:500,marginRight:8}}>{title}</span>
                      <span style={{fontSize:12,color:"#6A5E50",fontWeight:300}}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CALENDAR TAB ═══ */}
        {tab==="calendar" && (
          <div className="fade" style={{paddingTop:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button className="btn" onClick={()=>setCalMonth(m=>Math.max(0,m-1))} disabled={calMonth<=0}>←</button>
              <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5"}}>{MONTH_NAMES[calMonth]} 2026</div>
              <button className="btn" onClick={()=>setCalMonth(m=>Math.min(11,m+1))} disabled={calMonth>=11}>→</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {["일","월","화","수","목","금","토"].map((d,i)=>(
                <div key={d} style={{textAlign:"center",fontSize:10,letterSpacing:".1em",color:i===0?"#D48C6E77":i===6?"#6EA8D477":"#3A3028",padding:"6px 0",fontFamily:"'Cormorant Garamond',serif"}}>{d}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {calCells.map((cell,i)=>{
                if(!cell) return <div key={`e${i}`}/>;
                const t2=cell.theme, isV=cell.isView;
                return (
                  <div key={cell.k} className="cal-cell" onClick={()=>{setViewDate(cell.dt);setTab("main");}}
                    style={{background:isV?t2.bg:cell.done?"rgba(255,255,255,.04)":"rgba(255,255,255,.02)",border:`1px solid ${isV?t2.border:cell.done?"rgba(255,255,255,.08)":"rgba(255,255,255,.04)"}`,borderRadius:10,padding:"7px 3px 6px",cursor:"pointer",transition:"all .18s",minHeight:60,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                    <div style={{fontSize:11,fontWeight:cell.isToday?700:400,color:cell.isToday?t2.color:isV?t2.color+"CC":"#6A5E50",fontFamily:"'Cormorant Garamond',serif"}}>{cell.d}</div>
                    {cell.r2&&cell.r2!=="개별통독"&&<div style={{fontSize:9,color:t2.color+"99",textAlign:"center",lineHeight:1.3,maxWidth:44,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cell.r2}</div>}
                    {cell.r2==="개별통독"&&<div style={{fontSize:9,color:"#3A3028"}}>자유</div>}
                    {cell.done&&<div style={{fontSize:9,color:t2.color}}>✓</div>}
                    {cell.isToday&&!cell.done&&<div style={{width:4,height:4,borderRadius:2,background:t2.color,marginTop:1}}/>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:16,justifyContent:"center",margin:"14px 0 8px",flexWrap:"wrap"}}>
              {THEMES.map(t=>(
                <div key={t.key} style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:8,height:8,borderRadius:4,background:t.color}}/>
                  <span style={{fontSize:11,color:"#6A5E50"}}>{t.name}</span>
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"#C9A84C"}}>✓</span>
                <span style={{fontSize:11,color:"#6A5E50"}}>완료</span>
              </div>
            </div>
            <div style={{height:30}}/>
          </div>
        )}

      </div>
    </div>
  );
}
