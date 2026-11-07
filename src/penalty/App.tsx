/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

import questionBank from './data/question_bank.json';

export interface QuestionItem {
  id: string;
  unit: string;
  lesson: string;
  page: number;
  type: string;
  difficulty: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface StrikerIdentity {
  number: number;
  skin: string;
  hairColor: string;
  hairStyle: 'fade' | 'spiky' | 'curly' | 'headband';
}

export const NUMBER_POOL = [8, 9, 10, 11, 13, 14, 15, 17, 18, 19, 20, 21, 22];
export const SKIN_POOL = ['#f5d0b5', '#e8b890', '#d49b6a', '#c68642', '#8d5524'];
export const HAIR_COLORS = ['#18181b', '#2c1810', '#3b2219', '#111111'];
export const HAIR_STYLES = ['fade', 'spiky', 'curly', 'headband'] as const;

const trainingData = questionBank.training_questions as QuestionItem[];
const u1Questions = trainingData.filter(q => q.unit.includes('الأولى'));
const u2Questions = trainingData.filter(q => q.unit.includes('الثانية'));
const u3Questions = trainingData.filter(q => q.unit.includes('الثالثة'));

const STAGES: QuestionItem[][] = [
  u1Questions.slice(0, 10),
  u2Questions.slice(0, 10),
  u3Questions.slice(0, 10),
  [...u1Questions.slice(10, 15), ...u2Questions.slice(10, 15)],
  [...u1Questions.slice(15, 19), ...u2Questions.slice(15, 18), ...u3Questions.slice(10, 13)]
];

export interface RoundTheme {
  name: string;
  shortTitle: string;
  desc?: string;
  shirt: string;
  shorts: string;
  sock: string;
  stripes?: boolean;
  number: number;
  playerSkin: string;
  playerHair: string;
  stadiumLight: string;
  bannerColor: string;
  flagColor: string;
  isSaudiFinal?: boolean;
}

export const CHAMPIONSHIP_ROUNDS: RoundTheme[] = [
  // Stage 1: Quarter-Final / Islamic Values (Yellow Shirt, Blue Shorts)
  {
    name: 'المرحلة الأولى: ربع النهائي / القيم الإسلامية',
    shortTitle: 'المرحلة الأولى · ربع النهائي',
    shirt: '#facc15',
    shorts: '#1d4ed8',
    sock: '#facc15',
    number: 7,
    playerSkin: '#e8b890',
    playerHair: '#1a1a1a',
    stadiumLight: 'rgba(255, 230, 150, 0.08)',
    bannerColor: '#1e3a8a',
    flagColor: '#facc15'
  },
  // Stage 2: Semi-Final / Figures (Blue Shirt, White Shorts)
  {
    name: 'المرحلة الثانية: نصف النهائي / الأعلام',
    shortTitle: 'المرحلة الثانية · نصف النهائي',
    shirt: '#2563eb',
    shorts: '#ffffff',
    sock: '#2563eb',
    number: 10,
    playerSkin: '#d49b6a',
    playerHair: '#2c1810',
    stadiumLight: 'rgba(150, 200, 255, 0.08)',
    bannerColor: '#1d4ed8',
    flagColor: '#2563eb'
  },
  // Stage 3: Mini-Final / Homeland (Yellow & Black Striped Shirt, Black Shorts)
  {
    name: 'المرحلة الثالثة: النهائي المصغر / الوطن',
    shortTitle: 'المرحلة الثالثة · النهائي المصغر',
    shirt: '#eab308',
    shorts: '#18181b',
    sock: '#18181b',
    stripes: true,
    number: 9,
    playerSkin: '#e8b890',
    playerHair: '#18181b',
    stadiumLight: 'rgba(255, 240, 150, 0.08)',
    bannerColor: '#18181b',
    flagColor: '#eab308'
  },
  // Stage 4: Qualifying Play-off / Grammar Challenge (Green Shirt, White Shorts)
  {
    name: 'المرحلة الرابعة: الملحق التأهيلي / التحدي النحوي',
    shortTitle: 'المرحلة الرابعة · الملحق التأهيلي',
    shirt: '#16a34a',
    shorts: '#ffffff',
    sock: '#16a34a',
    number: 11,
    playerSkin: '#c68642',
    playerHair: '#111111',
    stadiumLight: 'rgba(180, 255, 180, 0.08)',
    bannerColor: '#15803d',
    flagColor: '#ffffff'
  },
  // Stage 5: Grand Final — Saudi National Team Theme (Saudi Green Shirt, White Shorts)
  {
    name: 'المرحلة الخامسة: النهائي الكبير / درة الملاعب وكأس التفوق',
    shortTitle: 'المرحلة الخامسة · النهائي الكبير 🇸🇦',
    shirt: '#006c35',
    shorts: '#ffffff',
    sock: '#ffffff',
    number: 8,
    playerSkin: '#e8b890',
    playerHair: '#111111',
    stadiumLight: 'rgba(0, 168, 80, 0.16)',
    bannerColor: '#00572b',
    flagColor: '#006c35',
    isSaudiFinal: true
  }
];

export const STAGE_NAMES = CHAMPIONSHIP_ROUNDS.map(r => r.name);
export const NUMS = CHAMPIONSHIP_ROUNDS.map(r => r.number);



const encAudio = (filename: string) => `/penalty/audio/${encodeURIComponent(filename)}`;

export interface ClipInfo {
  id: string;
  path: string;
  text: string;
  category: 'intro' | 'prep' | 'goal' | 'coach' | 'witty' | 'save' | 'post' | 'stage' | 'tournament' | 'miss';
  persona: 'goal_commentator' | 'coach_fury' | 'playful_witty';
  personaTitle: string;
  icon: string;
}

export const COMMENTARY_REGISTRY: Record<string, ClipInfo> = {
  // === الملفات الصوتية الأصلية المعتمدة للعبة «لغتي تحكي — ركلات الترجيح» ===
  // 1. الافتتاحية الرسمية للبطولة
  mp3_intro_start: {
    id: 'mp3_intro_start',
    path: encAudio('صوت  البداية 1.mp3'),
    text: 'صوت البداية والافتتاحية للمباراة',
    category: 'intro',
    persona: 'goal_commentator',
    personaTitle: 'افتتاحية المباراة',
    icon: '🎙️'
  },

  // 2. الاستعداد والتسديد
  mp3_prep_advance_shoot: {
    id: 'mp3_prep_advance_shoot',
    path: encAudio('اللاعب يتقدم يقترب يسدد.mp3'),
    text: 'اللاعب يتقدم يقترب يسدد...',
    category: 'prep',
    persona: 'goal_commentator',
    personaTitle: 'معلق المباراة',
    icon: '⚽'
  },
  mp3_prep_calm_focus: {
    id: 'mp3_prep_calm_focus',
    path: encAudio('يتقدم اللعب نحو الكره هدوء وتركيز .mp3'),
    text: 'يتقدم اللاعب نحو الكرة بهدوء وتركيز...',
    category: 'prep',
    persona: 'goal_commentator',
    personaTitle: 'معلق المباراة',
    icon: '🧘'
  },
  mp3_prep_look_ball: {
    id: 'mp3_prep_look_ball',
    path: encAudio('الاعب ينظر الى الكرة .mp3'),
    text: 'اللاعب ينظر إلى الكرة ويستعد للتسديد...',
    category: 'prep',
    persona: 'goal_commentator',
    personaTitle: 'معلق المباراة',
    icon: '👀'
  },
  mp3_prep_all_focus: {
    id: 'mp3_prep_all_focus',
    path: encAudio('كل هذا التركيز .mp3'),
    text: 'كل هذا التركيز قبل التنفيذ...',
    category: 'prep',
    persona: 'goal_commentator',
    personaTitle: 'معلق المباراة',
    icon: '🎯'
  },
  mp3_prep_final_kick: {
    id: 'mp3_prep_final_kick',
    path: encAudio('الركلة الاخير يسدد اللاعب يالله .mp3'),
    text: 'الركلة الأخيرة يسدد اللاعب يالله...',
    category: 'prep',
    persona: 'goal_commentator',
    personaTitle: 'الركلة العاشرة الأخيرة',
    icon: '🔥'
  },

  // 3. الأهداف
  mp3_goal_yarabbah: {
    id: 'mp3_goal_yarabbah',
    path: encAudio('ياربااااااااه هدف.mp3'),
    text: 'يا رباااااااه! هدف!',
    category: 'goal',
    persona: 'goal_commentator',
    personaTitle: 'معلق الأهداف',
    icon: '⚽'
  },
  mp3_goal_beautiful: {
    id: 'mp3_goal_beautiful',
    path: encAudio('هدف ولا اجمل يا بطل .mp3'),
    text: 'هدف ولا أجمل يا بطل!',
    category: 'goal',
    persona: 'goal_commentator',
    personaTitle: 'معلق الأهداف',
    icon: '🌟'
  },
  mp3_goal_decisive_moment: {
    id: 'mp3_goal_decisive_moment',
    path: encAudio('يالها من لحظه حاسمه هدف قوول .mp3'),
    text: 'يا لها من لحظة حاسمة! هدف قووول!',
    category: 'goal',
    persona: 'goal_commentator',
    personaTitle: 'معلق الأهداف',
    icon: '💥'
  },

  // 4. تصديات الحارس
  mp3_save_basic: {
    id: 'mp3_save_basic',
    path: encAudio('الحارس تصدى.mp3'),
    text: 'الحارس تصدى!',
    category: 'save',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🧤'
  },
  mp3_save_blocked: {
    id: 'mp3_save_blocked',
    path: encAudio('تصدى لها الحارس .mp3'),
    text: 'تصدى لها الحارس!',
    category: 'save',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🧤'
  },
  mp3_save_legendary_vacation: {
    id: 'mp3_save_legendary_vacation',
    path: encAudio('تصدي خرافي الحارس يحتاج اجازه بعد التالق.mp3'),
    text: 'تصدي خرافي! الحارس يحتاج إجازة بعد هذا التألق!',
    category: 'save',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🏖️'
  },
  mp3_save_maintenance: {
    id: 'mp3_save_maintenance',
    path: encAudio('الحارس اغلق المرمى للصيانه الرجاء المحاولة لاحقا .mp3'),
    text: 'الحارس أغلق المرمى للصيانة، الرجاء المحاولة لاحقًا!',
    category: 'save',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🚧'
  },
  mp3_save_request_rejected: {
    id: 'mp3_save_request_rejected',
    path: encAudio('اللاعب سدد والحارس قال الطلب مرفوض .mp3'),
    text: 'اللاعب سدد والحارس قال: الطلب مرفوض!',
    category: 'save',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🚫'
  },
  mp3_save_impossible_denial: {
    id: 'mp3_save_impossible_denial',
    path: encAudio('مستحيل الحارس يحرم اللاعب من الهدف.mp3'),
    text: 'مستحيل! الحارس يحرم اللاعب من الهدف!',
    category: 'save',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🛡️'
  },
  mp3_save_did_not_move: {
    id: 'mp3_save_did_not_move',
    path: encAudio('يا جماعة الخير الحارس لم يتحرك .mp3'),
    text: 'يا جماعة الخير الحارس لم يتحرك!',
    category: 'save',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🗿'
  },

  // 5. القائم والعارضة
  mp3_post_interferes: {
    id: 'mp3_post_interferes',
    path: encAudio('القائم يتدخل .mp3'),
    text: 'القائم يتدخل!',
    category: 'post',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🥅'
  },
  mp3_crossbar_saves: {
    id: 'mp3_crossbar_saves',
    path: encAudio('العارضة تنقذ الحارس من هدف محقق.mp3'),
    text: 'العارضة تنقذ الحارس من هدف محقق!',
    category: 'post',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '🥅'
  },
  mp3_crossbar_bad_luck: {
    id: 'mp3_crossbar_bad_luck',
    path: encAudio('في العارضه ياللحظ العاثر .mp3'),
    text: 'في العارضة! يا للحظ العاثر!',
    category: 'post',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🤦‍♂️'
  },
  mp3_crossbar_rights: {
    id: 'mp3_crossbar_rights',
    path: encAudio('الكرة اصطدمت بالعارضة والعارضه تطالب بحقوقها .mp3'),
    text: 'الكرة اصطدمت بالعارضة، والعارضة تطالب بحقوقها!',
    category: 'post',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '😂'
  },
  mp3_crossbar_centimeters: {
    id: 'mp3_crossbar_centimeters',
    path: encAudio('سنتيمترات قليله واحلام كبيره العارضة تنقذ الحارس.mp3'),
    text: 'سنتيمترات قليلة وأحلام كبيرة! العارضة تنقذ الحارس!',
    category: 'post',
    persona: 'goal_commentator',
    personaTitle: 'معلق رياضي',
    icon: '📏'
  },
  mp3_crossbar_not_today: {
    id: 'mp3_crossbar_not_today',
    path: encAudio('حتى العارضة قالت مو اليوم يا بطل .mp3'),
    text: 'حتى العارضة قالت: مو اليوم يا بطل!',
    category: 'post',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🙅‍♂️'
  },

  // 6. الإضاعة وخروج الكرة
  mp3_miss_takeoff: {
    id: 'mp3_miss_takeoff',
    path: encAudio('ياساتر من سمح للكرة بالاقلاع.mp3'),
    text: 'يا ساتر! من سمح للكرة بالإقلاع؟! تسديدة بعيدة!',
    category: 'witty',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🛫'
  },
  mp3_miss_another_stadium: {
    id: 'mp3_miss_another_stadium',
    path: encAudio('ياساتر الكرة راحت تبحث عن ملعب ثاني .mp3'),
    text: 'يا ساتر! الكرة راحت تبحث عن ملعب ثانٍ!',
    category: 'witty',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🏟️'
  },
  mp3_miss_target_birds: {
    id: 'mp3_miss_target_birds',
    path: encAudio('الكره فوق العارضه يبدو ان اللاعب يستهدف الطيور .mp3'),
    text: 'الكرة فوق العارضة، يبدو أن اللاعب يستهدف الطيور!',
    category: 'witty',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🦅'
  },
  mp3_miss_farewell_letter: {
    id: 'mp3_miss_farewell_letter',
    path: encAudio('هذه ليست تسديده هذه رساله وداع للكرة .mp3'),
    text: 'هذه ليست تسديدة، هذه رسالة وداع للكرة!',
    category: 'witty',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '✉️'
  },
  mp3_miss_rethink: {
    id: 'mp3_miss_rethink',
    path: encAudio('هذه الركلة تحتاج الى اعادة تفكير .mp3'),
    text: 'هذه الركلة تحتاج إلى إعادة تفكير!',
    category: 'witty',
    persona: 'playful_witty',
    personaTitle: 'معلق ساخر مرح',
    icon: '🤔'
  },


  // 8. نهايات المراحل والبطولة
  mp3_stage_congrats: {
    id: 'mp3_stage_congrats',
    path: encAudio('مبروك اداء يستحق التقدير .mp3'),
    text: 'مبروك! أداء يستحق التقدير!',
    category: 'stage',
    persona: 'goal_commentator',
    personaTitle: 'نهاية المرحلة',
    icon: '👏'
  },
  mp3_tournament_victory: {
    id: 'mp3_tournament_victory',
    path: encAudio('انتصار يالها من بطولة .mp3'),
    text: 'انتصار! يا لها من بطولة!',
    category: 'tournament',
    persona: 'goal_commentator',
    personaTitle: 'تتويج البطولة',
    icon: '🏆'
  }
};

const isGoalMode = (m: string) => m === 'goal';

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

const PENALTY_PARAMS = new URLSearchParams(window.location.search);
const IS_EMBEDDED = PENALTY_PARAMS.get('embedded') === '1';
const EXTERNAL_STUDENT_ID = PENALTY_PARAMS.get('studentId') || '';
const EXTERNAL_STUDENT_NAME = PENALTY_PARAMS.get('studentName') || '';
const scopedStorageKey = (key: string) => EXTERNAL_STUDENT_ID && (key === 'pk_prog' || key === 'pk_question_awards') ? `${key}_${EXTERNAL_STUDENT_ID}` : key;
const LS = {
  g(k: string) {
    try { return JSON.parse(localStorage.getItem(scopedStorageKey(k)) || ''); } catch { return null; }
  },
  s(k: string, v: unknown) {
    try { localStorage.setItem(scopedStorageKey(k), JSON.stringify(v)); } catch {}
  }
};

const esc = (v: string | number) =>
  String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qRef = useRef<HTMLDivElement | null>(null);

  // Anti-Repetition Tracking Engine:
  // 1. Tracks clips played in current session per category
  // 2. Doesn't repeat a clip until all category clips are played
  // 3. Prevents consecutive kick repetition even across deck reshuffles
  const commentaryHistoryRef = useRef<{
    usedByCat: Record<string, string[]>;
    lastPlayedId: string | null;
  }>({
    usedByCat: {
      intro: [],
      prep: [],
      goal: [],
      coach: [],
      witty: [],
      save: [],
      post: [],
      stage: [],
      tournament: [],
      miss: []
    },
    lastPlayedId: null
  });

  // Audio Queue & Orchestration Manager (Strict Single-Channel & State-Aware Queue)
  const audioStateRef = useRef<{
    activeClip: string | null;
    activeCategory: string | null;
    isPlaying: boolean;
    waitingTimer: number | null;
    roundAnswered: boolean;
    currentRoundId: number;
    pendingOnEnded: (() => void) | null;
    currentAudioPromise: Promise<void> | null;
    waitingSequenceIdx: number;
    lastRequestTime: number;
    executedEvents: Set<string>;
  }>({
    activeClip: null,
    activeCategory: null,
    isPlaying: false,
    waitingTimer: null,
    roundAnswered: false,
    currentRoundId: 0,
    pendingOnEnded: null,
    currentAudioPromise: null,
    waitingSequenceIdx: 0,
    lastRequestTime: 0,
    executedEvents: new Set<string>()
  });

  const selectCommentary = (
    category: 'intro' | 'prep' | 'goal' | 'coach' | 'witty' | 'save' | 'post' | 'stage' | 'tournament' | 'miss',
    poolFilter?: string[]
  ): ClipInfo => {
    const reg = COMMENTARY_REGISTRY;
    const candidateIds = poolFilter && poolFilter.length > 0
      ? poolFilter.filter(id => reg[id])
      : Object.keys(reg).filter(id => reg[id].category === category);

    if (candidateIds.length === 0) {
      return reg['mp3_goal_yarabbah'];
    }

    const hist = commentaryHistoryRef.current;
    if (!hist.usedByCat[category]) {
      hist.usedByCat[category] = [];
    }

    const used = hist.usedByCat[category];
    let available = candidateIds.filter(id => !used.includes(id));

    // When all clips in category have been exhausted, begin a fresh shuffle cycle
    if (available.length === 0) {
      hist.usedByCat[category] = [];
      available = [...candidateIds];
    }

    // Never repeat the exact same commentary clip in two consecutive kicks
    let finalCandidates = available;
    if (finalCandidates.length > 1 && hist.lastPlayedId) {
      finalCandidates = finalCandidates.filter(id => id !== hist.lastPlayedId);
    }

    const chosenId = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
    hist.usedByCat[category].push(chosenId);
    hist.lastPlayedId = chosenId;

    return reg[chosenId];
  };

  // React state for HUD and UI overlays
  const [eduScoreDisplay, setEduScoreDisplay] = useState(0);
  const [studentGoalsDisplay, setStudentGoalsDisplay] = useState(0);
  const [opponentGoalsDisplay, setOpponentGoalsDisplay] = useState(0);
  const [studentSavesDisplay, setStudentSavesDisplay] = useState(0);
  const [roundDisplay, setRoundDisplay] = useState(1);
  const [stageDisplay, setStageDisplay] = useState(1);
  const [isStrikerDisplay, setIsStrikerDisplay] = useState(true);
  const [dots, setDots] = useState<(number | undefined)[]>(Array(10).fill(undefined));
  const [msgText, setMsgText] = useState('⚽ دورك: مسدد · أجب عن السؤال لتسديد الركلة');
  const [msgVisible, setMsgVisible] = useState(true);
  const msgTimerRef = useRef<number | null>(null);

  const showStatusMsg = (text: string) => {
    setMsgText(text);
    setMsgVisible(true);
    if (msgTimerRef.current) {
      window.clearTimeout(msgTimerRef.current);
      msgTimerRef.current = null;
    }
  };
  const [rsButtonVisible, setRsButtonVisible] = useState(false);
  const [rsButtonText, setRsButtonText] = useState('العب من جديد');
  const [hintButtonDisabled, setHintButtonDisabled] = useState(false);
  const [hintButtonText, setHintButtonText] = useState('💡 احذف إجابة خاطئة');
  const [isMuted, setIsMuted] = useState(false);

  // Start Game Lifecycle State Machine per requirements:
  // ready -> introPlaying -> introFinished -> playing (or introError on permission/network failure)
  type GameStartState = 'ready' | 'introPlaying' | 'introFinished' | 'introError' | 'playing';
  const [gameStartState, setGameStartState] = useState<GameStartState>('ready');
  const gameStartStateRef = useRef<GameStartState>('ready');
  const introPlayingRef = useRef<boolean>(false);
  const introAudioRef = useRef<HTMLAudioElement | null>(null);

  // Modals & Navigation: Standalone Penalty Shootout Game
  const [currentView, setCurrentView] = useState<'shootout'>('shootout');
  const [showStartModal, setShowStartModal] = useState(true);
  const [showStageSummaryModal, setShowStageSummaryModal] = useState(false);
  const [canResume, setCanResume] = useState(false);
  const [resumeText, setResumeText] = useState('استكمال');
  const [playerName, setPlayerName] = useState(() => {
    const p = LS.g('pk_prog');
    return EXTERNAL_STUDENT_NAME || p?.name || 'طالب لغتي';
  });
  const [overallEduScore, setOverallEduScore] = useState<number>(() => {
    const p = LS.g('pk_prog');
    if (p && Array.isArray(p.best)) {
      return p.best.reduce((a: number, b: number) => a + b, 0);
    }
    return 0;
  });
  const [teacherAnnouncementInput, setTeacherAnnouncementInput] = useState('');
  const [teacherAnnouncementSavedMsg, setTeacherAnnouncementSavedMsg] = useState('');

  const [showLBModal, setShowLBModal] = useState(false);
  const [lbRows, setLbRows] = useState<[string, number][]>([]);

  // Teacher Control Panel & Stage Locks State
  // Default: Stage 1 (idx 0) is open, other stages locked unless opened by teacher
  const [stageLocks, setStageLocks] = useState<boolean[]>(() => {
    const saved = LS.g('pk_stage_locks');
    if (Array.isArray(saved) && saved.length === 5) {
      return saved.map(Boolean);
    }
    return [true, false, false, false, false];
  });

  const [showTeacherAuthModal, setShowTeacherAuthModal] = useState(false);
  const [showTeacherPanelModal, setShowTeacherPanelModal] = useState(false);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return LS.g('pk_teacher_auth') === true;
  });
  const [teacherPinInput, setTeacherPinInput] = useState('');
  const [teacherAuthError, setTeacherAuthError] = useState('');
  const [showChangePinSection, setShowChangePinSection] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeSuccessMsg, setPinChangeSuccessMsg] = useState('');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewList, setReviewList] = useState<{ qItem: QuestionItem; studentChoiceIdx: number; isCorrect: boolean }[]>([]);
  const [showRoundTransitionModal, setShowRoundTransitionModal] = useState(false);
  const [nextTargetStage, setNextTargetStage] = useState(0);

  // Refs for game state that canvas & animation loops interact with
  const gameStateRef = useRef({
    // Educational score (0-10 per stage)
    eduScore: 0,
    totEduScore: 0,
    // Match scoreboard (Student vs Opponent)
    studentGoals: 0,
    opponentGoals: 0,
    studentSaves: 0,

    round: 0,
    stage: 0,
    res: [] as (0 | 1)[],
    busy: false,
    ended: false,
    stageDone: false,
    evaluated: false,
    answeredThisRound: false,
    lastAnswerCorrect: false,
    lastStudentChoiceIdx: -1,
    roundReviewData: [] as { qItem: QuestionItem; studentChoiceIdx: number; isCorrect: boolean }[],
    lastGoalCelType: -1,
    lastMissType: -1,
    lastWaitingClip: '',
    currentQuestion: null as QuestionItem | null,
    currentStriker: {
      number: 8,
      skin: '#e8b890',
      hairColor: '#18181b',
      hairStyle: 'fade' as 'fade' | 'spiky' | 'curly' | 'headband'
    },
    lastStudentStrikerNumber: -1,
    lastStudentSkin: '',
    lastOpponentStrikerNumber: -1,
    cg: false,
    cb: false,
    leave: 0,
    wrong: 0,
    consecutiveMisses: 0,
    streak: 0,
    starsT: -9999,
    started: true,
    introPlayed: false,
    introInProgress: false,
    bismillahPlayed: false,
    hintUsed: false,
    mathAudioPlayedInStage1: false,
    qdl: 0,
    name: '',
    ball: { x: 320, y: 368, s: 1, gy: 368, rot: 0, rotX: 0, rotY: 0, bulge: 0 },
    keep: { x: 320, y: 198, tilt: 0, kk: 0 },
    seq: null as any,
    win: null as any,
    missCans: [] as Array<{ x: number; y: number; vx: number; vy: number; rot: number; vrot: number; type: 'water' | 'juice'; alpha: number }>,
    tvBroadcast: null as { active: boolean; startTime: number; duration: number; studentGoals: number; opponentGoals: number } | null,
    lastExit: { x: -70, y: 215 },
    PRJ: [] as any[],
    CROWD: [] as any[],
    muted: false,
    audioBuffers: {} as Record<string, AudioBuffer>,
    currentCommentarySource: null as AudioBufferSourceNode | null,
    currentFallbackAudio: null as HTMLAudioElement | null
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const ambRef = useRef<{
    source: AudioBufferSourceNode | null;
    gain: GainNode | null;
    filter: BiquadFilterNode | null;
    isPlaying: boolean;
  } | null>(null);
  const commentaryAudioElementRef = useRef<HTMLAudioElement | null>(null);

  const getCommentaryAudioElement = () => {
    if (!commentaryAudioElementRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      commentaryAudioElementRef.current = audio;
    }
    return commentaryAudioElementRef.current;
  };

  // Initialize AudioContext with iOS Safari compatibility
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = gameStateRef.current.muted ? 0 : 1;
        master.connect(ctx.destination);

        audioCtxRef.current = ctx;
        masterGainRef.current = master;
      } catch {
        return null;
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    return audioCtxRef.current;
  };

  // Safari / iOS audio unlock
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play a tiny silent buffer to unlock iOS Safari Web Audio completely
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  };

  // High quality procedural multi-layered crowd buffer (4.0s seamless loop)
  const createProceduralCrowdBuffer = (ctx: AudioContext, dur = 4.0) => {
    const numSamples = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(2, numSamples, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let bL0 = 0, bL1 = 0, bL2 = 0;
    let bR0 = 0, bR1 = 0, bR2 = 0;

    for (let i = 0; i < numSamples; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      // 3-pole pinking filter for stadium acoustic murmur
      bL0 = 0.99886 * bL0 + whiteL * 0.0555179;
      bL1 = 0.99332 * bL1 + whiteL * 0.0750759;
      bL2 = 0.96900 * bL2 + whiteL * 0.1538520;
      const pinkL = bL0 + bL1 + bL2 + whiteL * 0.5362;

      bR0 = 0.99886 * bR0 + whiteR * 0.0555179;
      bR1 = 0.99332 * bR1 + whiteR * 0.0750759;
      bR2 = 0.96900 * bR2 + whiteR * 0.1538520;
      const pinkR = bR0 + bR1 + bR2 + whiteR * 0.5362;

      // Subtle crowd swell modulation
      const mod = 0.85 + 0.15 * Math.sin((i / numSamples) * Math.PI * 2);

      left[i] = pinkL * 0.11 * mod;
      right[i] = pinkR * 0.11 * mod;
    }

    return buffer;
  };

  // Procedural noise and tones
  const nb = (d: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const n = Math.floor(ctx.sampleRate * d);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const a = b.getChannelData(0);
    for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
    return b;
  };

  const nz = (t0: number, dur: number, type: BiquadFilterType, f0: number, f1: number, v: number, q?: number, att?: number) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const b = nb(dur + 0.1);
    if (!b) return;
    const s = ctx.createBufferSource();
    s.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.linearRampToValueAtTime(f1, t0 + dur);
    f.Q.value = q || 1;
    const g = ctx.createGain();
    const a = att || Math.min(0.03, dur / 3);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f);
    f.connect(g);
    g.connect(master);
    s.start(t0);
    s.stop(t0 + dur + 0.1);
  };

  const tone = (t0: number, dur: number, type: OscillatorType, f0: number, f1: number, v: number, att?: number, vib?: [number, number]) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.linearRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(v, t0 + (att || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    if (vib) {
      const l = ctx.createOscillator();
      const lg = ctx.createGain();
      l.frequency.value = vib[0];
      lg.gain.value = vib[1];
      l.connect(lg);
      l.connect(o.frequency);
      l.start(t0);
      l.stop(t0 + dur + 0.05);
    }
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  };

  // Continuous Stadium Atmosphere Channel:
  // Stays alive and continuous throughout the entire game, never interrupted by questions or commentary
  const startAmb = () => {
    if (introPlayingRef.current || gameStartStateRef.current === 'introPlaying' || gameStartStateRef.current === 'ready' || gameStartStateRef.current === 'introError') {
      return;
    }
    const s = gameStateRef.current;
    if (s.muted) return;

    // Strict Rule: If already running, NEVER restart or re-seek to 0!
    if (ambRef.current && ambRef.current.isPlaying) {
      return;
    }

    const ctx = getAudioContext();
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    try {
      let b = s.audioBuffers['ambient_crowd'];
      if (!b) {
        b = createProceduralCrowdBuffer(ctx, 4.0);
      }
      if (!b) return;

      const source = ctx.createBufferSource();
      source.buffer = b;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 580;
      filter.Q.value = 0.45;

      const gain = ctx.createGain();
      gain.gain.value = 0.045; // balanced stadium crowd volume

      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      source.start(0);

      ambRef.current = {
        source,
        gain,
        filter,
        isPlaying: true
      };
    } catch (err) {
      console.warn('[Ambient Audio] Failed to start ambient crowd:', err);
    }
  };

  const stopAmb = () => {
    if (ambRef.current) {
      try {
        if (ambRef.current.source) {
          ambRef.current.source.stop();
          ambRef.current.source.disconnect();
        }
      } catch {}
      ambRef.current = null;
    }
  };

  const sfStep = (h?: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    nz(ctx.currentTime, 0.08, 'lowpass', 500, 200, h ? 0.16 : 0.1);
  };

  const sfKick = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(t, 0.16, 'sine', 170, 55, 0.55);
    nz(t, 0.06, 'bandpass', 1800, 0, 0.25, 1);
  };

  const sfWhoosh = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    nz(ctx.currentTime, 0.45, 'bandpass', 500, 1400, 0.09, 0.8, 0.15);
  };

  const sfGoal = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    nz(t, 0.35, 'highpass', 2500, 0, 0.14);
    nz(t + 0.05, 2.6, 'bandpass', 900, 1300, 0.42, 0.6, 0.4);
    if (ambRef.current && ambRef.current.gain) {
      try {
        ambRef.current.gain.gain.setTargetAtTime(0.12, t, 0.15);
        ambRef.current.gain.gain.setTargetAtTime(0.045, t + 2.5, 0.4);
      } catch {}
    }
    tone(t + 0.3, 0.8, 'sine', 2900, 2900, 0.07, 0.05, [28, 90]);
    tone(t + 1.3, 0.5, 'sine', 3100, 3100, 0.06, 0.05, [30, 100]);
  };

  const sfChase = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(t, 0.3, 'square', 250, 800, 0.1, 0.02, [14, 60]);
    tone(t + 0.4, 0.7, 'sawtooth', 190, 110, 0.07, 0.05, [6, 10]);
    for (let i = 0; i < 16; i++) nz(t + 0.3 + i * 0.15, 0.07, 'lowpass', 500, 200, 0.1);
  };

  const sfMiss = (m: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (ambRef.current && ambRef.current.gain) {
      try {
        ambRef.current.gain.gain.setTargetAtTime(0.075, t, 0.1);
        ambRef.current.gain.gain.setTargetAtTime(0.045, t + 1.8, 0.3);
      } catch {}
    }
    if (m === 'save') {
      nz(t, 0.07, 'bandpass', 1500, 0, 0.32, 1);
      tone(t, 0.14, 'sine', 130, 60, 0.4);
    }
    nz(t + 0.1, 1.5, 'bandpass', 500, 250, 0.28, 0.7, 0.15);
    tone(t + 0.1, 1.3, 'triangle', 240, 140, 0.09, 0.15);
    tone(t + 0.1, 1.3, 'triangle', 180, 110, 0.07, 0.15);
    tone(t + 0.15, 1.4, 'sawtooth', 140, 95, 0.05, 0.2, [7, 8]);
    nz(t + 0.1, 1.4, 'bandpass', 350, 200, 0.3, 1, 0.1);
    for (let i = 0; i < 14; i++) nz(t + 0.5 + i * 0.11, 0.08, 'lowpass', 400, 200, 0.09);
  };

  const sfBottle = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;
    nz(t, 0.06, 'bandpass', 1200, 0, 0.18, 1);
    tone(t, 0.09, 'sine', 420, 260, 0.16);
  };

  // Woodwork impact sound (metallic ping + deep structural thud)
  const sfPost = () => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    // Resonant crossbar / post acoustic reverberation
    tone(t, 0.28, 'sine', 720, 500, 0.42);
    tone(t + 0.015, 0.38, 'triangle', 1180, 420, 0.28);
    nz(t, 0.08, 'bandpass', 2200, 350, 0.38, 2.8, 0.01);
  };

  // Load single audio clip buffer on-demand via Web Audio (iOS Safari compliant)
  const loadSingleClipBuffer = async (clipKey: string): Promise<AudioBuffer | null> => {
    const s = gameStateRef.current;
    if (s.audioBuffers[clipKey]) {
      return s.audioBuffers[clipKey];
    }
    const clip = COMMENTARY_REGISTRY[clipKey];
    if (!clip) return null;

    const ctx = getAudioContext();
    if (!ctx) return null;

    try {
      const response = await fetch(clip.path);
      if (!response.ok) {
        console.warn(`[Audio Load Error] fetch returned status ${response.status} for ${clip.path}`);
        return null;
      }
      const arrayBuf = await response.arrayBuffer();
      return await new Promise<AudioBuffer | null>((resolve) => {
        try {
          ctx.decodeAudioData(
            arrayBuf,
            (decoded) => {
              s.audioBuffers[clipKey] = decoded;
              resolve(decoded);
            },
            (err) => {
              console.warn(`[Audio Decode Error] decodeAudioData failed for ${clipKey}:`, err);
              resolve(null);
            }
          );
        } catch (err) {
          console.warn(`[Audio Decode Error] decode threw for ${clipKey}:`, err);
          resolve(null);
        }
      });
    } catch (err) {
      console.warn(`[Audio Load Error] Fetch caught error for ${clipKey}:`, err);
      return null;
    }
  };

  // Pre-load priority commentary files into AudioBuffers for zero latency & iOS compliance
  const loadAudioBuffers = async () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const s = gameStateRef.current;

    // High-priority clips needed early
    const priorityClips = [
      'mp3_intro_start',
      'mp3_prep_advance_shoot',
      'mp3_prep_final_kick',
      'mp3_prep_look_ball',
      'mp3_goal_yarabbah',
      'mp3_goal_beautiful',
      'mp3_goal_decisive_moment',
      'mp3_save_basic',
      'mp3_save_blocked',
      'mp3_post_interferes',
      'mp3_miss_another_stadium'
    ];

    try {
      // Generate clean acoustic stadium murmur completely free of speech
      if (!s.audioBuffers['ambient_crowd']) {
        s.audioBuffers['ambient_crowd'] = createProceduralCrowdBuffer(ctx, 4.0);
      }
    } catch {
      // ignore
    }

    // Background load the remaining clips without blocking gameplay
    const allClips = Object.keys(COMMENTARY_REGISTRY);
    const remainingClips = allClips.filter(key => !priorityClips.includes(key));
    const chunkSize = 4;
    for (let i = 0; i < remainingClips.length; i += chunkSize) {
      const chunk = remainingClips.slice(i, i + chunkSize);
      try {
        await Promise.allSettled(chunk.map(key => loadSingleClipBuffer(key)));
      } catch {
        // ignore
      }
    }
  };

  // =========================================================================
  // CENTRAL AUDIO MANAGER (نظام إدارة وتشغيل الصوت المركزي)
  // Strict Single-Audio Guarantee, Zero-Overlap, Native Safari / iPhone Compliance
  // =========================================================================

  // 1. Dedicated Intro Audio Player (Runs natively & synchronously on user click)
  const stopIntro = () => {
    if (introAudioRef.current) {
      try {
        introAudioRef.current.pause();
        introAudioRef.current.currentTime = 0;
      } catch {}
      introAudioRef.current = null;
    }
    introPlayingRef.current = false;
    gameStateRef.current.introInProgress = false;
  };

  const playIntro = (
    audioPath: string,
    onEnded: () => void,
    onError: (err: any) => void
  ): boolean => {
    const s = gameStateRef.current;
    if (s.muted) {
      onEnded();
      return true;
    }

    // Stop all prior sounds (commentary, timers, ambient) so intro is crystal clear
    stopCommentary();
    stopAmb();
    stopIntro();

    introPlayingRef.current = true;
    s.introInProgress = true;
    gameStartStateRef.current = 'introPlaying';
    setGameStartState('introPlaying');

    try {
      const audio = new Audio(audioPath);
      introAudioRef.current = audio;
      audio.preload = 'auto';
      audio.volume = s.muted ? 0 : 1;

      let hasEnded = false;
      const handleEnded = () => {
        if (hasEnded) return;
        hasEnded = true;
        introPlayingRef.current = false;
        s.introInProgress = false;
        introAudioRef.current = null;
        onEnded();
      };

      const handleError = (e: any) => {
        if (hasEnded) return;
        hasEnded = true;
        introPlayingRef.current = false;
        s.introInProgress = false;
        introAudioRef.current = null;
        onError(e);
      };

      audio.addEventListener('ended', handleEnded, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      // Directly invoke play() within the synchronous user interaction stack for iOS Safari
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[Central Audio Manager] Intro play promise rejected:', err);
          handleError(err);
        });
      }
      return true;
    } catch (err) {
      console.error('[Central Audio Manager] Failed to instantiate intro Audio:', err);
      introPlayingRef.current = false;
      s.introInProgress = false;
      introAudioRef.current = null;
      onError(err);
      return false;
    }
  };

  // 2. Commentary Audio Stopper & Timer Clearer (Stops ONLY commentary, leaves stadium crowd intact)
  const stopCommentary = () => {
    const s = gameStateRef.current;
    if (s.currentCommentarySource) {
      try {
        s.currentCommentarySource.onended = null;
        s.currentCommentarySource.stop();
        s.currentCommentarySource.disconnect();
      } catch {}
      s.currentCommentarySource = null;
    }
    if (commentaryAudioElementRef.current) {
      try {
        commentaryAudioElementRef.current.onended = null;
        commentaryAudioElementRef.current.onerror = null;
        commentaryAudioElementRef.current.pause();
        commentaryAudioElementRef.current.currentTime = 0;
      } catch {}
    }
    s.currentFallbackAudio = null;
    clearWaitingAndCoachTimers();
    audioStateRef.current.isPlaying = false;
    audioStateRef.current.activeClip = null;
    audioStateRef.current.activeCategory = null;
    audioStateRef.current.pendingOnEnded = null;
    audioStateRef.current.currentAudioPromise = null;
  };

  // 3. Stop All Sound System (Used only on mute or reset to menu)
  const stopAll = () => {
    stopIntro();
    stopCommentary();
    stopAmb();
    clearWaitingAndCoachTimers();
  };

  // Aliases for seamless integration across existing code
  const stopCurrentAudio = stopCommentary;

  // Clear any scheduled waiting commentary timers
  const clearWaitingAndCoachTimers = () => {
    const a = audioStateRef.current;
    if (a.waitingTimer) {
      window.clearTimeout(a.waitingTimer);
      a.waitingTimer = null;
    }
  };

  // 4. Central Commentary Player with Strict Priority and Zero-Overlap Guarantee
  const playCommentary = async (
    clipKey: string,
    onClipEnded?: () => void,
    eventId?: string,
    priority: 'normal' | 'waiting' | 'answer' = 'normal'
  ): Promise<void> => {
    const s = gameStateRef.current;
    if (s.muted) {
      if (onClipEnded) onClipEnded();
      return;
    }

    // RULE 1: Never play commentary while Intro audio is playing!
    if (introPlayingRef.current || gameStartStateRef.current === 'introPlaying') {
      console.log('[Central Audio Manager] Commentary suppressed while intro is active:', clipKey);
      if (onClipEnded) onClipEnded();
      return;
    }

    // RULE 2: Unique Event Tracking - Prevent executing the same event twice
    if (eventId) {
      if (audioStateRef.current.executedEvents.has(eventId)) {
        console.log('[Central Audio Manager] Duplicate event prevented:', eventId);
        if (onClipEnded) onClipEnded();
        return;
      }
      audioStateRef.current.executedEvents.add(eventId);
    }

    const clip = COMMENTARY_REGISTRY[clipKey];
    if (!clip) {
      console.warn('[Central Audio Manager] Clip not found in registry:', clipKey);
      if (onClipEnded) onClipEnded();
      return;
    }

    // RULE 3: Debounce identical clip requests within 350ms
    const now = performance.now();
    if (audioStateRef.current.activeClip === clipKey && (now - audioStateRef.current.lastRequestTime < 350)) {
      if (onClipEnded) onClipEnded();
      return;
    }
    audioStateRef.current.lastRequestTime = now;

    // RULE 4: Strict Event Priority (Student Answer > Waiting Commentary)
    if (audioStateRef.current.isPlaying) {
      if (priority === 'waiting') {
        // Requirement 2: If audio manager is busy, skip waiting commentary
        console.log('[Central Audio Manager] Audio manager busy; waiting commentary skipped:', clipKey);
        if (onClipEnded) onClipEnded();
        return;
      }

      // Requirement 1 & 3: If a waiting commentary is playing, stop it immediately!
      // Do NOT wait for its ended event; student answer has strict higher priority.
      if (audioStateRef.current.activeCategory === 'waiting' || audioStateRef.current.activeClip?.includes('prep')) {
        console.log('[Central Audio Manager] Student answered: stopping waiting commentary immediately:', clipKey);
        stopCommentary();
      } else {
        // For other sequential commentary (e.g. outcome after shot), await current finish
        if (audioStateRef.current.currentAudioPromise) {
          try {
            await audioStateRef.current.currentAudioPromise;
          } catch {}
        }
      }
    }

    if (s.muted) {
      if (onClipEnded) onClipEnded();
      return;
    }

    audioStateRef.current.isPlaying = true;
    audioStateRef.current.activeClip = clipKey;
    audioStateRef.current.activeCategory = priority;
    audioStateRef.current.pendingOnEnded = onClipEnded || null;

    const ctx = getAudioContext();
    const master = masterGainRef.current;

    // Fetch / decode buffer on demand if not cached
    let buffer: AudioBuffer | null = s.audioBuffers[clipKey] || null;
    if (!buffer && ctx && ctx.state !== 'closed') {
      buffer = await loadSingleClipBuffer(clipKey);
    }

    const playPromise = new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          audioStateRef.current.isPlaying = false;
          audioStateRef.current.activeClip = null;
          audioStateRef.current.activeCategory = null;
          audioStateRef.current.currentAudioPromise = null;
          const callback = audioStateRef.current.pendingOnEnded;
          audioStateRef.current.pendingOnEnded = null;
          if (callback) {
            try { callback(); } catch {}
          }
          resolve();
        }
      };

      // Primary: Web Audio API playback (zero latency when buffer is decoded)
      if (ctx && master && buffer && ctx.state === 'running') {
        try {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          const gainNode = ctx.createGain();
          gainNode.gain.value = 1.0;
          source.connect(gainNode);
          gainNode.connect(master);
          source.onended = () => {
            if (s.currentCommentarySource === source) {
              s.currentCommentarySource = null;
            }
            done();
          };
          source.start(0);
          s.currentCommentarySource = source;
          return;
        } catch (err) {
          console.warn('[Central Audio Manager] WebAudio buffer source failed:', clipKey, err);
        }
      }

      // Secondary fallback: Reusable single HTMLAudioElement (clean, zero memory leaks, iOS safe)
      try {
        const audio = getCommentaryAudioElement();
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
        audio.onerror = null;
        audio.src = clip.path;
        audio.volume = s.muted ? 0 : 1;

        audio.onended = () => {
          s.currentFallbackAudio = null;
          done();
        };
        audio.onerror = (e) => {
          console.warn('[Central Audio Manager] HTMLAudioElement error:', clipKey, e);
          s.currentFallbackAudio = null;
          done();
        };

        s.currentFallbackAudio = audio;
        const p = audio.play();
        if (p !== undefined) {
          p.catch((err) => {
            console.warn('[Central Audio Manager] HTMLAudioElement play rejected:', clipKey, err);
            done();
          });
        }
      } catch (err) {
        console.warn('[Central Audio Manager] HTMLAudioElement exception:', clipKey, err);
        done();
      }
    });

    audioStateRef.current.currentAudioPromise = playPromise;
    return playPromise;
  };

  // Backward compatibility alias
  const playClip = playCommentary;

  // 5. Automatic waiting audio: 5-second countdown on question display
  // If student answers within 5s: cancelled immediately.
  // If 5s elapse without answer: plays 1 authentic waiting clip from user MP3s with zero overlap.
  const startWaitingAudioSequence = () => {
    clearWaitingAndCoachTimers();

    const s = gameStateRef.current;
    if (!s.started || s.ended || s.introInProgress || introPlayingRef.current) {
      return;
    }

    const currentStage = s.stage;
    const currentRound = s.round;
    const questionKey = `stage-${currentStage}-round-${currentRound}`;
    const waitingEventId = `${questionKey}-waiting`;

    // Only 1 waiting commentary per question
    if (audioStateRef.current.executedEvents.has(waitingEventId)) {
      return;
    }

    audioStateRef.current.roundAnswered = false;

    audioStateRef.current.waitingTimer = window.setTimeout(async () => {
      audioStateRef.current.waitingTimer = null;

      const curS = gameStateRef.current;
      // Verification guards (Requirements 1, 2, 4):
      if (audioStateRef.current.roundAnswered || curS.evaluated || curS.answeredThisRound) {
        return;
      }
      if (curS.stage !== currentStage || curS.round !== currentRound) {
        return;
      }
      if (!curS.started || curS.ended || curS.introInProgress || introPlayingRef.current) {
        return;
      }
      if (audioStateRef.current.executedEvents.has(waitingEventId)) {
        return;
      }
      if (audioStateRef.current.isPlaying) {
        console.log('[Central Audio Manager] Waiting audio skipped because manager is busy');
        return;
      }

      // Authentic pool of reflection and focus clips from user's original MP3s
      const waitingPool = ['mp3_prep_all_focus', 'mp3_prep_look_ball', 'mp3_prep_calm_focus'];
      const chosenClip = selectCommentary('prep', waitingPool).id;

      try {
        await playCommentary(chosenClip, undefined, waitingEventId, 'waiting');
      } catch (err) {
        console.warn('[Central Audio Manager] Waiting commentary error:', err);
      }
    }, 5000);
  };

  // 6. Audio-only commentary playback with event deduplication
  const say = (_text: string, clipKey?: string | null, _personaTitle?: string, _icon?: string, eventId?: string) => {
    if (gameStateRef.current.muted || !clipKey) return;
    if (introPlayingRef.current || gameStartStateRef.current === 'introPlaying') {
      return;
    }
    playCommentary(clipKey, undefined, eventId).catch(() => {});
  };

  // Canvas Drawing & Physics Setup
  const G = { l: 190, r: 450, t: 118, b: 236 };
  const BX = 320, BY = 368;

  const PATHS = [
    [[302, 402, 0.95], [330, 300, 0.8], [478, 240, 0.68], [470, 212, 0.62], [320, 212, 0.62], [140, 212, 0.62], [-60, 215, 0.62]],
    [[302, 402, 0.95], [480, 394, 0.95], [720, 386, 0.95]],
    [[302, 402, 0.95], [150, 396, 0.95], [-80, 388, 0.95]]
  ].map(pts => {
    const L = [0];
    for (let i = 1; i < pts.length; i++) {
      L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    return { pts, L, tot: L[L.length - 1] };
  });

  const pathAt = (d: number, rt = 0) => {
    const P = PATHS[rt];
    const pts = P.pts;
    const n = pts.length - 1;
    if (d <= 0) return { x: 302 + (rt === 2 ? -d : d), y: 402, sc: 0.95, bh: false, sd: 0 };
    if (d >= P.tot) {
      const a = pts[n - 1], b = pts[n];
      const sg = Math.sign(b[0] - a[0]) || 1;
      return { x: b[0] + sg * (d - P.tot), y: b[1], sc: b[2], bh: rt === 0, sd: rt === 1 ? 1 : -1, end: 1 };
    }
    let k = 0;
    while (k < n - 1 && P.L[k + 1] < d) k++;
    const a = pts[k], b = pts[k + 1];
    const f = (d - P.L[k]) / (P.L[k + 1] - P.L[k]);
    let x = a[0] + (b[0] - a[0]) * f;
    let y = a[1] + (b[1] - a[1]) * f;
    if (rt === 0) x += Math.sin(d / 22) * (k < 3 ? 6 : 2);
    else y += Math.sin(d / 26) * 6;
    return { x, y, sc: a[2] + (b[2] - a[2]) * f, bh: rt === 0 && k >= 3, sd: rt === 0 ? (k >= 3 ? -1 : 0) : (rt === 1 ? 1 : -1) };
  };

  const PAL_OPPONENT = { shirt: '#dc2626', shorts: '#18181b', sock: '#dc2626', boot: '#111', skin: '#e8b890', hair: '#2a1c14' };
  const PAL_C = { shirt: '#1e4d8c', shorts: '#222', sock: '#222', boot: '#111', skin: '#e8b890', hair: '#222', long: true };

  const getPalP = (stage: number) => {
    const theme = CHAMPIONSHIP_ROUNDS[Math.min(stage, 4)] || CHAMPIONSHIP_ROUNDS[0];
    return {
      shirt: theme.shirt,
      shorts: theme.shorts,
      sock: theme.sock,
      boot: stage === 0 ? '#1e40af' : '#c33',
      skin: theme.playerSkin,
      hair: theme.playerHair,
      stripes: theme.stripes
    };
  };
  const PAL_P = getPalP(0);



  const resetRound = () => {
    stopCommentary();
    audioStateRef.current.executedEvents.clear();
    const s = gameStateRef.current;
    s.ball = { x: BX, y: BY, s: 1, gy: BY, rot: 0, rotX: 0, rotY: 0, bulge: 0 };
    s.keep = { x: 320, y: 198, tilt: 0, kk: 0 };
    s.seq = null;
    s.missCans = [];
    if (s.tvBroadcast) s.tvBroadcast.active = false;

    // Requirement 2: توليد مظهر ورقم ديناميكي لكل ركلة جديدة
    // - لا يتكرر الرقم في ركلتين متتاليتين
    // - في الجولة 1: يظهر اللاعب رقم 7 في ركلة واحدة فقط (الركلة الثالثة للطالب s.round === 4) مع احتفالية Siuuu
    // - باقي ركلات الجولة 1 وجميع الجولات الأخرى لا تستخدم الرقم 7 مطلقاً
    // - مهاجم المنافس أيضاً يتغير مظهره ورقمه ولا يرتدي الرقم 7 أبداً
    const isStriker = s.round % 2 === 0;
    if (isStriker) {
      if (s.stage === 0 && s.round === 4) {
        s.currentStriker = {
          number: 7,
          skin: '#e8b890',
          hairColor: '#18181b',
          hairStyle: 'fade'
        };
        s.lastStudentStrikerNumber = 7;
      } else {
        const pool = NUMBER_POOL.filter(n => n !== s.lastStudentStrikerNumber && n !== 7);
        const num = pool[Math.floor(Math.random() * pool.length)];
        s.lastStudentStrikerNumber = num;
        const skinCand = SKIN_POOL.filter(sk => sk !== s.lastStudentSkin);
        const skin = skinCand[Math.floor(Math.random() * skinCand.length)];
        s.lastStudentSkin = skin;
        const hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
        const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
        s.currentStriker = { number: num, skin, hairColor, hairStyle };
      }
    } else {
      const pool = NUMBER_POOL.filter(n => n !== s.lastOpponentStrikerNumber && n !== 7);
      const num = pool[Math.floor(Math.random() * pool.length)];
      s.lastOpponentStrikerNumber = num;
      const skin = SKIN_POOL[Math.floor(Math.random() * SKIN_POOL.length)];
      const hairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
      const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
      s.currentStriker = { number: num, skin, hairColor, hairStyle };
    }
  };

  const drawDots = () => {
    const s = gameStateRef.current;
    const dArr: (number | undefined)[] = [];
    for (let i = 0; i < 10; i++) {
      dArr.push(s.res[i]);
    }
    setDots(dArr);
    setEduScoreDisplay(s.eduScore);
    setStudentGoalsDisplay(s.studentGoals);
    setOpponentGoalsDisplay(s.opponentGoals);
    setStudentSavesDisplay(s.studentSaves);
    setRoundDisplay(Math.min(s.round + 1, 10));
    setStageDisplay(s.stage + 1);
    setIsStrikerDisplay(s.round % 2 === 0);
  };

  const ln = (ctx: CanvasRenderingContext2D, a: number, b: number, c: number, d: number, w: number, col: string) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
  };

  const drawSide = (ctx: CanvasRenderingContext2D, px: number, py: number, H: number, dir: number, ph: number, pal: any, mode: number) => {
    const u = H / 105;
    const hx = px;
    const hy = py - 48 * u;
    const sx = hx + dir * 6 * u;
    const sy = py - 84 * u;

    const leg = (i: number) => {
      const q = ph + i * Math.PI;
      const a = Math.sin(q) * 0.95;
      const fx = 0.3 + 0.9 * Math.max(0, Math.cos(q));
      const kx = hx + Math.sin(a) * 22 * u * dir;
      const ky = hy + Math.cos(a) * 22 * u;
      const sa = a - fx;
      const ax = kx + Math.sin(sa) * 24 * u * dir;
      const ay = ky + Math.cos(sa) * 24 * u;
      if (pal.long) {
        ln(ctx, hx, hy, kx, ky, 11 * u, pal.shorts);
        ln(ctx, kx, ky, ax, ay, 10 * u, pal.shorts);
      } else {
        ln(ctx, hx, hy, kx, ky, 9 * u, pal.skin);
        ln(ctx, hx, hy, hx + (kx - hx) * 0.6, hy + (ky - hy) * 0.6, 12 * u, pal.shorts);
        ln(ctx, kx, ky, ax, ay, 8 * u, pal.sock);
      }
      ctx.fillStyle = pal.boot;
      ctx.beginPath();
      ctx.ellipse(ax + dir * 4 * u, ay + 2 * u, 7 * u, 3.5 * u, 0, 0, 7);
      ctx.fill();
    };

    const arm = (i: number) => {
      // Anatomically realistic arm swing and forward elbow flexion
      let aa = -Math.sin(ph + i * Math.PI) * 0.92;
      if (mode === 1) aa = 2.75 + Math.sin(performance.now() / 65 + i * 2) * 0.35;
      else if (mode === 2 && i === 1) aa = 2.3 + Math.sin(performance.now() / 55) * 0.15;
      // Forearm flexes naturally in motion direction
      const fa = mode === 1 ? aa + 0.18 : aa + 0.65;
      const ex = sx + Math.sin(aa) * 14 * u * dir;
      const ey = sy + Math.cos(aa) * 14 * u;
      const hx2 = ex + Math.sin(fa) * 13 * u * dir;
      const hy2 = ey + Math.cos(fa) * 13 * u;
      ln(ctx, sx, sy, ex, ey, 7 * u, pal.shirt);
      ln(ctx, ex, ey, hx2, hy2, 6 * u, pal.skin);
      ctx.fillStyle = pal.skin;
      ctx.beginPath();
      ctx.arc(hx2, hy2, 3.5 * u, 0, 7);
      ctx.fill();
    };

    leg(0);
    arm(0);
    ln(ctx, hx, hy, sx, py - 86 * u, 17 * u, pal.shirt);
    ctx.fillStyle = pal.hair;
    ctx.beginPath();
    ctx.arc(hx + dir * 8 * u, py - 99 * u, 8.5 * u, 0, 7);
    ctx.fill();
    ctx.fillStyle = pal.skin;
    ctx.beginPath();
    ctx.arc(hx + dir * 11 * u, py - 97 * u, 6.5 * u, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + dir * 17 * u, py - 96 * u, 2 * u, 1.6 * u, 0, 0, 7);
    ctx.fill();
    leg(1);
    arm(1);
  };

  // Grand Team Victory Scene & Opponent Walk-Off
  const drawVictoryScene = (ctx: CanvasRenderingContext2D, T: number) => {
    const s = gameStateRef.current;
    if (!s.win) return;
    const vT = (T - s.win.t0) / 1000;
    if (vT < 0 || vT > 6.5) return;

    // 1. Slow, disappointed walk-off of opponent players towards far right exit
    const oppWalkers = [
      { startX: 320, startY: 202, targetX: 680, targetY: 216, delay: 0.2, sp: 32, isKeeper: true },
      { startX: 370, startY: 310, targetX: 680, targetY: 322, delay: 0.6, sp: 34, isKeeper: false },
      { startX: 310, startY: 375, targetX: 680, targetY: 388, delay: 1.0, sp: 30, isKeeper: false }
    ];

    oppWalkers.forEach(opp => {
      if (vT < opp.delay) {
        const H = 14 + (Math.max(0, opp.startY - 30) / 380) * 95;
        const pal = opp.isKeeper
          ? { shirt: '#25a8b8', shorts: '#1c2a3a', sock: '#25a8b8', boot: '#111', skin: '#e8b890', hair: '#2a1c14' }
          : PAL_OPPONENT;
        drawSide(ctx, opp.startX, opp.startY, H, 1, 0, pal, 0);
        return;
      }
      const walkDuration = vT - opp.delay;
      const curX = Math.min(opp.targetX, opp.startX + walkDuration * opp.sp);
      const frac = (curX - opp.startX) / (opp.targetX - opp.startX);
      const curY = opp.startY + (opp.targetY - opp.startY) * frac;
      if (curX >= 680) return;

      const H = 14 + (Math.max(0, curY - 30) / 380) * 95;
      const ph = walkDuration * 4.2;
      const pal = opp.isKeeper
        ? { shirt: '#25a8b8', shorts: '#1c2a3a', sock: '#25a8b8', boot: '#111', skin: '#e8b890', hair: '#2a1c14' }
        : PAL_OPPONENT;

      ctx.save();
      ctx.translate(curX, curY);
      ctx.rotate(0.08); // Slump forward in sadness
      ctx.translate(-curX, -curY);
      drawSide(ctx, curX, curY, H, 1, ph, pal, 0);
      ctx.restore();
    });

    // 2. Teammates gathering in natural victory celebration at screen center (CX = 320, CY = 368)
    const teammates = [
      { startX: 258, startY: 418, targetX: 285, targetY: 374 },
      { startX: 220, startY: 395, targetX: 305, targetY: 384 },
      { startX: 160, startY: 360, targetX: 335, targetY: 384 },
      { startX: 180, startY: 420, targetX: 355, targetY: 374 },
      { startX: 290, startY: 340, targetX: 295, targetY: 356 },
      { startX: 350, startY: 340, targetX: 345, targetY: 356 }
    ];

    const pGather = Math.min(1, Math.max(0, vT / 1.0));

    teammates.forEach((tm, i) => {
      const curX = tm.startX + (tm.targetX - tm.startX) * Math.sin(pGather * Math.PI / 2);
      const curY = tm.startY + (tm.targetY - tm.startY) * Math.sin(pGather * Math.PI / 2);
      const H = 14 + (Math.max(0, curY - 30) / 380) * 95;
      const dir = curX < 320 ? 1 : -1;

      if (vT < 1.0) {
        // Running towards center to celebrate together
        const ph = vT * 12;
        drawSide(ctx, curX, curY, H, dir, ph, PAL_P, 1);
      } else {
        // Natural team joy on the grass: jumping, waving arms, and clapping
        const hop = Math.abs(Math.sin(T / 100 + i * 1.3)) * 6.5;
        drawSide(ctx, curX, curY - hop, H, dir, T / 70 + i, PAL_P, 1);
      }
    });

    // 3. Confetti fluttering over the center celebration area
    const confettiColors = ['#2ecc71', '#f1c40f', '#3498db', '#ffffff', '#e67e22', '#1abc9c'];
    ctx.save();
    for (let c = 0; c < 36; c++) {
      const seed = c * 137.5;
      const cSpeed = 40 + (c % 7) * 12;
      const confX = 200 + ((seed * 11 + vT * 25) % 240);
      const confY = 160 + ((seed * 7 + vT * cSpeed) % 240);
      const cRot = (seed + vT * 5) % (Math.PI * 2);
      ctx.save();
      ctx.translate(confX, confY);
      ctx.rotate(cRot);
      ctx.fillStyle = confettiColors[c % confettiColors.length];
      ctx.fillRect(-3, -2, 6, 4);
      ctx.restore();
    }
    ctx.restore();

    // 4. Floating Victory Title Badge at screen center (Pure team victory, no coach)
    ctx.save();
    const vTitle = '🏆 أبطال المباراة! فوز مستحق وتأهل رائع!';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const vW = ctx.measureText(vTitle).width + 20;
    const badgeY = 220 - Math.min(vT * 12, 16);
    ctx.fillStyle = 'rgba(12, 34, 18, 0.9)';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(320 - vW / 2, badgeY, vW, 24, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(vTitle, 320, badgeY + 16);
    ctx.restore();
  };

  // Audio-only commentary: no text speech bubbles rendered on screen
  const drawSay = (_ctx: CanvasRenderingContext2D, _T: number) => {};

  const drawFig = (ctx: CanvasRenderingContext2D, px: number, py: number, H: number, col: string, sk: string, ph: number, up: boolean, sh?: string) => {
    const u = H / 105;
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const fx = sg * 5 * u + Math.sin(ph + i * Math.PI) * 9 * u * (up ? 0 : 1);
      const fy = -Math.max(0, Math.cos(ph + i * Math.PI)) * 8 * u * (up ? 0 : 1);
      ln(ctx, px + sg * 4 * u, py - 40 * u, px + fx, py + fy, Math.max(2, 7 * u), sh || '#222');
    }
    ctx.fillStyle = col;
    ctx.fillRect(px - 11 * u, py - 86 * u, 22 * u, 46 * u);
    if (up) {
      const w = Math.sin(ph * 2) * 4 * u;
      ln(ctx, px - 11 * u, py - 82 * u, px - 15 * u, py - 116 * u + w, Math.max(2, 6 * u), sk);
      ln(ctx, px + 11 * u, py - 82 * u, px + 15 * u, py - 116 * u - w, Math.max(2, 6 * u), sk);
    } else {
      ln(ctx, px - 11 * u, py - 82 * u, px - 15 * u, py - 100 * u + Math.sin(ph) * 4 * u, Math.max(2, 6 * u), sk);
      ln(ctx, px + 11 * u, py - 82 * u, px + 15 * u, py - 100 * u - Math.sin(ph) * 4 * u, Math.max(2, 6 * u), sk);
    }
    ctx.fillStyle = sk;
    ctx.beginPath();
    ctx.arc(px, py - 96 * u, 9 * u, 0, 7);
    ctx.fill();
  };

  // Audience stays in stands (no running onto pitch or projectile throwing)
  const updateChasers = (_dt: number, _T: number) => {};
  const drawChasers = (_ctx: CanvasRenderingContext2D, _back: number, _T: number) => {};
  const throwAt = (_sx: number, _sy: number, _tx: number, _ty: number, _T: number) => {};
  const plPos = (_ch: number, _rt: number) => ({ x: 0, y: 0 });
  const updatePrj = (_dt: number, _T: number) => {};
  const drawPrj = (_ctx: CanvasRenderingContext2D) => {};

  // Requirement 7: حركة علب الماء والعصير عند ضياع الكرة (تسقط في مسار آمن وترتد بهدوء دون لمس اللاعب)
  const spawnMissCans = () => {
    const s = gameStateRef.current;
    s.missCans = [
      {
        x: 212 + Math.random() * 14,
        y: 285,
        vx: -(0.6 + Math.random() * 0.6),
        vy: -1.6,
        rot: Math.random() * Math.PI,
        vrot: 0.08,
        type: 'water',
        alpha: 1
      },
      {
        x: 300 + Math.random() * 16,
        y: 295,
        vx: 0.6 + Math.random() * 0.6,
        vy: -1.4,
        rot: Math.random() * Math.PI,
        vrot: -0.07,
        type: 'juice',
        alpha: 1
      }
    ];
  };

  const drawMissCans = (ctx: CanvasRenderingContext2D) => {
    const s = gameStateRef.current;
    if (!s.missCans || s.missCans.length === 0) return;
    s.missCans.forEach(can => {
      ctx.save();
      ctx.translate(can.x, can.y);
      ctx.rotate(can.rot);
      if (can.type === 'water') {
        // Cartoon Water Bottle
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.roundRect(-4.5, -10, 9, 20, 2);
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -3, 8, 7);
        // Cap
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-2.5, -13, 5, 3);
      } else {
        // Cartoon Juice Can
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.roundRect(-4.5, -9, 9, 18, 3);
        ctx.fill();
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Logo
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Top tab
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-2, -11, 4, 2);
      }
      ctx.restore();
    });
  };

  const startWin = (T: number) => {
    const s = gameStateRef.current;
    s.win = { t0: T, k: -1 };
    if (s.seq) s.seq.cty = 'both';
    sfGoal();
    // Requirement 6: الجمهور يبقى داخل المدرجات طوال المباراة والاحتفالات دون النزول للملعب
  };

  // Precomputed 3D soccer ball geometry (Truncated icosahedron 12 pentagons with outer seams)
  const SOCCER_PENTAGONS_3D = (() => {
    const PHI = (1 + Math.sqrt(5)) / 2;
    const L = Math.sqrt(1 + PHI * PHI);
    const a = 1 / L;
    const b = PHI / L;

    const centers = [
      [ a,  b,  0], [-a,  b,  0], [ a, -b,  0], [-a, -b,  0],
      [ 0,  a,  b], [ 0, -a,  b], [ 0,  a, -b], [ 0, -a, -b],
      [ b,  0,  a], [-b,  0,  a], [ b,  0, -a], [-b,  0, -a],
    ];

    return centers.map((c) => {
      const ref = Math.abs(c[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
      let ux = ref[1] * c[2] - ref[2] * c[1];
      let uy = ref[2] * c[0] - ref[0] * c[2];
      let uz = ref[0] * c[1] - ref[1] * c[0];
      const ulen = Math.hypot(ux, uy, uz);
      ux /= ulen; uy /= ulen; uz /= ulen;

      const vx = c[1] * uz - c[2] * uy;
      const vy = c[2] * ux - c[0] * uz;
      const vz = c[0] * uy - c[1] * ux;

      const rPatch = 0.36;
      const sinR = Math.sin(rPatch);
      const cosR = Math.cos(rPatch);

      const rSeam = 0.52;
      const sinS = Math.sin(rSeam);
      const cosS = Math.cos(rSeam);

      const verts: [number, number, number][] = [];
      const seams: [number, number, number][] = [];
      for (let k = 0; k < 5; k++) {
        const angle = (k * 2 * Math.PI) / 5;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const vxk = c[0] * cosR + (ux * cosA + vx * sinA) * sinR;
        const vyk = c[1] * cosR + (uy * cosA + vy * sinA) * sinR;
        const vzk = c[2] * cosR + (uz * cosA + vz * sinA) * sinR;
        verts.push([vxk, vyk, vzk]);

        const sxk = c[0] * cosS + (ux * cosA + vx * sinA) * sinS;
        const syk = c[1] * cosS + (uy * cosA + vy * sinA) * sinS;
        const szk = c[2] * cosS + (uz * cosA + vz * sinA) * sinS;
        seams.push([sxk, syk, szk]);
      }
      return {
        center: c as [number, number, number],
        verts,
        seams,
      };
    });
  })();

  const drawBall = (ctx: CanvasRenderingContext2D) => {
    const b = gameStateRef.current.ball;
    const R = 10 * b.s;

    // 1. Dynamic ground shadow based on ball height above ground surface (b.gy - b.y)
    // When ball is on the grass (height = 0), shadow is crisp and right underneath.
    // As ball elevates high towards goal, shadow expands, diffuses, and softens with stadium ambient light.
    const height = Math.max(0, b.gy - b.y);
    const heightNorm = Math.min(height / 85, 2.0);

    const shadowSpread = 1 + heightNorm * 0.52;
    const shadowRx = Math.max(2, R * 1.15 * shadowSpread);
    const shadowRy = Math.max(1, R * 0.35 * (1 + heightNorm * 0.22));

    // Slight directional projection from upper-left floodlights
    const shadowX = b.x + (height * 0.08);
    const shadowY = b.gy + R * 0.82;

    // Softening alpha: concentrated under resting ball, faint ambient dispersion in the air
    const baseAlpha = 0.36;
    const shadowAlpha = Math.max(0.06, baseAlpha / (1 + heightNorm * 1.55));

    ctx.save();
    ctx.translate(shadowX, shadowY);
    ctx.scale(1, shadowRy / shadowRx);
    const sGrad = ctx.createRadialGradient(0, 0, shadowRx * 0.12, 0, 0, shadowRx);
    sGrad.addColorStop(0, `rgba(8, 20, 10, ${shadowAlpha})`);
    sGrad.addColorStop(0.55, `rgba(12, 26, 14, ${shadowAlpha * 0.55})`);
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.arc(0, 0, shadowRx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Net bulge radial glow if ball stretches the net
    if (b.bulge > 0) {
      const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 26);
      g.addColorStop(0, `rgba(255,255,255,${0.35 * b.bulge})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 26, 0, 7);
      ctx.fill();
    }

    // 3. 3D Spherical Soccer Ball Rendering with Multi-Axis Rotation (Pitch, Yaw, Roll)
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.s, b.s);

    // Ball contour clipping mask
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.clip();

    // Base leather white
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(-10, -10, 20, 20);

    // 3D rotation angles: rotX (Pitch / forward roll), rotY (Yaw / curl spin), rot (Roll / tilt)
    const rx = b.rotX || 0;
    const ry = b.rotY || 0;
    const rz = b.rot || 0;

    const cx = Math.cos(rx), sx = Math.sin(rx);
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cz = Math.cos(rz), sz = Math.sin(rz);

    // Composite rotation matrix R = Rz * Ry * Rx
    const m00 = cz * cy;
    const m01 = cz * sy * sx - sz * cx;
    const m02 = cz * sy * cx + sz * sx;

    const m10 = sz * cy;
    const m11 = sz * sy * sx + cz * cx;
    const m12 = sz * sy * cx - cz * sx;

    const m20 = -sy;
    const m21 = cy * sx;
    const m22 = cy * cx;

    // Draw visible 3D pentagons and seam lines
    ctx.fillStyle = '#1c1c1c';
    ctx.strokeStyle = 'rgba(25, 25, 25, 0.42)';
    ctx.lineWidth = 0.65;

    for (let pIdx = 0; pIdx < SOCCER_PENTAGONS_3D.length; pIdx++) {
      const pent = SOCCER_PENTAGONS_3D[pIdx];
      const c = pent.center;
      // Rotated center normal in Z (depth facing camera)
      const czRot = m20 * c[0] + m21 * c[1] + m22 * c[2];
      if (czRot < -0.22) continue; // Culled on back hemisphere

      // Render 5-pointed leather pentagon patch on sphere
      ctx.beginPath();
      for (let vIdx = 0; vIdx < 5; vIdx++) {
        const v = pent.verts[vIdx];
        const vx = m00 * v[0] + m01 * v[1] + m02 * v[2];
        const vy = m10 * v[0] + m11 * v[1] + m12 * v[2];
        if (vIdx === 0) ctx.moveTo(vx * 10, vy * 10);
        else ctx.lineTo(vx * 10, vy * 10);
      }
      ctx.closePath();
      ctx.fill();

      // Render subtle stitched seam lines extending from vertices
      for (let vIdx = 0; vIdx < 5; vIdx++) {
        const s = pent.seams[vIdx];
        const sxRot = m00 * s[0] + m01 * s[1] + m02 * s[2];
        const syRot = m10 * s[0] + m11 * s[1] + m12 * s[2];
        const szRot = m20 * s[0] + m21 * s[1] + m22 * s[2];
        if (szRot > -0.15) {
          const v = pent.verts[vIdx];
          const vx = m00 * v[0] + m01 * v[1] + m02 * v[2];
          const vy = m10 * v[0] + m11 * v[1] + m12 * v[2];
          ctx.beginPath();
          ctx.moveTo(vx * 10, vy * 10);
          ctx.lineTo(sxRot * 10, syRot * 10);
          ctx.stroke();
        }
      }
    }

    // 4. Realistic 3D Spherical Shading & Specular Highlight
    const sphereGrad = ctx.createRadialGradient(-3.2, -3.8, 0.8, -0.5, -0.5, 11);
    sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    sphereGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.15)');
    sphereGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)');
    sphereGrad.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = sphereGrad;
    ctx.fillRect(-10, -10, 20, 20);

    ctx.restore();

    // 5. Crisp ball edge rim
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawCrowd = (ctx: CanvasRenderingContext2D, T: number) => {
    const s = gameStateRef.current;
    let mood = 0;
    if (s.seq && s.seq.celT) {
      const c = (T - s.seq.celT) / 1000;
      mood = isGoalMode(s.seq.mode) ? 1 : -1;
      if (c > 2.6) mood = 0;
    }
    if (s.win) mood = 1;

    s.CROWD.forEach((p: any, idx: number) => {
      if (p.st === 2 || ((p.st === 1 || p.st === 3) && T >= p.t0)) return;
      const px = p.x;
      // Natural 2D swaying and cheering motions
      const sway = Math.sin(T / 240 + p.p) * 1.2;
      let bob = Math.sin(T / 320 + p.p) * 0.8;
      if (mood > 0) bob = -Math.abs(Math.sin(T / 120 + p.p)) * 5;
      else if (mood < 0) bob = 1.2;
      const y = p.y + bob;

      // Fan torso & head
      ctx.fillStyle = p.c;
      ctx.fillRect(px - 3 + sway * 0.3, y + 3, 6, 6);
      ctx.fillStyle = p.sk;
      ctx.beginPath();
      ctx.arc(px + sway * 0.3, y, 2.7, 0, Math.PI * 2);
      ctx.fill();

      // Arms waving / gesturing
      ctx.strokeStyle = p.sk;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      if (mood > 0) {
        // High celebratory hand waving
        const waveL = Math.sin(T / 110 + p.p) * 3;
        const waveR = Math.cos(T / 110 + p.p) * 3;
        ctx.moveTo(px - 3, y + 4);
        ctx.lineTo(px - 6, y - 5 + waveL);
        ctx.moveTo(px + 3, y + 4);
        ctx.lineTo(px + 6, y - 5 + waveR);
      } else if (mood < 0) {
        // Disappointment posture
        ctx.moveTo(px - 3, y + 5);
        ctx.lineTo(px - 4, y);
        ctx.moveTo(px + 3, y + 5);
        ctx.lineTo(px + 4, y);
      } else {
        // Natural gentle cheering / hand motion
        const gentle = Math.sin(T / 260 + p.p) * 2;
        ctx.moveTo(px - 3, y + 4);
        ctx.lineTo(px - 5, y - 2 + gentle);
        ctx.moveTo(px + 3, y + 4);
        ctx.lineTo(px + 5, y - 2 - gentle);
      }
      ctx.stroke();

      // Small waving green flags distributed naturally among spectators
      if (idx % 6 === 2 && y > 24 && y < 105) {
        const flagWave = Math.sin(T / 150 + p.p) * 2.5;
        // White flagpole
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 4, y + 2);
        ctx.lineTo(px + 7, y - 11);
        ctx.stroke();

        // Saudi Green fabric waving
        ctx.fillStyle = '#006c35';
        ctx.beginPath();
        ctx.moveTo(px + 7, y - 11);
        ctx.lineTo(px + 17 + flagWave, y - 11);
        ctx.lineTo(px + 15 + flagWave, y - 4);
        ctx.lineTo(px + 7, y - 5);
        ctx.closePath();
        ctx.fill();

        // Miniature white emblem dot on flag
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(px + 10 + flagWave * 0.5, y - 9, 3, 2);
      }
    });
  };

  // Distinctive stadium stands banners & Saudi Arabia Flag
  const drawStandsBanners = (ctx: CanvasRenderingContext2D, T: number) => {
    // 1. Right Banner: «الأول متوسط»
    ctx.save();
    const b1x = 458, b1y = 96, b1w = 145, b1h = 20;
    ctx.fillStyle = '#00572b';
    ctx.beginPath();
    ctx.roundRect(b1x, b1y, b1w, b1h, 4);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Inner decorative dashed border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(b1x + 2, b1y + 2, b1w - 4, b1h - 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽ لغتي تحكي · الأول متوسط', b1x + b1w / 2, b1y + b1h / 2 + 0.5);
    ctx.restore();

    // 2. Left Banner: «مدرسة الخندق»
    ctx.save();
    const b2x = 35, b2y = 96, b2w = 140, b2h = 20;
    ctx.fillStyle = '#00572b';
    ctx.beginPath();
    ctx.roundRect(b2x, b2y, b2w, b2h, 4);
    ctx.fill();
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(b2x + 2, b2y + 2, b2w - 4, b2h - 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏫 مدرسة الخندق المتوسطة', b2x + b2w / 2, b2y + b2h / 2 + 0.5);
    ctx.restore();

    // 3. Center: Accurate Flag of Saudi Arabia (علم المملكة العربية السعودية)
    ctx.save();
    const fx = 285, fy = 91, fw = 70, fh = 26;
    const ripple = Math.sin(T / 200) * 0.8;

    // Green Flag Canvas
    ctx.fillStyle = '#006c35'; // Official Saudi Flag Pantone 349 C Green
    ctx.beginPath();
    ctx.roundRect(fx, fy + ripple * 0.5, fw, fh, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gold/Silver Flagpole on the right (hoist side in Saudi protocol)
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(fx + fw, fy - 3, 2.5, fh + 7);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fx + fw + 1.2, fy - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // White Arabic Shahada silhouette in center: «لا إله إلا الله محمد رسول الله»
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('لا إله إلا الله', fx + fw / 2 - 2, fy + fh / 2 - 4.5 + ripple * 0.5);

    // White Sword pointing left underneath
    ctx.fillStyle = '#ffffff';
    const swY = fy + fh / 2 + 4.5 + ripple * 0.5;
    const swX = fx + fw / 2 - 18;
    // Blade
    ctx.fillRect(swX, swY, 32, 1.6);
    // Pointed tip pointing to the left
    ctx.beginPath();
    ctx.moveTo(swX, swY - 0.5);
    ctx.lineTo(swX - 3.5, swY + 0.8);
    ctx.lineTo(swX, swY + 2.1);
    ctx.closePath();
    ctx.fill();
    // Guard and Hilt on the right
    ctx.fillRect(swX + 28, swY - 2, 2.5, 5.5);
    ctx.fillRect(swX + 30.5, swY - 0.5, 3.5, 2.6);
    ctx.beginPath();
    ctx.arc(swX + 34.5, swY + 0.8, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const leg = (ctx: CanvasRenderingContext2D, hx: number, hy: number, ax: number, ay: number, side: number, pal?: any) => {
    const L1 = 22, L2 = 24, dx = ax - hx, dy = ay - hy;
    const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.5);
    const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const ka = Math.atan2(dy, dx) + side * a;
    const kx = hx + (ax - hx) * 0.48, ky = hy + (ay - hy) * 0.48;
    ln(ctx, hx, hy, kx, ky, 10, pal?.skin || '#e8b890');
    ln(ctx, kx, ky, ax, ay, 8, pal?.sock || '#fff');
    ctx.fillStyle = pal?.boot || '#c33';
    ctx.beginPath();
    ctx.ellipse(ax, ay + 3, 6, 4, 0, 0, 7);
    ctx.fill();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, pass: number, T: number) => {
    const s = gameStateRef.current;
    const isStriker = s.round % 2 === 0;
    const roundTheme = CHAMPIONSHIP_ROUNDS[Math.min(s.stage, 4)] || CHAMPIONSHIP_ROUNDS[0];
    const currentPal = isStriker ? getPalP(s.stage) : PAL_OPPONENT;
    const shirtCol = isStriker ? roundTheme.shirt : PAL_OPPONENT.shirt;
    const shortsCol = isStriker ? roundTheme.shorts : PAL_OPPONENT.shorts;

    const striker = s.currentStriker || {
      number: 8,
      skin: roundTheme.playerSkin,
      hairColor: roundTheme.playerHair,
      hairStyle: 'fade' as const
    };
    const skinCol = striker.skin;
    const hairCol = striker.hairColor;
    const hairStyle = striker.hairStyle;
    const numText = String(striker.number);
    const isRonaldoSiuuu = (s.stage === 0 && striker.number === 7);

    const numCol = isStriker
      ? (roundTheme.stripes ? '#111827' : (roundTheme.isSaudiFinal ? '#ffffff' : (s.stage === 0 ? '#1d4ed8' : '#ffffff')))
      : '#f59e0b';

    const r = s.seq ? s.seq.r : 0;
    const kt = s.seq ? s.seq.kt : 0;
    const run = !!s.seq && kt === 0;
    const gc = !!(s.seq && s.seq.celT && isGoalMode(s.seq.mode));
    const c = gc ? Math.max(0, (T - s.seq.celT) / 1000) : 0;
    const isMiss = !!(s.seq && s.seq.celT && !isGoalMode(s.seq.mode));
    const mc = isMiss ? Math.max(0, (T - s.seq.celT) / 1000) : 0;
    const mType = s.seq ? (s.seq.missType ?? 0) : 0;

    // Player NEVER chases the ball off the field or behind the goal on misses
    const fl = false;
    if (pass || s.win) return;

    const sm = 1 - Math.pow(1 - r, 1.6);
    const sn = run ? Math.sin(r * 3 * Math.PI) : 0;
    const idle = s.seq ? 0 : Math.sin(T / 500);

    // Goal celebration vertical displacement based on type
    let celDy = 0;
    if (gc) {
      if (isRonaldoSiuuu) {
        // Ronaldo Siuuu leap & land
        celDy = -Math.sin(Math.min(c * 2.2, 1) * Math.PI) * 22;
      } else {
        // Single unified celebration jump
        celDy = -Math.sin(Math.min(c * 2.2, 1) * Math.PI) * 20;
      }
    }

    // Miss reaction vertical displacement (drop to knees, sitting, etc.)
    let missDy = 0;
    if (isMiss) {
      if (mType === 1) {
        // Drop to knees
        missDy = Math.min(mc * 40, 20);
      } else if (mType === 5) {
        // Sitting on grass
        missDy = Math.min(mc * 45, 26);
      }
    }

    ctx.save();
    ctx.translate(
      258 + 44 * sm,
      418 - 16 * sm - (run ? Math.abs(sn) : 0) + idle * 0.5 + celDy + missDy
    );
    ctx.scale(1 - 0.05 * sm, 1 - 0.05 * sm);
    ctx.translate(-258, -418);

    let lL = 0;
    let axR = 266;
    let ayR = 405;

    if (kt > 0) {
      const b = Math.min(kt / 0.5, 1);
      const f = Math.max(0, Math.min(1, (kt - 0.5) / 0.3));
      ayR = 405 - 26 * Math.sin((b * Math.PI) / 2) * (1 - f) - 16 * f;
      axR = 266 + 12 * f - 4 * b * (1 - f);
      lL = 0;
    } else if (run) {
      lL = Math.max(0, sn) * 11;
      const lR = Math.max(0, -sn) * 11;
      ayR = 405 - lR + Math.max(0, sn) * 3;
    }

    // Goal and Miss foot positioning
    if (gc) {
      if (isRonaldoSiuuu && c > 0.45) {
        // Siuuu wide stance landing
        axR = 276;
        lL = -8;
      } else {
        ayR = 405;
        axR = 266;
        lL = 0;
      }
    } else if (isMiss) {
      if (mType === 1) {
        // Falling on knees
        ayR = 398;
        axR = 264;
      } else if (mType === 4) {
        // Foot stomp in frustration
        ayR = 405 - Math.abs(Math.sin(mc * 8)) * 6;
      }
    }

    const palWithSkin = { ...currentPal, skin: skinCol };
    leg(ctx, 252, 360, 250, 405 - lL + Math.max(0, -sn) * 3, 1, palWithSkin);
    leg(ctx, 264, 360, axR, ayR, -1, palWithSkin);

    ctx.fillStyle = shortsCol;
    ctx.beginPath();
    ctx.moveTo(244, 352);
    ctx.lineTo(272, 352);
    ctx.lineTo(274, 374);
    ctx.lineTo(258, 370);
    ctx.lineTo(242, 374);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.translate(258, 360);

    // Torso rotation based on kick or miss reaction
    if (kt > 0) {
      ctx.rotate(kt * 0.1);
    } else if (isMiss) {
      if (mType === 1) {
        ctx.rotate(0.15); // Slumped forward on knees
      } else if (mType === 2) {
        ctx.rotate(0.35); // Leaning forward with hands on knees
      } else if (mType === 3) {
        ctx.rotate(Math.sin(mc * 8) * 0.06); // Shaking head in disbelief
      }
    }
    ctx.translate(-258, -360);

    ctx.fillStyle = shirtCol;
    ctx.beginPath();
    ctx.moveTo(243, 304);
    ctx.lineTo(273, 304);
    ctx.lineTo(271, 358);
    ctx.lineTo(245, 358);
    ctx.closePath();
    ctx.fill();

    // Round 3 (Stage 2): Black vertical stripes on yellow jersey
    if (isStriker && roundTheme.stripes) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(247, 304, 3.5, 54);
      ctx.fillRect(256, 304, 3.5, 54);
      ctx.fillRect(265, 304, 3.5, 54);
    }

    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(258, 304, 14, 54);
    ctx.fillStyle = numCol;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(numText, 258, 335);

    const sp = Math.min(1, kt * 3);
    [-1, 1].forEach(sDir => {
      // Anatomical upper arm (a1) and forearm (a2) angles
      let a1 = sDir * (0.24 + 0.45 * sp) - sDir * sn * 0.12 + sDir * idle * 0.05;
      let a2 = a1 + sDir * (0.25 + 0.45 * sp);

      // --- Requirement 4: Varied & Anatomically Realistic Goal Celebrations ---
      if (gc) {
        // احتفال موحّد: قفزة واحدة مع رفع الذراع اليمنى عموديًا دون وضعية Siuuu.
        if (sDir === 1) {
          a1 = 3.05;
          a2 = 3.05;
        } else {
          a1 = -0.3;
          a2 = -0.2;
        }
      }

      // --- Requirement 3: Varied & Realistic Miss Reactions ---
      if (isMiss) {
        if (mType === 0) {
          // Hands on head in agony: elbows raised high, hands clasping temples of head
          a1 = sDir * 2.45;
          a2 = -sDir * 1.55;
        } else if (mType === 1) {
          // Fallen on knees, arms resting sadly on legs
          a1 = sDir * 0.2;
          a2 = sDir * 0.1;
        } else if (mType === 2) {
          // Hands braced on knees
          a1 = sDir * 0.65;
          a2 = sDir * 0.05;
        } else if (mType === 3) {
          // Arms out in disbelief with palms up
          a1 = sDir * 1.65;
          a2 = sDir * 2.1;
        } else if (mType === 4) {
          // Thigh slap in frustration
          if (sDir === 1) {
            a1 = 0.45 + Math.sin(mc * 10) * 0.25;
            a2 = 0.35;
          } else {
            a1 = -0.3;
            a2 = -0.2;
          }
        } else {
          // Seated with arms supporting on grass
          a1 = sDir * 0.35;
          a2 = sDir * 0.25;
        }
      }

      const sx = 258 + sDir * 15, sy = 308;
      const ex = sx + Math.sin(a1) * 22, ey = sy + Math.cos(a1) * 22;
      const hx = ex + Math.sin(a2) * 20, hy = ey + Math.cos(a2) * 20;
      ln(ctx, sx, sy, ex, ey, 8, shirtCol);
      ln(ctx, ex, ey, hx, hy, 6, skinCol);
      ctx.fillStyle = skinCol;
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, 7);
      ctx.fill();
    });

    ctx.fillStyle = skinCol;
    ctx.beginPath();
    ctx.arc(258, 298, 4, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(249, 291, 2.5, 0, 7);
    ctx.arc(267, 291, 2.5, 0, 7);
    ctx.fill();

    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(258, 290, 9.5, 0, 7);
    ctx.fill();

    if (hairStyle === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(250, 285);
      ctx.lineTo(253, 279);
      ctx.lineTo(257, 283);
      ctx.lineTo(261, 278);
      ctx.lineTo(265, 283);
      ctx.lineTo(268, 285);
      ctx.closePath();
      ctx.fill();
    } else if (hairStyle === 'curly') {
      ctx.beginPath();
      ctx.arc(253, 283, 3.5, 0, Math.PI * 2);
      ctx.arc(258, 281, 4, 0, Math.PI * 2);
      ctx.arc(263, 283, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (hairStyle === 'headband') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(250, 288, 16, 2.5);
    }

    ctx.restore();

    // Overhead Role Badge over Striker
    if (!fl) {
      ctx.save();
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const studentFirstName = (s.name || 'الطالب').trim().split(/\s+/)[0];
      const pLabel = isStriker ? `⚽ ${studentFirstName}` : '🔴 المنافس (مسدد)';
      const pw = ctx.measureText(pLabel).width + 12;
      ctx.fillStyle = isStriker ? 'rgba(39, 174, 96, 0.92)' : 'rgba(192, 57, 43, 0.92)';
      ctx.beginPath();
      ctx.roundRect(258 - pw / 2, 266, pw, 17, 8.5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(pLabel, 258, 274.5);
      ctx.restore();
    }

    ctx.restore();
  };

  const drawKeeper = (ctx: CanvasRenderingContext2D, T: number) => {
    const s = gameStateRef.current;
    const isStriker = s.round % 2 === 0;
    // When isStriker is true: Opponent keeper (cyan/teal '#25a8b8', gloves '#f2d13a', shorts '#1c2a3a')
    // When isStriker is false: Student keeper (green '#27ae60', gloves '#f1c40f', shorts '#1b4d2e')
    const kShirt = isStriker ? '#25a8b8' : '#27ae60';
    const kShorts = isStriker ? '#1c2a3a' : '#1b4d2e';
    const kGloves = isStriker ? '#f2d13a' : '#f1c40f';

    const k = s.keep;
    if (s.win) return;
    const idle = !s.seq || s.seq.p === 0;
    const sh = idle ? Math.sin(T / 230) * 5 : 0;
    const bk = idle ? Math.sin(T / 260) * 1.5 : 0;
    const kk = k.kk;
    const sp = 1 - kk;

    ctx.save();
    ctx.translate(k.x + sh, k.y + bk);
    ctx.rotate(k.tilt);

    [-1, 1].forEach(sDir => {
      const ta = sDir * 0.5 * sp + sDir * 0.05 * kk;
      const sa = -sDir * 0.15 * sp;
      const kx = sDir * 4 + Math.sin(ta) * 13;
      const ky = Math.cos(ta) * 13;
      const ax = kx + Math.sin(sa) * 13;
      const ay = ky + Math.cos(sa) * 13;
      ln(ctx, sDir * 4, 0, kx, ky, 9, kShorts);
      ln(ctx, kx, ky, ax, ay, 7, kShirt);
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(ax, ay + 2, 5, 3, 0, 0, 7);
      ctx.fill();
    });

    ctx.fillStyle = kShirt;
    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.lineTo(10, -30);
    ctx.lineTo(8, 0);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(-10, -20, 20, 3);
    ctx.fillStyle = kShorts;
    ctx.fillRect(-9, -3, 18, 9);
    ctx.fillStyle = '#e8b890';
    ctx.beginPath();
    ctx.arc(0, -38, 7, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#2a1c14';
    ctx.beginPath();
    ctx.arc(0, -40, 7.2, Math.PI, 0);
    ctx.fill();

    [-1, 1].forEach(sDir => {
      const sw = idle ? Math.sin(T / 200 + sDir) * 0.1 : 0;
      const a1 = sDir * (1.9 + 1.15 * kk) + sw;
      const a2 = sDir * (2.9 + 0.22 * kk) + sw;
      const ex = sDir * 10 + Math.sin(a1) * 13;
      const ey = -28 + Math.cos(a1) * 13;
      const hx = ex + Math.sin(a2) * 12;
      const hy = ey + Math.cos(a2) * 12;
      ln(ctx, sDir * 10, -28, ex, ey, 7, kShirt);
      ln(ctx, ex, ey, hx, hy, 6, '#e8b890');
      ctx.fillStyle = kGloves;
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, 7);
      ctx.fill();
    });

    // Overhead Role Badge over Keeper
    ctx.save();
    ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const studentFirstName = (s.name || 'الطالب').trim().split(/\s+/)[0];
    const kLabel = isStriker ? '🧤 حارس المنافس' : `🧤 ${studentFirstName} (حارس)`;
    const kw = ctx.measureText(kLabel).width + 12;
    ctx.fillStyle = isStriker ? 'rgba(37, 168, 184, 0.92)' : 'rgba(39, 174, 96, 0.92)';
    ctx.beginPath();
    ctx.roundRect(0 - kw / 2, -60, kw, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(kLabel, 0, -52);
    ctx.restore();

    ctx.restore();
  };

  const drawStars = (ctx: CanvasRenderingContext2D, T: number) => {
    const s = gameStateRef.current;
    const e = T - s.starsT;
    if (e < 0 || e > 1800) return;
    ctx.save();
    ctx.globalAlpha = 1 - e / 1800;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 8; i++) {
      ctx.fillText('⭐', 70 + i * 72 + Math.sin(i * 3 + e / 200) * 10, 300 - e * 0.06 - (i % 3) * 14);
    }
    ctx.restore();
  };

  // Requirement 9: رسم شريط الإخراج التلفزيوني والشارات الاحترافية للأهداف الحاسمة
  const drawTvBroadcastOverlay = (ctx: CanvasRenderingContext2D, bData: { studentGoals: number; opponentGoals: number }) => {
    ctx.save();
    // 1. Live Badge at top left
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(16, 14, 110, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Red pulsating dot
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * pulse})`;
    ctx.beginPath();
    ctx.arc(28, 27, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('مباشر · LIVE', 38, 27);

    // 2. Center Top Broadcast Banner
    const bannerW = 220;
    const bannerH = 26;
    const bannerX = 320 - bannerW / 2;
    const bannerY = 14;
    ctx.fillStyle = 'rgba(10, 30, 20, 0.92)';
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ لقطة الهدف الحاسم ⚡', 320, bannerY + bannerH / 2);

    // 3. Lower Third Scoreboard Popup (Floating at y = 388)
    const ltW = 440;
    const ltH = 38;
    const ltX = 320 - ltW / 2;
    const ltY = 388;

    // Dark sleek glassmorphism background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(ltX, ltY, ltW, ltH, 8);
    ctx.fill();
    ctx.stroke();

    // Left accent block: Decisive Goal badge
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(ltX + 4, ltY + 4, 95, ltH - 8, 5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽ هدف الفوز', ltX + 51, ltY + ltH / 2);

    // Center Match Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`الطالب  ${bData.studentGoals}  -  ${bData.opponentGoals}  المنافس`, 320, ltY + ltH / 2);

    // Right School Badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏫 مدرسة الخندق', ltX + ltW - 14, ltY + ltH / 2);

    ctx.restore();
  };

  const draw = (ctx: CanvasRenderingContext2D, _dt: number, T: number) => {
    const s = gameStateRef.current;

    // Requirement 9: الإخراج التلفزيوني للأهداف الحاسمة - زوم الكاميرا 1.28x على المسدد
    let isTvZoom = false;
    let tvZoom = 1.0;
    if (s.tvBroadcast && s.tvBroadcast.active) {
      const bElapsed = performance.now() - s.tvBroadcast.startTime;
      if (bElapsed > s.tvBroadcast.duration) {
        s.tvBroadcast.active = false;
      } else {
        isTvZoom = true;
        const prog = bElapsed / s.tvBroadcast.duration;
        if (prog < 0.16) {
          tvZoom = 1.0 + 0.28 * Math.sin((prog / 0.16) * Math.PI / 2);
        } else if (prog < 0.84) {
          tvZoom = 1.28;
        } else {
          tvZoom = 1.28 - 0.28 * Math.sin(((prog - 0.84) / 0.16) * Math.PI / 2);
        }
      }
    }

    ctx.clearRect(0, 0, 640, 440);
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, 640, 440);

    ctx.save();
    if (isTvZoom && tvZoom > 1.001) {
      ctx.translate(258, 380);
      ctx.scale(tvZoom, tvZoom);
      ctx.translate(-258, -380);
    }

    ctx.fillStyle = '#1b6b4c';
    ctx.fillRect(0, 18, 640, 100);
    ctx.fillStyle = '#154f39';
    for (let i = 0; i < 32; i++) {
      ctx.fillRect(i * 20 + 2, 24, 14, 8);
      ctx.fillRect(i * 20 + 2, 48, 14, 8);
      ctx.fillRect(i * 20 + 2, 72, 14, 8);
    }
    drawCrowd(ctx, T);
    drawStandsBanners(ctx, T);
    ctx.fillStyle = '#7a4a45';
    ctx.fillRect(0, 112, 640, 8);
    ctx.fillStyle = '#6b6a66';
    ctx.fillRect(0, 120, 640, 62);
    ctx.fillStyle = '#8a9a96';
    ctx.fillRect(0, 182, 640, 22);

    // grass stripes
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#3f9a2f' : '#48a638';
      ctx.fillRect(0, 204 + i * 29.5, 640, 30);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 222, 640, 2);
    ctx.fillRect(0, 250, 640, 2);
    ctx.fillRect(0, 420, 640, 2);

    drawPlayer(ctx, 1, T);

    // goal net
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(G.l, G.t, G.r - G.l, G.b - G.t);
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 1;
    for (let i = G.l; i <= G.r; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, G.t);
      ctx.lineTo(i, G.b);
      ctx.stroke();
    }
    for (let j = G.t; j <= G.b; j += 8) {
      ctx.beginPath();
      ctx.moveTo(G.l, j);
      ctx.lineTo(G.r, j);
      ctx.stroke();
    }

    drawKeeper(ctx, T);

    // posts
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(G.l, G.b);
    ctx.lineTo(G.l, G.t);
    ctx.lineTo(G.r, G.t);
    ctx.lineTo(G.r, G.b);
    ctx.stroke();

    // shooter & ball
    drawPlayer(ctx, 0, T);
    drawBall(ctx);
    // مشهد العبوات محذوف؛ الجمهور يبقى في المدرجات.
    drawVictoryScene(ctx, T);
    drawSay(ctx, T);
    drawStars(ctx, T);
    drawIntroLineup(ctx, T);

    ctx.restore();

    // Requirement 9: رسم شريط الإخراج التلفزيوني والشارات الاحترافية
    if (isTvZoom && s.tvBroadcast) {
      drawTvBroadcastOverlay(ctx, s.tvBroadcast);
    }
  };

  // مراسم افتتاح المباراة — شريط التقديم مع بقاء اللاعبين في مواقعهم الطبيعية دون مشهد دخول أو اصطفاف
  const drawIntroLineup = (ctx: CanvasRenderingContext2D, _T: number) => {
    const s = gameStateRef.current;
    if (!s.introInProgress) return;

    ctx.save();
    // Ceremonial presentation broadcast banner at top
    const bw = 390;
    const bh = 54;
    const bx = 320 - bw / 2;
    const by = 26;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽ بطولة لغتي تحكي — ركلات الترجيح ⚽', 320, by + 19);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11.5px system-ui, -apple-system, sans-serif';
    ctx.fillText('🎙️ مراسم الافتتاح: استمع لصوت البداية والبسملة...', 320, by + 38);

    ctx.restore();
  };

  const RUN = 1300, KICK = 400, LAUNCH = 220, FLY = 650;

  const update = (now: number) => {
    const s = gameStateRef.current;

    // Requirement 7: فيزياء حركة علب الماء والعصير عند ضياع الكرة
    if (s.missCans && s.missCans.length > 0) {
      const groundY = 416;
      s.missCans.forEach(can => {
        can.vy += 0.22;
        can.x += can.vx;
        can.y += can.vy;
        can.rot += can.vrot;
        if (can.y >= groundY) {
          can.y = groundY;
          if (Math.abs(can.vy) > 0.8) {
            can.vy = -can.vy * 0.42;
            can.vx *= 0.7;
            can.vrot *= 0.6;
          } else {
            can.vy = 0;
            can.vx = 0;
            can.vrot = 0;
          }
        }
      });
    }

    if (!s.seq) return;

    const elTime = now - s.seq.t0;
    s.seq.r = Math.min(elTime / RUN, 1);
    s.seq.kt = elTime < RUN ? 0 : Math.min((elTime - RUN) / KICK, 1);
    const sd = s.seq.sd || (s.seq.sd = {});
    if (s.seq.r >= 0.33 && !sd.a) {
      sd.a = 1;
      sfStep();
    }
    if (s.seq.r >= 0.66 && !sd.b) {
      sd.b = 1;
      sfStep();
    }
    if (s.seq.r >= 1 && !sd.c) {
      sd.c = 1;
      sfStep(true);
    }
    if (s.seq.kt >= 0.55 && !sd.k) {
      sd.k = 1;
      sfKick();
    }
    if (s.seq.celT && !isGoalMode(s.seq.mode) && s.seq.mode !== 'wide' && (now - s.seq.celT) / 1000 > 0.9 && !sd.f) {
      sd.f = 1;
      sfChase();
    }

    const fe = elTime - RUN - LAUNCH;
    s.seq.p = fe < 0 ? 0 : Math.min(fe / FLY, 1);
    if (s.seq.p > 0.04 && !sd.d) {
      sd.d = 1;
      sfWhoosh();
    }

    if (s.seq.p > 0) {
      const p = s.seq.p;
      const e2 = 1 - Math.pow(1 - p, 1.5);
      s.ball.x = BX + (s.seq.tx - BX) * e2;
      s.ball.y = BY + (s.seq.ty - BY) * e2 - Math.sin(p * Math.PI) * 10;
      s.ball.s = 1 - 0.45 * e2;
      s.ball.gy = BY + (232 - BY) * e2;
      const flightT = Math.max(0, (now - s.seq.t0 - RUN - LAUNCH) / 1000);
      const sideFactor = (s.seq.tx - BX) / 140;
      s.ball.rot = flightT * (sideFactor < 0 ? -1 : 1) * 12;
      s.ball.rotX = flightT * 18;
      s.ball.rotY = flightT * sideFactor * 10;
      s.ball.bulge = 0;

      if (p >= 1) {
        const t2 = Math.max(0, (now - s.seq.t0 - RUN - LAUNCH - FLY) / 1000);
        const m = s.seq.mode;
        const exVal = 1 - Math.exp(-t2 * 3);
        s.ball.rot += t2 * 6 * (s.seq.tx < BX ? -1 : 1);
        s.ball.rotX += t2 * 6;
        s.ball.rotY += t2 * sideFactor * 4;
        if (m === 'goal') {
          const gy = 226;
          const th = Math.sqrt(Math.max(0, gy - s.seq.ty) / 130);
          let yy = s.seq.ty + 130 * t2 * t2;
          if (t2 > th) {
            const u = t2 - th;
            yy = gy - Math.abs(Math.sin(u * 5.5)) * 12 * Math.exp(-u * 2.5);
          }
          s.ball.x = s.seq.tx + (s.seq.tx < BX ? -1 : 1) * -6 * exVal;
          s.ball.y = Math.min(yy, gy);
          s.ball.gy = 232;
          s.ball.bulge = Math.max(0, 1 - t2 * 1.6);
        } else if (m === 'save') {
          const dr = s.seq.tx < BX ? -1 : 1;
          const gy = 246;
          const th = Math.sqrt(Math.max(0, gy - s.seq.ty) / 220);
          let yy = s.seq.ty + 220 * t2 * t2;
          if (t2 > th) {
            const u = t2 - th;
            yy = gy - Math.abs(Math.sin(u * 6)) * 16 * Math.exp(-u * 2);
          }
          s.ball.x = s.seq.tx + dr * 110 * (1 - Math.exp(-t2 * 2.2));
          s.ball.y = Math.min(yy, gy);
          s.ball.gy = gy + 4;
          s.ball.s = 0.55 + 0.12 * Math.min(t2, 1);
        } else if (m === 'post_out') {
          // Rebounds back out into penalty area
          const dr = s.seq.tx < BX ? -1 : 1;
          const gy = 246;
          const th = Math.sqrt(Math.max(0, gy - s.seq.ty) / 200);
          let yy = s.seq.ty + 180 * t2 * t2;
          if (t2 > th) {
            const u = t2 - th;
            yy = gy - Math.abs(Math.sin(u * 5)) * 14 * Math.exp(-u * 2);
          }
          s.ball.x = s.seq.tx - dr * 85 * (1 - Math.exp(-t2 * 2.4));
          s.ball.y = Math.min(yy, gy);
          s.ball.gy = gy + 4;
          s.ball.s = 0.55 + 0.1 * Math.min(t2, 1);
        } else {
          // 'wide' or 'coach_fury' - flies off-target into stands
          s.ball.x = s.seq.tx + (s.seq.tx - BX) * 0.25 * t2;
          s.ball.y = s.seq.ty - 50 * t2;
          s.ball.s = Math.max(0.15, 0.55 - 0.25 * t2);
          s.ball.gy = 232;
        }
      }

      const kk = Math.max(0, Math.min((p - 0.04) / (0.6 - s.stage * 0.05), 1));
      const ke = 1 - Math.pow(1 - kk, 2);
      s.keep.kk = ke;
      s.keep.x = 320 + (s.seq.hx - 320) * ke;
      s.keep.y = 198 + (s.seq.hy - 198) * ke - Math.sin(ke * Math.PI) * 8;
      s.keep.tilt = s.seq.tm * ke;

      if (p >= 1 && !s.seq.done) {
        s.seq.done = 1;
        finish(s.seq.mode);
      }
    }
  };

  const launchPhysicsAndKick = (ok: boolean) => {
    unlockAudio();
    startAmb();
    const s = gameStateRef.current;
    if (ok) s.cg = true;
    s.busy = true;

    const isStriker = s.round % 2 === 0;

    // Outcome differentiation:
    // When Student is Striker (odd kicks 1, 3, 5, 7, 9):
    //   - Correct answer: Student scores clean goal into net! ('goal')
    //   - Incorrect answer: Miss / Opponent keeper save / Woodwork out
    // When Student is Goalkeeper (even kicks 2, 4, 6, 8, 10):
    //   - Correct answer: Student defends successfully! ('save' / 'wide' / 'post_out')
    //   - Incorrect answer: Opponent scores into student net! ('goal')
    let mode: 'goal' | 'save' | 'wide' | 'post_out';

    if (isStriker) {
      if (ok) {
        mode = 'goal';
      } else {
        const roll = Math.random();
        if (roll < 0.45) {
          mode = 'save';
        } else if (roll < 0.75) {
          mode = 'wide';
        } else {
          mode = 'post_out';
        }
      }
    } else {
      if (ok) {
        const roll = Math.random();
        if (roll < 0.50) {
          mode = 'save';
        } else if (roll < 0.80) {
          mode = 'wide';
        } else {
          mode = 'post_out';
        }
      } else {
        mode = 'goal';
      }
    }

    let tx = G.l + 30 + Math.random() * (G.r - G.l - 60);
    let ty = G.t + 22 + Math.random() * (G.b - G.t - 45);
    let kx: number;

    if (mode === 'goal') {
      // Clean shot into net, keeper dives towards it but misses
      kx = Math.max(
        240,
        Math.min(
          400,
          tx < 320 ? tx + (85 - s.stage * 6) + Math.random() * 25 : tx - (85 - s.stage * 6) - Math.random() * 25
        )
      );
    } else if (mode === 'save') {
      // Keeper makes blocking contact
      tx = 250 + Math.random() * 140;
      ty = 150 + Math.random() * 55;
      kx = tx;
    } else if (mode === 'post_out') {
      // Direct post or crossbar hit bouncing back out (NO goal)
      if (Math.random() < 0.6) {
        tx = Math.random() < 0.5 ? G.l - 4 : G.r + 4;
        ty = 145 + Math.random() * 55;
      } else {
        tx = 240 + Math.random() * 160;
        ty = G.t - 4;
      }
      kx = 320 + (tx < 320 ? 45 : -45);
    } else {
      // Wide - ball flies off-target into stands
      if (Math.random() < 0.5) {
        tx = Math.random() < 0.5 ? 85 : 555;
        ty = 145 + Math.random() * 55;
      } else {
        tx = 230 + Math.random() * 180;
        ty = 40;
      }
      kx = 240 + Math.random() * 160;
    }

    const hi = Math.max(0, Math.min(1, (211 - ty) / 73));
    const kd = mode === 'save' ? tx : kx;
    const mid = Math.abs(kd - 320) < 28;
    const dir = kd >= 320 ? 1 : -1;
    const tm = mid ? 0 : dir * (1.45 - 0.6 * hi);
    let hx: number, hy: number;

    if (mode === 'save') {
      hx = mid ? 320 : tx - Math.sin(tm) * 50;
      hy = Math.min(ty + Math.cos(tm) * 50, 216);
    } else {
      hx = mid ? 320 : kd - Math.sin(tm) * 30;
      hy = mid ? 192 : 208;
    }

    const coachAction = isStriker ? (ok || (s.wrong % 2 === 0)) : (!ok);

    // Phase 5.2: احتفالية القفزة الشهيرة (Siuuu) حصرية للاعب رقم 7 في الجولة الأولى فقط
    let goalCelType: number;
    if (isStriker && s.stage === 0) {
      // حصرية للاعب رقم 7 في الجولة الأولى
      goalCelType = 0;
    } else {
      // في الجولات الأخرى (2، 3، 4، 5) تقتصر الاحتفالات على الأنواع 1 إلى 7 وتستبعد 0 تماماً
      const availableCels = [1, 2, 3, 4, 5, 6, 7].filter(x => x !== s.lastGoalCelType);
      goalCelType = availableCels[Math.floor(Math.random() * availableCels.length)];
    }
    s.lastGoalCelType = goalCelType;

    let missType = Math.floor(Math.random() * 6);
    if (missType === s.lastMissType) missType = (missType + 1) % 6;
    s.lastMissType = missType;

    s.seq = {
      t0: performance.now(),
      mode,
      tx,
      ty,
      kx,
      hx,
      hy,
      tm,
      tf: (tm ? Math.sign(tm) : Math.random() < 0.5 ? -1 : 1) * 1.4,
      r: 0,
      kt: 0,
      p: 0,
      done: 0,
      goalCelType,
      missType,
      route: 0,
      coach: coachAction
    };
  };

  const shoot = launchPhysicsAndKick;

  const finish = (mode: string) => {
    const s = gameStateRef.current;
    if (s.evaluated) return;
    s.evaluated = true;

    const isStriker = s.round % 2 === 0;
    const isGoal = isGoalMode(mode);
    const outcomeEventId = `stage-${s.stage}-round-${s.round}-outcome`;

    if (isStriker) {
      // Student is Striker
      if (isGoal) {
        s.studentGoals++;
        s.res[s.round] = 1;
        s.consecutiveMisses = 0;
        s.streak++;
        if (s.streak >= 3) s.starsT = performance.now();
        sfGoal();
        const clip = selectCommentary('goal', ['mp3_goal_yarabbah', 'mp3_goal_beautiful', 'mp3_goal_decisive_moment']);
        say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
        showStatusMsg('🎉 قوووووووول! هدف رائع في الشباك!');
      } else {
        s.res[s.round] = 0;
        s.streak = 0;
        s.consecutiveMisses++;
        s.wrong++;
        s.leave = Math.min(1, s.wrong * 0.06);
        s.lastExit = {
          x: s.seq.route === 1 ? 720 : -70,
          y: s.seq.route === 0 ? 215 : s.seq.route === 1 ? 386 : 388
        };

        if (mode === 'save') {
          const clip = selectCommentary('save', [
            'mp3_save_basic',
            'mp3_save_blocked',
            'mp3_save_legendary_vacation',
            'mp3_save_maintenance',
            'mp3_save_request_rejected',
            'mp3_save_impossible_denial',
            'mp3_save_did_not_move'
          ]);
          sfMiss('save');
          say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          showStatusMsg('🧤 تصدى حارس المنافس للكرة!');
        } else if (mode === 'post_out') {
          const clip = selectCommentary('post', [
            'mp3_post_interferes',
            'mp3_crossbar_saves',
            'mp3_crossbar_bad_luck',
            'mp3_crossbar_rights',
            'mp3_crossbar_centimeters',
            'mp3_crossbar_not_today'
          ]);
          sfPost();
          setTimeout(() => {
            sfMiss('post');
            say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          }, 180);
          showStatusMsg('🥅 ارتطمت بالقائم وخرجت!');
        } else {
          // Bad miss by student striker: off-target into stands
          sfMiss('wide');
          const strikerMissPool = [
            'mp3_miss_takeoff',
            'mp3_miss_another_stadium',
            'mp3_miss_target_birds',
            'mp3_miss_farewell_letter',
            'mp3_miss_rethink'
          ];
          const clip = selectCommentary('miss', strikerMissPool);
          say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          showStatusMsg('💨 التسديدة تخرج بعيدًا عن المرمى!');

          // Requirement 7: حركة علب الماء والعصير عند ضياع الكرة باحتمال 40%
          // مشهد رمي العبوات من المدرجات معطّل حسب متطلبات اللعبة.
        }
      }
    } else {
      // Student is Goalkeeper (Opponent is Striker)
      if (isGoal) {
        s.opponentGoals++;
        s.res[s.round] = 0;
        s.streak = 0;
        s.consecutiveMisses++;
        s.wrong++;
        sfGoal();
        const clip = selectCommentary('goal', ['mp3_goal_yarabbah', 'mp3_goal_beautiful', 'mp3_goal_decisive_moment']);
        say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
        showStatusMsg('⚽ هدف للمنافس في شباكك!');
      } else {
        s.studentSaves++;
        s.res[s.round] = 1;
        s.consecutiveMisses = 0;
        s.streak++;
        if (s.streak >= 3) s.starsT = performance.now();

        if (mode === 'save') {
          const clip = selectCommentary('save', [
            'mp3_save_basic',
            'mp3_save_blocked',
            'mp3_save_legendary_vacation',
            'mp3_save_maintenance',
            'mp3_save_request_rejected',
            'mp3_save_impossible_denial',
            'mp3_save_did_not_move'
          ]);
          sfMiss('save');
          say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          showStatusMsg('🧤 براعة وقفاز ذهبي! تصديت لتسديدة المنافس بنجاح!');
        } else if (mode === 'post_out') {
          const clip = selectCommentary('post', [
            'mp3_post_interferes',
            'mp3_crossbar_saves',
            'mp3_crossbar_bad_luck',
            'mp3_crossbar_rights',
            'mp3_crossbar_centimeters',
            'mp3_crossbar_not_today'
          ]);
          sfPost();
          setTimeout(() => {
            sfMiss('post');
            say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          }, 180);
          showStatusMsg('🥅 تسديدة المنافس اصطدمت بالقائم وخرجت!');
        } else {
          // Opponent kicked wide into stands
          const oppMissPool = [
            'mp3_miss_takeoff',
            'mp3_miss_another_stadium',
            'mp3_miss_target_birds',
            'mp3_miss_farewell_letter',
            'mp3_miss_rethink'
          ];
          const clip = selectCommentary('miss', oppMissPool);
          sfMiss('wide');
          say(clip.text, clip.id, clip.personaTitle, clip.icon, outcomeEventId);
          showStatusMsg('💨 تسديدة المنافس خرجت بعيدًا!');
        }
      }
    }

    s.seq.celT = performance.now();
    drawDots();

    // Record student answer and outcome for end-of-stage review
    if (s.currentQuestion) {
      s.roundReviewData.push({
        qItem: s.currentQuestion,
        studentChoiceIdx: s.lastStudentChoiceIdx,
        isCorrect: s.lastAnswerCorrect
      });
    }

    // Requirement 9: الانتقال التلقائي بنسبة 100% بين الركلات وإلغاء زر «المحاولة التالية» تماماً
    // - لا تبدأ الركلة التالية ولا يظهر السؤال التالي أثناء تحدث المعلق إطلاقاً
    // - اكتمال التعليق الصوتي لنتيجة الركلة + اكتمال حركة اللاعب والكرة
    // - مهلة أمان قصوى احتياطية (Fallback timeout)
    const isLastKick = s.round >= 9;
    const finishStartTime = performance.now();
    let advanced = false;

    const doAdvance = () => {
      if (advanced) return;
      advanced = true;
      clearWaitingAndCoachTimers();
      if (isLastKick) {
        finishStage();
      } else {
        s.round++;
        resetRound();
        s.busy = false;
        s.evaluated = false;
        s.answeredThisRound = false;
        drawDots();
        nextQ();
      }
    };

    // مهلة أمان قصوى احتياطية لمنع أي تعليق
    const fallbackTimer = window.setTimeout(doAdvance, 7000);

    // الاستماع لانتهاء التعليق الصوتي
    audioStateRef.current.pendingOnEnded = () => {
      const elapsed = performance.now() - finishStartTime;
      if (elapsed < 2600) {
        setTimeout(() => {
          window.clearTimeout(fallbackTimer);
          doAdvance();
        }, 2600 - elapsed);
      } else {
        window.clearTimeout(fallbackTimer);
        doAdvance();
      }
    };

    // فحص دوري عند اكتمال الحركة المرئية (2.7 ثانية) في حال انتهاء الصوت أو كتمه مسبقاً
    setTimeout(() => {
      if (!audioStateRef.current.isPlaying) {
        window.clearTimeout(fallbackTimer);
        doAdvance();
      }
    }, 2700);
  };

  const finishStage = () => {
    const s = gameStateRef.current;
    s.ended = true;
    s.stageDone = true;
    s.totEduScore += s.eduScore;
    if (qRef.current) qRef.current.style.visibility = 'hidden';

    // Populate review list for end-of-stage review modal
    setReviewList([...s.roundReviewData]);

    saveProg();

    const isStudentWinner = s.studentGoals > s.opponentGoals;
    const isTie = s.studentGoals === s.opponentGoals;

    let resultMsg = '';
    if (isStudentWinner) {
      resultMsg = `🏆 فوز رائع للطالب في المباراة! (${s.studentGoals} - ${s.opponentGoals})`;
      startWin(performance.now());
      if (s.stage === 4) {
        say('انتصار! يا لها من بطولة!', 'mp3_tournament_victory', 'تتويج البطولة', '🏆');
      } else {
        say('مبروك! أداء يستحق التقدير!', 'mp3_stage_congrats', 'نهاية المرحلة', '👏');
      }
    } else if (isTie) {
      resultMsg = `🤝 تعادل مثير في ركلات الترجيح! (${s.studentGoals} - ${s.opponentGoals})`;
      say('هذه الركلة تحتاج إلى إعادة تفكير!', 'mp3_miss_rethink', 'نهاية الجولة', '🤔');
    } else {
      resultMsg = `💪 تفوق المنافس في هذه الجولة (${s.opponentGoals} - ${s.studentGoals}). فرصة للتعويض!`;
      say('هذه الركلة تحتاج إلى إعادة تفكير! فرصة للتعويض في الجولة القادمة!', 'mp3_miss_rethink', 'معلق المباراة', '🤔');
    }

    setMsgText(resultMsg);

    // If student won, display the glorious hoisting celebration on the pitch before showing summary modal
    if (isStudentWinner) {
      setTimeout(() => {
        setShowStageSummaryModal(true);
      }, 5600);
    } else {
      setTimeout(() => {
        setShowStageSummaryModal(true);
      }, 1600);
    }
  };

  const saveProg = () => {
    const s = gameStateRef.current;
    const p = LS.g('pk_prog') || { name: '', best: [0, 0, 0, 0, 0], next: 0 };
    p.name = s.name;
    // Educational points (0..10 per stage) saved in p.best (total out of 50)
    p.best[s.stage] = Math.max(p.best[s.stage] || 0, s.eduScore);
    p.next = s.stage < 4 ? s.stage + 1 : 0;
    LS.s('pk_prog', p);

    const t = p.best.reduce((a: number, b: number) => a + b, 0);
    setOverallEduScore(t);
    const lb = (LS.g('pk_lb') || []).filter((r: any) => r.n !== s.name);
    lb.push({ n: s.name, t });
    lb.sort((a: any, b: any) => b.t - a.t);
    LS.s('pk_lb', lb.slice(0, 20));
  };

  const handleRewardPoint = (points: number) => {
    const p = LS.g('pk_prog') || { name: playerName || 'طالب لغتي', best: [0, 0, 0, 0, 0], next: 0 };
    p.name = playerName || 'طالب لغتي';
    p.best[0] = Math.min(10, (p.best[0] || 0) + points);
    LS.s('pk_prog', p);
    const t = p.best.reduce((a: number, b: number) => a + b, 0);
    setOverallEduScore(t);
  };

  const handleLaunchShootout = (stageIdx: number = 0) => {
    if (!isStageUnlocked(stageIdx)) {
      showStatusMsg(`⚠️ المرحلة ${stageIdx + 1} (${STAGE_NAMES[stageIdx]}) مغلقة بقرار المعلم.`);
      return;
    }
    setCurrentView('shootout');
    beginGame(stageIdx);
  };

  const handlePublishTeacherAnnouncement = () => {
    if (!teacherAnnouncementInput.trim()) return;
    const existing = LS.g('pk_teacher_announcements') || [];
    const updated = [teacherAnnouncementInput.trim(), ...(Array.isArray(existing) ? existing : [])];
    LS.s('pk_teacher_announcements', updated);
    setTeacherAnnouncementSavedMsg('✅ تم نشر الإعلان بنجاح!');
    setTeacherAnnouncementInput('');
    setTimeout(() => setTeacherAnnouncementSavedMsg(''), 3000);
  };

  const showLB = () => {
    const lb: any[] = LS.g('pk_lb') || [];
    setLbRows(lb.map((r: any) => [r.n, r.t]));
    setShowLBModal(true);
  };

  const enableQButtons = () => {
    if (!qRef.current) return;
    qRef.current.querySelectorAll('button').forEach((b: HTMLButtonElement) => {
      b.disabled = false;
    });
  };

  const tick = () => {
    // Question countdown timer removed per requirement (open thinking time without pressure)
  };

  const nextQ = () => {
    const s = gameStateRef.current;
    if (!qRef.current) return;
    if (s.round >= 10) return;

    // Strict Requirement: Never render or reveal question if intro audio is playing or not yet finished!
    if (gameStartStateRef.current === 'introPlaying' || gameStartStateRef.current === 'introError' || gameStartStateRef.current === 'ready') {
      if (qRef.current) {
        qRef.current.innerHTML = '';
        qRef.current.style.display = 'none';
        qRef.current.style.visibility = 'hidden';
      }
      return;
    }

    // 1. Immediately reset document active focus (clears any lingering mobile touch / button focus)
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Reset all answer and selection states for clean transition
    s.evaluated = false;
    s.answeredThisRound = false;
    s.lastAnswerCorrect = false;
    s.lastStudentChoiceIdx = -1;

    // 3. Clear previous question elements completely and restore full visibility & interactivity
    qRef.current.innerHTML = '';
    qRef.current.style.opacity = '1';
    qRef.current.style.visibility = 'visible';
    qRef.current.style.pointerEvents = 'auto';

    const qItem = STAGES[s.stage][s.round];
    s.currentQuestion = qItem;

    if (s.started && !s.introInProgress) {
      startWaitingAudioSequence();
    }

    // Remove category title like «الصنف اللغوي» from question display
    const cleanLesson = qItem.lesson.replace(/^[^:]+:\s*/, '').trim();

    // 1. Question frame at bottom of screen
    const qBox = document.createElement('div');
    qBox.className = 'q-box';

    const header = document.createElement('div');
    header.className = 'q-header';
    header.innerHTML = `
      <span class="q-lesson">📖 ${esc(cleanLesson)} (ص ${qItem.page})</span>
    `;
    qBox.appendChild(header);

    const questionText = document.createElement('div');
    questionText.className = 't';
    questionText.textContent = qItem.question;
    qBox.appendChild(questionText);

    qRef.current.appendChild(qBox);

    // 2. The four answer options in a single horizontal row directly below the question
    const optionsRow = document.createElement('div');
    optionsRow.className = 'q-options-row';

    // Map the 4 options with uniform default styling
    qItem.options
      .map((optionText, index) => ({ optionText, index }))
      .sort(() => Math.random() - 0.5)
      .forEach(({ optionText, index }) => {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'q-opt-btn';
        bt.textContent = optionText;
        bt.dataset.idx = String(index);
        bt.dataset.correct = index === qItem.answer ? '1' : '0';
        bt.style.outline = 'none';
        bt.disabled = false;

        let handled = false;
        const selectOption = (e: Event) => {
          if (e.type === 'pointerdown' && (e as PointerEvent).pointerType === 'mouse' && (e as PointerEvent).button !== 0) {
            return;
          }
          if (handled || s.answeredThisRound || s.busy || s.ended) return;
          handled = true;

          // Crucial: Unlock iOS Safari Web Audio directly on this touch gesture
          unlockAudio();

          s.answeredThisRound = true;
          s.lastStudentChoiceIdx = index;

          const isCorrect = (index === qItem.answer);
          s.lastAnswerCorrect = isCorrect;

          // Temporary visual feedback only on chosen button using CSS class (.is-correct / .is-wrong)
          bt.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

          // Immediately disable all 4 buttons to prevent multiple clicks or race conditions
          if (qRef.current) {
            qRef.current.querySelectorAll('.q-opt-btn').forEach((b: Element) => {
              (b as HTMLButtonElement).disabled = true;
            });
          }

          // Award educational point immediately
          if (isCorrect) {
            const awardedIds: string[] = LS.g('pk_question_awards') || [];
            const isFirstCorrectAnswer = !awardedIds.includes(qItem.id);
            if (isFirstCorrectAnswer) {
              LS.s('pk_question_awards', [...awardedIds, qItem.id]);
              s.eduScore += 1;
              setEduScoreDisplay(s.eduScore);
              if (IS_EMBEDDED && EXTERNAL_STUDENT_ID && window.parent !== window) {
                window.parent.postMessage({ type: 'LT_PENALTY_AWARD', studentId: EXTERNAL_STUDENT_ID, questionId: qItem.id }, window.location.origin);
              }
            }
          }

          // 1. Immediately STOP any active waiting commentary (e.g. «كل هذا التركيز»، «اللاعب ينظر الى الكرة»)
          stopCommentary();

          // 2. Clear waiting timers and mark round answered
          audioStateRef.current.roundAnswered = true;
          clearWaitingAndCoachTimers();

          const prepPool = ['mp3_prep_advance_shoot', 'mp3_prep_calm_focus', 'mp3_prep_look_ball', 'mp3_prep_all_focus'];
          const shootClipKey = (s.round === 9)
            ? 'mp3_prep_final_kick'
            : selectCommentary('prep', prepPool).id;

          // Critical: The player MUST remain stationary at (258, 418) while this audio plays!
          // We trigger launchPhysicsAndKick ONLY when the audio ended event fires.
          let launched = false;
          const proceedToRunAndKick = () => {
            if (launched) return;
            launched = true;

            // Fade out question and options during kick execution so player and ball are NEVER obscured
            if (qRef.current) {
              qRef.current.style.opacity = '0';
              qRef.current.style.pointerEvents = 'none';
            }

            launchPhysicsAndKick(isCorrect);
          };

          // Robust safety timeout fallback: 4.2s (since waiting commentary was stopped immediately)
          const prepEventId = `stage-${s.stage}-round-${s.round}-prep`;
          playClip(shootClipKey, undefined, prepEventId, 'answer')
            .then(proceedToRunAndKick)
            .catch((err) => {
              console.warn('[Audio Playback Error] shoot clip failed:', err);
              proceedToRunAndKick();
            });
        };

        bt.addEventListener('pointerdown', selectOption, { passive: true });
        bt.addEventListener('click', selectOption);

        optionsRow.appendChild(bt);
      });

    qRef.current.appendChild(optionsRow);
  };

  const newStage = () => {
    stopCurrentAudio();
    clearWaitingAndCoachTimers();
    const s = gameStateRef.current;
    s.eduScore = 0;
    s.studentGoals = 0;
    s.opponentGoals = 0;
    s.studentSaves = 0;
    s.round = 0;
    s.res = [];
    s.roundReviewData = [];
    s.lastStudentChoiceIdx = -1;
    setReviewList([]);
    setShowReviewModal(false);
    s.busy = false;
    s.ended = false;
    s.stageDone = false;
    s.evaluated = false;
    s.answeredThisRound = false;
    s.streak = 0;
    s.consecutiveMisses = 0;
    s.hintUsed = false;
    setHintButtonDisabled(false);
    setHintButtonText('💡 احذف إجابة خاطئة');
    resetRound();
    setRsButtonVisible(false);
    setShowStageSummaryModal(false);
    if (qRef.current) qRef.current.style.visibility = 'visible';
    s.wrong = 0;
    s.win = null;
    s.PRJ.length = 0;
    s.CROWD.forEach((p: any) => {
      p.st = 0;
    });
    drawDots();
    nextQ();
  };

  const isStageUnlocked = (stageIdx: number): boolean => {
    const saved = LS.g('pk_stage_locks');
    if (Array.isArray(saved) && saved.length === 5) {
      return Boolean(saved[stageIdx]);
    }
    return stageLocks[stageIdx] ?? (stageIdx === 0);
  };

  const updateStageLock = (stageIdx: number, unlocked: boolean) => {
    setStageLocks(prev => {
      const next = [...prev];
      next[stageIdx] = unlocked;
      LS.s('pk_stage_locks', next);
      return next;
    });
  };

  const setAllStagesLock = (unlocked: boolean) => {
    const next = Array(5).fill(unlocked);
    setStageLocks(next);
    LS.s('pk_stage_locks', next);
  };

  const handleTeacherLogin = () => {
    const correctPin = String(LS.g('pk_teacher_pin') || '1448');
    if (teacherPinInput.trim() === correctPin) {
      setIsTeacherAuthenticated(true);
      LS.s('pk_teacher_auth', true);
      setShowTeacherAuthModal(false);
      setShowTeacherPanelModal(true);
      setTeacherPinInput('');
      setTeacherAuthError('');
    } else {
      setTeacherAuthError('❌ رمز المرور غير صحيح، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    LS.s('pk_teacher_auth', false);
    setShowTeacherPanelModal(false);
  };

  const handleChangePin = () => {
    if (newPinInput.trim().length < 4) {
      setTeacherAuthError('رمز المرور يجب أن يتكون من 4 خانات على الأقل.');
      return;
    }
    LS.s('pk_teacher_pin', newPinInput.trim());
    setPinChangeSuccessMsg('✅ تم تحديث رمز مرور المعلم بنجاح!');
    setNewPinInput('');
    setTimeout(() => setPinChangeSuccessMsg(''), 3500);
  };

  const handleNextStageOrRestart = () => {
    setShowStageSummaryModal(false);
    const s = gameStateRef.current;
    if (s.stageDone && s.stage < 4) {
      const nextStage = s.stage + 1;
      if (!isStageUnlocked(nextStage)) {
        showStatusMsg(`🔒 الجولة التالية (${STAGE_NAMES[nextStage]}) مغلقة بقرار المعلم.`);
        setShowStartModal(true);
        return;
      }
      // Phase 7: عرض بطاقة تقديم الجولة الجديدة وألوان أطقم الفريق
      setNextTargetStage(nextStage);
      setShowRoundTransitionModal(true);
    } else {
      if (!isStageUnlocked(0)) {
        showStatusMsg(`🔒 الجولة الأولى مغلقة بقرار المعلم.`);
        setShowStartModal(true);
        return;
      }
      s.stage = 0;
      s.totEduScore = 0;
      s.cg = false;
      s.cb = false;
      s.started = true;
      newStage();
    }
  };

  const confirmRoundTransition = () => {
    setShowRoundTransitionModal(false);
    const s = gameStateRef.current;
    s.stage = nextTargetStage;
    s.started = true;
    newStage();
    const isStriker = s.round % 2 === 0;
    const qItem = STAGES[s.stage][s.round];
    setMsgText(`${isStriker ? 'أنت المسدد ⚽' : 'أنت الحارس 🧤'} · ${qItem.lesson}`);
    startWaitingAudioSequence();
  };

  const handleHintClick = () => {
    const s = gameStateRef.current;
    if (!s.started || s.introInProgress || s.busy || s.ended || s.hintUsed || !qRef.current) return;
    const bs = Array.from(qRef.current.querySelectorAll('button')).filter(
      b => !b.disabled && b.dataset.correct !== '1' && !b.classList.contains('fb-next-btn')
    );
    if (!bs.length) return;
    const b = bs[Math.floor(Math.random() * bs.length)];
    b.disabled = true;
    b.style.visibility = 'hidden';
    s.hintUsed = true;
    setHintButtonDisabled(true);
    setHintButtonText('💡 استُخدمت');
  };

  const handleMuteToggle = () => {
    unlockAudio();
    const s = gameStateRef.current;
    s.muted = !s.muted;
    setIsMuted(s.muted);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = s.muted ? 0 : 1;
    }
    if (s.muted) {
      stopAll();
      if (s.introInProgress) {
        s.introInProgress = false;
        s.introPlayed = true;
        introPlayingRef.current = false;
        s.started = true;
        gameStartStateRef.current = 'playing';
        setGameStartState('playing');
        if (qRef.current) {
          qRef.current.style.display = 'block';
          qRef.current.style.visibility = 'visible';
          qRef.current.style.opacity = '1';
        }
        nextQ();
        enableQButtons();
        const qItem = STAGES[s.stage][s.round];
        const isStriker = s.round % 2 === 0;
        setMsgText(`${isStriker ? '⚽ دورك: مسدد' : '🧤 دورك: حارس مرمى'} · ${qItem.lesson}`);
      }
    } else {
      loadAudioBuffers();
    }
  };

  const beginGame = (startStage = 0) => {
    // 1. Strict Stage Lock Verification:
    if (!isStageUnlocked(startStage)) {
      setMsgText(`⚠️ المرحلة ${startStage + 1} (${STAGE_NAMES[startStage]}) مغلقة بقرار المعلم ولا يمكن دخولها.`);
      setShowStartModal(true);
      return;
    }

    unlockAudio();
    stopAll();
    setShowStartModal(false);
    setShowStageSummaryModal(false);
    const s = gameStateRef.current;
    s.name = playerName.trim() || 'لاعب';
    s.totEduScore = 0;
    s.cg = false;
    s.cb = false;
    s.stage = startStage;
    s.eduScore = 0;
    s.studentGoals = 0;
    s.opponentGoals = 0;
    s.studentSaves = 0;
    s.round = 0;
    s.res = [];
    s.busy = false;
    s.ended = false;
    s.stageDone = false;
    s.evaluated = false;
    s.answeredThisRound = false;
    s.streak = 0;
    s.consecutiveMisses = 0;
    s.hintUsed = false;
    setHintButtonDisabled(false);
    setHintButtonText('💡 احذف إجابة خاطئة');
    resetRound();
    setRsButtonVisible(false);
    s.wrong = 0;
    s.win = null;
    s.PRJ.length = 0;
    s.CROWD.forEach((p: any) => {
      p.st = 0;
    });
    drawDots();

    // Check if intro has not yet played in this session:
    if (!s.introPlayed && !s.muted) {
      s.started = false;
      s.introInProgress = true;
      introPlayingRef.current = true;
      gameStartStateRef.current = 'introPlaying';
      setGameStartState('introPlaying');

      // Keep question container strictly empty and hidden during intro audio
      if (qRef.current) {
        qRef.current.innerHTML = '';
        qRef.current.style.display = 'none';
        qRef.current.style.visibility = 'hidden';
      }

      setMsgText('﷽ افتتاحية البطولة: مرحباً بكم في تحدي ركلات الترجيح...');

      // Directly & synchronously trigger audio playback on this user click for iOS Safari
      playIntro(
        encAudio('صوت  البداية 1.mp3'),
        // 1. Native 'ended' event callback (ONLY when audio genuinely finishes):
        () => {
          s.introPlayed = true;
          s.introInProgress = false;
          introPlayingRef.current = false;
          gameStartStateRef.current = 'introFinished';
          setGameStartState('introFinished');

          // Transition to playing and reveal Question 1
          setTimeout(() => {
            s.started = true;
            gameStartStateRef.current = 'playing';
            setGameStartState('playing');
            if (qRef.current) {
              qRef.current.style.display = 'block';
              qRef.current.style.visibility = 'visible';
              qRef.current.style.opacity = '1';
            }
            startAmb();
            nextQ();
            const qItem = STAGES[s.stage][s.round];
            const isStriker = s.round % 2 === 0;
            setMsgText(`${isStriker ? 'أنت المسدد ⚽' : 'أنت الحارس 🧤'} · ${qItem.lesson}`);
          }, 80);
        },
        // 2. Error / rejection handler:
        (err) => {
          console.warn('[Central Audio Manager] Intro audio failed/rejected:', err);
          s.introInProgress = false;
          introPlayingRef.current = false;
          gameStartStateRef.current = 'introError';
          setGameStartState('introError');
          if (qRef.current) {
            qRef.current.innerHTML = '';
            qRef.current.style.display = 'none';
            qRef.current.style.visibility = 'hidden';
          }
          setMsgText('⚠️ تعذر تشغيل الصوت الافتتاحي تلقائياً. يرجى الضغط على زر التشغيل لبدء البطولة.');
        }
      );
    } else {
      // Intro already played or muted: start match directly
      s.started = true;
      s.introInProgress = false;
      introPlayingRef.current = false;
      gameStartStateRef.current = 'playing';
      setGameStartState('playing');
      if (qRef.current) {
        qRef.current.style.display = 'block';
        qRef.current.style.visibility = 'visible';
        qRef.current.style.opacity = '1';
      }
      startAmb();
      nextQ();
      const qItem = STAGES[s.stage][s.round];
      const isStriker = s.round % 2 === 0;
      setMsgText(`${isStriker ? 'أنت المسدد ⚽' : 'أنت الحارس 🧤'} · ${qItem.lesson}`);
      startWaitingAudioSequence();
    }
  };

  // Direct retry handler for opening audio if blocked by iOS Safari policy
  const handleRetryIntroAudio = () => {
    unlockAudio();
    stopAll();
    const s = gameStateRef.current;
    s.started = false;
    s.introInProgress = true;
    introPlayingRef.current = true;
    gameStartStateRef.current = 'introPlaying';
    setGameStartState('introPlaying');

    if (qRef.current) {
      qRef.current.innerHTML = '';
      qRef.current.style.display = 'none';
      qRef.current.style.visibility = 'hidden';
    }

    setMsgText('﷽ افتتاحية البطولة: استمع لصوت البداية والبسملة...');

    playIntro(
      encAudio('صوت  البداية 1.mp3'),
      () => {
        s.introPlayed = true;
        s.introInProgress = false;
        introPlayingRef.current = false;
        gameStartStateRef.current = 'introFinished';
        setGameStartState('introFinished');

        setTimeout(() => {
          s.started = true;
          gameStartStateRef.current = 'playing';
          setGameStartState('playing');
          if (qRef.current) {
            qRef.current.style.display = 'block';
            qRef.current.style.visibility = 'visible';
            qRef.current.style.opacity = '1';
          }
          startAmb();
          nextQ();
          const qItem = STAGES[s.stage][s.round];
          const isStriker = s.round % 2 === 0;
          setMsgText(`${isStriker ? 'أنت المسدد ⚽' : 'أنت الحارس 🧤'} · ${qItem.lesson}`);
        }, 80);
      },
      (err) => {
        console.warn('[Central Audio Manager] Retry intro failed:', err);
        s.introInProgress = false;
        introPlayingRef.current = false;
        gameStartStateRef.current = 'introError';
        setGameStartState('introError');
      }
    );
  };

  // Main lifecycle: Canvas crowd setup, loop, and touch listener
  useEffect(() => {
    // Crowd setup
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cols = ['#d33', '#eee', '#2a5bd7', '#f2c230', '#222', '#e87a1e'];
    const shc = ['#2a7de1', '#e33', '#2fb34f', '#f2c230', '#8e44ad', '#e67e22'];
    const crowd: any[] = [];
    for (let row = 0; row < 7; row++) {
      for (let cx = 4; cx < 640; cx += 10) {
        if (rnd() < 0.55) {
          crowd.push({
            x: cx + rnd() * 4,
            y: 30 + row * 11.5,
            c: cols[Math.floor(rnd() * 6)],
            p: rnd() * 6,
            o: rnd(),
            st: 0,
            sh: shc[Math.floor(rnd() * 6)],
            sk: rnd() < 0.5 ? '#e8b890' : '#b98a64'
          });
        }
      }
    }
    gameStateRef.current.CROWD = crowd;

    // Check saved progress
    const P0 = LS.g('pk_prog');
    if (P0 && P0.name) setPlayerName(P0.name);
    if (P0 && P0.next > 0) {
      if (isStageUnlocked(P0.next)) {
        setCanResume(true);
        setResumeText(`استكمال من المرحلة ${P0.next + 1}`);
      } else {
        setCanResume(false);
      }
    }

    // Canvas animation loop
    let lastTime = 0;
    let animId: number;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - (lastTime || now)) / 1000);
      lastTime = now;
      update(now);
      tick();
      draw(ctx, dt, now);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Initial setup of dots only (questions are revealed strictly after intro audio finishes)
    drawDots();

    // iOS Safari audio unlock on first touch
    const handleFirstTouch = () => {
      unlockAudio();
      loadAudioBuffers();
    };
    window.addEventListener('pointerdown', handleFirstTouch, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });
    window.addEventListener('click', handleFirstTouch, { once: true, passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointerdown', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  const handleUpdateStudentName = (name: string) => {
    setPlayerName(name);
    const p = LS.g('pk_prog') || {};
    p.name = name;
    LS.s('pk_prog', p);
  };

  return (
    <>
      {/* PENALTY SHOOTOUT GAME (لعبة ركلات الترجيح المستقلة تماماً) */}
      <div className="wrap">
        <div className="header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="sm"
              onClick={() => setShowStartModal(true)}
              style={{ margin: 0, background: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '6px 14px' }}
            >
              📋 المراحل
            </button>
            <button
              type="button"
              className="sm"
              onClick={showLB}
              style={{ margin: 0 }}
            >
              🏅 الأبطال
            </button>
          </div>
          <h1 style={{ margin: 0, fontSize: '17px' }}>⚽ لغتي تحكي — ركلات الترجيح</h1>
          {IS_EMBEDDED && <button type="button" className="sm" onClick={() => window.parent.postMessage({ type: 'LT_PENALTY_EXIT' }, window.location.origin)} style={{ margin: 0, background: '#0f766e', color: '#fff', fontWeight: 800 }}>↩ العودة إلى لغتي</button>}
          <button
            type="button"
            className={`teacher-btn-entry ${isTeacherAuthenticated ? 'active' : ''}`}
            style={{ display: IS_EMBEDDED ? 'none' : 'inline-flex' }}
            onClick={() => {
              if (isTeacherAuthenticated) {
                setShowTeacherPanelModal(true);
              } else {
                setTeacherPinInput('');
                setTeacherAuthError('');
                setShowTeacherAuthModal(true);
              }
            }}
            title="لوحة تحكم المعلم لإدارة فتح وإغلاق المراحل"
          >
            👨‍🏫 {isTeacherAuthenticated ? 'لوحة المعلم' : 'دخول المعلم'}
          </button>
        </div>

      <div id="hud">
        {/* الصف العلوي: نقاط الركلات وهوية الجولة */}
        <div className="hud-row-top">
          <div id="dots">
            {dots.map((res, i) => (
              <span
                key={i}
                className={res === 1 ? 'g' : res === 0 ? 'm' : ''}
                title={`الركلة ${i + 1} (${i % 2 === 0 ? 'تسديد الطالب' : 'حراسة الطالب'})`}
              />
            ))}
          </div>
          <div>
            الركلة: <b id="rd">{roundDisplay}</b>/10 · <span style={{ color: '#16a34a', fontWeight: 700 }}>{CHAMPIONSHIP_ROUNDS[Math.min(stageDisplay - 1, 4)]?.shortTitle || `الجولة ${stageDisplay}`}</span>
          </div>
        </div>

        {/* الصف السفلي: نتيجة المباراة ونقاط التعلم منفصلة تماماً */}
        <div className="hud-row-bottom">
          <div className="match-scores">
            <span>⚽ أهدافك: <b>{studentGoalsDisplay}</b></span>
            <span>🥅 أهداف المنافس: <b>{opponentGoalsDisplay}</b></span>
            <span>🧤 تصدياتك: <b>{studentSavesDisplay}</b></span>
          </div>
          <div className="edu-score-badge">
            📚 نقاط التعلم: <b>{eduScoreDisplay}</b>/10
          </div>
        </div>
      </div>

      <div className="cw">
        <canvas id="c" ref={canvasRef} width="640" height="440" />
        {/* Phase 9.5: شارة دور وحيدة وصغيرة ثابتة يسار الملعب */}
        <div className="fixed-role-pill">
          {isStrikerDisplay ? 'أنت المسدد ⚽' : 'أنت الحارس 🧤'}
        </div>
        <div
          id="q"
          ref={qRef}
          style={{
            display: (gameStartState === 'playing' || gameStartState === 'introFinished') ? 'block' : 'none',
            visibility: (gameStartState === 'playing' || gameStartState === 'introFinished') ? 'visible' : 'hidden'
          }}
        />
      </div>

      <div style={{ marginTop: '8px' }}>
        <button id="hn" className="sm" disabled={hintButtonDisabled || gameStartState !== 'playing'} onClick={handleHintClick}>
          {hintButtonText}
        </button>{' '}
        <button id="lbb" className="sm" onClick={showLB}>
          🏅 الأبطال
        </button>{' '}
        <button id="mu" style={{ padding: '4px 12px', fontSize: '15px', marginTop: '6px' }} onClick={handleMuteToggle}>
          {isMuted ? '🔇 الصوت' : '🔊 الصوت'}
        </button>
      </div>

      {rsButtonVisible && (
        <button id="rs" style={{ display: 'inline-block', marginBottom: '8px' }} onClick={handleNextStageOrRestart}>
          {rsButtonText}
        </button>
      )}

      <p>تناوب بين التسديد والحراسة: أجب بدقة لتحرز هدفًا وتتصدى لتسديدة المنافس!</p>
    </div>

    {/* Global Modals: Accessible from both Student Homepage and Shootout Game */}

      {/* Intro Audio Error & Retry Modal (iOS Safari & Browser Permission) */}
      {gameStartState === 'introError' && (
        <div id="intro-err-ov" className="ov" style={{ zIndex: 99999 }}>
          <div className="card" style={{ maxWidth: '440px', width: 'min(92vw, 440px)', textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎙️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', margin: '0 0 10px 0' }}>
              الافتتاحية الصوتية للمباراة
            </h3>
            <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', marginBottom: '20px' }}>
              يتطلب متصفحك إذناً لبدء الاستماع إلى صوت البداية الرسمي («بسم الله الرحمن الرحيم» حتى «أبطاله»). اضغط على الزر أدناه لبدء الصوت ودخول المباراة:
            </p>
            <button
              type="button"
              className="stage-act-btn"
              style={{ width: '100%', padding: '12px 18px', fontSize: '15px', fontWeight: 700, borderRadius: '10px' }}
              onClick={handleRetryIntroAudio}
            >
              ▶️ تشغيل الصوت الافتتاحي وبدء البطولة
            </button>
          </div>
        </div>
      )}

      {/* Start / Stage Selection Modal */}
      {showStartModal && (
        <div id="ov" className="ov">
          <div className="card" style={{ maxWidth: '480px', width: 'min(94vw, 480px)' }}>
            <h2>⚽ لغتي تحكي — ركلات الترجيح</h2>
            <p style={{ fontSize: '13px', color: '#666' }}>
              اكتب اسمك واختر إحدى المراحل المفتوحة لبدء التحدي والتناوب
            </p>
            <input
              id="nm"
              maxLength={24}
              placeholder="اسم الطالب"
              value={playerName}
              readOnly={IS_EMBEDDED}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const firstOpen = stageLocks.findIndex(Boolean);
                  if (firstOpen !== -1) beginGame(firstOpen);
                }
              }}
            />

            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                📖 اختر المرحلة التعليمية:
              </div>
              <div className="stage-list">
                {STAGE_NAMES.map((name, idx) => {
                  const unlocked = isStageUnlocked(idx);
                  const pBest = LS.g('pk_prog')?.best?.[idx];
                  return (
                    <div key={idx} className={`stage-card-item ${unlocked ? '' : 'locked'}`}>
                      <div className="stage-info">
                        <div className="stage-title">
                          المرحلة {idx + 1}: {name}
                        </div>
                        <div className="stage-meta">
                          {unlocked ? (
                            <span className="badge-open">🔓 مفتوحة</span>
                          ) : (
                            <span className="badge-locked">🔒 مغلقة بقرار المعلم</span>
                          )}
                          {pBest !== undefined && (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>
                              ⭐ أفضل نتيجة: {pBest}/10
                            </span>
                          )}
                        </div>
                      </div>
                      {unlocked ? (
                        <button
                          className="stage-act-btn"
                          onClick={() => beginGame(idx)}
                        >
                          ⚽ دخول
                        </button>
                      ) : (
                        <button
                          className="stage-act-btn locked"
                          disabled
                          title="هذه المرحلة مغلقة بقرار المعلم ولا يمكن دخولها حالياً"
                        >
                          🔒 مغلقة
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  className="sm"
                  onClick={showLB}
                  style={{ margin: 0 }}
                >
                  🏅 الأبطال
                </button>
              </div>
              <button
                type="button"
                className="teacher-btn-entry"
                onClick={() => {
                  if (isTeacherAuthenticated) {
                    setShowTeacherPanelModal(true);
                  } else {
                    setTeacherPinInput('');
                    setTeacherAuthError('');
                    setShowTeacherAuthModal(true);
                  }
                }}
              >
                👨‍🏫 {isTeacherAuthenticated ? 'لوحة المعلم (مفعّلة)' : 'دخول المعلم'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Summary Modal (Phase 13: 6 Separate Stats & Championship Card) */}
      {showStageSummaryModal && (
        <div id="sm-ov" className="ov" style={{ display: 'flex' }}>
          <div className="card" style={{ maxWidth: '460px', width: 'min(94vw, 460px)', textAlign: 'center', direction: 'rtl' }}>
            <h2>🏆 نهاية {STAGE_NAMES[gameStateRef.current.stage] || `المرحلة ${stageDisplay}`}</h2>
            <p style={{ fontWeight: 600, color: '#16a34a', margin: '4px 0 12px', fontSize: '13.5px' }}>
              {CHAMPIONSHIP_ROUNDS[gameStateRef.current.stage]?.shortTitle || ''}
            </p>

            {/* Grand Final Championship Trophy Card (Stage 5) */}
            {gameStateRef.current.stage === 4 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(202, 138, 4, 0.18))',
                  border: '2px solid #eab308',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  margin: '8px 0 12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(234, 179, 8, 0.2)'
                }}
              >
                <div style={{ fontSize: '36px', lineHeight: '1.2' }}>🏆</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#854d0e', margin: '4px 0' }}>
                  تتويج بطل كأس بطولة لغتي تحكي لعام 1448 هـ!
                </div>
                <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                  🇸🇦 مبارك للمنتخب وللبطل {playerName || 'اللاعب'} التتويج بلقب البطولة الكبرى
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1f2937', marginTop: '6px' }}>
                  المجموع الكلي لنقاط البطولة: <span style={{ color: '#16a34a', fontSize: '18px' }}>{gameStateRef.current.totEduScore}</span> من 50
                </div>
              </div>
            )}

            {/* 6 Separated Statistical Items (Phase 13) */}
            <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '12px', margin: '8px 0', border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '8px', textAlign: 'right' }}>
                📊 إحصائيات الجولة المعتمدة (10 ركلات ترجيح):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                {/* 1. Student Goals */}
                <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>⚽ أهدافك</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d' }}>{studentGoalsDisplay}</div>
                </div>
                {/* 2. Opponent Goals */}
                <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>🥅 أهداف المنافس</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>{opponentGoalsDisplay}</div>
                </div>
                {/* 3. Goalkeeper Saves */}
                <div style={{ background: '#ffffff', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>🧤 تصدياتك</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>{studentSavesDisplay}</div>
                </div>
                {/* 4. Educational Points */}
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>⭐ نقاط التعلم</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#15803d' }}>{eduScoreDisplay}/10</div>
                </div>
                {/* 5. Correct Answers */}
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  <div style={{ fontSize: '11px', color: '#15803d' }}>✅ إجابات صحيحة</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>
                    {reviewList.filter(r => r.isCorrect).length}
                  </div>
                </div>
                {/* 6. Incorrect Answers */}
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '8px 4px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '11px', color: '#991b1b' }}>❌ إجابات خاطئة</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>
                    {reviewList.filter(r => !r.isCorrect).length}
                  </div>
                </div>
              </div>

              {/* Match outcome banner */}
              <p style={{ textAlign: 'center', fontWeight: 800, margin: '10px 0 2px', fontSize: '13px', color: studentGoalsDisplay > opponentGoalsDisplay ? '#15803d' : studentGoalsDisplay === opponentGoalsDisplay ? '#d97706' : '#b91c1c' }}>
                {studentGoalsDisplay > opponentGoalsDisplay
                  ? '🎉 فوز رائع للطالب في هذه المباراة!'
                  : studentGoalsDisplay === opponentGoalsDisplay
                  ? '🤝 تعادل مثير وحماسي بين الفريقين!'
                  : '💪 تفوق المنافس! أمامك فرصة التعويض والتألق.'}
              </p>
            </div>

            {/* End of Stage Review Button (Phase 2 & 13) */}
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              style={{
                width: '100%',
                margin: '10px 0 6px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📝 مراجعة الأخطاء والإجابات
            </button>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
              {gameStateRef.current.stage < 4 ? (
                isStageUnlocked(gameStateRef.current.stage + 1) ? (
                  <button onClick={handleNextStageOrRestart} style={{ flex: 1 }}>
                    الجولة التالية ▶
                  </button>
                ) : (
                  <button
                    disabled
                    style={{ flex: 1, background: '#7f8c8d', cursor: 'not-allowed' }}
                    title="الجولة التالية مغلقة بقرار المعلم"
                  >
                    🔒 الجولة التالية مغلقة
                  </button>
                )
              ) : (
                <button onClick={handleNextStageOrRestart} style={{ flex: 1 }}>
                  العب البطولة من جديد 🔄
                </button>
              )}
              <button
                className="sm"
                onClick={() => {
                  setShowStageSummaryModal(false);
                  setShowStartModal(true);
                }}
                style={{ margin: 0, background: '#16a34a', color: '#ffffff', fontWeight: 700 }}
              >
                📋 قائمة المراحل
              </button>
              <button className="sm" onClick={showLB} style={{ margin: 0 }}>
                🏅 الأبطال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Transition Modal (Phase 7: Team presentation, kit preview & entry) */}
      {showRoundTransitionModal && (
        <div className="ov" style={{ display: 'flex', zIndex: 65 }}>
          <div className="card" style={{ maxWidth: '440px', width: 'min(94vw, 440px)', textAlign: 'center', direction: 'rtl' }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>⚽</div>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px' }}>
              تقديم {CHAMPIONSHIP_ROUNDS[nextTargetStage]?.name || `الجولة ${nextTargetStage + 1}`}
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 14px' }}>
              {CHAMPIONSHIP_ROUNDS[nextTargetStage]?.shortTitle}
            </p>

            {/* Team Identity & Jersey Color Preview */}
            <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: '14px', margin: '10px 0', border: '1px solid var(--bd)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                🎽 طقم الفريق واللاعب:
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '8px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: CHAMPIONSHIP_ROUNDS[nextTargetStage]?.shirt || '#f59e0b',
                      border: '2px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      margin: '0 auto 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: (nextTargetStage === 3 || nextTargetStage === 4) ? '#ffffff' : '#1e3a8a',
                      fontWeight: 800,
                      fontSize: '18px'
                    }}
                  >
                    {CHAMPIONSHIP_ROUNDS[nextTargetStage]?.number}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>القميص (رقم {CHAMPIONSHIP_ROUNDS[nextTargetStage]?.number})</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '8px',
                      backgroundColor: CHAMPIONSHIP_ROUNDS[nextTargetStage]?.shorts || '#1d4ed8',
                      border: '2px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      margin: '0 auto 4px'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>الشورت</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '10px', lineHeight: '1.5' }}>
                {nextTargetStage === 0 && '⚡ قيادة الهجوم بالنجم رقم 7 واحتفالية السييي الأسطورية!'}
                {nextTargetStage === 1 && '⭐ صانع الألعاب الماهر بالقميص الأزرق رقم 10.'}
                {nextTargetStage === 2 && '🔥 القناص رقم 9 بالقميص المخطط بالأسود والأصفر.'}
                {nextTargetStage === 3 && '⚡ الجناح السريع رقم 11 بالقميص الأخضر والشورت الأبيض.'}
                {nextTargetStage === 4 && '🇸🇦 نهائي كأس البطولة باللون الأخضر السعودي والأجواء الاحتفالية الكبرى!'}
              </div>
            </div>

            <button
              type="button"
              onClick={confirmRoundTransition}
              style={{
                width: '100%',
                padding: '12px 18px',
                fontSize: '15px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '14px'
              }}
            >
              ⚽ دخول أرضية الملعب ⚽
            </button>

            <button
              type="button"
              onClick={() => {
                setShowStageSummaryModal(false);
                setShowStartModal(true);
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '13.5px',
                fontWeight: 700,
                background: '#f1f5f9',
                color: '#334151',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              📋 اختيار مرحلة أخرى
            </button>
          </div>
        </div>
      )}

      {/* End-of-Round Review Modal (مراجعة الأخطاء والإجابات) */}
      {showReviewModal && (
        <div className="ov" style={{ display: 'flex', zIndex: 60 }}>
          <div className="card" style={{ maxWidth: '640px', width: 'min(94vw, 640px)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', textAlign: 'right', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>📝 مراجعة الأخطاء والإجابات</h2>
              <span style={{ fontSize: '12px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                المرحلة {stageDisplay}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 10px' }}>
              💡 هذه المراجعة تهدف إلى ترسيخ الفهم وتعزيز التعلم الذاتي، ولا تمنح أو تخصم أي نقاط إضافية.
            </p>

            {/* Performance Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--bd)' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>إجمالي الأسئلة</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{reviewList.length}</div>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <div style={{ fontSize: '11px', color: '#15803d' }}>الإجابات الصحيحة</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
                  {reviewList.filter(r => r.isCorrect).length}
                </div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <div style={{ fontSize: '11px', color: '#b91c1c' }}>الإجابات الخاطئة</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
                  {reviewList.filter(r => !r.isCorrect).length}
                </div>
              </div>
            </div>

            {/* Scrollable Questions List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Mistakes Section */}
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#dc2626', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>❌ الأسئلة التي تحتاج مراجعة</span>
                  <span>({reviewList.filter(r => !r.isCorrect).length})</span>
                </div>
                {reviewList.filter(r => !r.isCorrect).length === 0 ? (
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                    🎉 رائع جداً! لا توجد أخطاء في هذه المرحلة، أجبت عن جميع الأسئلة بصورة صحيحة!
                  </div>
                ) : (
                  reviewList.map((item, idx) => {
                    if (item.isCorrect) return null;
                    const q = item.qItem;
                    return (
                      <div key={idx} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12.5px', color: '#991b1b', fontWeight: 700, marginBottom: '4px' }}>
                          السؤال {idx + 1}: {q.question}
                        </div>
                        <div style={{ fontSize: '12px', margin: '4px 0', color: '#b91c1c' }}>
                          <b>إجابتك:</b> <span style={{ textDecoration: 'line-through' }}>{item.studentChoiceIdx >= 0 ? q.options[item.studentChoiceIdx] : 'لم تتم الإجابة'}</span>
                        </div>
                        <div style={{ fontSize: '12px', margin: '4px 0', color: '#15803d' }}>
                          <b>الإجابة الصحيحة:</b> <span>{q.options[q.answer]}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', margin: '6px 0 2px', background: 'rgba(0,0,0,0.04)', padding: '6px 8px', borderRadius: '6px', color: '#374151', lineHeight: '1.4' }}>
                          <b>💡 التفسير التعليمي:</b> {q.explanation}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Correct Answers Section */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#16a34a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✅ الأسئلة التي أتقنتها بنجاح</span>
                  <span>({reviewList.filter(r => r.isCorrect).length})</span>
                </div>
                {reviewList.map((item, idx) => {
                  if (!item.isCorrect) return null;
                  const q = item.qItem;
                  return (
                    <div key={idx} style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12.5px', color: '#166534', fontWeight: 700, marginBottom: '4px' }}>
                        السؤال {idx + 1}: {q.question}
                      </div>
                      <div style={{ fontSize: '12px', margin: '4px 0', color: '#15803d' }}>
                        <b>إجابتك الصحيحة:</b> <span>{q.options[q.answer]}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', margin: '6px 0 2px', background: 'rgba(0,0,0,0.04)', padding: '6px 8px', borderRadius: '6px', color: '#374151', lineHeight: '1.4' }}>
                        <b>💡 التفسير:</b> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--bd)', paddingTop: '10px', marginTop: '10px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ width: '100%', maxWidth: '240px', padding: '8px 16px', background: '#374151', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                ✕ إغلاق المراجعة والعودة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Authentication Modal */}
      {showTeacherAuthModal && (
        <div className="ov" style={{ display: 'flex' }}>
          <div className="card" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <h2>🔐 دخول لوحة تحكم المعلم</h2>
            <p style={{ fontSize: '13px', margin: '8px 0' }}>
              أدخل رمز المرور للتحكم في فتح وإغلاق مراحل اللعبة:
            </p>
            <input
              type="password"
              placeholder="رمز المرور (الافتراضي 1448)"
              value={teacherPinInput}
              onChange={e => setTeacherPinInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTeacherLogin();
              }}
              autoFocus
            />
            {teacherAuthError && (
              <div style={{ color: '#e74c3c', fontSize: '13px', margin: '4px 0', fontWeight: 600 }}>
                {teacherAuthError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
              <button onClick={handleTeacherLogin} style={{ flex: 1 }}>
                تأكيد الدخول
              </button>
              <button
                className="sm"
                onClick={() => {
                  setShowTeacherAuthModal(false);
                  setTeacherAuthError('');
                }}
                style={{ margin: 0 }}
              >
                إلغاء
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
              💡 رمز المرور الافتراضي للمعلم هو: <b>1448</b>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Control Panel Modal */}
      {showTeacherPanelModal && (
        <div className="ov" style={{ display: 'flex' }}>
          <div className="card" style={{ maxWidth: '520px', width: 'min(94vw, 520px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>👨‍🏫 لوحة تحكم المعلم</h2>
              <span className="badge-open">الصلاحيات مفعلة</span>
            </div>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 10px', textAlign: 'right' }}>
              تحكم بفتح وإغلاق كل مرحلة بصورة مستقلة. المرحلة المغلقة لا يستطيع الطالب دخولها حتى لو أنهى المرحلة السابقة.
            </p>

            {/* Quick Bulk Actions */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="sm"
                onClick={() => setAllStagesLock(true)}
                style={{ margin: 0, background: '#27ae60' }}
              >
                🔓 فتح جميع المراحل
              </button>
              <button
                type="button"
                className="sm"
                onClick={() => setAllStagesLock(false)}
                style={{ margin: 0, background: '#c0392b' }}
              >
                🔒 إغلاق جميع المراحل
              </button>
              <button
                type="button"
                className="sm"
                onClick={() => {
                  const oneOnly = [true, false, false, false, false];
                  setStageLocks(oneOnly);
                  LS.s('pk_stage_locks', oneOnly);
                }}
                style={{ margin: 0, background: '#2980b9' }}
              >
                🎯 الأولى فقط
              </button>
            </div>

            {/* 5 Stages Toggle List */}
            <div style={{ maxHeight: '260px', overflowY: 'auto', paddingRight: '4px', textAlign: 'right' }}>
              {STAGE_NAMES.map((name, idx) => {
                const isUnlocked = isStageUnlocked(idx);
                return (
                  <div
                    key={idx}
                    className={`teacher-stage-row ${isUnlocked ? '' : 'is-locked'}`}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>
                        المرحلة {idx + 1}: {name}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '2px' }}>
                        الحالة الحالية:{' '}
                        {isUnlocked ? (
                          <span style={{ color: '#27ae60', fontWeight: 700 }}>مفتوحة ومتاحة للطلاب 🔓</span>
                        ) : (
                          <span style={{ color: '#e74c3c', fontWeight: 700 }}>مغلقة وممنوعة على الطلاب 🔒</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`teacher-toggle-btn ${isUnlocked ? 'to-lock' : 'to-open'}`}
                      onClick={() => updateStageLock(idx, !isUnlocked)}
                    >
                      {isUnlocked ? '🔒 إغلاق' : '🔓 فتح'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Teacher Announcement Broadcasting Section */}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg)', borderRadius: '10px', textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                📢 نشر إعلان وتوجيه مباشر للطلاب في الشريط المتحرك:
              </div>
              <textarea
                rows={2}
                placeholder="اكتب إعلانك أو توجيهك التربوي للطلاب ليظهر في مقدمة شريط الإعلانات..."
                value={teacherAnnouncementInput}
                onChange={e => setTeacherAnnouncementInput(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', padding: '8px', border: '1px solid var(--bd, #cbd5e1)', fontSize: '12.5px', direction: 'rtl', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  className="sm"
                  onClick={handlePublishTeacherAnnouncement}
                  style={{ background: '#2563eb', margin: 0, padding: '6px 14px' }}
                >
                  🚀 نشر في شريط الإعلانات
                </button>
                {teacherAnnouncementSavedMsg && (
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    {teacherAnnouncementSavedMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Security Section: Change Teacher PIN */}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg)', borderRadius: '10px', textAlign: 'right' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setShowChangePinSection(!showChangePinSection)}
              >
                <span style={{ fontWeight: 700, fontSize: '13px' }}>⚙️ إعدادات الأمان وتغيير رمز المعلم</span>
                <span style={{ fontSize: '12px', color: '#666' }}>{showChangePinSection ? '▲ إخفاء' : '▼ إظهار'}</span>
              </div>
              {showChangePinSection && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="password"
                    placeholder="أدخل رمز مرور المعلم الجديد"
                    value={newPinInput}
                    onChange={e => setNewPinInput(e.target.value)}
                    style={{ marginBottom: '6px' }}
                  />
                  <button className="sm" onClick={handleChangePin} style={{ margin: '0 0 6px' }}>
                    حفظ الرمز الجديد
                  </button>
                  {pinChangeSuccessMsg && (
                    <div style={{ color: '#27ae60', fontSize: '12px', fontWeight: 600 }}>
                      {pinChangeSuccessMsg}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons: Logout and Close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <button
                type="button"
                className="sm"
                onClick={handleTeacherLogout}
                style={{ background: '#e74c3c', margin: 0 }}
              >
                🚪 تسجيل خروج المعلم
              </button>
              <button
                type="button"
                onClick={() => setShowTeacherPanelModal(false)}
              >
                ✕ إغلاق وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLBModal && (
        <div id="lbv" className="ov" style={{ display: 'flex' }}>
          <div className="card" id="lbc">
            <h2>🏅 لوحة الأبطال</h2>
            {lbRows.length ? (
              lbRows.slice(0, 10).map((r, i) => (
                <p key={i}>
                  {i + 1}. {esc(r[0])} — {esc(r[1])} نقطة
                </p>
              ))
            ) : (
              <p>لا توجد نتائج بعد</p>
            )}
            <div style={{ marginTop: '14px' }}>
              <button id="lbx" onClick={() => setShowLBModal(false)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
