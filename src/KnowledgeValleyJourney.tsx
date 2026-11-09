import React, { useEffect, useMemo, useState } from 'react';
import './KnowledgeValleyJourney.css';

type View = 'cinema'|'map'|'trial'|'game'|'reward';
type Props = {studentId:string;studentName:string;canEnterUnit:(unit:number)=>boolean;onStartUnit:(unit:number)=>void};
const gates = [
 {id:1,title:'واحة القيم',sub:'الفصل الأول',symbol:'✦',unit:1,tone:'emerald',desc:'افتح كنوز القيم الإسلامية واجعل الكلمة الطيبة دليلك.'},
 {id:2,title:'مدينة الأعلام',sub:'الفصل الثاني',symbol:'♜',unit:2,tone:'violet',desc:'تتبّع آثار العظماء واكتشف قوة المعرفة.'},
 {id:3,title:'حصن الوطن',sub:'الفصل الثالث',symbol:'⌑',unit:3,tone:'gold',desc:'ارفع راية الفخر واكتشف أسرار لغتنا ووطننا.'},
 {id:4,title:'غابة الكلمات',sub:'ممر الأسرار',symbol:'♧',tone:'forest',desc:'اكتشف جذور الكلمات وعائلاتها.'},
 {id:5,title:'قلعة النحو',sub:'حصن القواعد',symbol:'♜',tone:'stone',desc:'أعد النظام إلى مملكة الجمل.'},
 {id:6,title:'جبال البلاغة',sub:'قمة البيان',symbol:'△',tone:'ice',desc:'تسلّق قمم التعبير وجمال التصوير.'},
 {id:7,title:'مكتبة الأسرار',sub:'سر المنارة',symbol:'✧',tone:'magic',desc:'اجمع مفاتيح المعرفة وأعد النور.'}
];
const qs = [
 ['أي الكلمات تدل على الشجاعة؟',['الجُبن','الإقدام','التردد','الكسل'],1,'الشجاعة تعني الجرأة والإقدام.'],
 ['ما ضد «التعاون»؟',['التكاتف','التآزر','التنازع','التشارك'],2,'ابحث عن كلمة تدل على الاختلاف والصراع.'],
 ['أي الجمل تبدأ بفعل؟',['السماء صافية','يقرأ الطالب','العلم نور','الحديقة جميلة'],1,'الجملة الفعلية تبدأ بفعل.'],
 ['ما جمع «قيمة»؟',['قوام','قيم','قائمات','قيمة'],1,'جمع التكسير هنا «قِيَم».'],
 ['أي الكلمات اسم؟',['يكتب','إلى','مدرسة','لن'],2,'الاسم يدل على إنسان أو مكان أو شيء أو معنى.'],
 ['ما نوع الأسلوب «ما أجمل الصدق!»؟',['استفهام','تعجب','نهي','أمر'],1,'المتكلم يُظهر إعجابه.'],
 ['اختر الكتابة الصحيحة:',['مسؤلية','مسؤولية','مسئوليه','مسؤليه'],1,'انتبه إلى الهمزة والياء.'],
 ['ما مرادف «يتقن»؟',['يهمل','يحسن','يترك','يسرع'],1,'الإتقان هو إحسان العمل وإجادته.'],
 ['أي الكلمات فعل ماضٍ؟',['يستكشف','استكشف','استكشاف','مكتشف'],1,'الفعل الماضي يدل على حدث وقع وانتهى.'],
 ['ما علامة رفع المبتدأ المفرد؟',['الفتحة','الكسرة','الضمة','السكون'],2,'المبتدأ مرفوع وعلامة رفع المفرد الضمة.']
] as const;
const storeKey = 'lt-knowledge-valley-v2:';
function read(id:string){try{return JSON.parse(localStorage.getItem(storeKey+id)||'{}')}catch{return {}}}

export function KnowledgeValleyJourney({studentId,studentName,canEnterUnit,onStartUnit}:Props){
 const [view,setView]=useState<View>(()=>read(studentId).started?'map':'cinema');
 const [scene,setScene]=useState(0),[qi,setQi]=useState(0),[answers,setAnswers]=useState<number[]>([]);
 const [choice,setChoice]=useState<number|null>(null),[feedback,setFeedback]=useState('');
 const [gameStep,setGameStep]=useState(0),[gameChoice,setGameChoice]=useState<number|null>(null),[gameOrder,setGameOrder]=useState<string[]>([]);
 const [progress,setProgress]=useState(()=>read(studentId));
 const first=studentName.trim().split(/\s+/)[0]||'أيها البطل';
 const score=useMemo(()=>answers.reduce((n,a,i)=>n+(a===qs[i][2]?1:0),0),[answers]);
 useEffect(()=>{const p=read(studentId);setProgress(p);setView(p.started?'map':'cinema');setScene(0);setQi(0);setAnswers([])},[studentId]);
 useEffect(()=>{const onQuizComplete=(event:Event)=>{const detail=(event as CustomEvent<{total:number;unit:number}>).detail;if(detail?.total===10&&detail.unit>=1&&detail.unit<=3){setGameStep(0);setGameChoice(null);setGameOrder([]);setFeedback('');setView('game')}};window.addEventListener('lt:knowledge-valley:quiz-complete',onQuizComplete);return()=>window.removeEventListener('lt:knowledge-valley:quiz-complete',onQuizComplete)},[]);
 const save=(patch:Record<string,unknown>)=>{const p={...read(studentId),...patch};try{localStorage.setItem(storeKey+studentId,JSON.stringify(p))}catch{}setProgress(p)};
 const begin=()=>{save({started:true});setView('map')};
 const startTrial=()=>{setQi(0);setAnswers([]);setChoice(null);setFeedback('');setGameOrder([]);setView('trial')};
 const answer=(i:number)=>{if(choice!==null)return;setChoice(i);setFeedback(i===qs[qi][2]?'إجابة موفقة! أضاءت نجمة جديدة.':'ليست هذه المرة. '+qs[qi][3])};
 const next=()=>{const a=[...answers,choice??-1];setAnswers(a);setChoice(null);setFeedback('');if(qi===9){setView('game');setGameStep(0);setGameChoice(null)}else setQi(q=>q+1)};
 const tasks=[{q:'رتّب الكلمات لتبني الجملة الصحيحة',w:['ينير','العلم','العقول'],a:'العلم ينير العقول'},{q:'أكمل العبارة: بالصدق ... الثقة',w:['تُبنى','تُهدم','تضيع'],a:'تُبنى'},{q:'اختر مرادف كلمة «مشرق»',w:['مضيء','مظلم','بعيد'],a:'مضيء'}];
 const checkGame=()=>{const correct=gameStep===0?gameOrder.join(' ')===tasks[0].a:gameChoice!==null&&tasks[gameStep].w[gameChoice]===tasks[gameStep].a;if(!correct){setFeedback('حاول مرة أخرى؛ المفتاح الصحيح قريب!');return}setFeedback('أحسنت!');if(gameStep===2){save({started:true,trialDone:true,stars:Math.max(progress.stars||0,score)});setView('reward')}else{setGameStep(s=>s+1);setGameChoice(null);setGameOrder([]);setFeedback('')}};
 return <section className="kvj" dir="rtl" aria-label="مغامرة سر وادي المعرفة">
  <div className="kvj-world">
   <div className="kvj-stars">✦　·　✧　　　✦　　✧　·　✦</div><div className="kvj-sun"/>
   <div className="kvj-mountain kvj-m1"/><div className="kvj-mountain kvj-m2"/><div className="kvj-mountain kvj-m3"/>
   <div className="kvj-castle"><i/><i/><i/><b>✧</b></div><div className="kvj-waterfall"/>
   <div className="kvj-river"/><div className="kvj-forest">♧　♧　♧　♧　♧</div>
   <div className="kvj-world-title"><small>حكاية تفاعلية • عالم من المعرفة</small><h2>سرّ وادي المعرفة</h2><p>رحلة الأبطال تبدأ بكلمة… وتنتهي بإعادة النور</p></div>
   <div className="kvj-eagle">🦅</div><div className="kvj-world-label">✦ وادي المعرفة</div>
  </div>
  {view==='cinema'&&<div className="kvj-cinema">
   <div className="kvj-cinema-top"><span>المشهد {scene+1} / 3</span><div><i style={{width:((scene+1)/3*100)+'%'}}/></div><span>الفصل الافتتاحي</span></div>
   {scene===0&&<div className="kvj-scene"><span>🌌</span><div><small>قبل زمن بعيد…</small><h3>حين انطفأت منارة الوادي</h3><p>كان وادي المعرفة يلمع كنجمة وسط الجبال. وفي ليلة غامضة انطفأت منارته، وسكنَت أبوابه السبعة، وتفرّق نور الحروف في أرجاء الوادي.</p></div></div>}
   {scene===1&&<div className="kvj-scene"><span>🧙🏻‍♂️</span><div><small>ظهر حارس الأسرار</small><h3>نداء الحكيم</h3><p>قال الحكيم: «يا {first}، لن يعود النور بالقوة، بل بعقل يعرف ولسان يفصح وقلب يحب الخير. أمامك أبواب لا تُفتح إلا بالمعرفة».</p></div></div>}
   {scene===2&&<div className="kvj-scene"><span>🦅</span><div><small>رفيقك في الرحلة</small><h3>الصقر يعرف الطريق</h3><p>هبط صقر الوادي قربك وبسط جناحيه نحو الممر الذهبي. «سأرافقك يا بطل. اجمع مفاتيح المعرفة وأعد النور إلى المنارة!»</p></div></div>}
   <div className="kvj-actions">{scene>0&&<button className="kvj-secondary" onClick={()=>setScene(s=>s-1)}>السابق</button>}<button className="kvj-primary" onClick={()=>scene<2?setScene(s=>s+1):begin()}>{scene<2?'تابع الحكاية ←':'ادخل الوادي وافتح الخريطة ✦'}</button></div>
   <p className="kvj-note">تُحفظ رحلتك على هذا الجهاز. مشاهدة القصة لا تمنح نقاطًا.</p>
  </div>}
  {view==='map'&&<div className="kvj-map">
   <div className="kvj-map-heading"><div><small>دليل المستكشف</small><h3>خريطة وادي المعرفة</h3><p>اختر بوابة، واجعل المعرفة مفتاحك.</p></div><div className="kvj-score"><b>{progress.stars||0}</b><span>نجوم الإتقان</span></div></div>
   <div className="kvj-map-art"><svg viewBox="0 0 900 300" role="img" aria-label="خريطة وادي المعرفة"><defs><linearGradient id="valley" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#123d49"/><stop offset="1" stopColor="#2b806e"/></linearGradient></defs><rect width="900" height="300" rx="22" fill="url(#valley)"/><path d="M0 210Q120 140 240 205T470 190T690 200T900 150V300H0Z" fill="#285e50"/><path d="M0 250Q140 190 260 240T500 225T720 230T900 200" fill="none" stroke="#8be1cf" strokeWidth="17" opacity=".7"/><path d="M50 180Q160 55 280 165T500 140T690 155T850 60" fill="none" stroke="#f3d28d" strokeWidth="5" strokeDasharray="9 12"/><g fill="#d7c69f"><path d="M25 180L110 45 190 180Z"/><path d="M650 155L760 20 870 155Z"/><path d="M410 145L510 40 600 145Z"/></g><g fill="#f6d991" stroke="#fff0c6" strokeWidth="2"><circle cx="110" cy="180" r="18"/><circle cx="280" cy="165" r="18"/><circle cx="500" cy="140" r="18"/><circle cx="690" cy="155" r="18"/></g><g fill="#173f45" fontSize="15" fontWeight="bold" textAnchor="middle"><text x="110" y="186">١</text><text x="280" y="171">٢</text><text x="500" y="146">٣</text><text x="690" y="161">٤</text></g><g fill="#e6f4e7" fontSize="17" fontWeight="bold" textAnchor="middle"><text x="130" y="280">غابة الكلمات</text><text x="450" y="280">قلعة النحو</text><text x="770" y="280">منارة الوادي</text></g></svg><div className="kvj-map-legend"><span>✦ طريق المعرفة</span><span>● بوابات الرحلة</span><span>⌑ المنارة المفقودة</span></div></div>
   <div className="kvj-gates">{gates.map(g=>{const open=g.unit?canEnterUnit(g.unit):true;return <article key={g.id} className={'kvj-gate '+g.tone+(open?' open':' closed')}><div className="kvj-number">{String(g.id).padStart(2,'0')}</div><div className="kvj-symbol">{g.symbol}</div><div className="kvj-copy"><small>{g.sub}</small><h4>{g.title}</h4><p>{g.desc}</p></div>{g.unit?<button disabled={!open} onClick={()=>onStartUnit(g.unit!)}>{open?'ابدأ المهمة ←':'مغلقة بإذن المعلم'}</button>:<button onClick={startTrial}>اكتشف الباب ←</button>}</article>})}</div>
   <div className="kvj-map-footer"><span>🦅 الصقر: «كل باب يخبئ سرًا… فالمعرفة تفتح الطريق»</span><button onClick={()=>{setScene(0);setView('cinema')}}>إعادة القصة</button></div>
  </div>}
  {view==='trial'&&<div className="kvj-trial"><div className="kvj-trial-head"><b>اختبار حارس البوابة</b><span>{qi+1} / 10</span></div><div className="kvj-trial-bar"><i style={{width:((qi+1)*10)+'%'}}/></div><h3>{qs[qi][0]}</h3><div className="kvj-options">{qs[qi][1].map((o,i)=><button key={o} disabled={choice!==null} className={choice===i?(i===qs[qi][2]?'correct':'wrong'):''} onClick={()=>answer(i)}><span>{['أ','ب','ج','د'][i]}</span>{o}</button>)}</div>{feedback&&<div className="kvj-feedback">{feedback}<button onClick={next}>{qi===9?'إلى اللعبة الكبرى ←':'السؤال التالي ←'}</button></div>}<p className="kvj-note">تحدٍّ تدريبي مستقل؛ لا يغيّر رصيد الطالب الدراسي.</p></div>}
  {view==='game'&&<div className="kvj-trial kvj-arcade"><small>تحدي ما بعد الأسئلة العشرة</small><h3>مهمة إنقاذ المنارة ✨</h3><p>{tasks[gameStep].q}</p>{gameStep===0&&<div className="kvj-built-word"><span>جملتك:</span>{gameOrder.map((w,i)=><button key={i} onClick={()=>setGameOrder(a=>a.filter((_,n)=>n!==i))}>{w} ×</button>)}</div>}<div className="kvj-word-options">{tasks[gameStep].w.map((w,i)=><button key={w} disabled={gameStep===0&&gameOrder.includes(w)} className={gameStep===0?(gameOrder.includes(w)?'selected':''):gameChoice===i?'selected':''} onClick={()=>{if(gameStep===0){setGameOrder(a=>[...a,w]);setFeedback('')}else{setGameChoice(i);setFeedback('')}}}>{w}</button>)}</div><button className="kvj-primary" disabled={gameStep===0?gameOrder.length!==3:gameChoice===null} onClick={checkGame}>{gameStep===2?'أعد النور إلى المنارة':'تحقق وتابع'}</button>{feedback&&<p className="kvj-feedback">{feedback}</p>}<small>المهمة {gameStep+1} من 3</small></div>}
  {view==='reward'&&<div className="kvj-reward"><span>✦ ✧ ✦</span><h3>عاد النور إلى وادي المعرفة!</h3><p>أحسنت يا {first}. اجتزت بوابة الأسرار وأتممت تحدي المنارة.</p><div className="kvj-stars-earned">{'★'.repeat(Math.max(1,Math.min(5,score)))}<small>{score} / 10 في الاختبار</small></div><button className="kvj-primary" onClick={()=>setView('map')}>العودة إلى خريطة الوادي</button></div>}
 </section>;
}
