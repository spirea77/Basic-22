import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";

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

async function saveCompletion(user, dateKey, done, voiceDone, passage) {
  try {
    await setDoc(doc(db, "completions", `${user.uid}_${dateKey}`), {
      uid: user.uid, displayName: user.displayName || "이름없음",
      email: user.email || "", photoURL: user.photoURL || "",
      done: !!done, voiceDone: !!voiceDone, dateKey,
      passage: passage || "", updatedAt: new Date().toISOString()
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

const DEVOTIONALS = {
"3-22":{핵심:"하나님은 기드온에게 군사의 수를 300명으로 줄이게 하십니다. 이는 전쟁의 승리가 인간의 숫자가 아닌 오직 하나님의 능력에 있음을 깨닫게 하시기 위함입니다.",성품:"하나님은 우리의 약함과 부족함을 통해 당신의 크신 능력을 온전히 드러내시는 전능하신 구원자이십니다.",묵상:"가진 것이 적어 두려우신가요? 하나님은 300명으로도 대군을 이기십니다. 내 약함이 오히려 하나님의 능력이 임하는 통로가 됨을 믿으세요.",기도:"전능하신 하나님, 내 능력과 상황을 의지하려는 마음을 내려놓고, 오직 주님의 크신 손길만을 신뢰하며 나아가게 하소서."},
"3-23":{핵심:"아비멜렉이 맷돌에 맞아 죽는 장면은 하나님의 심판이 반드시 임한다는 것을 보여줍니다. 이후에도 이스라엘은 또다시 바알과 아스다롯을 섬기며 하나님을 떠나는 반복적인 패턴을 보입니다.",성품:"하나님은 오래 참으시는 분이지만 결코 죄를 영원히 간과하지 않으십니다.",묵상:"내 삶에도 반복되는 패턴이 있나요? 하나님의 오래 참으심이 나를 회개로 이끕니다.",기도:"인내하시는 하나님, 반복되는 나의 연약함에도 포기하지 않으시는 사랑에 감사하며, 오늘 더 깊이 주께로 돌아가게 하소서."},
"3-24":{핵심:"입다는 기생의 아들로 쫓겨났지만 위기 앞에 다시 부름을 받습니다.",성품:"하나님은 버려진 자, 소외된 자를 부르시는 분입니다.",묵상:"혹시 스스로 쓸모없다고 느낀 적이 있나요? 하나님은 나를 부르시고 사용하기 원하십니다.",기도:"소외된 자를 부르시는 하나님, 나의 부족함에도 불구하고 당신의 손에 쓰임받는 그릇으로 만들어 주소서."},
"3-25":{핵심:"삼손은 하나님의 신이 임한 나실인이었지만, 욕망으로 인해 반복적으로 하나님의 부르심과 갈등합니다.",성품:"하나님은 실패한 자에게도 다시 기회를 주시는 분입니다.",묵상:"내 삶에서 가장 낮고 수치스러운 순간에도 하나님은 들으십니다.",기도:"자비로우신 하나님, 내 실패와 수치 속에서도 나의 부르짖음을 들으시고, 다시 일어설 힘을 주소서."},
"3-26":{핵심:"사사기 후반부는 이스라엘의 영적 혼란을 보여줍니다.",성품:"하나님은 우리 삶의 왕이 되기를 원하시는 분입니다.",묵상:"오늘 내 삶에서 각기 자기 소견에 옳은 대로 행하는 영역은 어디인가요?",기도:"나의 왕이신 하나님, 내 생각과 판단보다 당신의 말씀이 내 삶의 기준이 되게 하소서."},
"3-27":{핵심:"룻기는 사사 시대의 혼란 속에서 피어난 신실함의 이야기입니다.",성품:"하나님은 이방인도 품으시는 분입니다.",묵상:"어디를 가든 함께하겠다는 룻의 고백처럼, 오늘 하나님께 그런 신실함으로 나아갈 수 있나요?",기도:"신실하신 하나님, 룻처럼 어떤 상황에서도 주님을 따르는 믿음을 허락하시고, 내 삶에서도 당신의 선한 섭리를 경험하게 하소서."},
"3-28":{핵심:"한나의 간절한 기도와 사무엘의 탄생은 하나님이 기도를 들으시는 분임을 보여줍니다.",성품:"하나님은 고통 중에 부르짖는 기도를 들으시는 분입니다.",묵상:"오래 기도했지만 아직 응답이 없는 것이 있나요? 한나의 기도는 응답될 때까지 멈추지 않았습니다.",기도:"기도를 들으시는 하나님, 한나처럼 포기하지 않고 당신 앞에 내 마음을 쏟아내게 하소서."},
"3-29":{핵심:"언약궤를 빼앗기고 엘리와 그 아들들이 죽는 비극이 일어납니다. 그러나 하나님은 블레셋의 다곤 신전에서 스스로 당신의 영광을 지키십니다.",성품:"하나님은 스스로 당신의 영광을 지키시는 분입니다.",묵상:"때로 상황이 마치 하나님이 패배하신 것처럼 보일 때가 있습니다. 하지만 하나님은 스스로의 영광을 지키십니다.",기도:"영광의 하나님, 어떤 상황에서도 당신의 이름이 높임 받으며, 내 삶이 그 영광을 드러내는 통로가 되게 하소서."},
"3-30":{핵심:"사무엘이 마지막 사사로 이스라엘을 이끄는 동안 백성은 왕을 요구합니다.",성품:"하나님은 인간의 자유를 존중하시되 그 선택의 결과도 경험하게 하시는 분입니다.",묵상:"내가 원하는 것이 반드시 내게 필요한 것은 아닐 수 있습니다.",기도:"지혜로우신 하나님, 내 원함보다 당신의 뜻이 더 선함을 믿으며, 오늘 내 계획을 당신께 맡기게 하소서."},
"3-31":{핵심:"사울의 불순종에 사무엘은 '순종이 제사보다 낫고 듣는 것이 수양의 기름보다 낫다'고 선포합니다.",성품:"하나님은 외적인 종교 행위보다 마음의 순종을 기뻐하시는 분입니다.",묵상:"오늘 내 신앙이 형식에 머물고 있지는 않나요?",기도:"마음을 보시는 하나님, 형식이 아닌 진심으로 당신께 나아가며, 오늘 하루 말씀에 순종하는 삶을 살게 하소서."},
"4-1":{핵심:"사울은 아말렉을 완전히 진멸하지 않습니다.",성품:"하나님은 완전한 순종을 원하시는 분입니다.",묵상:"거의 다 순종했는데라고 생각하는 영역이 있나요?",기도:"전능하신 하나님, 부분적인 순종이 아닌 온전한 헌신으로 당신을 따르게 하소서."},
"4-2":{핵심:"다윗이 기름부음을 받습니다.",성품:"하나님은 중심을 보시는 분입니다.",묵상:"아무도 알아주지 않는 곳에서도 하나님은 내 중심을 보고 계십니다.",기도:"중심을 보시는 하나님, 사람의 시선이 아니라 하나님의 시선 앞에서 살아가는 오늘이 되게 하소서."},
"4-3":{핵심:"다윗은 골리앗 앞에 나아가 돌 다섯 개와 물매로 거인을 쓰러뜨립니다.",성품:"하나님은 약한 자를 통해 강한 자를 이기시는 분입니다.",묵상:"내 삶에서 골리앗 같은 두려움이 있나요?",기도:"전능하신 하나님, 내 앞의 두려운 것보다 당신이 더 크심을 믿으며, 담대하게 나아가는 하루가 되게 하소서."},
"4-4":{핵심:"다윗과 요나단의 우정은 성경에서 가장 아름다운 관계 중 하나입니다.",성품:"하나님은 우정과 사랑을 통해 당신의 백성을 보호하시는 분입니다.",묵상:"내 삶에서 요나단 같은 사람이 있나요?",기도:"사랑의 하나님, 신실한 관계를 허락하시고 내가 먼저 다른 이를 위해 나를 낮추는 삶을 살게 하소서."},
"4-5":{핵심:"사울의 마지막은 비참합니다.",성품:"하나님은 끝까지 기다리시는 분이지만 떠난 자의 결말을 막지는 않으십니다.",묵상:"오늘 하나님의 음성에 마음을 여세요.",기도:"신실하신 하나님, 사울처럼 하나님을 떠나지 않게 하시고, 끝까지 주님의 손을 붙잡는 삶을 허락하소서."},
"4-6":{핵심:"다윗은 헤브론에서 유다의 왕이 되고 긴 내전이 이어지지만 다윗의 집은 점점 강해집니다.",성품:"하나님은 인내하며 기다리는 자와 함께하시는 분입니다.",묵상:"내가 기다리고 있는 하나님의 약속이 있나요?",기도:"때를 아시는 하나님, 내 성급함을 내려놓고 당신의 때를 기다리는 믿음을 허락하소서."},
"4-7":{핵심:"다윗이 예루살렘을 정복합니다.",성품:"하나님은 거룩하신 분입니다.",묵상:"신앙이 너무 익숙해져서 하나님의 거룩하심을 잊어버리고 있지는 않나요?",기도:"거룩하신 하나님, 당신의 임재 앞에 경외함으로 나아가며, 오늘 하루 거룩하신 주를 예배하게 하소서."},
"4-8":{핵심:"다윗이 밧세바 사건으로 큰 죄를 범하고 나단의 책망을 받습니다.",성품:"하나님은 약속을 지키시는 분이며 동시에 죄를 직면하게 하시는 분입니다.",묵상:"즉시 인정하고 돌이킬 수 있나요?",기도:"진실하신 하나님, 내 삶의 숨겨진 죄를 직면할 용기를 주시고, 즉시 회개하며 돌아오게 하소서."},
"4-9":{핵심:"다윗 가정의 비극이 시작됩니다.",성품:"하나님은 죄의 결과 가운데에서도 함께하시는 분입니다.",묵상:"고난 중에도 하나님을 향한 예배를 멈추지 마세요.",기도:"신실하신 하나님, 어떤 상황에서도 예배를 드리는 하루가 되게 하소서."},
"4-10":{핵심:"압살롬의 반란으로 다윗은 예루살렘을 떠납니다.",성품:"하나님은 겸손한 자를 회복시키시는 분입니다.",묵상:"누군가의 비난이나 어려운 상황이 찾아올 때, 다윗처럼 그 안에서 하나님의 손길을 볼 수 있나요?",기도:"겸손을 사랑하시는 하나님, 내가 낮아지는 순간에 당신의 손길을 신뢰하게 하소서."},
"4-11":{핵심:"다윗의 말년에도 반란이 계속됩니다.",성품:"하나님은 충성스러운 공동체를 통해 역사하시는 분입니다.",묵상:"내 삶에서 함께 신앙의 길을 걷는 공동체가 있나요?",기도:"공동체의 하나님, 나도 신실한 동반자가 되게 하소서."},
"4-12":{핵심:"다윗의 마지막 노래 '여호와는 나의 반석이시요'는 온 생애를 통한 신앙의 결론입니다.",성품:"하나님은 회개하는 자를 받으시는 분입니다.",묵상:"다윗의 일생은 완벽하지 않았지만 하나님을 향한 마음은 한결같았습니다.",기도:"긍휼이 많으신 하나님, 다윗처럼 실패해도 즉시 돌아오는 마음을 허락하소서."},
"4-13":{핵심:"다윗이 죽기 전 솔로몬에게 '하나님의 도를 지키라'고 당부합니다.",성품:"하나님은 세대를 넘어 언약을 이어가시는 분입니다.",묵상:"내 신앙이 다음 세대에게 전해지고 있나요?",기도:"영원하신 하나님, 나를 통해 당신의 언약이 다음 세대로 이어지게 하소서."},
"4-14":{핵심:"솔로몬이 기브온에서 하나님께 일천 번제를 드릴 때 하나님이 나타나십니다.",성품:"하나님은 바른 것을 구하는 자에게 넘치도록 주시는 분입니다.",묵상:"지금 내가 하나님께 구하는 것은 무엇인가요?",기도:"지혜를 주시는 하나님, 솔로몬처럼 하나님의 뜻을 이루기 위한 지혜를 구하게 하소서."},
"4-15":{핵심:"솔로몬이 7년에 걸쳐 성전을 건축합니다.",성품:"하나님은 당신의 백성 가운데 임재하기를 원하시는 분입니다.",묵상:"내 삶이 하나님의 임재로 가득 찬 성전이 될 수 있습니다.",기도:"임재하시는 하나님, 내 삶이 당신의 영광으로 가득 찬 성전이 되게 하소서."},
"4-16":{핵심:"솔로몬의 성전 봉헌 기도는 성경에서 가장 위대한 기도 중 하나입니다.",성품:"하나님은 기도를 들으시는 하나님이십니다.",묵상:"내 기도가 하나님의 위대하심으로 시작되고 있나요?",기도:"기도를 들으시는 하나님, 당신의 위대하심 앞에 겸손히 나아가며 중보하게 하소서."},
"4-17":{핵심:"솔로몬의 영광이 절정에 달하지만 이방 여인들을 따라 신들을 섬기기 시작합니다.",성품:"하나님은 지혜를 주시지만 그 지혜를 어떻게 사용할지는 인간의 선택에 달려 있습니다.",묵상:"하나님이 내게 주신 재능과 은사를 어디에 쓰고 있나요?",기도:"은사를 주시는 하나님, 당신의 영광을 위해 사용하는 청지기가 되게 하소서."},
"4-18":{핵심:"르호보암이 노인들의 조언을 무시하고 결국 이스라엘은 남북으로 분열됩니다.",성품:"하나님은 교만한 자를 낮추시는 분입니다.",묵상:"연륜 있는 사람들의 조언에 귀를 기울여보세요.",기도:"지혜의 하나님, 나의 교만을 내려놓고 겸손히 당신의 뜻에 귀 기울이게 하소서."},
"4-19":{핵심:"엘리야 선지자가 등장합니다.",성품:"하나님은 홀로 서 있는 자를 먹이시고 돌보시는 분입니다.",묵상:"혼자라고 느껴지는 순간이 있나요?",기도:"공급하시는 하나님, 내가 광야에 있을 때도 당신이 돌보심을 믿으며 감사하게 하소서."},
"4-20":{핵심:"갈멜산의 대결에서 엘리야가 450명의 바알 선지자들과 맞섭니다.",성품:"하나님은 당신만이 참 하나님이심을 증명하시는 분입니다.",묵상:"오늘 내 삶에서 하나님만이 나의 유일한 하나님이심을 다시 고백하는 시간을 가지세요.",기도:"유일하신 하나님, 오직 당신만이 나의 하나님이심을 고백하게 하소서."},
"4-21":{핵심:"아합이 나봇의 포도원을 빼앗습니다.",성품:"하나님은 약자의 억울함을 듣고 심판하시는 분입니다.",묵상:"오늘 정의를 위해 내가 할 수 있는 작은 행동을 생각해보세요.",기도:"공의로우신 하나님, 약자의 편에 서시는 당신을 따라 정의를 실천하는 용기를 허락하소서."},
"4-22":{핵심:"엘리야가 회오리바람 속에 하늘로 올라가고 엘리사가 그 사역을 이어받습니다.",성품:"하나님은 당신의 종의 끝을 영광스럽게 하시는 분입니다.",묵상:"오늘 내가 하나님께 대담하게 구하고 싶은 것이 있나요?",기도:"능력의 하나님, 당신의 영이 내 삶에 강하게 역사하시기를 구하며, 더 큰 믿음으로 나아가게 하소서."},
"4-23":{핵심:"나아만 장군의 문둥병이 치유됩니다.",성품:"하나님은 이방인에게도 은혜를 베푸시는 분입니다.",묵상:"하나님의 단순한 말씀에 순종할 수 있나요?",기도:"모든 민족의 하나님, 내 자존심을 내려놓고 당신의 말씀에 순종하는 겸손을 허락하소서."},
"4-24":{핵심:"엘리사는 아람군이 이스라엘을 포위할 때 제자의 눈을 열어 하늘의 군대를 보게 합니다.",성품:"하나님은 우리 눈에 보이지 않는 곳에서 더 큰 군대로 보호하시는 분입니다.",묵상:"눈에 보이는 위협에 두려워하고 있나요?",기도:"보이지 않는 것을 보게 하시는 하나님, 두려운 상황 속에서도 보호하심을 믿는 믿음의 눈을 열어주소서."},
"4-25":{핵심:"북이스라엘은 계속 하나님을 떠나 결국 앗수르에 포로로 잡혀가는 심판을 받습니다.",성품:"하나님은 반드시 심판하시는 분이지만 그 심판도 오래 참으신 후에 오는 것입니다.",묵상:"하나님의 오래 참으심을 당연하게 여기고 있지는 않나요?",기도:"오래 참으시는 하나님, 당신의 인내를 헛되이 여기지 않고 오늘 온전히 돌아오게 하소서."},
"4-26":{핵심:"히스기야 왕은 앗수르의 산헤립이 예루살렘을 위협할 때 성전에서 기도합니다.",성품:"하나님은 기도에 응답하시는 분입니다.",묵상:"나를 위협하는 상황을 하나님 앞에 펼쳐놓고 기도해본 적 있나요?",기도:"응답하시는 하나님, 히스기야처럼 내 위기를 당신 앞에 가져가며 기도하게 하소서."},
"4-27":{핵심:"히스기야는 죽게 되었을 때 하나님께 기도하여 15년의 생명을 더 받습니다.",성품:"하나님은 기도를 들으시며 우리 삶에 구체적으로 개입하시는 분입니다.",묵상:"하나님의 은혜를 받은 후에 교만해진 적이 있나요?",기도:"은혜를 베푸시는 하나님, 받은 은혜가 더 깊은 겸손과 감사로 이어지게 하소서."},
"4-28":{핵심:"므낫세는 유다 역사상 가장 악한 왕이지만 고난 중에 회개하고 하나님께 돌아옵니다.",성품:"하나님은 가장 악한 자의 회개도 받으시는 분입니다.",묵상:"내 죄는 너무 커서 용서받기 어렵다고 생각한 적이 있나요?",기도:"용서의 하나님, 므낫세의 죄도 받으신 당신의 긍휼이 나에게도 미침을 믿으며 담대히 주 앞에 나아가게 하소서."},
"4-29":{핵심:"요시야 왕이 성전을 수리하다가 율법책을 발견합니다.",성품:"하나님은 말씀을 통해 민족을 새롭게 하시는 분입니다.",묵상:"최근 말씀이 내 마음에 깊이 닿은 적이 있나요?",기도:"말씀의 하나님, 요시야처럼 말씀 앞에서 내 마음이 찢어지는 감동을 허락하소서."},
"4-30":{핵심:"역대기는 이스라엘 역사를 하나님의 관점에서 다시 씁니다.",성품:"하나님은 역사의 주관자이시며 당신의 이야기를 이어가시는 분입니다.",묵상:"내 삶이 하나님의 더 큰 이야기의 일부임을 믿나요?",기도:"역사의 주관자이신 하나님, 내 삶이 당신의 큰 이야기 안에 있음을 믿으며 오늘도 함께 써가게 하소서."},
};

const BF = {"창":"창세기","출":"출애굽기","레":"레위기","민":"민수기","신":"신명기","수":"여호수아","삿":"사사기","룻":"룻기","삼상":"사무엘상","삼하":"사무엘하","왕상":"열왕기상","왕하":"열왕기하","대상":"역대상","대하":"역대하","스":"에스라","느":"느헤미야","에":"에스더","욥":"욥기","시":"시편","잠":"잠언","전":"전도서","아":"아가","사":"이사야","렘":"예레미야","애":"예레미야애가","겔":"에스겔","단":"다니엘","호":"호세아","욜":"요엘","암":"아모스","옵":"오바댜","욘":"요나","미":"미가","나":"나훔","합":"하박국","습":"스바냐","학":"학개","슥":"스가랴","말":"말라기","마":"마태복음","막":"마가복음","눅":"누가복음","요":"요한복음","행":"사도행전","롬":"로마서","고전":"고린도전서","고후":"고린도후서","갈":"갈라디아서","엡":"에베소서","빌":"빌립보서","골":"골로새서","살전":"데살로니가전서","살후":"데살로니가후서","딤전":"디모데전서","딤후":"디모데후서","딛":"디도서","몬":"빌레몬서","히":"히브리서","약":"야고보서","벧전":"베드로전서","벧후":"베드로후서","요일":"요한일서","요이":"요한이서","요삼":"요한삼서","유":"유다서","계":"요한계시록"};
function expand(raw) {
  if (!raw || raw==="개별통독") return raw;
  const sorted = Object.keys(BF).sort((a,b)=>b.length-a.length);
  let r = raw;
  for (const ab of sorted) r = r.replace(new RegExp(`^${ab}\\b`), BF[ab]);
  return r;
}

const R = {
  "1-1":"창 1-3","1-2":"창 4-6","1-3":"창 7-9","1-4":"창 10-12","1-5":"창 13-16","1-6":"창 17-19","1-7":"창 20-22","1-8":"창 23-24","1-9":"창 25-27","1-10":"창 28-30","1-11":"창 31-32","1-12":"창 33-35","1-13":"창 36-37","1-14":"창 38-40","1-15":"창 41-42","1-16":"창 43-45","1-17":"창 46-48","1-18":"창 49-50",
  "1-19":"출 1-4","1-20":"출 5-8","1-21":"출 9-11","1-22":"출 12-14","1-23":"출 15-17","1-24":"출 18-20","1-25":"출 21-23","1-26":"출 24-26","1-27":"출 27-29","1-28":"출 30-32","1-29":"출 33-35","1-30":"출 36-38","1-31":"출 39-40",
  "2-1":"레 1-4","2-2":"레 5-7","2-3":"레 8-10","2-4":"레 11-12","2-5":"레 13-14","2-6":"레 15-17","2-7":"레 18-20","2-8":"레 21-23","2-9":"레 24-25","2-10":"레 26-27",
  "2-11":"민 1-2","2-12":"민 3-4","2-13":"민 5-6","2-14":"민 7-8","2-15":"민 9-11","2-16":"개별통독","2-17":"개별통독","2-18":"개별통독",
  "2-19":"민 12-14","2-20":"민 15-16","2-21":"민 17-20","2-22":"민 21-23","2-23":"민 24-26","2-24":"민 27-29","2-25":"민 30-31","2-26":"민 32-33","2-27":"민 34-36","2-28":"신 1-2",
  "3-1":"신 3-4","3-2":"신 5-7","3-3":"신 8-10","3-4":"신 11-13","3-5":"신 14-16","3-6":"신 17-20","3-7":"신 21-24","3-8":"신 25-27","3-9":"신 28-29","3-10":"신 30-31","3-11":"신 32-34",
  "3-12":"수 1-4","3-13":"수 5-8","3-14":"수 9-11","3-15":"수 12-14","3-16":"수 15-17","3-17":"수 18-20","3-18":"수 21-22","3-19":"수 23-24",
  "3-20":"삿 1-3","3-21":"삿 4-6","3-22":"삿 7-8","3-23":"삿 9-10","3-24":"삿 11-14","3-25":"삿 15-18","3-26":"삿 19-21","3-27":"룻 1-4",
  "3-28":"삼상 1-3","3-29":"삼상 4-8","3-30":"삼상 9-12","3-31":"삼상 13-14",
  "4-1":"삼상 15-17","4-2":"삼상 18-20","4-3":"삼상 21-24","4-4":"삼상 25-27","4-5":"삼상 28-31",
  "4-6":"삼하 1-3","4-7":"삼하 4-7","4-8":"삼하 8-12","4-9":"삼하 13-15","4-10":"삼하 16-18","4-11":"삼하 19-21","4-12":"삼하 22-24",
  "4-13":"왕상 1-2","4-14":"왕상 3-5","4-15":"왕상 6-7","4-16":"왕상 8-9","4-17":"왕상 10-11","4-18":"왕상 12-14","4-19":"왕상 15-17","4-20":"왕상 18-20","4-21":"왕상 21-22",
  "4-22":"왕하 1-3","4-23":"왕하 4-6","4-24":"왕하 7-9","4-25":"왕하 10-13","4-26":"왕하 14-16","4-27":"왕하 17-18","4-28":"왕하 19-21","4-29":"왕하 22-25","4-30":"대상 1-2",
  "5-1":"대상 3-5","5-2":"대상 6-7","5-3":"대상 8-10","5-4":"대상 11-13","5-5":"대상 14-16","5-6":"대상 17-20","5-7":"대상 21-23","5-8":"대상 24-26","5-9":"대상 27-29",
  "5-10":"대하 1-5","5-11":"대하 6-8","5-12":"대하 9-12","5-13":"대하 13-17","5-14":"대하 18-20","5-15":"대하 21-24","5-16":"대하 25-28","5-17":"대하 29-31","5-18":"대하 32-34","5-19":"대하 35-36",
  "5-20":"스 1-2","5-21":"스 3-6","5-22":"스 7-10","5-23":"느 1-4","5-24":"느 5-7","5-25":"느 8-10","5-26":"느 11-13","5-27":"에 1-5","5-28":"에 6-10",
  "5-29":"욥 1-4","5-30":"욥 5-7","5-31":"욥 8-11",
  "6-1":"욥 12-14","6-2":"욥 15-18","6-3":"욥 19-21","6-4":"욥 22-25","6-5":"욥 26-29","6-6":"욥 30-31","6-7":"욥 32-34","6-8":"욥 35-37","6-9":"욥 38-39","6-10":"욥 40-42",
  "6-11":"시 1-8","6-12":"시 9-16","6-13":"시 17-20","6-14":"시 21-25","6-15":"시 26-31","6-16":"시 32-35","6-17":"시 36-38","6-18":"시 39-44","6-19":"시 45-50","6-20":"시 51-57","6-21":"시 58-65","6-22":"시 66-69","6-23":"시 70-73","6-24":"시 74-77","6-25":"시 78-79","6-26":"시 80-85","6-27":"시 86-89","6-28":"시 90-95","6-29":"시 96-102","6-30":"시 103-105",
  "7-1":"시 106-107","7-2":"시 108-114","7-3":"시 115-118","7-4":"시 119","7-5":"시 120-131","7-6":"시 132-138","7-7":"시 139-144","7-8":"시 145-150",
  "7-9":"잠 1-3","7-10":"잠 4-6","7-11":"잠 7-9","7-12":"잠 10-12","7-13":"잠 13-15","7-14":"잠 16-18","7-15":"잠 19-21","7-16":"잠 22-24","7-17":"잠 25-27","7-18":"잠 28-31",
  "7-19":"전 1-4","7-20":"전 5-8","7-21":"전 9-12","7-22":"아 1-8",
  "7-23":"사 1-4","7-24":"사 5-8","7-25":"사 9-13","7-26":"사 14-18","7-27":"사 19-23","7-28":"사 24-28","7-29":"사 29-32","7-30":"사 33-36","7-31":"사 37-40",
  "8-1":"사 41-43","8-2":"사 44-47","8-3":"사 48-51","8-4":"사 52-57","8-5":"사 58-62","8-6":"사 63-66",
  "8-7":"렘 1-3","8-8":"렘 4-6","8-9":"렘 7-9","8-10":"렘 10-12","8-11":"렘 13-16","8-12":"렘 17-20","8-13":"렘 21-24","8-14":"렘 25-27","8-15":"렘 28-30","8-16":"렘 31-32","8-17":"렘 33-36","8-18":"렘 37-40","8-19":"렘 41-44","8-20":"렘 45-48","8-21":"렘 49-50","8-22":"렘 51-52",
  "8-23":"애 1-2","8-24":"애 3-5",
  "8-25":"겔 1-5","8-26":"겔 6-9","8-27":"겔 10-12","8-28":"겔 13-15","8-29":"겔 16-17","8-30":"겔 18-20","8-31":"겔 21-22",
  "9-1":"겔 23-25","9-2":"겔 26-28","9-3":"겔 29-32","9-4":"겔 33-35","9-5":"겔 36-38","9-6":"겔 39-41","9-7":"겔 42-44","9-8":"겔 45-48",
  "9-9":"단 1-3","9-10":"단 4-6","9-11":"단 7-9","9-12":"단 10-12",
  "9-13":"호 1-7","9-14":"호 8-14","9-15":"욜 1-3","9-16":"암 1-5","9-17":"암 6-9","9-18":"옵 1, 욘 1-4","9-19":"미 1-7","9-20":"나 1-3, 합 1-3","9-21":"습 1-3, 학 1-2","9-22":"슥 1-5","9-23":"슥 6-10",
  "9-24":"개별통독","9-25":"개별통독","9-26":"개별통독",
  "9-27":"슥 11-14","9-28":"말 1-4","9-29":"마 1-4","9-30":"마 5-6",
  "10-1":"마 7-8","10-2":"마 9-10","10-3":"마 11-12","10-4":"마 13-14","10-5":"마 15-17","10-6":"마 18-20","10-7":"마 21-22","10-8":"마 23-24","10-9":"마 25-26","10-10":"마 27-28",
  "10-11":"막 1-3","10-12":"막 4-6","10-13":"막 7-9","10-14":"막 10-12","10-15":"막 13-16",
  "10-16":"눅 1-2","10-17":"눅 3-5","10-18":"눅 6-7","10-19":"눅 8-9","10-20":"눅 10-11","10-21":"눅 12-13","10-22":"눅 14-16","10-23":"눅 17-18","10-24":"눅 19-20","10-25":"눅 21-22","10-26":"눅 23-24",
  "10-27":"요 1-3","10-28":"요 4-5","10-29":"요 6-7","10-30":"요 8-9","10-31":"요 10-11",
  "11-1":"요 12-13","11-2":"요 14-15","11-3":"요 16-18","11-4":"요 19-21",
  "11-5":"행 1-3","11-6":"행 4-6","11-7":"행 7-8","11-8":"행 9-10","11-9":"행 11-13","11-10":"행 14-16","11-11":"행 17-19","11-12":"행 20-22","11-13":"행 23-25","11-14":"행 26-28",
  "11-15":"롬 1-3","11-16":"롬 4-6","11-17":"롬 7-9","11-18":"롬 10-12","11-19":"롬 13-16",
  "11-20":"고전 1-3","11-21":"고전 4-6","11-22":"고전 7-9","11-23":"고전 10-11","11-24":"고전 12-14","11-25":"고전 15-16",
  "11-26":"고후 1-3","11-27":"고후 4-7","11-28":"고후 8-10","11-29":"고후 11-13","11-30":"갈 1-3",
  "12-1":"갈 4-6","12-2":"엡 1-3","12-3":"엡 4-6","12-4":"빌 1-4","12-5":"골 1-4","12-6":"살전 1-5","12-7":"살후 1-3","12-8":"딤전 1-6","12-9":"딤후 1-4","12-10":"딛 1-3, 몬 1",
  "12-11":"히 1-4","12-12":"히 5-7","12-13":"히 8-10","12-14":"히 11-13","12-15":"약 1-5","12-16":"벧전 1-5","12-17":"벧후 1-3","12-18":"요일 1-5","12-19":"요이, 요삼, 유",
  "12-20":"계 1-3","12-21":"계 4-7","12-22":"계 8-12","12-23":"계 13-17","12-24":"계 18-22",
  "12-25":"개별통독","12-26":"개별통독","12-27":"개별통독","12-28":"개별통독","12-29":"개별통독","12-30":"개별통독","12-31":"개별통독",
};

const GOSPEL_BOOKS = new Set(["마","막","눅","요"]);
const NT_BOOKS = new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]);
const THEMES = [
  {key:"GOD", name:"하나님", color:"#C9A84C", bg:"rgba(201,168,76,0.07)", border:"rgba(201,168,76,0.22)"},
  {key:"JESUS", name:"예수님", color:"#D48C6E", bg:"rgba(212,140,110,0.07)", border:"rgba(212,140,110,0.22)"},
  {key:"SPIRIT", name:"성령님", color:"#6EA8D4", bg:"rgba(110,168,212,0.07)", border:"rgba(110,168,212,0.22)"},
];
function detectTheme(raw) {
  if (!raw || raw==="개별통독") return THEMES[0];
  const fw = raw.trim().split(/[\s,]/)[0];
  if (new Set(["마","막","눅","요"]).has(fw)) return THEMES[1];
  if (new Set(["행","롬","고전","고후","갈","엡","빌","골","살전","살후","딤전","딤후","딛","몬","히","약","벧전","벧후","요일","요이","요삼","유","계"]).has(fw)) return THEMES[2];
  return THEMES[0];
}
const dk = d => `${d.getMonth()+1}-${d.getDate()}`;
const today0 = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const addDays = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmtLong = d => d.toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const MAX_SEC = 300;

function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleLogin = async () => {
    setLoading(true); setError("");
    try { await signInWithPopup(auth, gProvider); }
    catch(e) { if (e.code !== "auth/popup-closed-by-user") setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요."); setLoading(false); }
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06091A,#080C1E,#060818)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Noto Serif KR',serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Noto+Serif+KR:wght@300;400;600&display=swap');`}</style>
      <div style={{textAlign:"center",maxWidth:340,width:"100%"}}>
        <div style={{fontSize:52,marginBottom:16,color:"#C9A84C"}}>✦</div>
        <div style={{fontSize:10,letterSpacing:".25em",color:"#3A3028",textTransform:"uppercase",marginBottom:8,fontFamily:"'Cormorant Garamond',serif"}}>BASIC Community Church</div>
        <h1 style={{fontSize:34,fontFamily:"'Cormorant Garamond',serif",color:"#C9A84C",marginBottom:8,fontWeight:600}}>2026 성경통독</h1>
        <p style={{fontSize:13,color:"#6A5E50",marginBottom:40,lineHeight:1.8,fontWeight:300}}>구글 계정으로 로그인하면<br/>통독 기록이 자동으로 저장되고<br/>멤버들과 함께 나눌 수 있어요</p>
        <button onClick={handleLogin} disabled={loading}
          style={{background:"#fff",border:"none",borderRadius:14,padding:"15px 32px",cursor:"pointer",fontSize:14,fontWeight:600,color:"#333",display:"flex",alignItems:"center",gap:10,margin:"0 auto",boxShadow:"0 4px 24px rgba(0,0,0,.4)",opacity:loading?0.7:1}}>
          <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="G" onError={e=>e.target.style.display="none"}/>
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>
        {error && <div style={{marginTop:16,fontSize:12,color:"#E07070",background:"rgba(224,112,112,.1)",border:"1px solid rgba(224,112,112,.2)",borderRadius:10,padding:"10px 14px"}}>{error}</div>}
      </div>
    </div>
  );
}

function LeaderDashboard({ theme }) {
  const TODAY = today0();
  const [selDate, setSelDate] = useState(TODAY);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = dk(selDate);
  const raw = R[key] || "";

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "completions"), where("dateKey", "==", key));
    const unsub = onSnapshot(q, snap => { setMembers(snap.docs.map(d => d.data())); setLoading(false); }, () => setLoading(false));
    return () => unsub();
  }, [key]);

  const getColor = m => { if (m.done && m.voiceDone) return "#4CAF81"; if (m.done) return "#C9A84C"; if (m.voiceDone) return "#6EA8D4"; return "#444"; };
  const getLabel = m => { if (m.done && m.voiceDone) return "통독 + 기도 ✓"; if (m.done) return "통독 완료"; if (m.voiceDone) return "기도 완료"; return "미완료"; };
  const sorted = [...members].sort((a,b) => { const s = m => (m.done?2:0)+(m.voiceDone?1:0); return s(b)-s(a); });

  return (
    <div className="fade" style={{paddingTop:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:8}}>
        <button className="btn" onClick={()=>setSelDate(d=>addDays(d,-1))} disabled={!R[dk(addDays(selDate,-1))]}>← 이전</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:14,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5"}}>{selDate.getMonth()+1}월 {selDate.getDate()}일 현황</div>
          <div style={{fontSize:11,color:theme.color,marginTop:2}}>{raw || "—"}</div>
        </div>
        <button className="btn" onClick={()=>setSelDate(d=>addDays(d,1))} disabled={!R[dk(addDays(selDate,1))]}>다음 →</button>
      </div>
      {!loading && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
          {[["전체",members.length,"#6A5E50"],["통독+기도",members.filter(m=>m.done&&m.voiceDone).length,"#4CAF81"],["통독만",members.filter(m=>m.done&&!m.voiceDone).length,"#C9A84C"],["미완료",members.filter(m=>!m.done&&!m.voiceDone).length,"#555"]].map(([label,count,color])=>(
            <div key={label} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${color}33`,borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{fontSize:20,fontFamily:"'Cormorant Garamond',serif",color,fontWeight:600}}>{count}</div>
              <div style={{fontSize:9,color:"#5A5040",letterSpacing:".05em",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        {[["#4CAF81","통독 + 기도"],["#C9A84C","통독만"],["#6EA8D4","기도만"],["#444","미완료"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:5,background:c,boxShadow:`0 0 6px ${c}`}}/>
            <span style={{fontSize:11,color:"#6A5E50"}}>{l}</span>
          </div>
        ))}
      </div>
      {loading ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#3A3028",fontSize:13}}>불러오는 중...</div>
      ) : sorted.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:"#3A3028",fontSize:13}}>이 날 아직 참여한 멤버가 없어요</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sorted.map(m => (
            <div key={m.uid} style={{background:"rgba(255,255,255,.03)",border:`2px solid ${getColor(m)}44`,borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              {m.photoURL ? <img src={m.photoURL} width={38} height={38} style={{borderRadius:19,border:`2px solid ${getColor(m)}`,flexShrink:0}} alt=""/> : <div style={{width:38,height:38,borderRadius:19,background:`${getColor(m)}22`,border:`2px solid ${getColor(m)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,color:getColor(m)}}>{(m.displayName||"?")[0]}</div>}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,color:"#EDE5D5",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.displayName || m.email}</div>
                <div style={{fontSize:11,color:getColor(m),marginTop:2}}>{getLabel(m)}</div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <div style={{width:22,height:22,borderRadius:11,background:m.done?"#C9A84C22":"rgba(255,255,255,.03)",border:`1px solid ${m.done?"#C9A84C":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.done?"#C9A84C":"#444"}}>{m.done?"✓":"—"}</div>
                <div style={{width:22,height:22,borderRadius:11,background:m.voiceDone?"#4CAF8122":"rgba(255,255,255,.03)",border:`1px solid ${m.voiceDone?"#4CAF81":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.voiceDone?"#4CAF81":"#444"}}>{m.voiceDone?"🙏":"—"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{height:36}}/>
    </div>
  );
}

// ─── 5분 기도 타이머 ──────────────────────────────────────────────────────────
function PrayerTimer({ dateKey, passageRaw, theme, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const timerRef = useRef(null);
  const shareTextRef = useRef(null);

  const dateStr = dateKey.replace("-","월 ")+"일";
  const shareText = `🙏 오늘도 성공!\n\n📖 ${dateStr} 말씀 통독 완료\n📌 본문: ${passageRaw||""}\n🙏 5분 기도까지 완료했어요!\n\n2026 BASIC 성경통독 함께해요 ✨`;

  useEffect(() => { setElapsed(0); setRunning(false); setDone(false); }, [dateKey]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= MAX_SEC) {
            clearInterval(timerRef.current);
            setRunning(false); setDone(true);
            if (onComplete) onComplete();
            return MAX_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const pct = Math.min((elapsed / MAX_SEC) * 100, 100);
  const remaining = MAX_SEC - elapsed;
  const circumference = 2 * Math.PI * 60;

  const handleReset = () => { setElapsed(0); setRunning(false); setDone(false); };

  const handleShare = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try { await navigator.share({title:"2026 BASIC 성경통독 🙏", text:shareText, url:window.location.href}); return; }
      catch(e) { if (e.name==="AbortError") return; }
    }
    setShowShareModal(true);
  };

  return (
    <div>
      {showShareModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setShowShareModal(false)}>
          <div style={{background:"#12151F",border:`1px solid ${theme.border}`,borderRadius:20,padding:"24px",maxWidth:400,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <textarea ref={shareTextRef} readOnly value={shareText}
              onClick={()=>shareTextRef.current?.select()}
              style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${theme.border}`,borderRadius:12,padding:"14px",color:"#EDE5D5",fontSize:13,lineHeight:1.8,resize:"none",height:160}}/>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>{shareTextRef.current?.select(); document.execCommand("copy");}} style={{flex:1,background:theme.color,border:"none",borderRadius:12,padding:"12px",color:"#08090F",fontWeight:700}}>📋 복사하기</button>
              <button onClick={()=>setShowShareModal(false)} style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:"12px 16px",color:"#6A5E50"}}>닫기</button>
            </div>
          </div>
        </div>
      )}

      <div style={{textAlign:"center",padding:"8px 0"}}>
        {/* 원형 타이머 */}
        <div style={{position:"relative",display:"inline-block",marginBottom:20}}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={60} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={8}/>
            <circle cx={75} cy={75} r={60} fill="none"
              stroke={done ? "#4CAF81" : theme.color}
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              style={{transform:"rotate(-90deg)",transformOrigin:"75px 75px",transition:"stroke-dashoffset 0.8s ease"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:34,fontWeight:700,color:done?"#4CAF81":theme.color,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>
              {fmtTime(done ? 0 : remaining)}
            </div>
            <div style={{fontSize:11,color:"#6A5E50",marginTop:4}}>
              {done ? "기도 완료 🙏" : running ? "기도 중..." : "5분 기도"}
            </div>
          </div>
        </div>

        {/* 타이머 버튼 */}
        {!done && (
          <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>
            <button onClick={()=>setRunning(r=>!r)}
              style={{background:`linear-gradient(135deg,${theme.color},${theme.color}BB)`,border:"none",borderRadius:100,padding:"13px 36px",color:"#08090F",fontSize:15,fontWeight:700,cursor:"pointer",minWidth:120}}>
              {running ? "⏸ 멈춤" : "▶ 시작"}
            </button>
            {elapsed > 0 && (
              <button onClick={handleReset}
                style={{background:"rgba(255,255,255,.05)",border:`1px solid ${theme.border}`,borderRadius:100,padding:"13px 20px",color:"#9A8E7A",fontSize:13,cursor:"pointer"}}>
                초기화
              </button>
            )}
          </div>
        )}

        {/* 공유/삭제 — 항상 표시 */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:4}}>
          <button onClick={handleShare}
            style={{background:theme.color,border:"none",borderRadius:20,padding:"9px 20px",color:"#08090F",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            📤 공유
          </button>
          {(done || elapsed > 0) && (
            <button onClick={handleReset}
              style={{background:"rgba(224,100,100,.1)",border:"1px solid rgba(224,100,100,.2)",borderRadius:20,padding:"9px 20px",color:"#E08080",fontSize:13,cursor:"pointer"}}>
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const isPersonal = raw === "개별통독";
  const expanded = expand(raw);
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
    if (d) { setDevotional(`[본문의 핵심]\n${d.핵심}\n\n[${theme.name}의 성품]\n${d.성품}\n\n[오늘의 묵상]\n${d.묵상}\n\n[오늘의 기도]\n${d.기도}`); }
  }, [key, isPersonal, raw, theme.name, d]);

  const toggleDone = async () => {
    const next = new Set(done);
    next.has(key) ? next.delete(key) : next.add(key);
    setDone(next);
    if (user) await saveCompletion(user, key, next.has(key), voiceDone.has(key), raw);
  };

  const handlePrayerComplete = async () => {
    const nextV = new Set(voiceDone); nextV.add(key); setVoiceDone(nextV);
    const nextD = new Set(done); nextD.add(key); setDone(nextD);
    if (user) await saveCompletion(user, key, true, true, raw);
  };

  const parseSections = (text) => {
    if (!text || text==="PERSONAL") return [];
    const heads = ["본문의 핵심",`${theme.name}의 성품`,"오늘의 묵상","오늘의 기도"];
    const icons = ["◎","✦","☽","♡"];
    return heads.map((h,i) => {
      const m = text.match(new RegExp(`\\[${h}\\]([\\s\\S]*?)(?=\\[|$)`));
      return m ? {label:h,icon:icons[i],content:m[1].trim()} : null;
    }).filter(Boolean);
  };
  const sections = parseSections(devotional);

  const buildCalendar = (m) => {
    const fd = new Date(2026,m,1).getDay(), ld = new Date(2026,m+1,0).getDate(), cells = [];
    for (let i=0;i<fd;i++) cells.push(null);
    for (let d2=1;d2<=ld;d2++) {
      const dt=new Date(2026,m,d2),k2=dk(dt),r2=R[k2]||"";
      cells.push({d:d2,k:k2,r2,dt,theme:detectTheme(r2),done:done.has(k2),voiceDone:voiceDone.has(k2),isToday:k2===dk(TODAY),isView:k2===key});
    }
    return cells;
  };
  const calCells = buildCalendar(calMonth);
  const nav = (delta) => { const next=addDays(viewDate,delta); if(R[dk(next)]!==undefined){setViewDate(next);setTab("main");} };
  const hasPrev = R[dk(addDays(viewDate,-1))]!==undefined;
  const hasNext = R[dk(addDays(viewDate,1))]!==undefined;

  if (user === undefined) return <div style={{minHeight:"100vh",background:"#06091A"}}/>;
  if (!user) return <LoginScreen />;

  const TABS = [["main","📖 묵상"],["voice","🙏 기도"],["calendar","📅 달력"],["leader","👑 현황판"]];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#06091A 0%,#080C1E 100%)",color:"#E8E0D0",fontFamily:"'Noto Serif KR',serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Noto+Serif+KR:wght@300;400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .fade{animation:fadeUp .6s ease both}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#9A8E7A;padding:9px 16px;border-radius:8px;cursor:pointer;font-family:'Noto Serif KR',serif;font-size:13px}
        .cal-cell:hover{opacity:.8;transform:scale(1.04)}
      `}</style>

      <div style={{maxWidth:660,margin:"0 auto",padding:"0 20px"}}>
        <header style={{display:"flex",justifyContent:"space-between",padding:"22px 0 0"}}>
          <div>
            <div style={{fontSize:10,letterSpacing:".2em",color:"#3A3028"}}>BASIC Community Church · 2026 성경통독</div>
            <div style={{fontSize:12,color:"#6A5E50"}}>{fmtLong(viewDate)}</div>
          </div>
          <button onClick={()=>signOut(auth)} style={{background:"none",border:"1px solid rgba(255,255,255,.08)",borderRadius:20,padding:"4px 10px",color:"#5A5040",fontSize:10,cursor:"pointer"}}>로그아웃</button>
        </header>

        <div style={{display:"flex",gap:3,justifyContent:"center",margin:"14px 0 0",overflowX:"auto"}}>
          {TABS.map(([t,l]) => (
            <button key={t} onClick={()=>setTab(t)} style={{color:tab===t?theme.color:"#5A5242",background:tab===t?theme.bg:"none",border:"none",padding:"7px 12px",borderRadius:20,fontSize:11,cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>

        {/* ═══ 묵상 탭 ═══ */}
        {tab==="main" && (
          <div key={key} className="fade">
            <section style={{textAlign:"center",padding:"24px 0 18px"}}>
              <h1 style={{fontSize:60,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:theme.color}}>{theme.name}</h1>
            </section>
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.06))`,border:`1px solid ${theme.border}`,borderRadius:20,padding:"18px 22px",marginBottom:12}}>
              <div style={{fontSize:26,fontFamily:"'Cormorant Garamond',serif",fontWeight:600,color:"#EDE5D5",marginBottom:4}}>{raw}</div>
              <div style={{fontSize:13,color:theme.color+"88"}}>{expanded}</div>
            </div>
            {sections.length>0 && (
              <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:20,padding:"18px 20px",marginBottom:14}}>
                {sections.map(s=>(
                  <div key={s.label} style={{marginBottom:15}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{color:theme.color}}>{s.icon}</span>
                      <span style={{fontSize:12,color:theme.color+"BB",fontWeight:600}}>{s.label}</span>
                    </div>
                    <p style={{fontSize:14,color:"#C0B49A",lineHeight:1.85}}>{s.content}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:30}}>
              <button className="btn" onClick={()=>nav(-1)} disabled={!hasPrev}>← 이전</button>
              <button className="btn" onClick={toggleDone} style={{background:done.has(key)?theme.color:"rgba(255,255,255,.05)",color:done.has(key)?"#08090F":theme.color}}>
                {done.has(key)?"✓ 완료됨":"완료 체크"}
              </button>
              <button className="btn" onClick={()=>nav(1)} disabled={!hasNext}>다음 →</button>
            </div>
          </div>
        )}

        {/* ═══ 기도 탭 ═══ */}
        {tab==="voice" && (
          <div key={`voice-${key}`} className="fade" style={{paddingTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"14px 0 18px"}}>
              <button className="btn" onClick={()=>nav(-1)} disabled={!hasPrev}>← 이전</button>
              <div style={{textAlign:"center",fontSize:14,color:"#EDE5D5"}}>{viewDate.getMonth()+1}월 {viewDate.getDate()}일</div>
              <button className="btn" onClick={()=>nav(1)} disabled={!hasNext}>다음 →</button>
            </div>
            <div style={{background:`linear-gradient(135deg,${theme.bg},rgba(0,0,0,.05))`,border:`1px solid ${theme.border}`,borderRadius:22,padding:"24px 22px",marginBottom:14}}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:10,letterSpacing:".25em",color:theme.color+"77",textTransform:"uppercase",marginBottom:10}}>오늘의 말씀 선포 및 기도</div>
                <div style={{background:"rgba(255,255,255,.02)",border:`1px solid ${theme.border}66`,borderRadius:14,padding:"18px",marginBottom:18}}>
                  <div style={{fontSize:15,color:"#EDE5D5",lineHeight:1.85,fontWeight:500,marginBottom:10,textAlign:"center",wordBreak:"keep-all"}}>
                    "내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라 이제 내가 육체 가운데 사는 것은 나를 사랑하사 나를 위하여 자기 자신을 버리신 하나님의 아들을 믿는 믿음 안에서 사는 것이라"
                  </div>
                  <div style={{fontSize:12,color:theme.color+"88",fontWeight:600}}>갈라디아서 2:20</div>
                  <div style={{fontSize:12,color:theme.color,marginTop:5}}>이 구절을 소리 내어 선포한 후 기도를 시작하세요.</div>
                </div>
              </div>
              <PrayerTimer dateKey={key} passageRaw={raw} theme={theme} onComplete={handlePrayerComplete}/>
            </div>
          </div>
        )}

        {/* ═══ 달력 탭 ═══ */}
        {tab==="calendar" && (
          <div className="fade" style={{paddingTop:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button className="btn" onClick={()=>setCalMonth(m=>Math.max(0,m-1))} disabled={calMonth<=0}>←</button>
              <div style={{fontSize:18,color:"#EDE5D5"}}>{MONTH_NAMES[calMonth]} 2026</div>
              <button className="btn" onClick={()=>setCalMonth(m=>Math.min(11,m+1))} disabled={calMonth>=11}>→</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {calCells.map((cell,i)=>{
                if(!cell) return <div key={`e${i}`}/>;
                const t2=cell.theme;
                return (
                  <div key={cell.k} className="cal-cell" onClick={()=>{setViewDate(cell.dt);setTab("main");}}
                    style={{background:cell.done?"rgba(255,255,255,.05)":"rgba(255,255,255,.02)",border:`1px solid ${cell.isView?t2.color:"transparent"}`,borderRadius:10,padding:"10px 5px",textAlign:"center",cursor:"pointer"}}>
                    <div style={{fontSize:11,color:cell.isToday?t2.color:"#6A5E50"}}>{cell.d}</div>
                    <div style={{fontSize:9,color:t2.color}}>{cell.done?"✓":""} {cell.voiceDone?"🙏":""}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ 현황판 탭 ═══ */}
        {tab==="leader" && <LeaderDashboard theme={theme}/>}
      </div>
    </div>
  );
}
