import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UNIT1_LESSONS,
  U,
  COMMON_MISTAKES_GUIDES,
  REMEDIAL_COMMON_QS,
  DAILY_CHALLENGE_PROGRESSION,
  DailyChallengeItem,
  QuestionItem
} from './data';
import { UNIT2_LESSONS, UNIT3_LESSONS } from './unitsData';
import { NAFES_STAGES, NafesStageExam } from './nafesBank';
import {
  DETECTIVE_BANK,
  ORDER_BANK,
  MEANING_BANK,
  SPEED_BANK,
  ORDER_UNITS_INFO,
  OrderUnitInfo,
  getOrderBankByUnit,
  getDetectiveBankByUnits,
  getMeaningBankByUnits,
  getSpeedBankByUnits,
  getOrderBankByUnits,
  getNonRepeatingBatch,
  DetectiveQuestion,
  OrderQuestion,
  MeaningQuestion,
  SpeedQuestion
} from './gamesBank';
import { SPLASH_SVG } from './splashImage';
import { CoverSplash } from './coverSplash';
import { fireCelebratoryFireworks } from './confetti';
import {
  MOTIVATIONAL_TITLES,
  MotivationalTitleInfo,
  getStudentRank,
  hasEarnedTitle
} from './titlesData';
import {
  ParentMessage,
  MessageCategory,
  MessageStatus,
  TeacherAnnouncementItem
} from './parentMessagesTypes';
import { ParentMessagesModal } from './parentMessagesModal';
import { TeacherMessagesManager } from './teacherMessagesManager';
import { TeacherAnnouncementsManager } from './teacherAnnouncementsManager';
import { RaceFinishModal } from './raceFinishModal';
import { StudentStatsManager } from './studentStatsManager';
import {
  db,
  auth,
  googleProvider,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  toSafeDocId,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  signInWithPopup,
  signOut
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const OPTION_LABELS = ['أ-', 'ب-', 'ج-', 'د-', 'هـ-', 'و-'];

interface LastActivity {
  kind: 'unit' | 'nafes' | 'lesson' | 'remedial';
  n?: number;
  label: string;
}

interface FeedbackItem {
  id?: string;
  role: string;
  cls?: string;
  text: string;
  status: string;
  createdAt?: number;
}

interface MistakeRecord {
  question: QuestionItem;
  wrongChoiceIndex: number;
  sourceTitle: string;
  timestamp: string;
}

interface DailyChallengeState {
  currentIndex: number;
  nextUnlockMs: number;
  solvedDays: Record<number, { timeSpentSec: number; attempts: number; solvedAtMs: number }>;
}

interface StudentProfile {
  name: string;
  code: string;
  cls: string;
  points: number;
  badges: string[];
  correct: number;
  attempts: number;
  progress: number;
  completed: string[];
  lastActivity: LastActivity | null;
  seenQuestions?: Record<string, number[]>;
  feedback?: FeedbackItem[];
  mistakes?: MistakeRecord[];
  resolvedMistakesCount?: number;
  nafesStageIndex?: number;
  completedNafesStages?: string[];
  lastQuizTitle?: string;
  lastQuizScore?: number;
  lastQuizTotal?: number;
  isBlocked?: boolean;
  dailyChallenge?: DailyChallengeState;
  dailyCurrentIndex?: number;
  dailyNextUnlockMs?: number;
  raceCompletedAt?: number;
  finishLineReached?: boolean;
  completedQuestionIds?: string[];
  gameCooldowns?: Record<string, number>;
  registeredAt?: number;
  lastActiveAt?: number;
  sessionCount?: number;
  gradeLevel?: string;
  lastActivityType?: string;
  updatedAt?: number;
}

export interface CloudStudentRow {
  docId: string;
  profileId: string;
  name: string;
  code: string;
  cls: string;
  points: number;
  badges: string[];
  correct: number;
  attempts: number;
  progress: number;
  completed: string[];
  nafesStageIndex: number;
  completedNafesStages?: string[];
  dailyCurrentIndex: number;
  dailyNextUnlockMs: number;
  lastQuizTitle: string;
  lastQuizScore: number;
  lastQuizTotal: number;
  isBlocked: boolean;
  raceCompletedAt?: number;
  finishLineReached?: boolean;
  updatedAt: number;
  registeredAt?: number;
  lastActiveAt?: number;
  sessionCount?: number;
  gradeLevel?: string;
  lastActivityType?: string;
}

interface AppSettings {
  announcement: string;
  enforce24hChallengeLock: boolean;
  enableGames: boolean;
  enableNafes: boolean;
  enableFeedback: boolean;
  adminPin: string;
  updatedAt: number;
  orderUnlockAll?: boolean;
  orderUnit1Open?: boolean;
  orderUnit2Open?: boolean;
  orderUnit3Open?: boolean;
  unit1Open?: boolean;
  unit2Open?: boolean;
  unit3Open?: boolean;
  gameDetectiveOpen?: boolean;
  gameOrderOpen?: boolean;
  gameMeaningOpen?: boolean;
  gameSpeedOpen?: boolean;
  platformManualStatus?: 'open' | 'closed';
  scheduleEnabled?: boolean;
  scheduledOpenAt?: string;
  scheduledCloseAt?: string;
  scheduleNote?: string;
  nafesStage1Open?: boolean;
  nafesStage2Open?: boolean;
  nafesStage3Open?: boolean;
  nafesStage4Open?: boolean;
  tickerCustomText?: string;
  tickerAnnouncements?: TeacherAnnouncementItem[];
}

interface LiveTickerEvent {
  id: string;
  studentName: string;
  cls: string;
  type: 'lead' | 'points' | 'badge';
  text: string;
  highlight: string;
  timestamp: number;
}


interface QuizState {
  title: string;
  qs: QuestionItem[];
  type: string;
  isLesson: boolean;
  isRemedial?: boolean;
  hasPassage?: boolean;
  passageData?: {
    title: string;
    genre: string;
    paragraphs: string[];
  };
  nafesStageId?: string;
  nafesStageIdx?: number;
}

interface SeenGamesMap {
  detective: string[];
  order: string[];
  meaning: string[];
  speed: string[];
}

const getSeenGames = (userId: string): SeenGamesMap => {
  const key = `LT_SEEN_GAMES_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        detective: Array.isArray(parsed.detective) ? parsed.detective : [],
        order: Array.isArray(parsed.order) ? parsed.order : [],
        meaning: Array.isArray(parsed.meaning) ? parsed.meaning : [],
        speed: Array.isArray(parsed.speed) ? parsed.speed : []
      };
    }
  } catch {}
  return { detective: [], order: [], meaning: [], speed: [] };
};

const saveSeenGames = (userId: string, data: SeenGamesMap) => {
  const key = `LT_SEEN_GAMES_${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

interface OrderGameProgress {
  unitSolvedCount: Record<number, number>;
  completedUnits: number[];
}

const getOrderGameProgress = (userId: string): OrderGameProgress => {
  const key = `LT_ORDER_PROGRESS_${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unitSolvedCount: parsed.unitSolvedCount || { 1: 0, 2: 0, 3: 0 },
        completedUnits: Array.isArray(parsed.completedUnits) ? parsed.completedUnits : []
      };
    }
  } catch {}
  return { unitSolvedCount: { 1: 0, 2: 0, 3: 0 }, completedUnits: [] };
};

const saveOrderGameProgress = (userId: string, data: OrderGameProgress) => {
  const key = `LT_ORDER_PROGRESS_${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

const isCurriculumUnitUnlocked = (
  unit: number,
  settings: AppSettings,
  isTeacher: boolean
): { unlocked: boolean; reason?: string } => {
  if (isTeacher) return { unlocked: true };

  if (unit === 1) {
    if (settings.unit1Open === false) {
      return { unlocked: false, reason: 'الوحدة الأولى (القيم الإسلامية) مقفلة حالياً بأمر المعلم (أ. مساعد الصخري) 🔒 — لا يمكن للطالب تجاوز القفل حتى يأذن المعلم بفتحها من لوحة التحكم.' };
    }
    return { unlocked: true };
  }

  if (unit === 2) {
    if (settings.unit2Open !== true) {
      return { unlocked: false, reason: 'الوحدة الثانية (الأعلام) مقفلة حالياً بأمر المعلم (أ. مساعد الصخري) 🔒 — لا يمكن للطالب تجاوز القفل حتى يأذن المعلم بفتحها من لوحة التحكم.' };
    }
    return { unlocked: true };
  }

  if (unit === 3) {
    if (settings.unit3Open !== true) {
      return { unlocked: false, reason: 'الوحدة الثالثة (وطني) مقفلة حالياً بأمر المعلم (أ. مساعد الصخري) 🔒 — لا يمكن للطالب تجاوز القفل حتى يأذن المعلم بفتحها من لوحة التحكم.' };
    }
    return { unlocked: true };
  }

  return { unlocked: true };
};

const isOrderUnitUnlocked = (
  unit: 1 | 2 | 3,
  settings: AppSettings,
  progress: OrderGameProgress,
  isTeacher?: boolean
): { unlocked: boolean; reason?: string } => {
  if (isTeacher) return { unlocked: true };
  if (settings.orderUnlockAll) return { unlocked: true };

  // If teacher closed Unit 1
  if (unit === 1) {
    if (settings.orderUnit1Open === false || settings.unit1Open === false) {
      return { unlocked: false, reason: 'الوحدة الأولى مقفلة مؤقتًا بقرار المعلم 🔒' };
    }
    return { unlocked: true };
  }

  if (unit === 2) {
    if (settings.unit2Open !== true && settings.orderUnit2Open !== true) {
      return { unlocked: false, reason: 'الوحدة الثانية (الأعلام) مقفلة 🔒 — حتى يأذن المعلم بفتحها' };
    }
    return { unlocked: true };
  }

  if (unit === 3) {
    if (settings.unit3Open !== true && settings.orderUnit3Open !== true) {
      return { unlocked: false, reason: 'الوحدة الثالثة (وطني) مقفلة 🔒 — حتى يأذن المعلم بفتحها' };
    }
    return { unlocked: true };
  }

  return { unlocked: true };
};

// فحص قفل/فتح اللعبة من قبل المعلم (المحقق اللغوي، ركّب الجملة، معنى الكلمة، تحدي السرعة)
const isGameUnlockedByTeacher = (
  gameKey: 'detective' | 'order' | 'meaning' | 'speed',
  settings: AppSettings,
  isTeacher?: boolean
): { unlocked: boolean; reason?: string } => {
  if (isTeacher) return { unlocked: true };
  if (settings.enableGames === false) {
    return { unlocked: false, reason: '🔒 مركز الألعاب مغلق بالكامل حالياً بأمر المعلم المشرف.' };
  }
  if (gameKey === 'detective' && settings.gameDetectiveOpen === false) {
    return { unlocked: false, reason: '🔒 أسئلة لعبة «المحقق اللغوي» مقفلة حالياً بأمر المعلم، ولا يمكن فتحها إلا بإذنه.' };
  }
  if (gameKey === 'order' && settings.gameOrderOpen === false) {
    return { unlocked: false, reason: '🔒 لعبة «ركّب الجملة» مقفلة حالياً بأمر المعلم، ولا يمكن فتحها إلا بإذنه.' };
  }
  if (gameKey === 'meaning' && settings.gameMeaningOpen === false) {
    return { unlocked: false, reason: '🔒 أسئلة لعبة «معنى الكلمة» مقفلة حالياً بأمر المعلم، ولا يمكن فتحها إلا بإذنه.' };
  }
  if (gameKey === 'speed' && settings.gameSpeedOpen === false) {
    return { unlocked: false, reason: '🔒 أسئلة لعبة «تحدي السرعة» مقفلة حالياً بأمر المعلم، ولا يمكن فتحها إلا بإذنه.' };
  }
  return { unlocked: true };
};

// فحص قفل/فتح كل مرحلة من مراحل اختبار نافس من قبل المعلم
const isNafesStageUnlockedByTeacher = (
  stageId: string,
  settings: AppSettings,
  isTeacher?: boolean
): { unlocked: boolean; reason?: string } => {
  if (isTeacher) return { unlocked: true };
  if (settings.enableNafes === false) {
    return { unlocked: false, reason: '🔒 اختبارات نافس مقفلة بالكامل حالياً بأمر المعلم المشرف.' };
  }
  if (stageId === 'nafes_unit_1' && settings.nafesStage1Open === false) {
    return { unlocked: false, reason: '🔒 المرحلة 1 من اختبار نافس مقفلة حالياً بأمر المعلم، انتظر حتى يأذن المعلم بفتحها.' };
  }
  if (stageId === 'nafes_unit_2' && settings.nafesStage2Open !== true) {
    return { unlocked: false, reason: '«أحسنت! أكملت المرحلة السابقة. المرحلة التالية مغلقة حاليًا، انتظر إذن المعلم».' };
  }
  if (stageId === 'nafes_unit_3' && settings.nafesStage3Open !== true) {
    return { unlocked: false, reason: '«أحسنت! أكملت المرحلة السابقة. المرحلة التالية مغلقة حاليًا، انتظر إذن المعلم».' };
  }
  if (stageId === 'nafes_comprehensive_4' && settings.nafesStage4Open !== true) {
    return { unlocked: false, reason: '«أحسنت! أكملت المرحلة السابقة. المرحلة التالية مغلقة حاليًا، انتظر إذن المعلم».' };
  }
  return { unlocked: true };
};

const DEFAULT_SETTINGS: AppSettings = {
  announcement: 'مرحبًا بكم يا فرسان لغتي! تنافسوا في الاختبارات وتحدي الـ 24 ساعة لتتصدروا مضمار الخيل 🐎',
  enforce24hChallengeLock: true,
  enableGames: true,
  enableNafes: true,
  enableFeedback: true,
  adminPin: '1448',
  platformManualStatus: 'open',
  scheduleEnabled: false,
  scheduledOpenAt: '',
  scheduledCloseAt: '',
  scheduleNote: '',
  orderUnlockAll: false,
  orderUnit1Open: true,
  orderUnit2Open: false,
  orderUnit3Open: false,
  unit1Open: true,
  unit2Open: false, // مقفلة حتى يأذن المعلم بفتحها
  unit3Open: false, // مقفلة حتى يأذن المعلم بفتحها
  gameDetectiveOpen: true,
  gameOrderOpen: true,
  gameMeaningOpen: true,
  gameSpeedOpen: true,
  nafesStage1Open: true,
  nafesStage2Open: false,
  nafesStage3Open: false,
  nafesStage4Open: false,
  tickerCustomText: '',
  updatedAt: Date.now()
};

export default function App() {
  const [screenStage, setScreenStage] = useState<'cover' | 'welcome' | 'app'>(() => {
    try {
      const savedActive = localStorage.getItem('LT_ACTIVE');
      const savedProfiles = JSON.parse(localStorage.getItem('LT_PROFILES') || '{}');
      if (savedActive && savedProfiles[savedActive]) {
        return 'app';
      }
      if (localStorage.getItem('LT_ADMIN_UNLOCKED') === 'true') {
        return 'app';
      }
    } catch {}
    return 'cover';
  });
  const [profiles, setProfiles] = useState<Record<string, StudentProfile>>(() => {
    try {
      return JSON.parse(localStorage.getItem('LT_PROFILES') || '{}');
    } catch {
      return {};
    }
  });
  const [activeId, setActiveId] = useState<string>(() => {
    return localStorage.getItem('LT_ACTIVE') || '';
  });

  // Firebase Auth & Cloud Database State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminUnlockedByPin, setAdminUnlockedByPin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('LT_ADMIN_UNLOCKED') === 'true';
    } catch {
      return false;
    }
  });
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [cloudStudents, setCloudStudents] = useState<CloudStudentRow[]>([]);
  const [customChallenges, setCustomChallenges] = useState<(DailyChallengeItem & { docId: string })[]>([]);
  const [cloudFeedback, setCloudFeedback] = useState<FeedbackItem[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('LT_GLOBAL_SETTINGS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [parentMessages, setParentMessages] = useState<ParentMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('LT_PARENT_MESSAGES') || '[]');
    } catch {
      return [];
    }
  });
  const [liveScoreEvents, setLiveScoreEvents] = useState<LiveTickerEvent[]>(() => {
    try {
      const raw = localStorage.getItem('LT_LIVE_SCORE_EVENTS');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [activeModal, setActiveModal] = useState<
    | null
    | 'profileModal'
    | 'lessonModal'
    | 'quizModal'
    | 'gamesModal'
    | 'feedbackModal'
    | 'badgesModal'
    | 'mistakesModal'
    | 'adminModal'
    | 'nafesStagesModal'
    | 'shareModal'
    | 'parentMessagesModal'
    | 'raceFinishModal'
  >(null);
  const [selectedUnit, setSelectedUnit] = useState<number>(1);
  const [titleCategoryFilter, setTitleCategoryFilter] = useState<
    'الكل' | 'وحدات المنهج' | 'التحديات والألعاب' | 'رتب النقاط' | 'الصدارة'
  >('الكل');

  // Admin panel active tab
  const [adminTab, setAdminTab] = useState<
    'students' | 'studentStats' | 'challenges' | 'announcements' | 'parentMessages' | 'schedule' | 'nafesStages' | 'settings' | 'feedback'
  >('students');
  const [schedOpenInput, setSchedOpenInput] = useState<string>(() => appSettings.scheduledOpenAt || '');
  const [schedCloseInput, setSchedCloseInput] = useState<string>(() => appSettings.scheduledCloseAt || '');
  const [schedEnabledDraft, setSchedEnabledDraft] = useState<boolean>(() => Boolean(appSettings.scheduleEnabled));
  const [schedNoteDraft, setSchedNoteDraft] = useState<string>(() => appSettings.scheduleNote || '');
  const [scheduleActionFeedback, setScheduleActionFeedback] = useState<string | null>(null);
  // New Custom Challenge Form in Admin
  const [newChDay, setNewChDay] = useState<number>(11);
  const [newChLevel, setNewChLevel] = useState<DailyChallengeItem['level']>('صعب جدًا');
  const [newChPoints, setNewChPoints] = useState<number>(35);
  const [newChTopic, setNewChTopic] = useState<string>('الوحدة الأولى والثانية — تطبيقات نحوية');
  const [newChQuestion, setNewChQuestion] = useState<string>('');
  const [newChOpt0, setNewChOpt0] = useState<string>('');
  const [newChOpt1, setNewChOpt1] = useState<string>('');
  const [newChOpt2, setNewChOpt2] = useState<string>('');
  const [newChOpt3, setNewChOpt3] = useState<string>('');
  const [newChAnswer, setNewChAnswer] = useState<number>(0);
  const [newChExplain, setNewChExplain] = useState<string>('');

  // Remedies modal tab
  const [mistakesTab, setMistakesTab] = useState<'myMistakes' | 'commonMistakes'>('myMistakes');

  // Toast / custom notice
  const [notice, setNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotice(msg);
  };

  // Student deletion & edit name/password state (لوحة تحكم المعلم)
  const [studentToDelete, setStudentToDelete] = useState<CloudStudentRow | null>(null);
  const [studentToEditName, setStudentToEditName] = useState<CloudStudentRow | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [editCodeInput, setEditCodeInput] = useState<string>('');
  const [inlineEditStudentId, setInlineEditStudentId] = useState<string | null>(null);
  const [inlineEditNameInput, setInlineEditNameInput] = useState<string>('');

  // Profile form state
  const [profileMode, setProfileMode] = useState<'chooser' | 'create' | 'login'>('chooser');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCls, setNewCls] = useState('أ');
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Quiz state
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Record<number, { selected?: number; essay?: string; isCorrect: boolean }>
  >({});
  const [essayDraft, setEssayDraft] = useState('');
  const [quizFinished, setQuizFinished] = useState(false);
  const [showPassage, setShowPassage] = useState(true);

  // Daily challenge strict 24h after answer state + stopwatch timer
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [dailyElapsedSec, setDailyElapsedSec] = useState<number>(0);
  const [dailyTimerRunning, setDailyTimerRunning] = useState<boolean>(true);
  const [dailyWrongChoices, setDailyWrongChoices] = useState<number[]>([]);
  const [dailyAttempts, setDailyAttempts] = useState<number>(0);
  const [dailySolvedTime, setDailySolvedTime] = useState<number | null>(null);

  const [localDailyState, setLocalDailyState] = useState<DailyChallengeState>(() => {
    try {
      const raw = localStorage.getItem('LT_DAILY_STATE_V2');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      currentIndex: 0,
      nextUnlockMs: 0,
      solvedDays: {}
    };
  });

  // Games state (متجددة بدون تكرار)
  const [gameView, setGameView] = useState<'menu' | 'detective' | 'order' | 'meaning' | 'speed'>('menu');
  const [gameDetectiveList, setGameDetectiveList] = useState<DetectiveQuestion[]>([]);
  const [detIndex, setDetIndex] = useState(0);
  const [detScore, setDetScore] = useState(0);
  const [detSelected, setDetSelected] = useState<number | null>(null);
  const [detDone, setDetDone] = useState(false);

  const [gameOrderList, setGameOrderList] = useState<OrderQuestion[]>([]);
  const [gameOrderActiveIdx, setGameOrderActiveIdx] = useState(0);
  const [orderWords, setOrderWords] = useState<string[]>([]);
  const [orderChosen, setOrderChosen] = useState<number[]>([]);
  const [orderSelectedUnit, setOrderSelectedUnit] = useState<1 | 2 | 3>(1);

  const [gameMeaningList, setGameMeaningList] = useState<MeaningQuestion[]>([]);
  const [meanIndex, setMeanIndex] = useState(0);
  const [meanScore, setMeanScore] = useState(0);
  const [meanOpts, setMeanOpts] = useState<string[]>([]);
  const [meanDone, setMeanDone] = useState(false);

  const [gameSpeedList, setGameSpeedList] = useState<SpeedQuestion[]>([]);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [speedScore, setSpeedScore] = useState(0);
  const [speedTime, setSpeedTime] = useState(30);
  const [speedDone, setSpeedDone] = useState(false);
  const [gameCycleNotice, setGameCycleNotice] = useState<string>('');
  const [orderSessionSolvedCount, setOrderSessionSolvedCount] = useState<number>(0);
  const [orderDone, setOrderDone] = useState<boolean>(false);
  const [, setGameCooldownTick] = useState<number>(0);
  const speedTimerRef = useRef<number | null>(null);

  // تحديث عداد الـ 24 ساعة لمركز الألعاب في الوقت الفعلي
  useEffect(() => {
    if (activeModal === 'gamesModal') {
      const interval = setInterval(() => {
        setGameCooldownTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeModal]);

  // Feedback state (اقتراحات الطلاب - خاصة بالمعلم فقط)
  const [fbStudentName, setFbStudentName] = useState('');
  const [fbCls, setFbCls] = useState('بدون تحديد');
  const [fbText, setFbText] = useState('');
  const [globalFeedback, setGlobalFeedback] = useState<FeedbackItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('LT_FEEDBACK') || '[]');
    } catch {
      return [];
    }
  });

  // مؤقت الوقت الفعلي لمتابعة مواعيد المنصة والجدولة الزمنية
  const [clockDate, setClockDate] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setClockDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentProfile = activeId && profiles[activeId] ? profiles[activeId] : null;
  const studentMistakes = currentProfile?.mistakes || [];
  const isTeacherAdmin =
    adminUnlockedByPin ||
    Boolean(firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  // تتبع الجلسات ونبضات التواجد الفعلي للطلاب في الوقت الحقيقي (Realtime Presence & Heartbeat)
  useEffect(() => {
    if (!activeId || !profiles[activeId]) return;

    // تسجيل الجلسة بدقة مرة واحدة فقط لكل جلسة متصفح بدون تكرار عند التحديث أو إعادة الرندر
    const sessionKey = `LT_SESSION_RECORDED_${activeId}`;
    try {
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        setProfiles(prev => {
          const p = prev[activeId];
          if (!p) return prev;
          const currentCount = typeof p.sessionCount === 'number' ? p.sessionCount : 0;
          const updated = {
            ...p,
            sessionCount: currentCount + 1,
            lastActiveAt: Date.now(),
            lastActivityType: 'تسجيل دخول'
          };
          syncProfileToCloud(activeId, updated);
          return { ...prev, [activeId]: updated };
        });
      }
    } catch {}

    // نبضات التواجد الدورية كل 35 ثانية لتحديث حالة "متصل الآن" وتفادي احتساب الجلسات غير النشطة
    const heartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = Date.now();
      setProfiles(prev => {
        const p = prev[activeId];
        if (!p) return prev;
        const updated = { ...p, lastActiveAt: now };
        syncProfileToCloud(activeId, updated);
        return { ...prev, [activeId]: updated };
      });
    }, 35000);

    return () => clearInterval(heartbeatTimer);
  }, [activeId]);

  // =========================================================================
  // نظام مواعيد المنصة وصلاحيات فتح وإغلاق المنصة — تحكم كامل للمعلم
  // أولوية التحكم اليدوي المباشر، مع خيار الجدولة التلقائية
  // =========================================================================
  const scheduleInfo = useMemo(() => {
    const now = clockDate.getTime();

    // 1. في حال تشغيل الجدولة التلقائية من قِبل المعلم
    if (appSettings.scheduleEnabled) {
      const openTime = appSettings.scheduledOpenAt ? new Date(appSettings.scheduledOpenAt).getTime() : NaN;
      const closeTime = appSettings.scheduledCloseAt ? new Date(appSettings.scheduledCloseAt).getTime() : NaN;

      let isOpen = false;
      let targetDate: Date | null = null;
      let timerLabel = '';

      if (!isNaN(openTime) && !isNaN(closeTime)) {
        if (now >= openTime && now < closeTime) {
          isOpen = true;
          targetDate = new Date(closeTime);
          timerLabel = 'متبقي على موعد إغلاق المنصة المجدول:';
        } else if (now < openTime) {
          isOpen = false;
          targetDate = new Date(openTime);
          timerLabel = 'متبقي على موعد فتح المنصة المجدول:';
        } else {
          // بعد انتهاء الفترة المجدولة
          isOpen = false;
          timerLabel = 'انتهت الفترة المجدولة (المنصة مغلقة حالياً)';
        }
      } else if (!isNaN(openTime) && now < openTime) {
        isOpen = false;
        targetDate = new Date(openTime);
        timerLabel = 'متبقي على موعد فتح المنصة:';
      } else if (!isNaN(closeTime) && now < closeTime) {
        isOpen = true;
        targetDate = new Date(closeTime);
        timerLabel = 'متبقي على موعد إغلاق المنصة:';
      } else {
        isOpen = appSettings.platformManualStatus !== 'closed';
      }

      let timerString = '';
      if (targetDate) {
        const diffMs = Math.max(0, targetDate.getTime() - now);
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        const pad = (n: number) => n.toString().padStart(2, '0');
        timerString = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
      }

      return {
        isOpen,
        isScheduled: true,
        statusLabel: isOpen ? 'مفتوحة (ضمن الجدول المعتمد)' : 'مغلقة (خارج الجدول المعتمد)',
        timerString,
        timerLabel,
        openAtText: appSettings.scheduledOpenAt ? new Date(appSettings.scheduledOpenAt).toLocaleString('ar-SA') : '',
        closeAtText: appSettings.scheduledCloseAt ? new Date(appSettings.scheduledCloseAt).toLocaleString('ar-SA') : '',
        message: isOpen
          ? '🏇 المنصة مفتوحة ومتاحة الآن للتنافس وإنجاز التحديات والاختبارات!'
          : '🌙 المنصة مغلقة حاليًا خارج أوقات العمل المجدولة.'
      };
    }

    // 2. التحكم اليدوي المباشر المعتمد (المعلم يفتح أو يغلق متى يشاء)
    const isOpen = appSettings.platformManualStatus !== 'closed';
    return {
      isOpen,
      isScheduled: false,
      statusLabel: isOpen ? 'مفتوحة بقرار المعلم' : 'مغلقة بقرار المعلم',
      timerString: '',
      timerLabel: isOpen ? 'المنصة متاحة الآن بقرار المعلم' : 'المنصة مغلقة حالياً بقرار المعلم',
      openAtText: '',
      closeAtText: '',
      message: isOpen
        ? '🏇 المنصة مفتوحة ومتاحة الآن لجميع فرسان لغتي الخالدة بإذن المعلم المشرف.'
        : '🔒 المنصة مغلقة حالياً بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.'
    };
  }, [clockDate, appSettings]);

  // =========================================================================
  // سجل احتساب النقاط (QUESTION SCORING LEDGER) — القواعد الأربع الملزمة
  // نقطة واحدة فقط لكل سؤال عن أول إجابة صحيحة داخل المجموعة، بدون تكرار
  // =========================================================================
  const getStudentScoredLedger = (studentId: string): Set<string> => {
    if (!studentId) return new Set();
    const key = `LT_SCORED_LEDGER_${studentId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch {}
    return new Set();
  };

  const recordQuestionScore = (
    studentId: string,
    groupId: string,
    questionPrompt: string
  ): boolean => {
    if (!studentId || !groupId || !questionPrompt) return false;
    const cleanQ = questionPrompt.trim().slice(0, 120);
    const qKey = `${groupId}:::${cleanQ}`;
    const ledger = getStudentScoredLedger(studentId);
    if (ledger.has(qKey)) {
      // سبق احتساب هذا السؤال لهذا الطالب داخل هذه المجموعة
      return false;
    }
    ledger.add(qKey);
    try {
      localStorage.setItem(`LT_SCORED_LEDGER_${studentId}`, JSON.stringify(Array.from(ledger)));
    } catch {}
    return true; // أول إجابة صحيحة محتسبة داخل المجموعة (تمنح +1 نقطة)
  };

  // Combine default progression + teacher's custom challenges from Firestore
  const allDailyChallenges: DailyChallengeItem[] = [
    ...DAILY_CHALLENGE_PROGRESSION,
    ...customChallenges
  ].sort((a, b) => a.day - b.day);

  // Sync student profile to Firestore database
  const syncProfileToCloud = async (profileId: string, p: StudentProfile) => {
    const safeId = toSafeDocId(profileId);
    const daily = p.dailyChallenge || localDailyState;
    const payload: Record<string, any> = {
      profileId: profileId.slice(0, 100),
      name: p.name.slice(0, 80),
      code: p.code.slice(0, 4),
      cls: p.cls.slice(0, 10),
      points: Math.max(0, Math.min(1000000, p.points || 0)),
      badges: (p.badges || []).slice(0, 20),
      correct: Math.max(0, p.correct || 0),
      attempts: Math.max(0, p.attempts || 0),
      progress: Math.max(0, Math.min(100, p.progress || 0)),
      completed: (p.completed || []).slice(0, 50),
      nafesStageIndex: Math.max(0, p.nafesStageIndex || 0),
      dailyCurrentIndex: Math.max(0, daily.currentIndex || 0),
      dailyNextUnlockMs: Math.max(0, daily.nextUnlockMs || 0),
      lastQuizTitle: (p.lastQuizTitle || p.lastActivity?.label || 'لم يختبر بعد').slice(0, 120),
      lastQuizScore: Math.max(0, p.lastQuizScore || 0),
      lastQuizTotal: Math.max(0, p.lastQuizTotal || 0),
      isBlocked: Boolean(p.isBlocked),
      raceCompletedAt: p.raceCompletedAt ? Number(p.raceCompletedAt) : 0,
      finishLineReached: Boolean(p.finishLineReached),
      gradeLevel: (p.gradeLevel || 'الأول المتوسط').slice(0, 50),
      lastActivityType: (p.lastActivityType || 'نشاط بالمنصة').slice(0, 60),
      lastActiveAt: p.lastActiveAt ? Number(p.lastActiveAt) : Date.now(),
      updatedAt: Date.now()
    };
    if (p.registeredAt) {
      payload.registeredAt = Number(p.registeredAt);
    }
    if (typeof p.sessionCount === 'number') {
      payload.sessionCount = Number(p.sessionCount);
    }
    if (Array.isArray(p.completedNafesStages) && p.completedNafesStages.length > 0) {
      payload.completedNafesStages = p.completedNafesStages.slice(0, 10);
    }
    try {
      await setDoc(doc(db, 'students', safeId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `students/${safeId}`);
    }
  };

  // Listen to Firebase Auth state and real-time Firestore collections
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => {
      setFirebaseUser(u);
    });

    // Listen to students leaderboard & progress
    const qStudents = query(collection(db, 'students'));
    const unsubStudents = onSnapshot(
      qStudents,
      snap => {
        const rows: CloudStudentRow[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data && typeof data.points === 'number' && data.points >= 0) {
            rows.push({
              docId: d.id,
              profileId: data.profileId || d.id,
              name: data.name || 'طالب',
              code: data.code || '0000',
              cls: data.cls || 'أ',
              points: data.points || 0,
              badges: Array.isArray(data.badges) ? data.badges : [],
              correct: data.correct || 0,
              attempts: data.attempts || 0,
              progress: data.progress || 0,
              completed: Array.isArray(data.completed) ? data.completed : [],
              nafesStageIndex: data.nafesStageIndex || 0,
              dailyCurrentIndex: data.dailyCurrentIndex || 0,
              dailyNextUnlockMs: data.dailyNextUnlockMs || 0,
              lastQuizTitle: data.lastQuizTitle || '—',
              lastQuizScore: data.lastQuizScore || 0,
              lastQuizTotal: data.lastQuizTotal || 0,
              isBlocked: Boolean(data.isBlocked),
              raceCompletedAt: Number(data.raceCompletedAt || 0),
              finishLineReached: Boolean(data.finishLineReached),
              updatedAt: data.updatedAt || 0,
              registeredAt: data.registeredAt ? Number(data.registeredAt) : undefined,
              lastActiveAt: data.lastActiveAt ? Number(data.lastActiveAt) : data.updatedAt ? Number(data.updatedAt) : undefined,
              sessionCount: typeof data.sessionCount === 'number' ? Number(data.sessionCount) : undefined,
              gradeLevel: data.gradeLevel || 'الأول المتوسط',
              lastActivityType: data.lastActivityType || '—',
              completedNafesStages: Array.isArray(data.completedNafesStages) ? data.completedNafesStages : []
            });
          }
        });
        rows.sort((a, b) => b.points - a.points || b.correct - a.correct);
        setCloudStudents(rows);
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, 'students');
      }
    );

    // Listen to custom challenges
    const qChallenges = query(collection(db, 'custom_challenges'));
    const unsubChallenges = onSnapshot(
      qChallenges,
      snap => {
        const list: (DailyChallengeItem & { docId: string })[] = [];
        snap.forEach(d => {
          const data = d.data();
          if (data && data.question && Array.isArray(data.options)) {
            list.push({
              docId: d.id,
              day: Number(data.day) || 11,
              level: data.level || 'صعب جدًا',
              points: Number(data.points) || 30,
              unitTopic: data.unitTopic || 'تحدي المعلم',
              question: data.question,
              options: data.options,
              answer: Number(data.answer) || 0,
              explanation: data.explanation || ''
            });
          }
        });
        setCustomChallenges(list);
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, 'custom_challenges');
      }
    );

    // Listen to global app settings
    const unsubSettings = onSnapshot(
      doc(db, 'app_settings', 'global'),
      snap => {
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          const merged: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...data,
            platformManualStatus: (data.platformManualStatus as any) || 'open',
            scheduleEnabled: Boolean(data.scheduleEnabled),
            scheduledOpenAt: data.scheduledOpenAt || '',
            scheduledCloseAt: data.scheduledCloseAt || '',
            scheduleNote: data.scheduleNote || '',
            unit1Open: data.unit1Open !== false,
            unit2Open: Boolean(data.unit2Open),
            unit3Open: Boolean(data.unit3Open),
            orderUnit1Open: data.orderUnit1Open !== false,
            orderUnit2Open: Boolean(data.orderUnit2Open),
            orderUnit3Open: Boolean(data.orderUnit3Open),
            gameDetectiveOpen: data.gameDetectiveOpen !== false,
            gameOrderOpen: data.gameOrderOpen !== false,
            gameMeaningOpen: data.gameMeaningOpen !== false,
            gameSpeedOpen: data.gameSpeedOpen !== false,
            nafesStage1Open: data.nafesStage1Open !== false,
            nafesStage2Open: Boolean(data.nafesStage2Open),
            nafesStage3Open: Boolean(data.nafesStage3Open),
            nafesStage4Open: Boolean(data.nafesStage4Open),
            tickerCustomText: data.tickerCustomText || '',
            tickerAnnouncements: Array.isArray(data.tickerAnnouncements) ? data.tickerAnnouncements : []
          };
          setAppSettings(merged);
          try {
            localStorage.setItem('LT_GLOBAL_SETTINGS', JSON.stringify(merged));
          } catch {}
        }
      },
      err => {
        handleFirestoreError(err, OperationType.GET, 'app_settings/global');
      }
    );

    // Listen to parent feedback
    const qFeedback = query(collection(db, 'feedback'));
    const unsubFeedback = onSnapshot(
      qFeedback,
      snap => {
        const items: FeedbackItem[] = [];
        snap.forEach(d => {
          const data = d.data();
          items.push({
            id: d.id,
            role: data.role || 'طالب متميز',
            cls: data.cls || 'بدون تحديد',
            text: data.text || '',
            status: data.status || 'وارد جديد',
            createdAt: data.createdAt || 0
          });
        });
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCloudFeedback(items);
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, 'feedback');
      }
    );

    // Listen to parent messages (خاصة وسرية ومباشرة بين ولي الأمر والمعلم)
    const qMessages = query(collection(db, 'parent_messages'));
    const unsubMessages = onSnapshot(
      qMessages,
      snap => {
        const msgs: ParentMessage[] = [];
        snap.forEach(d => {
          const data = d.data();
          msgs.push({
            id: d.id,
            studentId: data.studentId || '',
            studentName: data.studentName || 'طالب متميز',
            studentCls: data.studentCls || 'بدون تحديد',
            category: data.category || 'متابعة المستوى',
            text: data.text || '',
            status: data.status || 'جديد',
            createdAt: data.createdAt || Date.now(),
            replyText: data.replyText,
            replyAt: data.replyAt,
            teacherName: data.teacherName
          });
        });
        msgs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setParentMessages(msgs);
        try {
          localStorage.setItem('LT_PARENT_MESSAGES', JSON.stringify(msgs));
        } catch {}
      },
      err => {
        handleFirestoreError(err, OperationType.LIST, 'parent_messages');
      }
    );

    return () => {
      unsubAuth();
      unsubStudents();
      unsubChallenges();
      unsubSettings();
      unsubFeedback();
      unsubMessages();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('LT_PROFILES', JSON.stringify(profiles));
    localStorage.setItem('LT_ACTIVE', activeId);
  }, [profiles, activeId]);

  useEffect(() => {
    localStorage.setItem('LT_FEEDBACK', JSON.stringify(globalFeedback));
  }, [globalFeedback]);

  useEffect(() => {
    localStorage.setItem('LT_DAILY_STATE_V2', JSON.stringify(localDailyState));
  }, [localDailyState]);

  // ============================================================================
  // STRICT 24-HOUR LOCK AFTER ANSWERING PREVIOUS DAILY CHALLENGE QUESTION
  // ============================================================================
  const activeDailyState: DailyChallengeState = currentProfile?.dailyChallenge || localDailyState;
  const solvedDaysMap = activeDailyState.solvedDays || {};

  // Auto-advance to the next question ONLY when 24 hours have passed since solving the current one
  useEffect(() => {
    const curIdx = activeDailyState.currentIndex || 0;
    const isCurrentSolved = Boolean(solvedDaysMap[curIdx]);
    const unlockMs = activeDailyState.nextUnlockMs || 0;

    if (isCurrentSolved && unlockMs > 0 && nowMs >= unlockMs) {
      const nextIdx = (curIdx + 1) % allDailyChallenges.length;
      // Clear solved record if cycling back or moving forward
      const updatedState: DailyChallengeState = {
        ...activeDailyState,
        currentIndex: nextIdx,
        nextUnlockMs: 0
      };
      if (currentProfile && activeId) {
        updateCurrentProfile(p => ({
          ...p,
          dailyChallenge: updatedState
        }));
      } else {
        setLocalDailyState(updatedState);
      }
    }
  }, [nowMs, activeDailyState, allDailyChallenges.length, activeId]);

  const currentDayIndex = (activeDailyState.currentIndex || 0) % Math.max(1, allDailyChallenges.length);
  const currentDailyChallenge =
    allDailyChallenges[currentDayIndex] || DAILY_CHALLENGE_PROGRESSION[0];
  const currentDaySolvedRecord = solvedDaysMap[currentDayIndex];
  const isWaitingFor24hUnlock =
    Boolean(currentDaySolvedRecord) &&
    activeDailyState.nextUnlockMs > nowMs &&
    appSettings.enforce24hChallengeLock;

  const msRemainingToUnlockNext = Math.max(0, (activeDailyState.nextUnlockMs || 0) - nowMs);
  const remHours = Math.floor(msRemainingToUnlockNext / (1000 * 60 * 60));
  const remMinutes = Math.floor((msRemainingToUnlockNext % (1000 * 60 * 60)) / (1000 * 60));
  const remSeconds = Math.floor((msRemainingToUnlockNext % (1000 * 60)) / 1000);

  // Reset stopwatch when question index changes or student switches
  useEffect(() => {
    const solved = solvedDaysMap[currentDayIndex];
    if (solved) {
      setDailySolvedTime(solved.timeSpentSec);
      setDailyElapsedSec(solved.timeSpentSec);
      setDailyAttempts(solved.attempts);
      setDailyWrongChoices([]);
      setDailyTimerRunning(false);
    } else {
      setDailySolvedTime(null);
      setDailyElapsedSec(0);
      setDailyAttempts(0);
      setDailyWrongChoices([]);
      setDailyTimerRunning(true);
    }
  }, [currentDayIndex, activeId, Boolean(currentDaySolvedRecord)]);

  // 1-second tick for 24-hour unlock countdown and student solution stopwatch
  useEffect(() => {
    if (screenStage !== 'app') return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setDailyElapsedSec(prev => {
        if (dailyTimerRunning && dailySolvedTime === null && activeModal === null) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [screenStage, dailyTimerRunning, dailySolvedTime, activeModal]);

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerDailyChallenge = (optIdx: number) => {
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    if (dailySolvedTime !== null || dailyWrongChoices.includes(optIdx)) return;
    const nextAttempts = dailyAttempts + 1;
    setDailyAttempts(nextAttempts);

    if (optIdx === currentDailyChallenge.answer) {
      fireCelebratoryFireworks();
      const finalSec = Math.max(1, dailyElapsedSec);
      const solvedAtMs = Date.now();
      // Next question opens strictly 24 hours after answering this question!
      const nextUnlockMs = solvedAtMs + 24 * 60 * 60 * 1000;

      setDailySolvedTime(finalSec);
      setDailyTimerRunning(false);

      const solvedEntry = { timeSpentSec: finalSec, attempts: nextAttempts, solvedAtMs };
      const newDailyState: DailyChallengeState = {
        currentIndex: currentDayIndex,
        nextUnlockMs,
        solvedDays: {
          ...solvedDaysMap,
          [currentDayIndex]: solvedEntry
        }
      };

      if (currentProfile && activeId) {
        updateCurrentProfile(p => {
          const nextBadges = [...p.badges];
          if (!nextBadges.includes('قاهر التحدي اليومي')) {
            nextBadges.push('قاهر التحدي اليومي');
          }
          if (
            (currentDailyChallenge.level.includes('صعب جدًا') || currentDayIndex >= 6) &&
            !nextBadges.includes('قاهر التحدي الصعب')
          ) {
            nextBadges.push('قاهر التحدي الصعب');
          }
          if (finalSec <= 20 && !nextBadges.includes('سريع البديهة')) {
            nextBadges.push('سريع البديهة');
          }
          return {
            ...p,
            points: p.points + currentDailyChallenge.points,
            correct: p.correct + 1,
            attempts: p.attempts + 1,
            badges: nextBadges,
            dailyChallenge: newDailyState
          };
        });
      } else {
        setLocalDailyState(newDailyState);
      }

      showNotice(
        `🎉 أحسنت! وصلت للحل الصحيح في ${finalSec} ثانية وحصلت على +${currentDailyChallenge.points} نقطة! سيفتح لك السؤال التالي الأصعب بعد 24 ساعة من الآن.`
      );
    } else {
      setDailyWrongChoices(prev => [...prev, optIdx]);
    }
  };

  // Teacher override to unlock next daily challenge immediately if needed
  const handleAdminUnlockNextDaily = () => {
    const nextIdx = (currentDayIndex + 1) % allDailyChallenges.length;
    const updatedState: DailyChallengeState = {
      currentIndex: nextIdx,
      nextUnlockMs: 0,
      solvedDays: solvedDaysMap
    };
    if (currentProfile && activeId) {
      updateCurrentProfile(p => ({
        ...p,
        dailyChallenge: updatedState
      }));
    } else {
      setLocalDailyState(updatedState);
    }
    showNotice('تم فتح سؤال التحدي لليوم التالي بصلاحية المعلم.');
  };

  useEffect(() => {
    if (screenStage !== 'app') {
      document.body.classList.add('landing');
      document.body.classList.remove('appReady');
    } else {
      document.body.classList.remove('landing');
      document.body.classList.add('appReady');
    }
  }, [screenStage]);

  const updateCurrentProfile = (updater: (p: StudentProfile) => StudentProfile) => {
    if (!activeId || !profiles[activeId]) return;
    setProfiles(prev => {
      const updated = updater({ ...prev[activeId] });
      syncProfileToCloud(activeId, updated);
      return {
        ...prev,
        [activeId]: updated
      };
    });
  };

  const pushScoreEvent = (event: Omit<LiveTickerEvent, 'id' | 'timestamp'>) => {
    const newEv: LiveTickerEvent = {
      ...event,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    setLiveScoreEvents(prev => {
      const updated = [newEv, ...prev.filter(e => Date.now() - e.timestamp < 3600000)].slice(0, 10);
      try {
        localStorage.setItem('LT_LIVE_SCORE_EVENTS', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const addPoints = (ptsToAdd: number) => {
    if (!currentProfile || ptsToAdd <= 0) return;
    updateCurrentProfile(p => {
      const nextBadges = [...p.badges];
      const newPoints = p.points + ptsToAdd;

      if (ptsToAdd >= 5 && !nextBadges.includes('لاعب لغوي')) {
        nextBadges.push('لاعب لغوي');
      }

      // ألقاب ورتب النقاط التلقائية بمقياس (1 نقطة لكل سؤال)
      if (newPoints >= 10 && !nextBadges.some(b => b.includes('فارس منطلق'))) {
        nextBadges.push('رتبة: فارس منطلق');
      }
      if (newPoints >= 25 && !nextBadges.some(b => b.includes('فارس مقدام'))) {
        nextBadges.push('رتبة: فارس مقدام');
      }
      if (newPoints >= 50 && !nextBadges.some(b => b.includes('فارس متألق'))) {
        nextBadges.push('رتبة: فارس متألق');
      }
      if (newPoints >= 80 && !nextBadges.some(b => b.includes('فارس ذهبي متوج'))) {
        nextBadges.push('رتبة: فارس ذهبي متوج');
      }
      if (newPoints >= 120 && !nextBadges.some(b => b.includes('أسطورة فرسان لغتي'))) {
        nextBadges.push('رتبة: أسطورة فرسان لغتي');
      }

      // فحص انتزاع الصدارة: إذا تفوقت نقاط الطالب على نقاط المتصدر الحالي
      const competitors = leaderboardStudents.filter(
        s => s.profileId !== activeId && s.code !== p.code
      );
      const topCompetitorPoints = competitors.length > 0 ? Math.max(...competitors.map(s => s.points)) : 0;
      const justSeizedLead = competitors.length > 0 && newPoints > topCompetitorPoints && p.points <= topCompetitorPoints;

      if (justSeizedLead) {
        if (!nextBadges.includes('انتزع الصدارة')) {
          nextBadges.push('انتزع الصدارة');
        }
        pushScoreEvent({
          studentName: p.name,
          cls: p.cls,
          type: 'lead',
          text: `🔥 عاجل: الفارس ${p.name} (فصل ${p.cls}) انتزع الصدارة!`,
          highlight: `تربع على المركز الأول برصيد ${newPoints}⭐ نقطة`
        });
        setTimeout(() => {
          fireCelebratoryFireworks();
          showNotice('🔥 انتزعت الصدارة! ما شاء الله تبارك الله، لقد تغلبت على منافسيك وتربعت على قمة فرسان لغتي الخالدة! 🏆');
        }, 250);
      } else {
        pushScoreEvent({
          studentName: p.name,
          cls: p.cls,
          type: 'points',
          text: `تحديث نقاط: الفارس ${p.name} (فصل ${p.cls}) زادت نقاطه +${ptsToAdd}`,
          highlight: `مجموع نقاطه الآن ${newPoints}⭐ نقطة`
        });
      }

      return {
        ...p,
        points: newPoints,
        badges: nextBadges
      };
    });
  };


  const needProfile = (): boolean => {
    if (!currentProfile) {
      setProfileMode('chooser');
      setActiveModal('profileModal');
      return false;
    }
    if (currentProfile.isBlocked) {
      showNotice('عذرًا، هذا الملف موقوف مؤقتًا من قِبل المعلم.');
      return false;
    }
    return true;
  };

  const handleEnterApp = () => {
    setScreenStage('app');
    window.scrollTo(0, 0);
    setTimeout(() => {
      if (!currentProfile) {
        setProfileMode('chooser');
        setActiveModal('profileModal');
      }
    }, 350);
  };

  const handleCreateProfile = () => {
    const n = newName.trim();
    const c = newCode.trim();
    if (!n) return showNotice('اكتب اسم الطالب.');
    if (!/^\d{4}$/.test(c)) return showNotice('اكتب رمزًا من 4 أرقام.');
    const id = `${n}_${c}`;
    if (profiles[id]) return showNotice('يوجد ملف بهذا الاسم والرمز.');
    const created: StudentProfile = {
      name: n,
      code: c,
      cls: newCls,
      points: 0,
      badges: [],
      correct: 0,
      attempts: 0,
      progress: 0,
      completed: [],
      lastActivity: null,
      seenQuestions: {},
      feedback: [],
      mistakes: [],
      resolvedMistakesCount: 0,
      nafesStageIndex: 0,
      completedNafesStages: [],
      lastQuizTitle: 'انضم حديثًا',
      lastQuizScore: 0,
      lastQuizTotal: 0,
      isBlocked: false,
      registeredAt: Date.now(),
      lastActiveAt: Date.now(),
      sessionCount: 1,
      gradeLevel: 'الأول المتوسط',
      lastActivityType: 'تسجيل جديد',
      dailyChallenge: {
        currentIndex: 0,
        nextUnlockMs: 0,
        solvedDays: {}
      }
    };
    try {
      sessionStorage.setItem(`LT_SESSION_RECORDED_${id}`, 'true');
    } catch {}
    setProfiles(prev => ({ ...prev, [id]: created }));
    setActiveId(id);
    syncProfileToCloud(id, created);
    setNewName('');
    setNewCode('');
    setActiveModal(null);
    showNotice('تم إنشاء ملف الطالب وحفظه في سباق الفرسان بنجاح.');
  };

  // Student login from another device using Name & 4-digit PIN
  const handleStudentLoginFromAnyDevice = () => {
    const n = loginName.trim();
    const c = loginPin.trim();
    if (!n) return showNotice('اكتب اسمك الكامل المسجل.');
    if (!/^\d{4}$/.test(c)) return showNotice('اكتب رمزك السري المكون من 4 أرقام.');

    // Look up in cloudStudents first (synced from Firestore)
    const foundCloud = cloudStudents.find(
      s => (s.name.trim() === n || s.profileId.startsWith(n)) && s.code === c
    );

    if (foundCloud) {
      if (foundCloud.isBlocked) {
        return showNotice('عذرًا، هذا الملف موقوف مؤقتًا من قِبل المعلم.');
      }
      const restoredProfile: StudentProfile = {
        name: foundCloud.name,
        code: foundCloud.code,
        cls: foundCloud.cls,
        points: foundCloud.points,
        badges: foundCloud.badges || [],
        correct: foundCloud.correct,
        attempts: foundCloud.attempts,
        progress: foundCloud.progress,
        completed: foundCloud.completed || [],
        lastActivity: null,
        seenQuestions: {},
        feedback: [],
        mistakes: [],
        resolvedMistakesCount: 0,
        nafesStageIndex: foundCloud.nafesStageIndex || 0,
        completedNafesStages: foundCloud.completedNafesStages || [],
        lastQuizTitle: foundCloud.lastQuizTitle,
        lastQuizScore: foundCloud.lastQuizScore,
        lastQuizTotal: foundCloud.lastQuizTotal,
        isBlocked: foundCloud.isBlocked,
        registeredAt: foundCloud.registeredAt,
        lastActiveAt: Date.now(),
        sessionCount: (foundCloud.sessionCount || 0) + 1,
        gradeLevel: foundCloud.gradeLevel || 'الأول المتوسط',
        lastActivityType: 'تسجيل دخول',
        dailyChallenge: {
          currentIndex: foundCloud.dailyCurrentIndex || 0,
          nextUnlockMs: foundCloud.dailyNextUnlockMs || 0,
          solvedDays: {}
        }
      };

      try {
        sessionStorage.setItem(`LT_SESSION_RECORDED_${foundCloud.profileId}`, 'true');
      } catch {}
      setProfiles(prev => ({ ...prev, [foundCloud.profileId]: restoredProfile }));
      setActiveId(foundCloud.profileId);
      syncProfileToCloud(foundCloud.profileId, restoredProfile);
      setLoginName('');
      setLoginPin('');
      setActiveModal(null);
      return showNotice(`🎉 مرحبًا بعودتك يا بطل (${foundCloud.name})! تم تحميل ملفك ونقاطك (${foundCloud.points}) بنجاح.`);
    }

    // Check local profiles
    const localId = `${n}_${c}`;
    if (profiles[localId]) {
      setActiveId(localId);
      setLoginName('');
      setLoginPin('');
      setActiveModal(null);
      return showNotice(`مرحبًا بعودتك يا ${profiles[localId].name}!`);
    }

    showNotice('لم يتم العثور على طالب بهذا الاسم والرمز في قاعدة البيانات السحابية. تأكد من صحة الاسم والرمز أو أنشئ ملفًا جديدًا.');
  };

  const startQuiz = (
    title: string,
    qs: QuestionItem[],
    type: string,
    isLesson = false,
    isRemedial = false,
    hasPassage = false,
    passageData?: { title: string; genre: string; paragraphs: string[] },
    nafesStageId?: string,
    nafesStageIdx?: number
  ) => {
    // التحقق من مواعيد عمل المنصة بقرار المعلم المشرف
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }

    // التحقق الصارم من قفل المعلم للوحدات ومراحل نافس
    if (!isTeacherAdmin) {
      if ((title.includes('الوحدة 1') || type.includes('الوحدة 1')) && appSettings.unit1Open === false) {
        showNotice('🔒 أسئلة الوحدة الأولى مقفلة حالياً بأمر المعلم (أ. مساعد الصخري)، ولا يمكن للطالب تجاوز القفل أبداً إلا بعد فتحها من قِبل المعلم.');
        return;
      }
      if ((title.includes('الوحدة 2') || type.includes('الوحدة 2')) && !appSettings.unit2Open) {
        showNotice('🔒 أسئلة الوحدة الثانية مقفلة حالياً بأمر المعلم (أ. مساعد الصخري)، ولا يمكن للطالب تجاوز القفل أبداً إلا بعد فتحها من قِبل المعلم.');
        return;
      }
      if ((title.includes('الوحدة 3') || type.includes('الوحدة 3')) && !appSettings.unit3Open) {
        showNotice('🔒 أسئلة الوحدة الثالثة مقفلة حالياً بأمر المعلم (أ. مساعد الصخري)، ولا يمكن للطالب تجاوز القفل أبداً إلا بعد فتحها من قِبل المعلم.');
        return;
      }
      if (nafesStageId) {
        const nafesLock = isNafesStageUnlockedByTeacher(nafesStageId, appSettings, isTeacherAdmin);
        if (!nafesLock.unlocked) {
          showNotice(nafesLock.reason || '🔒 هذه المرحلة من اختبار نافس مقفلة حالياً بأمر المعلم (أ. مساعد الصخري).');
          return;
        }
      }
    }

    setQuiz({
      title,
      qs,
      type,
      isLesson,
      isRemedial,
      hasPassage,
      passageData,
      nafesStageId,
      nafesStageIdx
    });
    setQi(0);
    setScore(0);
    setUserAnswers({});
    setEssayDraft('');
    setQuizFinished(false);
    setShowPassage(true);
    setActiveModal('quizModal');
  };

  const handleUnit = (n: number) => {
    if (!needProfile()) return;
    const lockStatus = isCurriculumUnitUnlocked(n, appSettings, isTeacherAdmin);
    if (!lockStatus.unlocked) {
      showNotice(lockStatus.reason || 'هذه الوحدة مقفلة حالياً، انتظر حتى يأذن المعلم بفتحها 🔒');
      return;
    }
    setSelectedUnit(n);
    updateCurrentProfile(p => ({
      ...p,
      lastActivity: { kind: 'unit', n, label: `آخر نشاط: الوحدة ${n} — ${U[n]?.n || ''}` }
    }));
    setActiveModal('lessonModal');
  };

  const handleStartLesson = (title: string, bank: QuestionItem[]) => {
    if (!currentProfile) return;
    const lockStatus = isCurriculumUnitUnlocked(selectedUnit, appSettings, isTeacherAdmin);
    if (!lockStatus.unlocked) {
      showNotice(lockStatus.reason || '🔒 أسئلة هذه الوحدة مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل!');
      return;
    }
    const key = `lesson_${title}`;
    const seenMap = { ...(currentProfile.seenQuestions || {}) };
    let seen = seenMap[key] || [];
    let unseen = bank.map((_, i) => i).filter(i => !seen.includes(i));
    if (!unseen.length) {
      seen = [];
      unseen = bank.map((_, i) => i);
    }
    const chosen: number[] = [];
    const pool = [...unseen];
    while (pool.length && chosen.length < 10) {
      const k = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(k, 1)[0]);
    }
    seenMap[key] = [...seen, ...chosen];
    updateCurrentProfile(p => ({
      ...p,
      seenQuestions: seenMap,
      lastActivity: { kind: 'lesson', n: 1, label: `آخر نشاط: ${title}` }
    }));
    startQuiz(title, chosen.map(i => bank[i]), `درس — ${title}`, true);
  };

  // ============================================================================
  // PROGRESSIVE NON-REPEATING NAFES EXAMS (Unit 1 -> Unit 2 -> Unit 3 -> Renewable)
  // ============================================================================
  const currentNafesStageIdx = currentProfile?.nafesStageIndex || 0;
  const completedNafesStages = currentProfile?.completedNafesStages || [];

  const handleNafes = () => {
    if (!needProfile()) return;
    if (!appSettings.enableNafes) {
      showNotice('اختبار نافس مغلق حاليًا من قِبل المعلم.');
      return;
    }
    setActiveModal('nafesStagesModal');
  };

  const launchNafesStage = (stage: NafesStageExam, idx: number) => {
    if (!needProfile()) return;
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    const stageLock = isNafesStageUnlockedByTeacher(stage.id, appSettings, isTeacherAdmin);
    if (!stageLock.unlocked) {
      showNotice(stageLock.reason || '🔒 هذه المرحلة من اختبار نافس لم تُفتح بعد من قِبل المعلم (أ. مساعد الصخري).');
      return;
    }
    // Prevent returning to an already-completed Nafes exam unless teacher/admin
    if (completedNafesStages.includes(stage.id) && !isTeacherAdmin) {
      showNotice(
        'لقد أتممت هذا الاختبار بنجاح! انتقل الآن إلى المرحلة التالية ذات النص والأسئلة الجديدة.'
      );
      return;
    }
    updateCurrentProfile(p => ({
      ...p,
      lastActivity: { kind: 'nafes', label: `آخر نشاط: ${stage.title}` }
    }));
    startQuiz(
      stage.title,
      stage.questions,
      `${stage.unitLabel} (10 فهم + 10 قواعد + 10 صح/خطأ + 2 مقالي)`,
      false,
      false,
      true,
      stage.passage,
      stage.id,
      idx
    );
  };

  const openMistakesClinic = () => {
    if (!needProfile()) return;
    setMistakesTab('myMistakes');
    setActiveModal('mistakesModal');
  };

  const startMyMistakesRemedialQuiz = () => {
    if (!currentProfile) return;
    const list = currentProfile.mistakes || [];
    if (!list.length) {
      showNotice('لا توجد لديك أخطاء مسجلة حاليًا! يمكنك تجربة تدريب الأخطاء الشائعة.');
      return;
    }
    updateCurrentProfile(p => ({
      ...p,
      lastActivity: { kind: 'remedial', label: 'آخر نشاط: جلسة علاج الأخطاء' }
    }));
    startQuiz(
      'جلسة علاج أخطائي',
      list.map(m => m.question),
      'تدريب علاجي مخصص',
      false,
      true
    );
  };

  const startCommonMistakesQuiz = () => {
    if (!needProfile()) return;
    updateCurrentProfile(p => ({
      ...p,
      lastActivity: { kind: 'remedial', label: 'آخر نشاط: تدريب الأخطاء اللغوية الشائعة' }
    }));
    startQuiz(
      'تدريب علاج الأخطاء الشائعة',
      REMEDIAL_COMMON_QS,
      'تدريب علاجي',
      false,
      false
    );
  };

  const handleResumeLast = () => {
    if (!currentProfile || !currentProfile.lastActivity) return;
    const act = currentProfile.lastActivity;
    if (act.kind === 'unit' && act.n) handleUnit(act.n);
    else if (act.kind === 'nafes') handleNafes();
    else if (act.kind === 'lesson') setActiveModal('lessonModal');
    else if (act.kind === 'remedial') openMistakesClinic();
  };

  const currentQAnswer = userAnswers[qi];
  const isCurrentAnswered = !!currentQAnswer;

  const handleAnswerMcq = (idx: number) => {
    if (isCurrentAnswered || !quiz) return;
    const z = quiz.qs[qi];
    const isCorrect = idx === z[2];
    setUserAnswers(prev => ({
      ...prev,
      [qi]: { selected: idx, isCorrect }
    }));

    if (isCorrect) {
      setScore(s => s + 1);
      if (currentProfile) {
        updateCurrentProfile(p => {
          const existing = p.mistakes || [];
          const existed = existing.some(m => m.question[0] === z[0]);
          if (!existed) return p;
          const filtered = existing.filter(m => m.question[0] !== z[0]);
          const resolvedCount = (p.resolvedMistakesCount || 0) + 1;
          const nextBadges = [...p.badges];
          if (resolvedCount >= 3 && !nextBadges.includes('معالج الأخطاء')) {
            nextBadges.push('معالج الأخطاء');
          }
          if (resolvedCount >= 3 && !nextBadges.includes('طبيب اللغة ومعالج الأخطاء')) {
            nextBadges.push('طبيب اللغة ومعالج الأخطاء');
          }
          return {
            ...p,
            mistakes: filtered,
            resolvedMistakesCount: resolvedCount,
            badges: nextBadges
          };
        });
      }
    } else {
      if (currentProfile) {
        updateCurrentProfile(p => {
          const existing = p.mistakes ? [...p.mistakes] : [];
          const foundIdx = existing.findIndex(m => m.question[0] === z[0]);
          const record: MistakeRecord = {
            question: z,
            wrongChoiceIndex: idx,
            sourceTitle: quiz.title,
            timestamp: new Date().toLocaleDateString('ar-SA')
          };
          if (foundIdx >= 0) {
            existing[foundIdx] = record;
          } else {
            existing.unshift(record);
          }
          // عند الخطأ يتأخر الحصان إلى الخلف بخصم طفيف من النقاط
          const adjustedPoints = Math.max(0, p.points - 2);
          return {
            ...p,
            points: adjustedPoints,
            mistakes: existing
          };
        });
      }
    }
  };

  const handleAnswerEssay = () => {
    if (isCurrentAnswered || !quiz) return;
    if (!essayDraft.trim()) return showNotice('اكتب إجابتك المقالية أولًا.');
    setUserAnswers(prev => ({
      ...prev,
      [qi]: { essay: essayDraft.trim(), isCorrect: true }
    }));
    setScore(s => s + 1);
  };

  const handleFinishQuiz = () => {
    if (!quiz || !currentProfile) return;
    const tot = quiz.qs.length;
    updateCurrentProfile(p => {
      const completed = p.completed ? [...p.completed] : [];
      if (!completed.includes(quiz.title)) {
        completed.push(quiz.title);
      }

      // If this was a Nafes Stage exam, mark it completed and unlock the next stage!
      const compNafes = p.completedNafesStages ? [...p.completedNafesStages] : [];
      let nextNafesStageIdx = p.nafesStageIndex || 0;
      if (quiz.nafesStageId && !compNafes.includes(quiz.nafesStageId)) {
        compNafes.push(quiz.nafesStageId);
      }
      if (quiz.nafesStageIdx !== undefined && quiz.nafesStageIdx >= nextNafesStageIdx) {
        nextNafesStageIdx = quiz.nafesStageIdx + 1;
      }

      const nextBadges = [...p.badges];
      if (score === tot && !nextBadges.includes('إتقان')) {
        nextBadges.push('إتقان');
      }
      if (quiz.nafesStageId && score >= Math.ceil(tot * 0.75) && !nextBadges.includes('فارس نافس')) {
        nextBadges.push('فارس نافس');
      }
      if (compNafes.length >= 3 && !nextBadges.includes('بطل مراحل نافس')) {
        nextBadges.push('بطل مراحل نافس');
      }
      if (quiz.isRemedial && score > 0 && !nextBadges.includes('معالج الأخطاء')) {
        nextBadges.push('معالج الأخطاء');
      }

      // ألقاب إتقان الوحدات الدراسية
      const isHighPass = tot > 0 && score >= Math.ceil(tot * 0.7);
      if (isHighPass) {
        if (selectedUnit === 1 || quiz.title.includes('الوحدة الأولى') || quiz.title.includes('القيم الإسلامية')) {
          if (!nextBadges.includes('بطل الوحدة الأولى')) nextBadges.push('بطل الوحدة الأولى');
        }
        if (selectedUnit === 2 || quiz.title.includes('الوحدة الثانية') || quiz.title.includes('الأعلام')) {
          if (!nextBadges.includes('بطل الوحدة الثانية')) nextBadges.push('بطل الوحدة الثانية');
        }
        if (selectedUnit === 3 || quiz.title.includes('الوحدة الثالثة') || quiz.title.includes('وطني')) {
          if (!nextBadges.includes('بطل الوحدة الثالثة')) nextBadges.push('بطل الوحدة الثالثة');
        }
      }

      if (
        nextBadges.includes('بطل الوحدة الأولى') &&
        nextBadges.includes('بطل الوحدة الثانية') &&
        nextBadges.includes('بطل الوحدة الثالثة') &&
        !nextBadges.includes('فارس الفصحى الأكبر')
      ) {
        nextBadges.push('فارس الفصحى الأكبر');
      }

      if (quiz.nafesStageId && isHighPass && !nextBadges.includes('صنديد نافس الذهبي')) {
        nextBadges.push('صنديد نافس الذهبي');
      }

      // احتساب نقطة واحدة فقط لكل سؤال صحيح لأول مرة (منع تكرار احتساب النقاط عند إعادة الاختبار)
      let newlyEarnedPoints = 0;
      quiz.qs.forEach((q, qIndex) => {
        const userAns = userAnswers[qIndex];
        if (userAns && userAns.isCorrect) {
          const isFirstCorrect = recordQuestionScore(activeId || p.code, quiz.title, q[0]);
          if (isFirstCorrect) {
            newlyEarnedPoints += 1;
          }
        }
      });
      const earnedPoints = newlyEarnedPoints;
      const newPoints = p.points + earnedPoints;
      if (newPoints >= 10 && !nextBadges.some(b => b.includes('فارس منطلق'))) nextBadges.push('رتبة: فارس منطلق');
      if (newPoints >= 25 && !nextBadges.some(b => b.includes('فارس مقدام'))) nextBadges.push('رتبة: فارس مقدام');
      if (newPoints >= 50 && !nextBadges.some(b => b.includes('فارس متألق'))) nextBadges.push('رتبة: فارس متألق');
      if (newPoints >= 80 && !nextBadges.some(b => b.includes('فارس ذهبي متوج'))) nextBadges.push('رتبة: فارس ذهبي متوج');
      if (newPoints >= 120 && !nextBadges.some(b => b.includes('أسطورة فرسان لغتي'))) nextBadges.push('رتبة: أسطورة فرسان لغتي');

      const competitors = leaderboardStudents.filter(
        s => s.profileId !== activeId && s.code !== p.code
      );
      const topCompetitorPoints = competitors.length > 0 ? Math.max(...competitors.map(s => s.points)) : 0;
      if (competitors.length > 0 && newPoints > topCompetitorPoints && p.points <= topCompetitorPoints) {
        if (!nextBadges.includes('انتزع الصدارة')) {
          nextBadges.push('انتزع الصدارة');
        }
        pushScoreEvent({
          studentName: p.name,
          cls: p.cls,
          type: 'lead',
          text: `🔥 عاجل: الفارس ${p.name} (فصل ${p.cls}) انتزع الصدارة!`,
          highlight: `تربع على المركز الأول برصيد ${newPoints}⭐ نقطة`
        });
        setTimeout(() => {
          showNotice('🔥 انتزعت الصدارة! ما شاء الله تبارك الله، لقد تغلبت على منافسيك وتربعت على قمة فرسان لغتي الخالدة! 🏆');
        }, 250);
      } else if (score > 0) {
        pushScoreEvent({
          studentName: p.name,
          cls: p.cls,
          type: 'points',
          text: `الفارس ${p.name} (فصل ${p.cls}) أتم بنجاح ${quiz.title}`,
          highlight: `أحرز +${earnedPoints} ${earnedPoints === 1 ? 'نقطة' : 'نقاط'} ليصبح رصيده ${newPoints}⭐`
        });
      }

      return {
        ...p,
        points: newPoints,
        correct: p.correct + score,
        attempts: p.attempts + 1,
        completed,
        completedNafesStages: compNafes,
        nafesStageIndex: nextNafesStageIdx,
        lastQuizTitle: quiz.title,
        lastQuizScore: score,
        lastQuizTotal: tot,
        progress: Math.min(100, completed.length * 12),
        badges: nextBadges
      };
    });
    setQuizFinished(true);
    if (quiz.nafesStageId || quiz.nafesStageIdx !== undefined || score === tot) {
      fireCelebratoryFireworks();
    }
  };

  // Games handlers
  const openGames = () => {
    if (!needProfile()) return;
    if (!appSettings.enableGames) {
      showNotice('مركز الألعاب مغلق مؤقتًا من قِبل المعلم.');
      return;
    }
    if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    setGameView('menu');
    setActiveModal('gamesModal');
  };

  // دالة استخراج الوحدات المفتوحة والمصرح بظهور أسئلتها في الألعاب
  const getUnlockedGameUnits = (): (1 | 2 | 3)[] => {
    if (isTeacherAdmin) return [1, 2, 3];
    const units: (1 | 2 | 3)[] = [];
    if (appSettings.unit1Open !== false) units.push(1);
    if (appSettings.unit2Open === true) units.push(2);
    if (appSettings.unit3Open === true) units.push(3);
    return units.length > 0 ? units : [1];
  };

  // -------------------------------------------------------------
  // نظام محاولات مركز الألعاب: محاولة واحدة فقط لكل لعبة كل 24 ساعة
  // -------------------------------------------------------------
  const GAME_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 ساعة = 86,400,000 مللي ثانية

  const getGameCooldown = (gameKey: 'detective' | 'order' | 'meaning' | 'speed') => {
    if (isTeacherAdmin) {
      return { isLocked: false, remainingMs: 0, formattedRemaining: '', nextAllowedDateStr: '' };
    }
    if (!activeId) {
      return { isLocked: false, remainingMs: 0, formattedRemaining: '', nextAllowedDateStr: '' };
    }
    const profile = profiles[activeId];
    let lastPlayedMs = 0;
    if (profile?.gameCooldowns && profile.gameCooldowns[gameKey]) {
      lastPlayedMs = Number(profile.gameCooldowns[gameKey]) || 0;
    }
    try {
      const local = localStorage.getItem(`LT_GAME_COOLDOWNS_${activeId}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed[gameKey] && Number(parsed[gameKey]) > lastPlayedMs) {
          lastPlayedMs = Number(parsed[gameKey]);
        }
      }
    } catch {}

    if (!lastPlayedMs) {
      return { isLocked: false, remainingMs: 0, formattedRemaining: '', nextAllowedDateStr: '' };
    }

    const elapsed = Date.now() - lastPlayedMs;
    const remainingMs = GAME_COOLDOWN_MS - elapsed;
    if (remainingMs <= 0) {
      return { isLocked: false, remainingMs: 0, formattedRemaining: '', nextAllowedDateStr: '' };
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedRemaining = hours > 0
      ? `${hours} س و ${minutes} د`
      : `${minutes} د و ${seconds} ث`;

    const nextAllowedDate = new Date(lastPlayedMs + GAME_COOLDOWN_MS);
    const nextAllowedDateStr = nextAllowedDate.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      isLocked: true,
      remainingMs,
      formattedRemaining,
      nextAllowedDateStr
    };
  };

  const recordGameAttempt = (gameKey: 'detective' | 'order' | 'meaning' | 'speed') => {
    if (isTeacherAdmin) return;
    const now = Date.now();
    updateCurrentProfile(p => {
      const prevCooldowns = p.gameCooldowns || {};
      return {
        ...p,
        gameCooldowns: {
          ...prevCooldowns,
          [gameKey]: now
        }
      };
    });
    try {
      if (activeId) {
        const key = `LT_GAME_COOLDOWNS_${activeId}`;
        const prev = JSON.parse(localStorage.getItem(key) || '{}');
        prev[gameKey] = now;
        localStorage.setItem(key, JSON.stringify(prev));
      }
    } catch {}
  };

  const resetStudentGameCooldowns = (studentProfileId?: string) => {
    const targetId = studentProfileId || activeId;
    if (!targetId) return;
    setProfiles(prev => {
      const p = prev[targetId];
      if (!p) return prev;
      return {
        ...prev,
        [targetId]: {
          ...p,
          gameCooldowns: {}
        }
      };
    });
    try {
      localStorage.removeItem(`LT_GAME_COOLDOWNS_${targetId}`);
    } catch {}
    showNotice('🔄 تم تصفير مؤقتات الألعاب وفتح المحاولات اليومية بنجاح!');
  };

  // 1. المحقق اللغوي (Detective) — أسئلة دروس الوحدات المفتوحة فقط
  const startDetective = () => {
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    const teacherLock = isGameUnlockedByTeacher('detective', appSettings, isTeacherAdmin);
    if (!teacherLock.unlocked) {
      showNotice(teacherLock.reason || '🔒 أسئلة لعبة «المحقق اللغوي» مقفلة حالياً بأمر المعلم ولا يمكن تجاوز القفل!');
      return;
    }
    const cooldown = getGameCooldown('detective');
    if (cooldown.isLocked) {
      showNotice(`⏳ استنفدت محاولتك اليومية في المحقق اللغوي! تتجدد المحاولة بعد: ${cooldown.formattedRemaining}`);
      return;
    }
    recordGameAttempt('detective');

    const unlockedUnits = getUnlockedGameUnits();
    const unitPool = getDetectiveBankByUnits(unlockedUnits);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.detective, 5);
    seen.detective = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    const prepared = batch.selected.map(q => {
      const correctOpt = q.options[q.answer];
      const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
      const newAnswer = shuffledOpts.indexOf(correctOpt);
      return { ...q, options: shuffledOpts, answer: newAnswer };
    });

    setGameDetectiveList(prepared);
    setDetIndex(0);
    setDetScore(0);
    setDetSelected(null);
    setDetDone(false);
    const unitsText = unlockedUnits.map(u => `الوحدة ${u}`).join(' و ');
    setGameCycleNotice(batch.wasReset ? '🎉 بدأت دورة جديدة بأسئلة متجددة بالوحدات المفتوحة!' : `🔄 أسئلة من دروس: ${unitsText}`);
    setGameView('detective');
  };

  const answerDetective = (j: number) => {
    if (detSelected !== null || !gameDetectiveList[detIndex]) return;
    setDetSelected(j);
    const isCorrect = j === gameDetectiveList[detIndex].answer;
    if (isCorrect) {
      setDetScore(s => s + 1);
      // نقطة واحدة فقط لكل سؤال صحيح لأول مرة (بدون تكرار)
      const isNew = recordQuestionScore(activeId, 'game_detective', gameDetectiveList[detIndex].prompt);
      if (isNew) {
        addPoints(1);
      }
    }
  };

  const nextDetective = () => {
    if (detIndex + 1 < gameDetectiveList.length) {
      setDetIndex(detIndex + 1);
      setDetSelected(null);
    } else {
      setDetDone(true);
      if (detScore === gameDetectiveList.length && gameDetectiveList.length > 0) {
        updateCurrentProfile(p => {
          if (!p.badges.includes('محقق الضاد البارع')) {
            return { ...p, badges: [...p.badges, 'محقق الضاد البارع'] };
          }
          return p;
        });
        fireCelebratoryFireworks();
        showNotice('🔎 مبارك! نلت لقب «محقق الضاد البارع» لإتقانك جميع أسئلة المحقق اللغوي بعلامة كاملة!');
      }
    }
  };


  // 2. ركّب الجملة (Order Sentence) — مرتبطة بدروس الوحدات الثلاث مع قفل الوحدات المقفلة
  const setupOrderSentence = (item: OrderQuestion) => {
    const shuffled = [...item.words].sort(() => Math.random() - 0.5);
    if (shuffled.join(' ') === item.words.join(' ') && shuffled.length > 1) {
      shuffled.reverse();
    }
    setOrderWords(shuffled);
    setOrderChosen([]);
  };

  const startOrderGame = (targetUnit?: 1 | 2 | 3) => {
    const teacherLock = isGameUnlockedByTeacher('order', appSettings, isTeacherAdmin);
    if (!teacherLock.unlocked) {
      showNotice(teacherLock.reason || '🔒 لعبة «ركّب الجملة» مقفلة حالياً بأمر المعلم ولا يمكن تجاوز القفل!');
      return;
    }
    const cooldown = getGameCooldown('order');
    if (cooldown.isLocked) {
      showNotice(`⏳ استنفدت محاولتك اليومية في لعبة ركّب الجملة! تتجدد المحاولة بعد: ${cooldown.formattedRemaining}`);
      return;
    }
    recordGameAttempt('order');
    setOrderSessionSolvedCount(0);
    setOrderDone(false);

    const progress = getOrderGameProgress(activeId);
    const unlockedUnits = getUnlockedGameUnits();
    let chosenUnit: 1 | 2 | 3 = targetUnit || orderSelectedUnit || 1;

    // Check if unit is unlocked
    const status = isOrderUnitUnlocked(chosenUnit, appSettings, progress, isTeacherAdmin);
    if (!status.unlocked || (!isTeacherAdmin && !unlockedUnits.includes(chosenUnit))) {
      chosenUnit = unlockedUnits[0] || 1;
    }
    setOrderSelectedUnit(chosenUnit);

    const unitPool = getOrderBankByUnit(chosenUnit);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.order, 1);
    seen.order = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    setGameOrderList(batch.selected);
    setGameOrderActiveIdx(0);
    if (batch.selected.length > 0) {
      setupOrderSentence(batch.selected[0]);
    }
    setGameCycleNotice(
      batch.wasReset
        ? `🎉 بدأت دورة جديدة بجمل متجددة في الوحدة ${chosenUnit}!`
        : `🔄 جملة جديدة غير مكررة من دروس الوحدة ${chosenUnit}`
    );
    setGameView('order');
  };

  const switchOrderUnit = (newUnit: 1 | 2 | 3) => {
    const progress = getOrderGameProgress(activeId);
    const unlockedUnits = getUnlockedGameUnits();
    const status = isOrderUnitUnlocked(newUnit, appSettings, progress, isTeacherAdmin);
    if (!status.unlocked || (!isTeacherAdmin && !unlockedUnits.includes(newUnit))) {
      showNotice(status.reason || `🔒 الوحدة ${newUnit} مقفلة حالياً بأمر المعلم، ولن تظهر أسئلتها حتى يأذن بفتحها.`);
      return;
    }
    setOrderSelectedUnit(newUnit);
    const unitPool = getOrderBankByUnit(newUnit);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.order, 1);
    seen.order = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    setGameOrderList(batch.selected);
    setGameOrderActiveIdx(0);
    if (batch.selected.length > 0) {
      setupOrderSentence(batch.selected[0]);
    }
    showNotice(`تم الانتقال إلى الوحدة ${newUnit} بنجاح!`);
  };

  const nextOrderSentence = () => {
    const unitPool = getOrderBankByUnit(orderSelectedUnit);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.order, 1);
    seen.order = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    setGameOrderList(batch.selected);
    setGameOrderActiveIdx(0);
    if (batch.selected.length > 0) {
      setupOrderSentence(batch.selected[0]);
      showNotice('🔄 تم تحميل جملة جديدة غير مكررة!');
    }
  };

  const checkOrderGame = () => {
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    const currentQ = gameOrderList[gameOrderActiveIdx];
    if (!currentQ) return;
    const target = currentQ.words.join(' ');
    const sentence = orderChosen.map(i => orderWords[i]).join(' ');
    if (sentence === target) {
      // نقطة واحدة لكل سؤال صحيح لأول مرة استجابة لطلب المعلم (بدون تكرار النقاط)
      const isNew = recordQuestionScore(activeId, 'game_order', target);
      if (isNew) {
        addPoints(1);
      }

      // Save unit progress and check for unlocking next unit
      const progress = getOrderGameProgress(activeId);
      const prevCount = progress.unitSolvedCount[orderSelectedUnit] || 0;
      const currentCount = prevCount + 1;
      progress.unitSolvedCount[orderSelectedUnit] = currentCount;

      let celebration = '';
      if (currentCount >= 5 && !progress.completedUnits.includes(orderSelectedUnit)) {
        progress.completedUnits.push(orderSelectedUnit);
        fireCelebratoryFireworks();
        if (orderSelectedUnit === 1) {
          celebration = '🎉 مبارك يا بطل! أتممت بنجاح دروس الوحدة الأولى ونلت لقب «مهندس التراكيب والجمل»!';
        } else if (orderSelectedUnit === 2) {
          celebration = '🎉 رائع ومتميز! أتممت تدريبات الوحدة الثانية ونلت لقب «مهندس التراكيب والجمل»!';
        } else if (orderSelectedUnit === 3) {
          celebration = '🏆 إنجاز استثنائي ومتقن! أتممت بنجاح جميع تدريبات لغتي ونلت لقب «مهندس التراكيب والجمل»!';
        }
      }
      if (currentCount >= 5) {
        updateCurrentProfile(p => {
          if (!p.badges.includes('مهندس التراكيب والجمل')) {
            return { ...p, badges: [...p.badges, 'مهندس التراكيب والجمل'] };
          }
          return p;
        });
      }
      saveOrderGameProgress(activeId, progress);

      const nextSessionCount = orderSessionSolvedCount + 1;
      setOrderSessionSolvedCount(nextSessionCount);

      if (celebration) {
        showNotice(celebration);
      } else {
        const ruleHint = currentQ.ruleExplanation ? ` (${currentQ.ruleExplanation})` : '';
        showNotice(`⭐ رائع ومتقن! ترتيب صحيح (+1 نقطة) — [جملة ${nextSessionCount}/5 لمحاولة اليوم]${ruleHint}`);
      }

      if (nextSessionCount >= 5) {
        setOrderDone(true);
        fireCelebratoryFireworks();
        showNotice('🎉 أداء بطولي! أتممت بنجاح الجمل الخمس لمحاولة اليوم في تركيب الجمل (+5 نقاط بواقع نقطة لكل جملة)! ستتاح محاولتك القادمة بعد 24 ساعة.');
      } else {
        setTimeout(() => {
          nextOrderSentence();
        }, 900);
      }
    } else {
      showNotice('راجع ترتيب الكلمات، يمكنك الضغط على الكلمة المختارة أو زر تراجع لتعديلها.');
    }
  };

  // 3. معنى الكلمة (Meaning) — مفردات نصوص الوحدات المفتوحة فقط
  const startMeaning = () => {
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    const teacherLock = isGameUnlockedByTeacher('meaning', appSettings, isTeacherAdmin);
    if (!teacherLock.unlocked) {
      showNotice(teacherLock.reason || '🔒 أسئلة لعبة «معنى الكلمة» مقفلة حالياً بأمر المعلم ولا يمكن تجاوز القفل!');
      return;
    }
    const cooldown = getGameCooldown('meaning');
    if (cooldown.isLocked) {
      showNotice(`⏳ استنفدت محاولتك اليومية في معنى الكلمة! تتجدد المحاولة بعد: ${cooldown.formattedRemaining}`);
      return;
    }
    recordGameAttempt('meaning');

    const unlockedUnits = getUnlockedGameUnits();
    const unitPool = getMeaningBankByUnits(unlockedUnits);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.meaning, 5);
    seen.meaning = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    const prepared = batch.selected.map(item => {
      const shuffledOpts = [...item.options].sort(() => Math.random() - 0.5);
      return { ...item, options: shuffledOpts };
    });

    setGameMeaningList(prepared);
    setMeanIndex(0);
    setMeanScore(0);
    setMeanDone(false);
    if (prepared.length > 0) {
      setMeanOpts(prepared[0].options);
    }
    const unitsText = unlockedUnits.map(u => `الوحدة ${u}`).join(' و ');
    setGameCycleNotice(batch.wasReset ? '🎉 بدأت دورة جديدة بمفردات متجددة بالوحدات المفتوحة!' : `🔄 مفردات من نصوص: ${unitsText}`);
    setGameView('meaning');
  };

  const answerMeaning = (o: string) => {
    const currentQ = gameMeaningList[meanIndex];
    if (!currentQ) return;
    const isCorrect = o === currentQ.correctMeaning;
    const nextScore = isCorrect ? meanScore + 1 : meanScore;
    if (isCorrect) {
      showNotice('أحسنت! معنى دقيق وصحيح ✅');
      // نقطة واحدة فقط لكل سؤال صحيح لأول مرة (بدون تكرار)
      const isNew = recordQuestionScore(activeId, 'game_meaning', currentQ.word);
      if (isNew) {
        addPoints(1);
      }
    }

    if (meanIndex + 1 < gameMeaningList.length) {
      const nextIdx = meanIndex + 1;
      setMeanScore(nextScore);
      setMeanIndex(nextIdx);
      setMeanOpts(gameMeaningList[nextIdx].options);
    } else {
      setMeanScore(nextScore);
      setMeanDone(true);
      if (nextScore >= 4) {
        updateCurrentProfile(p => {
          if (!p.badges.includes('خازن المعاجم والمفردات')) {
            return { ...p, badges: [...p.badges, 'خازن المعاجم والمفردات'] };
          }
          return p;
        });
        fireCelebratoryFireworks();
        showNotice('🧠 ما شاء الله! نلت لقب «خازن المعاجم والمفردات» لبراعتك وفصاحتك في معاني الكلمات!');
      }
    }
  };

  // 4. تحدي السرعة (Speed Challenge) — أسئلة دروس الوحدات المفتوحة فقط
  const startSpeed = () => {
    if (!scheduleInfo.isOpen && !isTeacherAdmin) {
      showNotice(scheduleInfo.message || '🔒 المنصة مغلقة حاليًا بقرار المعلم المشرف (أ. مساعد الصخري). انتظر إذن المعلم للفتح.');
      return;
    }
    const teacherLock = isGameUnlockedByTeacher('speed', appSettings, isTeacherAdmin);
    if (!teacherLock.unlocked) {
      showNotice(teacherLock.reason || '🔒 أسئلة لعبة «تحدي السرعة» مقفلة حالياً بأمر المعلم ولا يمكن تجاوز القفل!');
      return;
    }
    const cooldown = getGameCooldown('speed');
    if (cooldown.isLocked) {
      showNotice(`⏳ استنفدت محاولتك اليومية في تحدي السرعة! تتجدد المحاولة بعد: ${cooldown.formattedRemaining}`);
      return;
    }
    recordGameAttempt('speed');

    if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    const unlockedUnits = getUnlockedGameUnits();
    const unitPool = getSpeedBankByUnits(unlockedUnits);
    const seen = getSeenGames(activeId);
    const batch = getNonRepeatingBatch(unitPool, seen.speed, 8);
    seen.speed = batch.updatedSeenIds;
    saveSeenGames(activeId, seen);

    const prepared = batch.selected.map(q => {
      const correctOpt = q.options[q.answer];
      const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
      const newAnswer = shuffledOpts.indexOf(correctOpt);
      return { ...q, options: shuffledOpts, answer: newAnswer };
    });

    setGameSpeedList(prepared);
    setSpeedIndex(0);
    setSpeedScore(0);
    setSpeedTime(30);
    setSpeedDone(false);
    const unitsText = unlockedUnits.map(u => `الوحدة ${u}`).join(' و ');
    setGameCycleNotice(batch.wasReset ? '🎉 جولة متجددة تمامًا بالوحدات المفتوحة!' : `🔄 أسئلة سرعة من دروس: ${unitsText}`);
    setGameView('speed');

    speedTimerRef.current = window.setInterval(() => {
      setSpeedTime(prev => {
        if (prev <= 1) {
          if (speedTimerRef.current) clearInterval(speedTimerRef.current);
          setSpeedDone(true);
          setSpeedScore(currentScore => {
            if (currentScore >= 6) {
              updateCurrentProfile(p => {
                if (!p.badges.includes('فارس السرعة الخاطفة')) {
                  return { ...p, badges: [...p.badges, 'فارس السرعة الخاطفة'] };
                }
                return p;
              });
              fireCelebratoryFireworks();
            }
            return currentScore;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const answerSpeed = (j: number) => {
    const currentQ = gameSpeedList[speedIndex];
    if (!currentQ) return;
    const isCorrect = j === currentQ.answer;
    const nextScore = isCorrect ? speedScore + 1 : speedScore;
    if (isCorrect) {
      // نقطة واحدة فقط لكل سؤال صحيح لأول مرة استجابة لطلب المعلم (بدون تكرار)
      const isNew = recordQuestionScore(activeId, 'game_speed', currentQ.prompt);
      if (isNew) {
        addPoints(1);
      }
    }

    if (speedIndex + 1 < gameSpeedList.length) {
      setSpeedScore(nextScore);
      setSpeedIndex(speedIndex + 1);
    } else {
      if (speedTimerRef.current) clearInterval(speedTimerRef.current);
      setSpeedScore(nextScore);
      setSpeedDone(true);
      if (nextScore >= 6) {
        updateCurrentProfile(p => {
          if (!p.badges.includes('فارس السرعة الخاطفة')) {
            return { ...p, badges: [...p.badges, 'فارس السرعة الخاطفة'] };
          }
          return p;
        });
        fireCelebratoryFireworks();
        showNotice('⚡ إنجاز استثنائي خاطف! نلت لقب «فارس السرعة الخاطفة» لإحرازك 6 إجابات صحيحة في 30 ثانية!');
      }
    }
  };

  const handleSendFeedback = async () => {
    const t = fbText.trim();
    if (!t) return showNotice('اكتب الاقتراح أولًا.');
    const studentName = (fbStudentName.trim() || currentProfile?.name || 'طالب متميز').slice(0, 50);
    const studentCls = (fbCls && fbCls !== 'بدون تحديد' ? fbCls : currentProfile?.cls || 'بدون تحديد').slice(0, 30);
    const feedId = `fb_${Date.now()}`;
    const newItem: FeedbackItem = {
      role: studentName,
      cls: studentCls,
      text: t.slice(0, 500),
      status: 'وارد للمعلم',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'feedback', feedId), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `feedback/${feedId}`);
    }
    setFbText('');
    setFbStudentName('');
    showNotice('تم إرسال اقتراحك وملاحظتك للمعلم بنجاح.');
  };

  // ============================================================================
  // ADMIN / TEACHER DATABASE CONTROLS
  // ============================================================================
  const handleGoogleAdminLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotice('تم تسجيل الدخول بحساب Google بنجاح.');
    } catch (err) {
      showNotice('تعذر تسجيل الدخول عبر نافذة Google، يمكنك استخدام رمز المعلم السريع.');
    }
  };

  const handlePinAdminLogin = () => {
    if (adminPinInput.trim() === (appSettings.adminPin || '1448')) {
      setAdminUnlockedByPin(true);
      try {
        localStorage.setItem('LT_ADMIN_UNLOCKED', 'true');
      } catch {}
      setAdminPinInput('');
      showNotice('مرحبًا بك أستاذ مساعد! تم فتح لوحة التحكم الكاملة.');
    } else {
      showNotice('رمز المعلم غير صحيح.');
    }
  };

  const handleSaveSettingsToCloud = async (updated: AppSettings) => {
    const payload: AppSettings = {
      announcement: (updated.announcement || '').slice(0, 400),
      enforce24hChallengeLock: Boolean(updated.enforce24hChallengeLock),
      enableGames: Boolean(updated.enableGames),
      enableNafes: Boolean(updated.enableNafes),
      enableFeedback: Boolean(updated.enableFeedback),
      adminPin: (updated.adminPin || '1448').slice(0, 12),
      platformManualStatus: updated.platformManualStatus || 'open',
      scheduleEnabled: Boolean(updated.scheduleEnabled),
      scheduledOpenAt: (updated.scheduledOpenAt || '').slice(0, 50),
      scheduledCloseAt: (updated.scheduledCloseAt || '').slice(0, 50),
      scheduleNote: (updated.scheduleNote || '').slice(0, 200),
      orderUnlockAll: Boolean(updated.orderUnlockAll),
      orderUnit1Open: updated.orderUnit1Open !== false,
      orderUnit2Open: Boolean(updated.orderUnit2Open),
      orderUnit3Open: Boolean(updated.orderUnit3Open),
      unit1Open: updated.unit1Open !== false,
      unit2Open: Boolean(updated.unit2Open),
      unit3Open: Boolean(updated.unit3Open),
      gameDetectiveOpen: updated.gameDetectiveOpen !== false,
      gameOrderOpen: updated.gameOrderOpen !== false,
      gameMeaningOpen: updated.gameMeaningOpen !== false,
      gameSpeedOpen: updated.gameSpeedOpen !== false,
      nafesStage1Open: updated.nafesStage1Open !== false,
      nafesStage2Open: Boolean(updated.nafesStage2Open),
      nafesStage3Open: Boolean(updated.nafesStage3Open),
      nafesStage4Open: Boolean(updated.nafesStage4Open),
      tickerCustomText: (updated.tickerCustomText || '').slice(0, 500),
      tickerAnnouncements: (updated.tickerAnnouncements || []).map(a => ({
        id: a.id,
        text: a.text.slice(0, 400),
        active: Boolean(a.active),
        order: Number(a.order) || 1,
        createdAt: Number(a.createdAt) || Date.now(),
        category: a.category || 'توجيه'
      })),
      updatedAt: Date.now()
    };
    try {
      try {
        localStorage.setItem('LT_GLOBAL_SETTINGS', JSON.stringify(payload));
      } catch {}
      await setDoc(doc(db, 'app_settings', 'global'), payload);
      showNotice('✅ تم حفظ الإعدادات وتحديث الصلاحيات سحابياً بنجاح!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'app_settings/global');
    }
  };

  // معالجات رسائل أولياء الأمور (تواصل خاص وسري مع المعلم)
  const handleSendParentMessage = async (category: MessageCategory, text: string) => {
    if (!currentProfile) {
      showNotice('يرجى تسجيل الدخول كطالب أولاً لتتمكن من إرسال رسالة المعلم.');
      return;
    }
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ParentMessage = {
      id: msgId,
      studentId: activeId,
      studentName: currentProfile.name,
      studentCls: currentProfile.cls,
      category,
      text,
      status: 'جديد',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'parent_messages', msgId), newMsg);
      showNotice('✅ تم إرسال رسالتك للمعلم (أ. مساعد الصخري) بنجاح! سيتم إشعارك فور الرد.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parent_messages/${msgId}`);
      setParentMessages(prev => [newMsg, ...prev]);
    }
  };

  const handleReplyParentMessage = async (messageId: string, replyText: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    try {
      const target = parentMessages.find(m => m.id === messageId);
      if (!target) return;
      const updated: ParentMessage = {
        ...target,
        status: 'تم الرد',
        replyText: trimmed,
        replyAt: Date.now(),
        teacherName: 'أ. مساعد سليمان الصخري'
      };
      await setDoc(doc(db, 'parent_messages', messageId), updated);
      showNotice(`✅ تم إرسال الرد لولي أمر الطالب «${target.studentName}» بنجاح!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parent_messages/${messageId}`);
    }
  };

  const handleMarkParentMessageRead = async (messageId: string) => {
    try {
      const target = parentMessages.find(m => m.id === messageId);
      if (!target) return;
      const updated: ParentMessage = { ...target, status: 'مقروءة' };
      await setDoc(doc(db, 'parent_messages', messageId), updated);
      showNotice('👁️ تم تحديد الرسالة كمقروءة.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parent_messages/${messageId}`);
    }
  };

  const handleDeleteParentMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'parent_messages', messageId));
      setParentMessages(prev => prev.filter(m => m.id !== messageId));
      showNotice('🗑️ تم حذف الرسالة بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `parent_messages/${messageId}`);
    }
  };

  // عبور وتتويج خط النهاية
  const handleCrossFinishLine = () => {
    if (!currentProfile) return;
    const isFirstTime = !currentProfile.finishLineReached;

    updateCurrentProfile(p => {
      const nextBadges = [...p.badges];
      if (!nextBadges.includes('فاتح خط النهاية')) {
        nextBadges.push('فاتح خط النهاية');
      }
      return {
        ...p,
        finishLineReached: true,
        raceCompletedAt: p.raceCompletedAt || Date.now(),
        points: isFirstTime ? p.points + 50 : p.points,
        badges: nextBadges
      };
    });

    if (isFirstTime) {
      pushScoreEvent({
        studentName: currentProfile.name,
        cls: currentProfile.cls,
        type: 'lead',
        text: `🏆 إنجاز تاريخي: الفارس ${currentProfile.name} استكمل جميع المتطلبات وأتم السباق بنجاح!`,
        highlight: `حصد وسام «فاتح خط النهاية الذهبي» و +50⭐ نقطة!`
      });
    }

    fireCelebratoryFireworks();
    setActiveModal('raceFinishModal');
  };

  const handleToggleUnitByTeacher = (unitNum: number, open: boolean) => {
    if (!isTeacherAdmin) {
      showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
      return;
    }
    const updated: AppSettings = {
      ...appSettings,
      ...(unitNum === 1
        ? { unit1Open: open, orderUnit1Open: open }
        : unitNum === 2
        ? { unit2Open: open, orderUnit2Open: open }
        : { unit3Open: open, orderUnit3Open: open })
    };
    setAppSettings(updated);
    handleSaveSettingsToCloud(updated);
    showNotice(
      open
        ? `🔓 تم الإذن بفتح الوحدة ${unitNum} (${U[unitNum]?.n || ''}) لجميع الطلاب!`
        : `🔒 تم إقفال أسئلة الوحدة ${unitNum} (${U[unitNum]?.n || ''})، ولن يتمكن الطلاب من تجاوز القفل.`
    );
  };

  const handleToggleGameByTeacher = (
    gameKey: 'detective' | 'order' | 'meaning' | 'speed',
    open: boolean
  ) => {
    if (!isTeacherAdmin) {
      showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
      return;
    }
    const updated: AppSettings = {
      ...appSettings,
      ...(gameKey === 'detective' ? { gameDetectiveOpen: open } : {}),
      ...(gameKey === 'order' ? { gameOrderOpen: open } : {}),
      ...(gameKey === 'meaning' ? { gameMeaningOpen: open } : {}),
      ...(gameKey === 'speed' ? { gameSpeedOpen: open } : {})
    };
    setAppSettings(updated);
    handleSaveSettingsToCloud(updated);
    const titles = {
      detective: 'المحقق اللغوي',
      order: 'ركّب الجملة (سباق الترتيب)',
      meaning: 'معنى الكلمة',
      speed: 'تحدي السرعة اللغوي'
    };
    showNotice(
      open
        ? `🔓 تم الإذن بفتح أسئلة لعبة «${titles[gameKey]}» لجميع الطلاب بنجاح!`
        : `🔒 تم إقفال لعبة «${titles[gameKey]}» بأمر المعلم، ولن يتمكن أي طالب من تجاوز القفل.`
    );
  };

  const handleSetAllGames = (open: boolean) => {
    if (!isTeacherAdmin) {
      showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
      return;
    }
    const updated: AppSettings = {
      ...appSettings,
      gameDetectiveOpen: open,
      gameOrderOpen: open,
      gameMeaningOpen: open,
      gameSpeedOpen: open
    };
    setAppSettings(updated);
    handleSaveSettingsToCloud(updated);
    showNotice(
      open
        ? '🔓 تم الإذن بفتح جميع ألعاب مركز الألعاب اللغوية (4 ألعاب) لجميع الطلاب بنجاح!'
        : '🔒 تم إقفال جميع ألعاب مركز الألعاب اللغوية بأمر المعلم، ولن يتمكن الطلاب من تجاوز القفل.'
    );
  };

  const handlePlatformOpenNow = async () => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    const updated: AppSettings = {
      ...appSettings,
      platformManualStatus: 'open',
      scheduleEnabled: false,
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    setSchedEnabledDraft(false);
    await handleSaveSettingsToCloud(updated);
    showNotice('🟢 تم فتح المنصة فوراً لجميع الطلاب بإذن المعلم المشرف (أ. مساعد الصخري)!');
  };

  const handlePlatformCloseNow = async () => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    const updated: AppSettings = {
      ...appSettings,
      platformManualStatus: 'closed',
      scheduleEnabled: false,
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    setSchedEnabledDraft(false);
    await handleSaveSettingsToCloud(updated);
    showNotice('🔒 تم إغلاق المنصة فوراً لجميع الطلاب بقرار المعلم المشرف.');
  };

  const handleSavePlatformSchedule = async () => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    if (schedEnabledDraft && (!schedOpenInput || !schedCloseInput)) {
      showNotice('يرجى تحديد وقت وتاريخ الفتح المجدول ووقت وتاريخ الإغلاق المجدول بدقة.');
      return;
    }
    const updated: AppSettings = {
      ...appSettings,
      scheduleEnabled: schedEnabledDraft,
      scheduledOpenAt: schedOpenInput,
      scheduledCloseAt: schedCloseInput,
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    await handleSaveSettingsToCloud(updated);
    showNotice(
      schedEnabledDraft
        ? '✅ تم حفظ وتفعيل جدول مواعيد المنصة بنجاح في قاعدة البيانات السحابية!'
        : '✅ تم حفظ التعديل بنجاح مع الاعتماد على التحكم اليدوي المباشر.'
    );
  };

  const handleCancelPlatformSchedule = async () => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    setSchedOpenInput('');
    setSchedCloseInput('');
    setSchedEnabledDraft(false);
    const updated: AppSettings = {
      ...appSettings,
      scheduleEnabled: false,
      scheduledOpenAt: '',
      scheduledCloseAt: '',
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    await handleSaveSettingsToCloud(updated);
    showNotice('❌ تم إلغاء الجدول الزمني والاعتماد على التحكم اليدوي المباشر للمعلم.');
  };

  const handleToggleNafesStage = async (stageNumber: 1 | 2 | 3 | 4, open: boolean) => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    const key = stageNumber === 1 ? 'nafesStage1Open' : stageNumber === 2 ? 'nafesStage2Open' : stageNumber === 3 ? 'nafesStage3Open' : 'nafesStage4Open';
    const updated: AppSettings = {
      ...appSettings,
      [key]: open,
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    await handleSaveSettingsToCloud(updated);
    showNotice(
      open
        ? `🔓 تم الإذن بفتح المرحلة ${stageNumber} من اختبار نافس للطلاب بنجاح!`
        : `🔒 تم إغلاق المرحلة ${stageNumber} من اختبار نافس عن الطلاب.`
    );
  };

  const handleSetAllNafesStages = async (open: boolean) => {
    if (!isTeacherAdmin) return showNotice('هذا الإجراء مخصص للمعلم المشرف فقط.');
    const updated: AppSettings = {
      ...appSettings,
      nafesStage1Open: open,
      nafesStage2Open: open,
      nafesStage3Open: open,
      nafesStage4Open: open,
      updatedAt: Date.now()
    };
    setAppSettings(updated);
    await handleSaveSettingsToCloud(updated);
    showNotice(
      open
        ? '🔓 تم فتح جميع مراحل اختبار نافس (المراحل 1 - 4) لجميع الطلاب فوراً!'
        : '🔒 تم إغلاق جميع مراحل اختبار نافس.'
    );
  };

  const handleAddCustomChallenge = async () => {
    if (!newChQuestion.trim() || !newChOpt0.trim() || !newChOpt1.trim()) {
      return showNotice('يرجى تعبئة نص السؤال والاختيارات الأربعة.');
    }
    const chId = `ch_day_${newChDay}_${Date.now()}`;
    const payload = {
      day: Math.max(1, Math.min(365, Number(newChDay) || 11)),
      level: newChLevel.slice(0, 40),
      points: Math.max(5, Math.min(500, Number(newChPoints) || 30)),
      unitTopic: (newChTopic.trim() || 'تحدي المعلم').slice(0, 120),
      question: newChQuestion.trim().slice(0, 500),
      options: [
        newChOpt0.trim().slice(0, 240) || 'خيار 1',
        newChOpt1.trim().slice(0, 240) || 'خيار 2',
        newChOpt2.trim().slice(0, 240) || 'خيار 3',
        newChOpt3.trim().slice(0, 240) || 'خيار 4'
      ],
      answer: Math.max(0, Math.min(3, Number(newChAnswer) || 0)),
      explanation: (newChExplain.trim() || 'إجابة صحيحة وفق القاعدة النحوية.').slice(0, 500),
      authorEmail: firebaseUser?.email || ADMIN_EMAIL,
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'custom_challenges', chId), payload);
      setNewChQuestion('');
      setNewChOpt0('');
      setNewChOpt1('');
      setNewChOpt2('');
      setNewChOpt3('');
      setNewChExplain('');
      setNewChDay(prev => prev + 1);
      showNotice('تمت إضافة سؤال التحدي الجديد إلى قاعدة البيانات بنجاح!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `custom_challenges/${chId}`);
    }
  };

  const handleDeleteCustomChallenge = async (docId: string) => {
    try {
      await deleteDoc(doc(db, 'custom_challenges', docId));
      showNotice('تم حذف سؤال التحدي.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `custom_challenges/${docId}`);
    }
  };

  const handleAdminModifyStudent = async (
    st: CloudStudentRow,
    changes: Partial<CloudStudentRow>
  ) => {
    const merged: CloudStudentRow = { ...st, ...changes, updatedAt: Date.now() };
    const payload = {
      profileId: merged.profileId.slice(0, 100),
      name: merged.name.slice(0, 80),
      code: merged.code.slice(0, 4),
      cls: merged.cls.slice(0, 10),
      points: Math.max(0, Math.min(1000000, merged.points)),
      badges: (merged.badges || []).slice(0, 20),
      correct: Math.max(0, merged.correct),
      attempts: Math.max(0, merged.attempts),
      progress: Math.max(0, Math.min(100, merged.progress)),
      completed: (merged.completed || []).slice(0, 50),
      nafesStageIndex: Math.max(0, merged.nafesStageIndex),
      dailyCurrentIndex: Math.max(0, merged.dailyCurrentIndex),
      dailyNextUnlockMs: Math.max(0, merged.dailyNextUnlockMs),
      lastQuizTitle: (merged.lastQuizTitle || '—').slice(0, 120),
      lastQuizScore: Math.max(0, merged.lastQuizScore),
      lastQuizTotal: Math.max(0, merged.lastQuizTotal),
      isBlocked: Boolean(merged.isBlocked),
      updatedAt: Date.now()
    };
    try {
      await setDoc(doc(db, 'students', st.docId), payload);
      // Also update local state if this student is on this device
      if (profiles[st.profileId]) {
        setProfiles(prev => ({
          ...prev,
          [st.profileId]: {
            ...prev[st.profileId],
            name: payload.name,
            code: payload.code,
            points: payload.points,
            nafesStageIndex: payload.nafesStageIndex,
            isBlocked: payload.isBlocked,
            dailyChallenge: {
              ...(prev[st.profileId].dailyChallenge || { currentIndex: 0, nextUnlockMs: 0, solvedDays: {} }),
              currentIndex: payload.dailyCurrentIndex,
              nextUnlockMs: payload.dailyNextUnlockMs
            }
          }
        }));
      }
      showNotice(`تم تحديث بيانات الطالب (${payload.name}) في قاعدة البيانات.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${st.docId}`);
    }
  };

  // تصفير وحذف نقاط طالب لوحده
  const handleAdminResetStudentPoints = async (st: CloudStudentRow) => {
    if (
      !window.confirm(
        `هل أنت متأكد من تصفير وحذف نقاط الطالب «${st.name}» (فصل: ${st.cls}، رصيد النقاط: ${st.points}⭐) وجعلها 0؟`
      )
    ) {
      return;
    }
    await handleAdminModifyStudent(st, { points: 0 });
    showNotice(`✅ تم تصفير وحذف نقاط الطالب «${st.name}» بنجاح (0⭐)!`);
  };

  // تصفير عداد النقاط لجميع الطلاب دفعة واحدة
  const handleAdminResetAllStudentsPoints = async () => {
    const count = cloudStudents.length;
    if (count === 0) {
      showNotice('لا يوجد طلاب مسجلون في قاعدة البيانات حاليًا.');
      return;
    }
    if (
      !window.confirm(
        `⚠️ تحذير أمان للمعلم:\nهل أنت متأكد من تصفير عداد النقاط لجميع الطلاب (${count} طالب) بالكامل؟\nسيتم جعل نقاط جميع الفرسان 0⭐ وتحديث منصة السباق.`
      )
    ) {
      return;
    }
    try {
      const promises = cloudStudents.map(st =>
        setDoc(
          doc(db, 'students', st.docId),
          {
            ...st,
            points: 0,
            updatedAt: Date.now()
          },
          { merge: true }
        )
      );
      await Promise.all(promises);

      // تحديث الملفات المحلية إن وُجدت
      setProfiles(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(pid => {
          next[pid] = { ...next[pid], points: 0 };
        });
        try {
          localStorage.setItem('LT_PROFILES', JSON.stringify(next));
        } catch {}
        return next;
      });

      showNotice(`✅ تم تصفير وحذف نقاط جميع الطلاب بنجاح (${count} طالب أصبح رصيدهم 0⭐)!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'students/reset_all_points');
    }
  };

  const handleAdminEditStudentCredentials = async (
    st: CloudStudentRow,
    newName: string,
    newCode: string
  ) => {
    const trimmedName = newName.trim();
    const trimmedCode = newCode.trim();
    if (!trimmedName) {
      showNotice('الرجاء كتابة اسم الطالب أولاً.');
      return;
    }
    if (!/^\d{4}$/.test(trimmedCode)) {
      showNotice('الرجاء كتابة كلمة السر / الرمز السري المكون من 4 أرقام (مثال: 1234).');
      return;
    }
    if (trimmedName === st.name && trimmedCode === st.code) {
      setStudentToEditName(null);
      setInlineEditStudentId(null);
      return;
    }
    await handleAdminModifyStudent(st, { name: trimmedName, code: trimmedCode });
    setStudentToEditName(null);
    setInlineEditStudentId(null);
    showNotice(`✅ تم بنجاح تعديل بيانات الطالب: الاسم إلى «${trimmedName}» وكلمة السر إلى «${trimmedCode}»!`);
  };

  const handleAdminEditStudentName = async (st: CloudStudentRow, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      showNotice('الرجاء كتابة اسم الطالب أولاً.');
      return;
    }
    if (trimmed === st.name) {
      setStudentToEditName(null);
      setInlineEditStudentId(null);
      return;
    }
    await handleAdminModifyStudent(st, { name: trimmed });
    setStudentToEditName(null);
    setInlineEditStudentId(null);
    showNotice(`تم تعديل اسم الطالب إلى «${trimmed}» بنجاح!`);
  };

  const handleStudentLogout = () => {
    const studentName = currentProfile?.name || 'الطالب';
    setActiveId('');
    try {
      localStorage.removeItem('LT_ACTIVE');
    } catch {}
    setActiveModal(null);
    setScreenStage('welcome');
    showNotice(`🚪 تم تسجيل خروج ${studentName} بنجاح. يمكنك الآن تسجيل الدخول كطالب آخر أو إنشاء حساب جديد!`);
  };

  const handleAdminDeleteStudent = async (st: CloudStudentRow) => {
    try {
      await deleteDoc(doc(db, 'students', st.docId));
      // Also remove from local profiles if present on this device
      if (profiles[st.profileId]) {
        setProfiles(prev => {
          const updated = { ...prev };
          delete updated[st.profileId];
          return updated;
        });
        if (activeId === st.profileId) {
          setActiveId('');
        }
      }
      // Also update cloudStudents state immediately
      setCloudStudents(prev => prev.filter(s => s.docId !== st.docId && s.profileId !== st.profileId));
      setStudentToDelete(null);
      showNotice(`✅ تم حذف ملف الطالب (${st.name}) نهائياً من قاعدة البيانات.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${st.docId}`);
    }
  };

  const handleToggleFeedbackApproval = async (fb: FeedbackItem) => {
    if (!fb.id) return;
    const nextStatus = fb.status === 'تمت القراءة' ? 'قيد المراجعة' : 'تمت القراءة';
    try {
      await setDoc(doc(db, 'feedback', fb.id), {
        role: fb.role,
        cls: fb.cls || 'بدون تحديد',
        text: fb.text,
        status: nextStatus,
        createdAt: fb.createdAt || Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `feedback/${fb.id}`);
    }
  };

  const handleDeleteFeedback = async (fbId?: string) => {
    if (!fbId) return;
    try {
      await deleteDoc(doc(db, 'feedback', fbId));
      showNotice('تم حذف الرسالة بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `feedback/${fbId}`);
    }
  };

  // Merge cloud students and local profiles for the Top 10 Horse Race Leaderboard
  const leaderboardStudents: CloudStudentRow[] = (() => {
    const map = new Map<string, CloudStudentRow>();
    cloudStudents.forEach(s => map.set(s.profileId, s));
    Object.entries(profiles).forEach(([pid, p]) => {
      if (!map.has(pid)) {
        map.set(pid, {
          docId: toSafeDocId(pid),
          profileId: pid,
          name: p.name,
          code: p.code,
          cls: p.cls,
          points: p.points || 0,
          badges: p.badges || [],
          correct: p.correct || 0,
          attempts: p.attempts || 0,
          progress: p.progress || 0,
          completed: p.completed || [],
          nafesStageIndex: p.nafesStageIndex || 0,
          dailyCurrentIndex: p.dailyChallenge?.currentIndex || 0,
          dailyNextUnlockMs: p.dailyChallenge?.nextUnlockMs || 0,
          lastQuizTitle: p.lastQuizTitle || p.lastActivity?.label || '—',
          lastQuizScore: p.lastQuizScore || 0,
          lastQuizTotal: p.lastQuizTotal || 0,
          isBlocked: Boolean(p.isBlocked),
          updatedAt: Date.now(),
          registeredAt: p.registeredAt,
          lastActiveAt: p.lastActiveAt || p.updatedAt,
          sessionCount: p.sessionCount,
          gradeLevel: p.gradeLevel || 'الأول المتوسط',
          lastActivityType: p.lastActivityType || '—',
          completedNafesStages: p.completedNafesStages || []
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.points - a.points || b.correct - a.correct);
  })();

  const top10Racers = leaderboardStudents.slice(0, 10);
  const maxRacePoints = Math.max(100, ...(top10Racers.map(r => r.points) || [100]));

  // ضبط هندسي دقيق لمضمار سباق الفرسان استجابة لطلب المعلم:
  // "اضبط مضمار السباق واجعل الأول يتقدم ولا يسبقه الثاني وهكذا بقيه المتسابقين"
  const racerTrackPositions = useMemo(() => {
    const count = top10Racers.length;
    if (count === 0) return [];

    const startRight = 2.5; // خط البداية على اليمين
    const maxLeaderReach = 68; // أقصى حد لتقدم المتصدر على المضمار العشبي ليبقى مسافة واضحة ومريحة
    const leader = top10Racers[0];
    const leaderPoints = leader?.points || 0;

    const positions: number[] = [];

    if (leaderPoints <= 0) {
      // إذا كان رصيد الجميع صفر، تصطف الخيول عند خط البداية بترتيب أنيق
      for (let i = 0; i < count; i++) {
        positions.push(Math.max(startRight, startRight + (count - 1 - i) * 0.25));
      }
      return positions;
    }

    // 1. المركز الأول يتقدم وله أسبقية الصدارة دائماً في طليعة المتسابقين
    const leaderPos = Math.min(
      maxLeaderReach,
      Math.max(30, 30 + Math.round((leaderPoints / Math.max(25, maxRacePoints)) * (maxLeaderReach - 30)))
    );
    positions.push(leaderPos);

    // 2. المراكز اللاحقة (من الثاني وحتى العاشر):
    // يتقدم كل متسابق حسب نقاطه مقارنة بالمتصدر، ولكن بشرط هندسي صارم:
    // الأول يتقدم في الطليعة ولا يسبقه الثاني أبداً، والثاني يتقدم ولا يسبقه الثالث، وهكذا لبقية المتسابقين!
    for (let i = 1; i < count; i++) {
      const racer = top10Racers[i];
      const prevPos = positions[i - 1];
      if (racer.points <= 0) {
        // المتسابق برصيد 0 يقف عند بوابة الانطلاق
        positions.push(startRight);
      } else {
        const ptsRatio = Math.min(0.96, racer.points / leaderPoints);
        // موقعه الأولي نسبي بين البداية وموقع المتصدر
        const rawPos = startRight + (leaderPos - startRight) * ptsRatio;
        // الفارق الأدنى ليضمن عدم لحاق أو تجاوز أي متسابق للمركز الذي يسبقه
        const minLeadGap = 3.5;
        // الحد الأقصى المسموح له هو أقل من المتسابق السابق بفارق واضح
        const maxAllowed = prevPos - minLeadGap;
        // التأكد من أن المتسابق صاحب النقاط متقدم عن خط البداية دائماً ودون أن يسبق زميله السابق
        const safePos = Math.max(startRight + 1.5, Math.min(maxAllowed, rawPos));
        positions.push(Math.round(safePos * 10) / 10);
      }
    }

    return positions;
  }, [top10Racers, maxRacePoints]);

  // دالة فحص ما إذا كان المتسابق قد انتزع الصدارة
  const isStudentLeadSeized = (racer: CloudStudentRow, idx: number): boolean => {
    if (idx !== 0 || racer.points <= 0) return false;
    if (top10Racers.length === 1) return true;
    return racer.points > (top10Racers[1]?.points || 0);
  };

  const currentStudentIsLeader = Boolean(
    activeId &&
      top10Racers.length > 0 &&
      isStudentLeadSeized(top10Racers[0], 0) &&
      (top10Racers[0].profileId === activeId ||
        (currentProfile && (top10Racers[0].code === currentProfile.code || top10Racers[0].name === currentProfile.name)))
  );

  // استخراج عناصر شريط الإعلانات المتحرك المستمر (الأوائل الـ 3 + أبطال الفئات الـ 5 + توجيهات المعلم)
  const raceTickerAnnouncements = (() => {
    const items: {
      id: string;
      icon: string;
      text: string;
      highlight?: string;
      type: 'top1' | 'top5' | 'badge' | 'rank' | 'teacher' | 'lead' | 'score';
    }[] = [];

    // 0. نصوص وإعلانات المعلم المخصصة والمفعّلة (تحكم كامل للمعلم)
    if (appSettings.tickerAnnouncements && Array.isArray(appSettings.tickerAnnouncements)) {
      const activeTeacherAnns = [...appSettings.tickerAnnouncements]
        .filter(a => a.active && a.text.trim())
        .sort((a, b) => a.order - b.order);

      activeTeacherAnns.forEach(ann => {
        const icon =
          ann.category === 'تنبيه'
            ? '⚠️'
            : ann.category === 'تحفيز'
            ? '🔥'
            : ann.category === 'عام'
            ? '📢'
            : '👨‍🏫';
        items.push({
          id: ann.id,
          icon,
          type: 'teacher',
          text: `توجيه المعلم (أ. مساعد الصخري):`,
          highlight: ann.text
        });
      });
    }

    if (appSettings.tickerCustomText && appSettings.tickerCustomText.trim()) {
      items.push({
        id: 'teacher_custom_single',
        icon: '👨‍🏫',
        type: 'teacher',
        text: 'توجيهات المعلم:',
        highlight: appSettings.tickerCustomText.trim()
      });
    }

    // 0.5. أحداث انتزاع الصدارة وتحديث النقاط المباشرة
    liveScoreEvents.slice(0, 3).forEach(ev => {
      items.push({
        id: ev.id,
        icon: ev.type === 'lead' ? '🔥' : '⚡',
        type: ev.type === 'lead' ? 'lead' : 'score',
        text: ev.text,
        highlight: ev.highlight
      });
    });

    // 1. فرسان الصدارة والأوائل في مضمار السباق بالترتيب الدقيق التدريجي (من المركز الأول وحتى العاشر)
    top10Racers.forEach((racer, idx) => {
      const isLead = isStudentLeadSeized(racer, idx);
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏇';
      const rankTitle =
        idx === 0
          ? '🥇 المركز الأول'
          : idx === 1
          ? '🥈 المركز الثاني'
          : idx === 2
          ? '🥉 المركز الثالث'
          : `🏇 المركز ${idx + 1}`;

      items.push({
        id: `top_${racer.profileId}_${idx}`,
        icon: medal,
        type: idx === 0 ? 'top1' : 'top5',
        text: `${rankTitle}: ${racer.name} (فصل ${racer.cls})`,
        highlight: isLead
          ? `🔥 انتزع الصدارة بـ ${racer.points}⭐ نقطة!`
          : `${racer.points}⭐ نقطة`
      });
    });

    // 2. بطل تحدي اليوم (الطالب الذي حل التحدي اليومي بنجاح من قاعدة البيانات)
    const dailyHero = leaderboardStudents.find(
      s => (s.dailyCurrentIndex > 0 || (s.badges && s.badges.includes('قاهر التحدي اليومي'))) && s.points > 0
    );
    if (dailyHero) {
      items.push({
        id: `hero_daily_${dailyHero.profileId}`,
        icon: '🎯',
        type: 'badge',
        text: `بطل تحدي اليوم: ${dailyHero.name} (فصل ${dailyHero.cls})`,
        highlight: 'أنجز تحدي اليوم بنجاح وتألق في الإجابة!'
      });
    }

    // 3. بطل نافس (الطالب الحاصل على أعلى نقاط أو مكتمل مراحل اختبارات نافس)
    const nafesHero = leaderboardStudents.find(
      s => (s.nafesStageIndex > 0 || (s.badges && s.badges.includes('صنديد نافس الذهبي'))) && s.points > 0
    );
    if (nafesHero) {
      items.push({
        id: `hero_nafes_${nafesHero.profileId}`,
        icon: '🌟',
        type: 'badge',
        text: `بطل نافس الوطني: ${nafesHero.name} (فصل ${nafesHero.cls})`,
        highlight: `اجتاز مراحل اختبارات نافس الوطنية بكفاءة!`
      });
    }

    // 4. بطل الوحدة الأولى (مع إمكانية بقية الوحدات)
    const unit1Hero = leaderboardStudents.find(
      s => s.badges && s.badges.some(b => b.includes('بطل الوحدة الأولى'))
    ) || (top10Racers[0]?.points > 0 ? top10Racers[0] : null);
    if (unit1Hero) {
      items.push({
        id: `hero_u1_${unit1Hero.profileId}`,
        icon: '📖',
        type: 'badge',
        text: `بطل الوحدة الأولى (القيم الإسلامية): ${unit1Hero.name} (فصل ${unit1Hero.cls})`,
        highlight: 'أتقن جميع دروس وتقويمات الوحدة الأولى بنجاح!'
      });
    }

    // بطل الوحدة الثانية إن وجد
    const unit2Hero = leaderboardStudents.find(
      s => s.badges && s.badges.some(b => b.includes('بطل الوحدة الثانية'))
    );
    if (unit2Hero && unit2Hero.points > 0) {
      items.push({
        id: `hero_u2_${unit2Hero.profileId}`,
        icon: '📚',
        type: 'badge',
        text: `بطل الوحدة الثانية (الأعلام): ${unit2Hero.name} (فصل ${unit2Hero.cls})`,
        highlight: 'أتقن سير الأعلام والأفعال الناسخة والمثنى!'
      });
    }

    // بطل الوحدة الثالثة إن وجد (علم المملكة العربية السعودية 🇸🇦)
    const unit3Hero = leaderboardStudents.find(
      s => s.badges && s.badges.some(b => b.includes('بطل الوحدة الثالثة'))
    );
    if (unit3Hero && unit3Hero.points > 0) {
      items.push({
        id: `hero_u3_${unit3Hero.profileId}`,
        icon: '🇸🇦',
        type: 'badge',
        text: `بطل الوحدة الثالثة (وطني): ${unit3Hero.name} (فصل ${unit3Hero.cls})`,
        highlight: 'أتقن نصوص وقواعد الوحدة الوطنية والحروف الناسخة!'
      });
    }

    // 5. بطل مركز الألعاب (الحاصل على أعلى نقاط أو شارات في ألعاب مركز الألعاب اللغوية)
    const gamesHero = leaderboardStudents.find(
      s =>
        s.badges &&
        s.badges.some(
          b =>
            b.includes('مركز الألعاب') ||
            b.includes('محقق الضاد') ||
            b.includes('فارس السرعة') ||
            b.includes('مهندس التراكيب') ||
            b.includes('خازن المعاجم')
        )
    );
    if (gamesHero && gamesHero.points > 0) {
      items.push({
        id: `hero_games_${gamesHero.profileId}`,
        icon: '🎮',
        type: 'badge',
        text: `بطل مركز الألعاب اللغوية: ${gamesHero.name} (فصل ${gamesHero.cls})`,
        highlight: 'خبير التحديات والألعاب اللغوية السريعة!'
      });
    }

    // 7. الطلاب الحاصلون على ألقاب وشارات مميزة — جمع الإنجازات بصيغة محفزة ومختصرة دون تكرار الاسم
    leaderboardStudents.slice(0, 10).forEach(st => {
      const badges = Array.isArray(st.badges) ? st.badges : [];
      if (badges.length === 0) return;

      const titleNames: string[] = [];
      badges.forEach(b => {
        const matchingTitle = MOTIVATIONAL_TITLES.find(
          t => t.badgeKey === b || b.includes(t.badgeKey) || t.name.includes(b)
        );
        const nameToAdd = matchingTitle ? matchingTitle.name : b;
        if (!titleNames.includes(nameToAdd)) {
          titleNames.push(nameToAdd);
        }
      });

      if (titleNames.length === 1) {
        items.push({
          id: `badge_group_${st.profileId}`,
          icon: '🎖️',
          type: 'badge',
          text: `مبارك للفارس ${st.name} (فصل ${st.cls})`,
          highlight: `حصوله على وسام «${titleNames[0]}»`
        });
      } else if (titleNames.length > 1) {
        const displayed = titleNames.slice(0, 3).map(n => `«${n}»`).join(' و');
        const remaining = titleNames.length > 3 ? ` و${titleNames.length - 3} أوسمة أخرى` : '';
        items.push({
          id: `badge_group_${st.profileId}`,
          icon: '🌟',
          type: 'badge',
          text: `مبارك للفارس ${st.name} (فصل ${st.cls})`,
          highlight: `تألقه بحصوله على ${titleNames.length} أوسمة: ${displayed}${remaining}`
        });
      }
    });

    if (items.length < 5) {
      items.push(
        {
          id: 'def_race_podium',
          icon: '🏆',
          type: 'top1',
          text: 'مضمار سباق فرسان لغتي:',
          highlight: 'تنافسوا في الاختبارات وتحديات اليوم لارتقاء سلم الترتيب ونيل الأوسمة الذهبية!'
        },
        {
          id: 'def_race_first',
          icon: '🥇',
          type: 'top1',
          text: 'وسام الصدارة الذهبية:',
          highlight: 'يُمنح للفارس صاحب أعلى مجموع نقاط في مضمار السباق'
        },
        {
          id: 'def_race_badges',
          icon: '🎖️',
          type: 'badge',
          text: 'أوسمة وشارات لغتي المتاحة:',
          highlight: 'وسام الدقة المتناهية، صنديد نافس، قاهر التحدي اليومي، وخازن المعاجم'
        },
        {
          id: 'def_race_games',
          icon: '🎮',
          type: 'badge',
          text: 'مركز الألعاب اللغوية:',
          highlight: 'محاولة واحدة يومياً لكل لعبة تتجدد بعد 24 ساعة لاختبار المهارة والسرعة'
        }
      );
    }

    return items;
  })();


  const allFeedbackToDisplay =
    cloudFeedback.length > 0 ? cloudFeedback : [...(currentProfile?.feedback || []), ...globalFeedback];

  return (
    <>
      {screenStage === 'cover' && (
        <CoverSplash onEnter={() => setScreenStage('welcome')} />
      )}

      {screenStage === 'welcome' && (
        <div id="splash" className="splash" aria-label="واجهة الترحيب">
          <div className="splashCard">
            <div className="splashDecorTop" />
            <div className="splashDecorBot" />
            <div className="splashBadge">
              <span>🎓</span>
              <span>الصف الأول المتوسط • الفصل الدراسي الأول • 1448هـ</span>
            </div>
            <img className="splashHeroArt" alt="واجهة لُغتي تحكي" src={SPLASH_SVG} />
            <h1 className="splashTitle">📚 لُغتي تحكي</h1>
            <p className="splashSub">لغتي تحكي... وأنا أصنع الحكاية</p>
            <p className="splashDesc">
              منصة تعليمية تفاعلية تجمع بين متعة التعلّم، وإتقان القواعد النحوية والإملائية، وتحديات الفهم القرائي، ومعالجة الأخطاء بأسلوب شيّق.
            </p>
            <div className="splashPills">
              <span className="splashPill">📖 دروس وأنشطة تفاعلية</span>
              <span className="splashPill">🏆 مراحل نافس المتجددة</span>
              <span className="splashPill">🐎 مضمار سباق الفرسان</span>
              <span className="splashPill">🩺 عيادة علاج الأخطاء</span>
            </div>
            <button className="splashEnterBtn" aria-label="ابدأ رحلتك الآن" onClick={handleEnterApp}>
              <span>ابدأ رحلتك الآن</span>
              <span>←</span>
            </button>
            <div className="splashFooter">
              <span>
                ✨ إعداد وتنفيذ: <b>المعلم / مساعد سليمان الصخري</b>
              </span>
              <span>جميع الحقوق محفوظة © 2026/2027م</span>
            </div>
          </div>
        </div>
      )}

      {screenStage === 'app' && (
        <div id="appShell" style={{ display: 'block' }}>
          <header className="hero">
            <div className="wrap heroIn">
              <div className="art">📚🌿</div>
              <div className="title">
                <h1>📚 لُغتي تحكي</h1>
                <p>لغتي تحكي... وأنا أصنع الحكاية</p>
              </div>
              <div className="term">
                <b>🎓 الصف الأول المتوسط</b>
                <span>الفصل الدراسي الأول</span>
                <span>1448هـ – 2026/2027م</span>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn light"
                    style={{ padding: '5px 12px', fontSize: 12 }}
                    onClick={() => setActiveModal('adminModal')}
                  >
                    ⚙️ لوحة تحكم المعلم (خاص بالمعلم)
                  </button>
                  <button
                    className="btn gold"
                    style={{ padding: '5px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => setActiveModal('shareModal')}
                    title="مشاركة رابط المنصة مع الطلاب والمعلمين عبر الواتساب"
                  >
                    📱 مشاركة عبر الواتساب ورابط المنصة
                  </button>
                  <button
                    className="btn light"
                    style={{
                      padding: '5px 12px',
                      fontSize: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#f0fdf4',
                      borderColor: '#86efac',
                      color: '#15803d',
                      fontWeight: 700
                    }}
                    onClick={() => setActiveModal('parentMessagesModal')}
                    title="تواصل ولي الأمر الخاص مع المعلم ومتابعة الردود"
                  >
                    📩 رسائل أولياء الأمور
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="wrap">
            {/* ================================================================= */}
            {/* شريط توقيت المنصة: تفتح 2:00 ظهراً وتغلق 9:00 مساءً مع تايمر ورموز ووصف مناسب */}
            {/* ================================================================= */}
            <div
              style={{
                marginTop: 16,
                background: scheduleInfo.isOpen
                  ? 'linear-gradient(90deg, #ecfdf5 0%, #ffffff 100%)'
                  : 'linear-gradient(90deg, #fff7ed 0%, #ffffff 100%)',
                border: `1.5px solid ${scheduleInfo.isOpen ? '#a7f3d0' : '#fed7aa'}`,
                borderRight: `6px solid ${scheduleInfo.isOpen ? '#10b981' : '#f97316'}`,
                borderRadius: 18,
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                boxShadow: scheduleInfo.isOpen
                  ? '0 4px 16px rgba(16, 185, 129, 0.1)'
                  : '0 4px 16px rgba(249, 115, 22, 0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{scheduleInfo.isOpen ? '🟢' : '🌙'}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: 15,
                        color: scheduleInfo.isOpen ? '#065f46' : '#9a3412',
                        fontWeight: 900
                      }}
                    >
                      {scheduleInfo.isOpen
                        ? '🏇 المنصة مفتوحة ومتاحة الآن لجميع فرسان لغتي الخالدة!'
                        : '🌙 فترة استراحة واستعداد الفرسان — المنصة مغلقة حاليًا'}
                    </strong>
                    <span
                      style={{
                        background: scheduleInfo.isOpen ? '#10b981' : '#ea580c',
                        color: '#fff',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontWeight: 800
                      }}
                    >
                      {scheduleInfo.isOpen ? 'مفتوحة الآن' : 'مغلقة حالياً'}
                    </span>
                    {isTeacherAdmin && (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #fde68a',
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 8,
                          fontWeight: 800
                        }}
                      >
                        🔑 صلاحية المعلم نشطة 24/7
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      color: scheduleInfo.isOpen ? '#047857' : '#c2410c',
                      marginTop: 2
                    }}
                  >
                    {scheduleInfo.isScheduled ? (
                      <>
                        ⏰ <b>الجدول الزمني المعتمد:</b> الفتح: <b>{scheduleInfo.openAtText || '—'}</b> • الإغلاق: <b>{scheduleInfo.closeAtText || '—'}</b>
                      </>
                    ) : (
                      <>
                        👨‍🏫 <b>نظام تحكم المعلم المشرف (أ. مساعد الصخري):</b> {scheduleInfo.message}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* مؤشر الوقت أو العداد التنازلي التفاعلي المباشر للجدولة */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: '#ffffff',
                  border: `2px solid ${scheduleInfo.isOpen ? '#6ee7b7' : '#fdba74'}`,
                  borderRadius: 14,
                  padding: '7px 16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <span style={{ fontSize: 22 }}>{scheduleInfo.isScheduled ? '⏳' : '🔑'}</span>
                <div style={{ textAlign: 'center' }}>
                  <small
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 800,
                      color: scheduleInfo.isOpen ? '#065f46' : '#9a3412'
                    }}
                  >
                    {scheduleInfo.isScheduled
                      ? scheduleInfo.timerLabel || (scheduleInfo.isOpen ? 'متبقي على إغلاق المنصة:' : 'متبقي على موعد فتح المنصة:')
                      : 'التحكم المعتمد:'}
                  </small>
                  <span
                    style={{
                      fontFamily: scheduleInfo.isScheduled ? 'monospace' : 'inherit',
                      fontSize: scheduleInfo.isScheduled ? 18 : 13,
                      fontWeight: 900,
                      color: scheduleInfo.isOpen ? '#047857' : '#c2410c',
                      letterSpacing: scheduleInfo.isScheduled ? 1.5 : 'normal'
                    }}
                  >
                    {scheduleInfo.isScheduled
                      ? scheduleInfo.timerString || '00:00:00'
                      : scheduleInfo.isOpen ? 'مفتوحة بإذن المعلم 🟢' : 'مغلقة بقرار المعلم 🔴'}
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Announcement Banner */}
            {appSettings.announcement && (
              <div
                style={{
                  marginTop: 16,
                  background: 'linear-gradient(90deg,#fff8e6,#fffdf7)',
                  border: '1px solid #f0d799',
                  borderRight: '5px solid #f7b832',
                  borderRadius: 16,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <div>
                  <b style={{ color: '#946200' }}>📣 رسالة المعلم: </b>
                  <span>{appSettings.announcement}</span>
                </div>
              </div>
            )}

            {currentProfile ? (
              <section className="welcome">
                {(() => {
                  const currentRank = getStudentRank(currentProfile.points);
                  return (
                    <>
                      <div className="student">
                        <div
                          className="avatar"
                          style={{
                            fontSize: 26,
                            background: currentRank.tier >= 4 ? '#fef3c7' : '#ecfdf5',
                            borderColor: currentRank.color,
                            boxShadow: currentRank.tier >= 4 ? '0 0 12px rgba(245, 158, 11, 0.35)' : undefined
                          }}
                        >
                          {currentRank.icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <h2 id="wname" style={{ margin: 0 }}>مرحبًا {currentProfile.name}</h2>
                            {currentStudentIsLeader && (
                              <span className="leadSeizedBadge" title="ما شاء الله تبارك الله، أنت متصدر سباق فرسان لغتي!">
                                🔥 انتزع الصدارة 🏆
                              </span>
                            )}
                            <span
                              className="rankTitlePill"
                              style={{
                                background: currentRank.tier >= 4 ? '#fef3c7' : '#f0fdf4',
                                color: currentRank.color
                              }}
                              title={`رتبتك الحالية: ${currentRank.title}`}
                            >
                              {currentRank.icon} {currentRank.title}
                            </span>
                          </div>
                          <p id="winfo" style={{ margin: '4px 0 0' }}>
                            أول متوسط • الفصل {currentProfile.cls} • المرحلة الحالية في نافس: ({Math.min(
                              currentNafesStageIdx + 1,
                              NAFES_STAGES.length
                            )} من {NAFES_STAGES.length})
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                            <button
                              className="btn light"
                              onClick={() => {
                                setProfileMode('chooser');
                                setActiveModal('profileModal');
                              }}
                            >
                              👤 ملف الطالب
                            </button>
                            <button
                              className="btn light"
                              style={{ border: '1.5px solid #fde68a', background: '#fffbeb', color: '#92400e', fontWeight: 700 }}
                              onClick={() => setActiveModal('badgesModal')}
                            >
                              🏆 خزانة الأوسمة والرتب
                            </button>
                            <button
                              className="btn light"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#eff6ff',
                                borderColor: '#93c5fd',
                                color: '#1d4ed8',
                                fontWeight: 700
                              }}
                              onClick={() => setActiveModal('parentMessagesModal')}
                              title="رسائل وتواصل ولي الأمر الخاص مع المعلم"
                            >
                              📩 تواصل ولي الأمر
                            </button>
                            <button
                              className="btn"
                              style={{
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1.5px solid #fca5a5',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 700
                              }}
                              onClick={handleStudentLogout}
                              title="تسجيل خروج الطالب الحالي للعودة أو تسجيل طالب آخر"
                            >
                              🚪 تسجيل خروج
                            </button>
                            {studentMistakes.length > 0 && (
                              <button className="btn coral" onClick={openMistakesClinic}>
                                🩺 لديك ({studentMistakes.length}) أخطاء للمعالجة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* الشارات والنقاط ورتبة الفارس بجانب بعضهما في صف أفقي واحد دائمًا ولا تجعلها أسفل بعض */}
                      <div
                        className="studentStatsRow"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          gap: 8,
                          alignItems: 'stretch',
                          width: '100%'
                        }}
                      >
                        {/* 1. النقاط */}
                        <div
                          className="stat"
                          style={{
                            margin: 0,
                            padding: '8px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 0
                          }}
                        >
                          <i style={{ fontSize: 24, lineHeight: 1.1 }}>⭐</i>
                          <b id="pts" style={{ fontSize: 22, lineHeight: 1.2 }}>{currentProfile.points}</b>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>النقاط</span>
                        </div>

                        {/* 2. الشارات */}
                        <div
                          className="stat"
                          style={{
                            margin: 0,
                            padding: '8px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            minWidth: 0
                          }}
                          onClick={() => setActiveModal('badgesModal')}
                          title="اضغط لعرض خزانة الأوسمة والشارات"
                        >
                          <i style={{ fontSize: 24, lineHeight: 1.1 }}>🏅</i>
                          <b id="badges" style={{ fontSize: 22, lineHeight: 1.2 }}>{currentProfile.badges.length}</b>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>الشارات</span>
                        </div>

                        {/* 3. رتبة الفارس */}
                        <div
                          className="stat"
                          style={{
                            margin: 0,
                            padding: '8px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            background: currentRank.tier >= 4 ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : undefined,
                            borderColor: currentRank.color,
                            minWidth: 0
                          }}
                          onClick={() => setActiveModal('badgesModal')}
                          title="اضغط لعرض تفاصيل رتبتك وألقابك"
                        >
                          <i style={{ fontSize: 24, lineHeight: 1.1 }}>{currentRank.icon}</i>
                          <b
                            style={{
                              fontSize: 12,
                              color: currentRank.color,
                              lineHeight: 1.2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                              fontWeight: 900
                            }}
                          >
                            {currentRank.title}
                          </b>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>رتبة الفارس</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </section>
            ) : (
              <section className="welcome">
                <div className="student">
                  <div className="avatar">👤</div>
                  <div>
                    <h2 id="wname">مرحبًا بك في منصة لغتي الخالدة</h2>
                    <p id="winfo">أنشئ ملفك لتبدأ رحلتك وتنافس في مضمار سباق الفرسان وتنال الألقاب والرتب.</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      <button
                        className="btn primary"
                        onClick={() => {
                          setProfileMode('chooser');
                          setActiveModal('profileModal');
                        }}
                      >
                        👤 تسجيل الدخول / إنشاء ملف
                      </button>
                      <button
                        className="btn light"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#eff6ff',
                          borderColor: '#93c5fd',
                          color: '#1d4ed8',
                          fontWeight: 700
                        }}
                        onClick={() => setActiveModal('parentMessagesModal')}
                        title="تواصل ولي الأمر الخاص مع المعلم"
                      >
                        📩 تواصل ولي الأمر
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================================================================= */}
            {/* DAILY CHALLENGE: AT THE TOP (سؤال تحدي اليوم في الأعلى استجابة لطلب المعلم) */}
            {/* ================================================================= */}
            <section id="dailyChallengeSection" className="daily">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 12
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 22 }}>
                    🎯 سؤال التحدي اليومي (اليوم {currentDailyChallenge.day} من {allDailyChallenges.length})
                  </h3>
                  <small style={{ color: 'var(--mut)', fontWeight: 700 }}>
                    📚 {currentDailyChallenge.unitTopic}
                  </small>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      background:
                        currentDailyChallenge.level === 'سهل'
                          ? '#e6f8f1'
                          : currentDailyChallenge.level === 'متوسط'
                          ? '#eef5ff'
                          : currentDailyChallenge.level === 'صعب'
                          ? '#fff4e0'
                          : '#ffecee',
                      color:
                        currentDailyChallenge.level === 'سهل'
                          ? '#197a56'
                          : currentDailyChallenge.level === 'متوسط'
                          ? '#1f64b0'
                          : currentDailyChallenge.level === 'صعب'
                          ? '#b56c00'
                          : '#b4232c',
                      border: '1px solid currentColor',
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 13,
                      fontWeight: 800
                    }}
                  >
                    🔥 المستوى: {currentDailyChallenge.level} (+{currentDailyChallenge.points} نقطة)
                  </span>

                  <span
                    style={{
                      background: dailySolvedTime !== null ? '#197a56' : '#174c59',
                      color: '#fff',
                      borderRadius: 999,
                      padding: '4px 14px',
                      fontSize: 14,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>⏱️</span>
                    <span>
                      {dailySolvedTime !== null
                        ? `زمن الوصول للحل: ${formatStopwatch(dailySolvedTime)} (${dailySolvedTime} ثانية)`
                        : `عداد الوقت: ${formatStopwatch(dailyElapsedSec)}`}
                    </span>
                  </span>

                  {isWaitingFor24hUnlock && (
                    <span
                      style={{
                        background: '#fff0f2',
                        border: '1px solid #f2b8c0',
                        color: '#9e1c28',
                        borderRadius: 999,
                        padding: '4px 12px',
                        fontSize: 13,
                        fontWeight: 800
                      }}
                    >
                      🔒 يفتح السؤال التالي الأصعب بعد مرور 24 ساعة من إجابتك:{' '}
                      {String(remHours).padStart(2, '0')}:
                      {String(remMinutes).padStart(2, '0')}:
                      {String(remSeconds).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* Progression Ladder Bar */}
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  marginBottom: 12
                }}
              >
                {allDailyChallenges.map((item, idx) => {
                  const isSolved = Boolean(solvedDaysMap[idx]);
                  const isCurrent = idx === currentDayIndex;
                  return (
                    <div
                      key={`${item.day}_${idx}`}
                      style={{
                        flex: '1 0 auto',
                        minWidth: 78,
                        textAlign: 'center',
                        padding: '5px 8px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 800,
                        border: isCurrent ? '2px solid var(--t)' : '1px solid #e4d5aa',
                        background: isSolved ? '#e6f8f1' : isCurrent ? '#fff' : '#fcfaf3',
                        color: isSolved ? '#197a56' : isCurrent ? 'var(--t)' : '#7b8a90'
                      }}
                    >
                      <div>
                        يوم {item.day} {isSolved ? '✅' : isCurrent ? '📍' : '🔒'}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.85 }}>{item.level}</div>
                    </div>
                  );
                })}
              </div>

              <p style={{ fontSize: 18, fontWeight: 800, margin: '8px 0 12px', color: 'var(--ink)' }}>
                {currentDailyChallenge.question}
              </p>

              <div id="daily" className="options">
                {currentDailyChallenge.options.map((o, i) => {
                  const isCorrectOpt = i === currentDailyChallenge.answer;
                  const isWrongChosen = dailyWrongChoices.includes(i);
                  const isSolved = dailySolvedTime !== null;

                  let btnClass = 'option';
                  if (isSolved && isCorrectOpt) btnClass += ' ok';
                  else if (isWrongChosen) btnClass += ' bad';

                  return (
                    <button
                      key={i}
                      disabled={isSolved || isWrongChosen}
                      className={btnClass}
                      onClick={() => handleAnswerDailyChallenge(i)}
                    >
                      {OPTION_LABELS[i]} {o}
                    </button>
                  );
                })}
              </div>

              {dailySolvedTime === null && dailyWrongChoices.length > 0 && (
                <div
                  className="note"
                  style={{
                    background: '#fff0f2',
                    borderColor: '#f3c2c8',
                    color: '#a12834',
                    marginTop: 10,
                    fontWeight: 700
                  }}
                >
                  ❌ إجابة غير صحيحة! العداد لا يزال يحسب الوقت (⏱️ {formatStopwatch(dailyElapsedSec)}) — فكّر جيدًا وحاول مرة أخرى للوصول إلى الحل الصحيح!
                </div>
              )}

              {dailySolvedTime !== null && (
                <div
                  className="explain"
                  style={{ marginTop: 12, background: '#e8f8f0', border: '1px solid #9adbc0' }}
                >
                  <div style={{ fontWeight: 800, color: '#146c47', marginBottom: 4 }}>
                    ✅ أحسنت! وصلت إلى الحل الصحيح خلال ({dailySolvedTime} ثانية) من المحاولة رقم (
                    {dailyAttempts}).
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <b>💡 شرح القاعدة:</b> {currentDailyChallenge.explanation}
                  </div>
                  <div
                    style={{
                      background: '#fff',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px dashed #299d82',
                      fontSize: 13,
                      color: '#0d5960',
                      fontWeight: 800
                    }}
                  >
                    🔒 تم إغلاق هذا التحدي بعد حلّه، وسيفتح لك السؤال التالي الأصعب تلقائيًا بعد مرور 24 ساعة من وقت إجابتك (المتبقي:{' '}
                    {String(remHours).padStart(2, '0')}:{String(remMinutes).padStart(2, '0')}:
                    {String(remSeconds).padStart(2, '0')}).
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn gold"
                      style={{ padding: '6px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => fireCelebratoryFireworks()}
                    >
                      🎆 إطلاق ألعاب نارية احتفالية
                    </button>
                  </div>
                </div>
              )}

              {isTeacherAdmin && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px dashed #e6d4a2',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <small style={{ color: '#6b582d', fontWeight: 700 }}>
                    🔑 أدوات المعلم السريعة:
                  </small>
                  <button
                    className="btn gold"
                    style={{ padding: '5px 12px', fontSize: 12 }}
                    onClick={handleAdminUnlockNextDaily}
                  >
                    ⏭️ فتح السؤال التالي فورًا (تجاوز قفل الـ 24 ساعة للمعلم)
                  </button>
                </div>
              )}
            </section>

            {/* ================================================================= */}
            {/* HORSE RACE LEADERBOARD FOR TOP 10 STUDENTS & EXAM PROGRESS TABLE   */}
            {/* ================================================================= */}
            <section className="raceSection">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginBottom: 12
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, color: 'var(--t)' }}>
                    🏇 مضمار سباق فرسان لغتي (أوائل الطلاب الـ 10)
                  </h2>
                  <p className="sub" style={{ margin: '2px 0 0' }}>
                    يتقدم جواد كل طالب من خط البداية (اليمين) تدريجيًا نحو الصدارة على المضمار العشبي الأخضر مع كل اختبار يجتازه وتحدٍّ يحلّه.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="splashBadge" style={{ margin: 0 }}>
                    👥 إجمالي الفرسان المسجلين: {leaderboardStudents.length}
                  </span>
                </div>
              </div>

              {/* إمكانية كتابة المعلم السريعة في شريط السباق */}
              {isTeacherAdmin && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1.5px solid #fde68a',
                    borderRadius: 12,
                    padding: '8px 12px',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>✍️</span>
                    <strong style={{ fontSize: 12.5, color: '#92400e' }}>
                      تحكم المعلم في شريط السباق المباشر:
                    </strong>
                    {appSettings.tickerCustomText ? (
                      <span style={{ fontSize: 11.5, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        النص المنشور: «{appSettings.tickerCustomText}»
                      </span>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#78350f' }}>
                        (لا يوجد نص مخصص حالياً)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn gold"
                      style={{ padding: '4px 12px', fontSize: 11.5, fontWeight: 800 }}
                      onClick={() => {
                        const input = window.prompt(
                          'اكتب ما تشاء ليظهر فوراً في شريط السباق أمام جميع الطلاب:',
                          appSettings.tickerCustomText || ''
                        );
                        if (input !== null) {
                          const newSettings: AppSettings = {
                            ...appSettings,
                            tickerCustomText: input.trim()
                          };
                          setAppSettings(newSettings);
                          handleSaveSettingsToCloud(newSettings);
                          showNotice(input.trim() ? '✅ تم نشر النص في شريط السباق بنجاح!' : '✅ تم مسح النص المخصص من شريط السباق.');
                        }
                      }}
                    >
                      ✍️ {appSettings.tickerCustomText ? 'تعديل النص المنشور' : 'اكتب في شريط السباق ما تشاء'}
                    </button>
                    {appSettings.tickerCustomText && (
                      <button
                        className="btn light"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => {
                          const newSettings: AppSettings = {
                            ...appSettings,
                            tickerCustomText: ''
                          };
                          setAppSettings(newSettings);
                          handleSaveSettingsToCloud(newSettings);
                          showNotice('تم مسح النص المخصص من شريط السباق.');
                        }}
                      >
                        مسح ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* شريط البث المباشر لنتائج السباق وتوجيهات المعلم المتحرك والمستمر فوق مضمار السباق */}
              <div className="raceTickerContainer" aria-label="شريط البث المباشر لنتائج سباق المضمار وتوجيهات المعلم">
                <div className="raceTickerHeaderBadge" title="البث المباشر لنتائج سباق المضمار وتوجيهات المعلم">
                  <span className="raceTickerPulseDot" />
                  <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5 }}>🏆 نتائج السباق وتوجيهات المعلم</span>
                </div>
                <div className="raceTickerViewport">
                  <div className="raceTickerTrack">
                    {/* تكرار القائمة مرتين لضمان استمرارية وانسيابية الحركة الدائرية دون انقطاع */}
                    {[...raceTickerAnnouncements, ...raceTickerAnnouncements].map((item, idx) => (
                      <div
                        key={`${item.id}_${idx}`}
                        className={`raceTickerItem ${
                          item.type === 'top1'
                            ? 'raceTickerItemTop1'
                            : item.type === 'badge'
                            ? 'raceTickerItemBadge'
                            : item.type === 'rank'
                            ? 'raceTickerItemRank'
                            : item.type === 'teacher'
                            ? 'raceTickerItemTeacher'
                            : item.type === 'lead'
                            ? 'raceTickerItemLead'
                            : item.type === 'score'
                            ? 'raceTickerItemScore'
                            : ''
                        }`}
                      >
                        <span style={{ fontSize: 15 }}>{item.icon}</span>
                        <span>{item.text}</span>
                        {item.highlight && (
                          <strong
                            style={{
                              color:
                                item.type === 'top1'
                                  ? '#fde047'
                                  : item.type === 'badge'
                                  ? '#6ee7b7'
                                  : item.type === 'rank'
                                  ? '#e9d5ff'
                                  : item.type === 'teacher'
                                  ? '#fef08a'
                                  : item.type === 'lead'
                                  ? '#ffffff'
                                  : item.type === 'score'
                                  ? '#7dd3fc'
                                  : '#bbf7d0'
                            }}
                          >
                            • {item.highlight}
                          </strong>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* بوابة التتويج — خاصة بالمعلم فقط ومخفية عن الطلاب */}
              {isTeacherAdmin && (() => {
                const hasCompletedLessons = Boolean(
                  currentProfile &&
                    ((currentProfile.completed && currentProfile.completed.length >= 1) ||
                      currentProfile.progress >= 20 ||
                      (currentProfile.lastQuizScore && currentProfile.lastQuizScore > 0))
                );
                const unresolvedMistakesCount = currentProfile?.mistakes ? currentProfile.mistakes.length : 0;
                const hasResolvedMistakes = unresolvedMistakesCount === 0;
                const hasCompletedDailyChallenge = Boolean(
                  currentProfile &&
                    (((currentProfile.dailyCurrentIndex ?? 0) >= 1) ||
                      (currentProfile.dailyChallenge && currentProfile.dailyChallenge.currentIndex >= 1) ||
                      (currentProfile.dailyNextUnlockMs && currentProfile.dailyNextUnlockMs > Date.now()) ||
                      (currentProfile.badges && currentProfile.badges.includes('قاهر التحدي اليومي')))
                );
                const hasRequiredPoints = Boolean(currentProfile && currentProfile.points >= 15);

                const finishRequirementsTotal = 4;
                const finishRequirementsDone =
                  (hasCompletedLessons ? 1 : 0) +
                  (hasResolvedMistakes ? 1 : 0) +
                  (hasCompletedDailyChallenge ? 1 : 0) +
                  (hasRequiredPoints ? 1 : 0);

                const finishLineUnlocked = finishRequirementsDone === finishRequirementsTotal;
                const isFinished = Boolean(currentProfile?.finishLineReached);

                return (
                  <div className="raceRequirementsCard" aria-label="بوابة خط النهاية وشروط إتمام السباق">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8, background: '#fef3c7', padding: '3px 10px', borderRadius: 8, border: '1px solid #fde68a' }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#92400e' }}>🔒 بوابة التتويج (خاصة بالمعلم فقط — مخفية عن الطلاب)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{finishLineUnlocked ? '🏆' : '🔒'}</span>
                        <div>
                          <strong style={{ fontSize: 15, color: '#0f172a' }}>
                            بوابة التتويج — شروط إكمال السباق
                          </strong>
                          <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                            {finishLineUnlocked
                              ? 'تهانينا! اكتملت جميع الشروط، وجوادك جاهز للتتويج بالوسام!'
                              : `استكمل المتطلبات المتبقية (${finishRequirementsTotal - finishRequirementsDone} من ${finishRequirementsTotal}) لتتوج بطلاً!`}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 999,
                            background: finishLineUnlocked ? '#dcfce7' : '#fee2e2',
                            color: finishLineUnlocked ? '#15803d' : '#991b1b',
                            fontSize: 12,
                            fontWeight: 800,
                            border: finishLineUnlocked ? '1px solid #86efac' : '1px solid #fca5a5'
                          }}
                        >
                          {finishLineUnlocked ? '✅ مؤهل للتتويج' : `🔒 مقفل (${finishRequirementsDone}/${finishRequirementsTotal})`}
                        </span>

                        {finishLineUnlocked && (
                          <button
                            className="btn gold"
                            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 800, animation: 'pulse 1.8s infinite' }}
                            onClick={handleCrossFinishLine}
                          >
                            {isFinished ? '🏆 عرض وسام وشهادة التتويج' : '🏆 استلم وسام التتويج!'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* قائمة المتطلبات الـ 4 */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: 8,
                        marginTop: 8
                      }}
                    >
                      {/* الشرط 1: أسئلة دروس الوحدات */}
                      <div
                        style={{
                          background: hasCompletedLessons ? '#f0fdf4' : '#f8fafc',
                          border: hasCompletedLessons ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12.5
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{hasCompletedLessons ? '✅' : '⏳'}</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: hasCompletedLessons ? '#15803d' : '#334155' }}>
                            أسئلة دروس المنهج
                          </strong>
                          <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                            {hasCompletedLessons ? 'تمت الإجابة والتقويم بنجاح' : 'مطلوب إكمال تقويم أو اختبار'}
                          </span>
                        </div>
                      </div>

                      {/* الشرط 2: عيادة الأخطاء */}
                      <div
                        style={{
                          background: hasResolvedMistakes ? '#f0fdf4' : '#fff5f5',
                          border: hasResolvedMistakes ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12.5
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{hasResolvedMistakes ? '✅' : '🩺'}</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: hasResolvedMistakes ? '#15803d' : '#991b1b' }}>
                            عيادة الأخطاء اللغوية
                          </strong>
                          <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                            {hasResolvedMistakes ? 'لا توجد أخطاء غير معالجة' : `متبقي (${unresolvedMistakesCount}) أخطاء تحتاج معالجة`}
                          </span>
                        </div>
                        {!hasResolvedMistakes && (
                          <button
                            className="btn coral"
                            style={{ padding: '3px 7px', fontSize: 10 }}
                            onClick={openMistakesClinic}
                          >
                            عالج الآن
                          </button>
                        )}
                      </div>

                      {/* الشرط 3: تحدي اليوم */}
                      <div
                        style={{
                          background: hasCompletedDailyChallenge ? '#f0fdf4' : '#f8fafc',
                          border: hasCompletedDailyChallenge ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12.5
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{hasCompletedDailyChallenge ? '✅' : '🎯'}</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: hasCompletedDailyChallenge ? '#15803d' : '#334155' }}>
                            تحدي اليوم (24 ساعة)
                          </strong>
                          <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                            {hasCompletedDailyChallenge ? 'تم إنجاز التحدي بنجاح' : 'مطلوب إنجاز سؤال التحدي'}
                          </span>
                        </div>
                        {!hasCompletedDailyChallenge && (
                          <a
                            href="#dailyChallengeSection"
                            className="btn primary"
                            style={{ padding: '3px 7px', fontSize: 10, textDecoration: 'none' }}
                          >
                            انتقل للحل
                          </a>
                        )}
                      </div>

                      {/* الشرط 4: نقاط الفرسان */}
                      <div
                        style={{
                          background: hasRequiredPoints ? '#f0fdf4' : '#f8fafc',
                          border: hasRequiredPoints ? '1.5px solid #86efac' : '1.5px solid #e2e8f0',
                          borderRadius: 10,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12.5
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{hasRequiredPoints ? '✅' : '⭐'}</span>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: hasRequiredPoints ? '#15803d' : '#334155' }}>
                            نقاط الفرسان (15+)
                          </strong>
                          <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                            رصيدك: {currentProfile?.points || 0} من 15⭐ نقطة
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {top10Racers.length > 0 ? (
                <div className="raceTrack">
                  {/* تم إلغاء رمز وحاجز خط النهاية من المضمار حالياً استجابة لطلب المعلم */}
                  <div className="raceStartLine" title="خط البداية والانطلاق (اليمين)" />
                  {top10Racers.map((racer, idx) => {
                    // موقع الحصان على المضمار مضبوط بهندسة دقيقة استجابة لطلب المعلم:
                    // الأول يتقدم ولا يسبقه الثاني أبداً، والثاني يتقدم ولا يسبقه الثالث، وهكذا لبقية المتسابقين!
                    const rightPercent = racerTrackPositions[idx] ?? 2.5;

                    const medal =
                      idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                    return (
                      <div key={racer.profileId} className="raceLane">
                        <div
                          className="raceRankBadge"
                          style={{
                            background:
                              idx === 0
                                ? '#f7b832'
                                : idx === 1
                                ? '#d9e2ec'
                                : idx === 2
                                ? '#eab676'
                                : '#f0fdf4',
                            color: '#14532d'
                          }}
                        >
                          {medal}
                        </div>
                        <div className="raceRunnerWrap">
                          {(() => {
                            const gallopDuration = (0.42 + (idx % 4) * 0.08).toFixed(2);
                            const gallopDelay = (-((idx * 0.17) % 0.6)).toFixed(2);
                            const bobDuration = (1.5 + (idx % 3) * 0.35).toFixed(2);
                            const isFirst = idx === 0;
                            const isCurrentStudent = Boolean(
                              activeId &&
                              (racer.profileId === activeId ||
                                (currentProfile && (racer.code === currentProfile.code || racer.name === currentProfile.name)))
                            );
                            const progressPercent = Math.min(65, Math.max(0, Math.round((rightPercent / 74) * 100)));
                            const isMoving = racer.points > 0;
                            return (
                              <div
                                className={`raceHorseNode ${isCurrentStudent ? 'raceHorseCurrent' : ''}`}
                                style={{
                                  right: `${rightPercent}%`,
                                  borderColor: isCurrentStudent
                                    ? '#d97706'
                                    : isFirst
                                    ? '#f59e0b'
                                    : idx === 1
                                    ? '#94a3b8'
                                    : idx === 2
                                    ? '#d97706'
                                    : '#166534',
                                  background: isCurrentStudent
                                    ? 'linear-gradient(135deg, #fffdf0 0%, #fef3c7 48%, #ffffff 100%)'
                                    : isFirst
                                    ? '#fffdf0'
                                    : '#fffffffa',
                                  boxShadow: isCurrentStudent
                                    ? '0 0 16px rgba(245, 158, 11, 0.55), 0 0 0 3px rgba(251, 191, 36, 0.45), 0 6px 20px rgba(180, 83, 9, 0.25)'
                                    : isFirst
                                    ? '0 6px 18px rgba(245, 158, 11, 0.35), 0 0 0 2px rgba(245, 158, 11, 0.25)'
                                    : undefined,
                                  zIndex: isCurrentStudent ? 8 : isFirst ? 5 : 4,
                                  animation: isMoving
                                    ? `horseBob ${bobDuration}s infinite ease-in-out ${gallopDelay}s`
                                    : 'none'
                                }}
                              >
                                {isCurrentStudent && (
                                  <span className="raceYouBadge" title="هذا هو جوادك المتميز في المضمار!">
                                    أنت
                                  </span>
                                )}
                                {isStudentLeadSeized(racer, idx) ? (
                                  <span className="leadSeizedBadge" title="🔥 انتزع الصدارة وتربع على المركز الأول!">
                                    🔥 انتزع الصدارة 🏆
                                  </span>
                                ) : isFirst ? (
                                  <span style={{ fontSize: 10, marginRight: -2 }} title="متصدر سباق الفرسان">
                                    👑
                                  </span>
                                ) : null}

                                {/* منطقة رمز الحصان وشريط التقدم المصغر نحو خط النهاية (بدون حركة عند 0 نقاط) */}
                                <div
                                  className="raceHorseIconArea"
                                  title={
                                    isMoving
                                      ? `نسبة التقدم نحو خط النهاية: ${progressPercent}% (${racer.points} نقطة)`
                                      : 'الجواد واقف عند خط البداية بانتظار الإجابات الصحيحة للانطلاق 🏇'
                                  }
                                >
                                  <span
                                    className="raceHorseIcon"
                                    style={{
                                      animation: isMoving
                                        ? `horseRhythmicBounce ${gallopDuration}s infinite ease-in-out ${gallopDelay}s`
                                        : 'none',
                                      filter: isCurrentStudent
                                        ? 'drop-shadow(0 0 4px #f59e0b) brightness(1.2) saturate(1.3)'
                                        : undefined
                                    }}
                                    title={
                                      isCurrentStudent
                                        ? 'جوادك المتميز باللون الذهبي'
                                        : isMoving
                                        ? 'الجواد منطلق في السباق'
                                        : 'الجواد واقف عند خط البداية'
                                    }
                                  >
                                    🏇
                                  </span>
                                  <div className="raceMiniProgressBar">
                                    <div
                                      className="raceMiniProgressFill"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>

                                {/* الاسم والفصل بجانب الحصان بحجم صغير مدمج لتوفير المساحة في المضمار */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      fontWeight: 800,
                                      color: isCurrentStudent || isFirst ? '#92400e' : '#14532d',
                                      maxWidth: 72,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={racer.name}
                                  >
                                    {racer.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 9.5,
                                      background: isCurrentStudent || isFirst ? '#fef3c7' : '#ecfdf5',
                                      color: isCurrentStudent || isFirst ? '#92400e' : '#15803d',
                                      padding: '1px 4px',
                                      borderRadius: 999,
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={`فصل ${racer.cls} — ${racer.points} نقطة (${getStudentRank(racer.points).title})`}
                                  >
                                    فصل {racer.cls} • {racer.points}⭐
                                  </span>
                                  <span
                                    style={{ fontSize: 10, padding: '0 1px' }}
                                    title={`رتبة: ${getStudentRank(racer.points).title}`}
                                  >
                                    {getStudentRank(racer.points).icon}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="note" style={{ textAlign: 'center', padding: 16 }}>
                  🏇 المضمار العشبي الأخضر جاهز للانطلاق! أنشئ ملف طالب وابدأ الاختبارات ليتنافس جوادك في السباق.
                </div>
              )}

              {/* Student Progress Table Across Exams — خاص بالمعلم فقط ومخفي عن الطلاب */}
              {isTeacherAdmin && leaderboardStudents.length > 0 && (
                <div style={{ marginTop: 16, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, color: 'var(--ink)' }}>
                      📊 سجل تقدم الطلاب في الاختبارات ومراحل نافس ورتب الفرسان:
                    </h4>
                    <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontWeight: 800 }}>
                      🔒 خاص بالمعلم فقط — مخفي عن الطلاب
                    </span>
                  </div>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      background: '#fff',
                      borderRadius: 14,
                      overflow: 'hidden',
                      fontSize: 13
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#126b70', color: '#fff', textAlign: 'right' }}>
                        <th style={{ padding: '8px 10px' }}>المركز</th>
                        <th style={{ padding: '8px 10px' }}>اسم الفارس</th>
                        <th style={{ padding: '8px 10px' }}>الفصل</th>
                        <th style={{ padding: '8px 10px' }}>النقاط</th>
                        <th style={{ padding: '8px 10px' }}>مراحل نافس المنجزة</th>
                        <th style={{ padding: '8px 10px' }}>آخر اختبار ونتيجته</th>
                        <th style={{ padding: '8px 10px' }}>نسبة التقدم</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardStudents.slice(0, 15).map((st, i) => {
                        const stRank = getStudentRank(st.points);
                        const isLead = isStudentLeadSeized(st, i);
                        return (
                          <tr
                            key={st.profileId}
                            style={{
                              borderBottom: '1px solid #e7f0ee',
                              background: st.profileId === activeId ? '#effaf7' : '#fff'
                            }}
                          >
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>#{i + 1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>
                              🐎 {st.name}
                              {isLead && (
                                <span className="tableLeadBadge">🔥 انتزع الصدارة 🥇</span>
                              )}
                              <span
                                style={{
                                  fontSize: 10.5,
                                  marginRight: 6,
                                  padding: '2px 6px',
                                  borderRadius: 6,
                                  background: stRank.tier >= 4 ? '#fef3c7' : '#f1f5f9',
                                  color: stRank.color,
                                  fontWeight: 700
                                }}
                              >
                                {stRank.icon} {stRank.title}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px' }}>{st.cls}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#197a56' }}>
                              ⭐ {st.points}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              المرحلة {Math.min(st.nafesStageIndex + 1, NAFES_STAGES.length)} من{' '}
                              {NAFES_STAGES.length} ({st.nafesStageIndex} مكتمل)
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {st.lastQuizTitle}{' '}
                              {st.lastQuizTotal > 0 ? `(${st.lastQuizScore}/${st.lastQuizTotal})` : ''}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 800 }}>{st.progress}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {currentProfile && currentProfile.lastActivity && (
              <section id="resumeCard" className="resume">
                <div style={{ flex: 1 }}>
                  <b>↩️ تابع من حيث توقفت</b>
                  <div id="resumeText" className="sub" style={{ margin: '2px 0 0' }}>
                    {currentProfile.lastActivity.label}
                  </div>
                  <div className="progressWrap">
                    <i id="progressBar" style={{ width: `${currentProfile.progress || 0}%` }} />
                  </div>
                  <div className="progressLabel">
                    <span>تقدمك في الرحلة</span>
                    <span id="progressText">{currentProfile.progress || 0}%</span>
                  </div>
                </div>
                <button className="btn primary" onClick={handleResumeLast}>
                  متابعة
                </button>
              </section>
            )}

            <section>
              <div className="secTitle">
                <h2>📖 الوحدات الدراسية</h2>
                <span className="line" />
              </div>
              <p className="sub">ابدأ من الوحدة التي تريدها واستكشف دروسها وأنشطتها.</p>
              <div className="units">
                {/* الوحدة 1 */}
                <article className="unit u1">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="unitArt">🕌📖</div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>
                      {appSettings.unit1Open !== false ? '✅ مفتوحة للجميع' : '🔒 مقفلة مؤقتاً'}
                    </span>
                  </div>
                  <h3>
                    الوحدة الأولى
                    <br />
                    القيم الإسلامية
                  </h3>
                  <p>قيمنا ومهاراتنا اللغوية في سياقات تربوية.</p>
                  {appSettings.unit1Open !== false ? (
                    <button className="btn green" onClick={() => handleUnit(1)}>
                      ابدأ الوحدة ←
                    </button>
                  ) : isTeacherAdmin ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn green"
                        style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                        onClick={() => { setSelectedUnit(1); setActiveModal('lessonModal'); }}
                      >
                        معاينة المعلم 👁️
                      </button>
                      <button
                        className="btn light"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => handleToggleUnitByTeacher(1, true)}
                      >
                        🔓 إذن بفتح الوحدة للطلاب
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn light"
                      style={{
                        width: '100%',
                        borderColor: '#fca5a5',
                        background: '#fff5f5',
                        color: '#b91c1c',
                        fontWeight: 700
                      }}
                      onClick={() => showNotice('🔒 أسئلة الوحدة الأولى (القيم الإسلامية) مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل حتى يأذن المعلم بفتحها.')}
                    >
                      🔒 مقفلة — بانتظار إذن المعلم
                    </button>
                  )}
                </article>

                {/* الوحدة 2 */}
                <article className="unit u2" style={{ position: 'relative', border: !appSettings.unit2Open ? '2px dashed #cbd5e1' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="unitArt">📚🪶</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: appSettings.unit2Open ? '#f3e8ff' : '#fee2e2',
                        color: appSettings.unit2Open ? '#6b21a8' : '#991b1b'
                      }}
                    >
                      {appSettings.unit2Open ? '🔓 مفتوحة بإذن المعلم' : '🔒 مقفلة حتى إذن المعلم'}
                    </span>
                  </div>
                  <h3>
                    الوحدة الثانية
                    <br />
                    الأعلام
                  </h3>
                  <p>
                    {appSettings.unit2Open
                      ? 'نتعرف على أعلامنا ونبني على إنجازاتهم.'
                      : 'مقفلة حالياً للطلاب بأمر المعلم حتى يأذن بفتحها 🔒'}
                  </p>
                  {appSettings.unit2Open ? (
                    <button className="btn purple" onClick={() => handleUnit(2)}>
                      ابدأ الوحدة ←
                    </button>
                  ) : isTeacherAdmin ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn purple"
                        style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                        onClick={() => { setSelectedUnit(2); setActiveModal('lessonModal'); }}
                      >
                        معاينة المعلم 👁️
                      </button>
                      <button
                        className="btn green"
                        style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                        onClick={() => handleToggleUnitByTeacher(2, true)}
                      >
                        🔓 إذن بفتح الوحدة للطلاب
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn light"
                      style={{
                        width: '100%',
                        borderColor: '#fca5a5',
                        background: '#fff5f5',
                        color: '#b91c1c',
                        fontWeight: 700
                      }}
                      onClick={() => showNotice('🔒 الوحدة الثانية (الأعلام) مقفلة حالياً، انتظر حتى يأذن المعلم بفتحها.')}
                    >
                      🔒 مقفلة — بانتظار إذن المعلم
                    </button>
                  )}
                </article>

                {/* الوحدة 3 */}
                <article className="unit u3" style={{ position: 'relative', border: !appSettings.unit3Open ? '2px dashed #cbd5e1' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="unitArt" title="علم المملكة العربية السعودية الشامخ">🇸🇦</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: appSettings.unit3Open ? '#dbeafe' : '#fee2e2',
                        color: appSettings.unit3Open ? '#1e40af' : '#991b1b'
                      }}
                    >
                      {appSettings.unit3Open ? '🔓 مفتوحة بإذن المعلم' : '🔒 مقفلة حتى إذن المعلم'}
                    </span>
                  </div>
                  <h3>
                    الوحدة الثالثة
                    <br />
                    وطني
                  </h3>
                  <p>
                    {appSettings.unit3Open
                      ? 'نحب وطننا ونعتز بموارده ومكانته.'
                      : 'مقفلة حالياً للطلاب بأمر المعلم حتى يأذن بفتحها 🔒'}
                  </p>
                  {appSettings.unit3Open ? (
                    <button className="btn blue" onClick={() => handleUnit(3)}>
                      ابدأ الوحدة ←
                    </button>
                  ) : isTeacherAdmin ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn blue"
                        style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                        onClick={() => { setSelectedUnit(3); setActiveModal('lessonModal'); }}
                      >
                        معاينة المعلم 👁️
                      </button>
                      <button
                        className="btn green"
                        style={{ padding: '6px 12px', fontSize: 12, flex: 1 }}
                        onClick={() => handleToggleUnitByTeacher(3, true)}
                      >
                        🔓 إذن بفتح الوحدة للطلاب
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn light"
                      style={{
                        width: '100%',
                        borderColor: '#fca5a5',
                        background: '#fff5f5',
                        color: '#b91c1c',
                        fontWeight: 700
                      }}
                      onClick={() => showNotice('🔒 الوحدة الثالثة (وطني) مقفلة حالياً، انتظر حتى يأذن المعلم بفتحها.')}
                    >
                      🔒 مقفلة — بانتظار إذن المعلم
                    </button>
                  )}
                </article>
              </div>
            </section>

            <section className="features">
              <div className="secTitle">
                <h2>⭐ مميزات التطبيق</h2>
              </div>
              <div className="featureGrid">
                <div className="feature">
                  <i>🎯</i>
                  <b>مهارات لغوية متنوعة</b>
                </div>
                <div className="feature">
                  <i>📚</i>
                  <b>أنشطة مرتبطة بالمنهج</b>
                </div>
                <div className="feature">
                  <i>🩺</i>
                  <b>تشخيص وعلاج الأخطاء</b>
                </div>
                <div className="feature">
                  <i>🐎</i>
                  <b>مضمار سباق الفرسان</b>
                </div>
                <div className="feature">
                  <i>📊</i>
                  <b>قاعدة بيانات ومتابعة</b>
                </div>
              </div>
            </section>

            <section>
              <div className="secTitle">
                <h2>🚀 رحلتي في لغتي</h2>
              </div>
              <div className="quick">
                <div
                  className="card"
                  style={{ borderColor: '#f3d2d4', background: 'linear-gradient(#fff9f9,#fff)' }}
                >
                  <i>🩺</i>
                  <h3>علاج الأخطاء</h3>
                  <p>
                    دفتر أخطائك الشخصي ({studentMistakes.length}) وتدريبات علاجية للأخطاء الشائعة.
                  </p>
                  <button className="btn coral full" onClick={openMistakesClinic}>
                    افتح عيادة اللغة
                  </button>
                </div>
                <div className="card">
                  <i>🎮</i>
                  <h3>مركز الألعاب</h3>
                  <p>تحديات لغوية قصيرة وممتعة.</p>
                  <button className="btn green full" onClick={openGames}>
                    افتح الألعاب
                  </button>
                </div>
                <div className="card">
                  <i>🏆</i>
                  <h3>مراحل اختبار نافس المتجدد</h3>
                  <p>
                    نصوص متجددة لكل وحدة (10 فهم قرائي + 10 قواعد + 10 صح/خطأ + 2 مقالي) دون تكرار.
                  </p>
                  <button className="btn gold full" onClick={handleNafes}>
                    افتح مراحل نافس ({completedNafesStages.length}/{NAFES_STAGES.length})
                  </button>
                </div>
                <div className="card">
                  <i>💬</i>
                  <h3>اقتراحات وملاحظات الطلاب</h3>
                  <p>أرسل رأيك أو استفسارك مباشرة وسرياً لمعلم المادة.</p>
                  <button
                    className="btn purple full"
                    onClick={() => {
                      if (!appSettings.enableFeedback) {
                        showNotice('إرسال المقترحات مغلق مؤقتًا.');
                        return;
                      }
                      setActiveModal('feedbackModal');
                    }}
                  >
                    أرسل مقترحًا للمعلم
                  </button>
                </div>
              </div>
            </section>
          </main>

          <footer>
            <p>♥</p>
            <p>
              <b>إعداد وتنفيذ: المعلم / مساعد سليمان الصخري</b>
            </p>
            <small>جميع الحقوق محفوظة © 1448هـ – 2026/2027م</small>
          </footer>
        </div>
      )}

      {/* ===================================================================== */}
      {/* NAFES PROGRESSIVE STAGES MODAL (Unit 1 -> Unit 2 -> Unit 3 -> Stage 4) */}
      {/* ===================================================================== */}
      <div
        id="nafesStagesModal"
        className={`modal ${activeModal === 'nafesStagesModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog">
          <div className="head" style={{ background: 'linear-gradient(135deg,#b57c00,#e59812)' }}>
            <h2>🏆 مراحل اختبار نافس المتجدد (لا يتكرر بعد الحل)</h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            <p className="sub">
              عند إتمام كل مرحلة من اختبارات نافس، تُحفظ نتيجتك ولا تعود لنفس الاختبار مرة أخرى، بل تفتح لك المرحلة التالية بنص جديد و32 سؤالًا جديدًا (10 فهم قرائي + 10 قواعد من النص + 10 صح وخطأ + 2 سؤال مقالي):
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {NAFES_STAGES.map((stg, idx) => {
                const isCompleted = completedNafesStages.includes(stg.id);
                const teacherLock = isNafesStageUnlockedByTeacher(stg.id, appSettings, isTeacherAdmin);
                const isUnlockedByProgress = idx <= currentNafesStageIdx || isTeacherAdmin;
                const isCurrentNext = idx === currentNafesStageIdx && !isCompleted;
                const canLaunch = teacherLock.unlocked && isUnlockedByProgress;

                return (
                  <div
                    key={stg.id}
                    style={{
                      border: !teacherLock.unlocked
                        ? '1.5px solid #fca5a5'
                        : isCurrentNext
                        ? '2px solid #e59812'
                        : isCompleted
                        ? '2px solid #299d82'
                        : '1px solid #d6e7e5',
                      background: !teacherLock.unlocked
                        ? '#fff5f5'
                        : isCompleted
                        ? '#f2fbf7'
                        : isCurrentNext
                        ? '#fffdf5'
                        : '#f8fafb',
                      borderRadius: 18,
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      opacity: canLaunch || isCompleted ? 1 : 0.75
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span
                          style={{
                            background: !teacherLock.unlocked
                              ? '#ef4444'
                              : isCompleted
                              ? '#299d82'
                              : isCurrentNext
                              ? '#f7b832'
                              : '#cad8d8',
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800
                          }}
                        >
                          {!teacherLock.unlocked
                            ? '🔒 مقفلة بقرار المعلم'
                            : isCompleted
                            ? '✅ مكتمل (تم الاجتياز)'
                            : isCurrentNext
                            ? '🔥 المرحلة الحالية المتاحة'
                            : '🔒 يفتح بعد إتمام المرحلة السابقة'}
                        </span>
                        <small style={{ color: 'var(--mut)', fontWeight: 700 }}>
                          {stg.unitLabel}
                        </small>
                      </div>
                      <h4 style={{ margin: '4px 0', fontSize: 18 }}>{stg.title}</h4>
                      <div style={{ fontSize: 13, color: 'var(--mut)' }}>
                        📖 {stg.passage.title} — (32 سؤالًا: 10 فهم + 10 قواعد + 10 صح/خطأ + 2 مقالي)
                      </div>
                      {!teacherLock.unlocked && (
                        <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 700 }}>
                          {teacherLock.reason}
                        </div>
                      )}
                    </div>

                    <div>
                      {!teacherLock.unlocked ? (
                        <button
                          className="btn light"
                          disabled
                          style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            cursor: 'not-allowed',
                            border: '1px solid #fca5a5',
                            fontWeight: 800
                          }}
                          onClick={() => showNotice(teacherLock.reason || '🔒 هذه المرحلة لم تُفتح بعد من قِبل المعلم.')}
                        >
                          🔒 لم تُفتح بعد من قِبل المعلم
                        </button>
                      ) : isCompleted && !isTeacherAdmin ? (
                        <button className="btn light" disabled>
                          ✅ تم إتمام هذه المرحلة
                        </button>
                      ) : isUnlockedByProgress ? (
                        <button
                          className="btn gold"
                          onClick={() => launchNafesStage(stg, idx)}
                        >
                          {isCompleted ? 'فتح (صلاحية معلم)' : 'ابدأ الاختبار الآن ←'}
                        </button>
                      ) : (
                        <button className="btn light" disabled>
                          🔒 مغلق حتى إتمام المرحلة {idx}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TEACHER / ADMIN DATABASE CONTROL PANEL MODAL                          */}
      {/* ===================================================================== */}
      <div
        id="adminModal"
        className={`modal ${activeModal === 'adminModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog" style={{ width: 'min(920px, 100%)' }}>
          <div className="head" style={{ background: 'linear-gradient(135deg,#0f4c5c,#1b7a8c)' }}>
            <h2>⚙️ لوحة تحكم المعلم وقاعدة البيانات السحابية</h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            {!isTeacherAdmin ? (
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <h3>🔐 دخول المعلم المشرف (أ. مساعد سليمان الصخري)</h3>
                <p className="sub">
                  يمكنك الدخول عبر حساب Google المعتمد ({ADMIN_EMAIL}) أو عبر رمز المعلم السريع لإدارة قاعدة البيانات والتحديات والصلاحيات:
                </p>
                <div
                  style={{
                    maxWidth: 380,
                    margin: '16px auto',
                    display: 'grid',
                    gap: 10,
                    background: '#f5fbf9',
                    padding: 18,
                    borderRadius: 18,
                    border: '1px solid #cfe6e2'
                  }}
                >
                  <button className="btn primary full" onClick={handleGoogleAdminLogin}>
                    🔑 تسجيل الدخول بحساب Google للمعلم
                  </button>
                  <div style={{ fontSize: 13, color: 'var(--mut)', margin: '4px 0' }}>
                    — أو أدخل رمز المعلم السريع (الافتراضي: 1448) —
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="password"
                      placeholder="رمز المعلم..."
                      value={adminPinInput}
                      onChange={e => setAdminPinInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 12,
                        border: '1px solid #c5deda'
                      }}
                    />
                    <button className="btn green" onClick={handlePinAdminLogin}>
                      دخول
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* إشعار المعلم المعتمد وحالة المنصة */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1.5px solid #86efac',
                    borderRadius: 14,
                    padding: '12px 16px',
                    marginBottom: 14,
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28 }}>👨‍🏫</span>
                    <div>
                      <h4 style={{ margin: 0, color: '#166534', fontSize: 15, fontWeight: 900 }}>
                        المعلم المشرف المعتمد: أ. مساعد سليمان الصخري
                      </h4>
                      <p style={{ margin: '2px 0 0', color: '#15803d', fontSize: 12.5 }}>
                        الحساب المعتمد للإدارة السحابية: <code style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: 6, fontWeight: 700 }}>msa3dals5ary@gmail.com</code> (صلاحيات كاملة 24/7)
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        background: scheduleInfo.isOpen ? '#10b981' : '#ea580c',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900
                      }}
                    >
                      حالة المنصة: {scheduleInfo.statusLabel}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 14
                  }}
                >
                  <div className="tabRow" style={{ marginBottom: 0, flexWrap: 'wrap' }}>
                    <button
                      className={`btn ${adminTab === 'schedule' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('schedule')}
                    >
                      ⏰ إدارة مواعيد المنصة
                    </button>
                    <button
                      className={`btn ${adminTab === 'nafesStages' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('nafesStages')}
                    >
                      🏆 مراحل اختبار نافس
                    </button>
                    <button
                      className={`btn ${adminTab === 'settings' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('settings')}
                    >
                      🔐 صلاحيات الوحدات والألعاب
                    </button>
                    <button
                      className={`btn ${adminTab === 'announcements' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('announcements')}
                    >
                      📣 شريط النتائج والتوجيهات ({appSettings.tickerAnnouncements?.length || 0})
                    </button>
                    <button
                      className={`btn ${adminTab === 'students' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('students')}
                    >
                      🐎 إدارة الطلاب والفرسان ({leaderboardStudents.length})
                    </button>
                    <button
                      className={`btn ${adminTab === 'studentStats' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('studentStats')}
                      style={{
                        background: adminTab === 'studentStats' ? undefined : '#f0fdf4',
                        color: adminTab === 'studentStats' ? undefined : '#166534',
                        borderColor: '#86efac',
                        fontWeight: 700
                      }}
                    >
                      📊 إحصائيات ونشاط الطلاب
                    </button>
                    <button
                      className={`btn ${adminTab === 'challenges' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('challenges')}
                    >
                      🎯 إضافة وإدارة التحديات ({allDailyChallenges.length})
                    </button>
                    <button
                      className={`btn ${adminTab === 'parentMessages' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('parentMessages')}
                    >
                      📩 رسائل أولياء الأمور ({parentMessages.length})
                      {parentMessages.filter(m => m.status === 'جديد').length > 0 && (
                        <span
                          style={{
                            marginRight: 6,
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 999,
                            fontWeight: 900
                          }}
                        >
                          {parentMessages.filter(m => m.status === 'جديد').length} جديد
                        </span>
                      )}
                    </button>
                    <button
                      className={`btn ${adminTab === 'feedback' ? 'primary' : 'light'}`}
                      onClick={() => setAdminTab('feedback')}
                    >
                      💬 صندوق رسائل وملاحظات الطلاب ({cloudFeedback.length})
                    </button>
                  </div>
                  <button
                    className="btn coral"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => {
                      setAdminUnlockedByPin(false);
                      try {
                        localStorage.removeItem('LT_ADMIN_UNLOCKED');
                      } catch {}
                      if (firebaseUser) signOut(auth);
                      showNotice('تم تسجيل خروج المعلم بنجاح.');
                    }}
                  >
                    تسجيل خروج المعلم
                  </button>
                </div>

                {/* TAB: SCHEDULE & PLATFORM TIMINGS MANAGEMENT */}
                {adminTab === 'schedule' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* بطاقة رأس القسم */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)',
                        color: '#fff',
                        borderRadius: 16,
                        padding: '16px 20px',
                        boxShadow: '0 4px 16px rgba(4, 120, 87, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 34 }}>⏰</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>
                            إدارة مواعيد المنصة وصلاحيات الفتح والإغلاق
                          </h3>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a7f3d0' }}>
                            المعلم هو صاحب الصلاحية الرئيسية والوحيدة. تحكم يدوي فوري في أي وقت، مع خيار الجدولة التلقائية المعتمدة.
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: scheduleInfo.isOpen ? '#10b981' : '#ea580c',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 900,
                            padding: '6px 14px',
                            borderRadius: 999,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}
                        >
                          الحالة الحالية: {scheduleInfo.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* أولاً: أزرار التحكم اليدوي المباشر السريع */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '2px solid #cbd5e1',
                        borderRadius: 16,
                        padding: '18px 20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 16, color: '#1e293b', fontWeight: 800 }}>
                            ⚡ 1. التحكم اليدوي المباشر في حالة المنصة (أولوية مطلقة للمعلم)
                          </h4>
                          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                            يمكنك فتح المنصة أو إغلاقها فوراً في أي وقت تريده بضغطة زر واحدة دون انتظار أي موعد مجدول:
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn green"
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              padding: '10px 20px',
                              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                            }}
                            onClick={handlePlatformOpenNow}
                          >
                            🟢 فتح المنصة الآن للجميع
                          </button>
                          <button
                            type="button"
                            className="btn coral"
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              padding: '10px 20px',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                            }}
                            onClick={handlePlatformCloseNow}
                          >
                            🔴 إغلاق المنصة الآن عن الجميع
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          background: scheduleInfo.isOpen ? '#f0fdf4' : '#fff7ed',
                          border: `1.5px solid ${scheduleInfo.isOpen ? '#86efac' : '#fdba74'}`,
                          borderRadius: 12,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{scheduleInfo.isOpen ? '🟢' : '🔒'}</span>
                          <div>
                            <b style={{ color: scheduleInfo.isOpen ? '#166534' : '#9a3412', fontSize: 14 }}>
                              مؤشر الوضع الراهن: المنصة {scheduleInfo.isOpen ? 'مفتوحة ومتاحة لجميع الطلاب' : 'مغلقة ومحجوبة عن الطلاب'}
                            </b>
                            <span style={{ display: 'block', fontSize: 12, color: scheduleInfo.isOpen ? '#15803d' : '#c2410c' }}>
                              {scheduleInfo.message}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            background: '#fff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#475569'
                          }}
                        >
                          نظام التحكم: {appSettings.scheduleEnabled ? 'مجدول تلقائي ⏱️' : 'يدوي مباشر 👨‍🏫'}
                        </span>
                      </div>
                    </div>

                    {/* ثانياً: قسم الجدولة الزمنية التلقائية */}
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '2px solid #94a3b8',
                        borderRadius: 16,
                        padding: '18px 20px'
                      }}
                    >
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 800 }}>
                          ⏱️ 2. جدولة مواعيد الفتح والإغلاق التلقائية (اختياري للمعلم)
                        </h4>
                        <p style={{ margin: '3px 0 0', fontSize: 13, color: '#475569' }}>
                          حدد تاريخ ووقت فتح المنصة وتاريخ ووقت إغلاقها، وسيقوم النظام بتطبيقها تلقائياً مع عرض عداد تنازلي للطلاب. يمكنك إلغاء الجدولة والعودة للتحكم اليدوي في أي لحظة.
                        </p>
                      </div>

                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '14px',
                          marginBottom: 14
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 800,
                            color: '#1e293b'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={schedEnabledDraft}
                            onChange={e => setSchedEnabledDraft(e.target.checked)}
                            style={{ width: 18, height: 18, accentColor: '#059669' }}
                          />
                          <span>
                            تشغيل نظام الجدولة الزمنية التلقائية (تفعيل فتح المنصة وإغلاقها حسب التاريخ والوقت المحددين)
                          </span>
                        </label>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 14,
                          marginBottom: 16
                        }}
                      >
                        <div className="field">
                          <label style={{ fontWeight: 800, color: '#166534' }}>
                            📅 تاريخ ووقت فتح المنصة المجدول:
                          </label>
                          <input
                            type="datetime-local"
                            value={schedOpenInput}
                            onChange={e => setSchedOpenInput(e.target.value)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              border: '1.5px solid #86efac',
                              fontWeight: 700
                            }}
                          />
                          <small style={{ color: '#64748b', fontSize: 11 }}>
                            تفتح المنصة تلقائياً فور حلول هذا التوقيت
                          </small>
                        </div>

                        <div className="field">
                          <label style={{ fontWeight: 800, color: '#991b1b' }}>
                            📅 تاريخ ووقت إغلاق المنصة المجدول:
                          </label>
                          <input
                            type="datetime-local"
                            value={schedCloseInput}
                            onChange={e => setSchedCloseInput(e.target.value)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              border: '1.5px solid #fca5a5',
                              fontWeight: 700
                            }}
                          />
                          <small style={{ color: '#64748b', fontSize: 11 }}>
                            تُغلق المنصة وتُحجب الأنشطة فور حلول هذا التوقيت
                          </small>
                        </div>
                      </div>

                      {/* أزرار الحفظ والإلغاء وتأكيد العملية */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn green"
                          style={{ padding: '9px 18px', fontWeight: 800 }}
                          onClick={handleSavePlatformSchedule}
                        >
                          💾 حفظ وتطبيق مواعيد المنصة سحابياً
                        </button>
                        <button
                          type="button"
                          className="btn light"
                          style={{ padding: '9px 18px', fontWeight: 700 }}
                          onClick={handleCancelPlatformSchedule}
                        >
                          ❌ إلغاء الجدولة والاعتماد على التحكم اليدوي فقط
                        </button>
                      </div>

                      {/* بطاقة عرض المواعيد المحفوظة في قاعدة البيانات */}
                      <div
                        style={{
                          marginTop: 16,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 12,
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div>
                          <b style={{ color: '#334155', fontSize: 13 }}>📋 ملخص المواعيد المحفوظة في الخادم السحابي:</b>
                          <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                            {appSettings.scheduleEnabled ? (
                              <span>
                                • موعد الفتح: <b>{appSettings.scheduledOpenAt ? new Date(appSettings.scheduledOpenAt).toLocaleString('ar-SA') : 'غير محدد'}</b> • موعد الإغلاق: <b>{appSettings.scheduledCloseAt ? new Date(appSettings.scheduledCloseAt).toLocaleString('ar-SA') : 'غير محدد'}</b>
                              </span>
                            ) : (
                              <span>
                                • نظام الجدولة <b>متوقف حالياً</b>. المنصة تعمل تحت <b>التحكم اليدوي المباشر للمعلم ({appSettings.platformManualStatus !== 'closed' ? 'مفتوحة' : 'مغلقة'})</b>.
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          style={{
                            background: appSettings.scheduleEnabled ? '#ecfdf5' : '#f1f5f9',
                            color: appSettings.scheduleEnabled ? '#047857' : '#475569',
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800
                          }}
                        >
                          {appSettings.scheduleEnabled ? 'جدولة نشطة ✅' : 'يدوي معتمد 👨‍🏫'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: NAFES STAGES MANAGEMENT */}
                {adminTab === 'nafesStages' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* بطاقة رأس القسم */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)',
                        color: '#fff',
                        borderRadius: 16,
                        padding: '16px 20px',
                        boxShadow: '0 4px 16px rgba(180, 83, 9, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 34 }}>🏆</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>
                            إدارة مراحل اختبار نافس الوطنية (المراحل 1 - 4)
                          </h3>
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#fef3c7' }}>
                            المعلم هو صاحب الصلاحية الرئيسية والوحيدة لفتح كل مرحلة أو إغلاقها. لا يمكن للطالب دخول أي مرحلة مقفلة.
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn green"
                          style={{ fontSize: 13, padding: '7px 14px', fontWeight: 800 }}
                          onClick={() => handleSetAllNafesStages(true)}
                        >
                          🔓 فتح جميع مراحل نافس (1 - 4)
                        </button>
                        <button
                          type="button"
                          className="btn coral"
                          style={{ fontSize: 13, padding: '7px 14px', fontWeight: 800 }}
                          onClick={() => handleSetAllNafesStages(false)}
                        >
                          🔒 إغلاق جميع مراحل نافس
                        </button>
                      </div>
                    </div>

                    {/* شبكة بطاقات المراحل الـ 4 */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 14
                      }}
                    >
                      {NAFES_STAGES.map((stage, idx) => {
                        const stageNum = (idx + 1) as 1 | 2 | 3 | 4;
                        const key = stageNum === 1 ? 'nafesStage1Open' : stageNum === 2 ? 'nafesStage2Open' : stageNum === 3 ? 'nafesStage3Open' : 'nafesStage4Open';
                        const isOpen = stageNum === 1 ? appSettings.nafesStage1Open !== false : Boolean(appSettings[key]);
                        const completedStudentsCount = leaderboardStudents.filter(
                          s => s.completedNafesStages && s.completedNafesStages.includes(stage.id)
                        ).length;

                        return (
                          <div
                            key={stage.id}
                            style={{
                              background: '#ffffff',
                              border: `2px solid ${isOpen ? '#22c55e' : '#fca5a5'}`,
                              borderRadius: 14,
                              padding: '16px',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: 12
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span
                                  style={{
                                    background: isOpen ? '#dcfce7' : '#fee2e2',
                                    color: isOpen ? '#15803d' : '#991b1b',
                                    fontSize: 11,
                                    fontWeight: 900,
                                    padding: '3px 10px',
                                    borderRadius: 999
                                  }}
                                >
                                  {isOpen ? 'مفتوحة للطلاب ✅' : 'مقفلة بقرار المعلم 🔒'}
                                </span>
                                <small style={{ color: '#64748b', fontWeight: 700 }}>
                                  المرحلة {stageNum} من 4
                                </small>
                              </div>

                              <h4 style={{ margin: '0 0 6px', fontSize: 16, color: '#1e293b' }}>
                                {stage.title}
                              </h4>
                              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
                                📖 {stage.passage.title} — (32 سؤالاً: 10 فهم + 10 قواعد + 10 صح/خطأ + 2 مقالي)
                              </p>

                              <div
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  fontSize: 12,
                                  color: '#334155',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between'
                                }}
                              >
                                <span>👥 ملخص إنجاز الطلاب:</span>
                                <b style={{ color: '#0f766e' }}>{completedStudentsCount} طالب أتموا هذه المرحلة</b>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                              <button
                                type="button"
                                className={`btn ${isOpen ? 'light' : 'green'}`}
                                style={{ flex: 1, fontSize: 12, padding: '7px 10px', fontWeight: 800 }}
                                onClick={() => handleToggleNafesStage(stageNum, true)}
                                disabled={isOpen}
                              >
                                🔓 فتح المرحلة
                              </button>
                              <button
                                type="button"
                                className={`btn ${!isOpen ? 'light' : 'coral'}`}
                                style={{ flex: 1, fontSize: 12, padding: '7px 10px', fontWeight: 800 }}
                                onClick={() => handleToggleNafesStage(stageNum, false)}
                                disabled={!isOpen}
                              >
                                🔒 إغلاق المرحلة
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB: STUDENT STATISTICS AND ACTIVITY DASHBOARD */}
                {adminTab === 'studentStats' && (
                  <div style={{ marginBottom: 20 }}>
                    <StudentStatsManager
                      students={leaderboardStudents}
                      isTeacherAdmin={isTeacherAdmin}
                      onRefresh={() => {
                        showNotice('تم تحديث بيانات ونشاط الطلاب بنجاح.');
                      }}
                    />
                  </div>
                )}

                {/* TAB 1: STUDENTS & LEADERBOARD MANAGEMENT */}
                {adminTab === 'students' && (
                  <div>
                    <p className="sub">
                      تحكم في نقاط الطلاب، أو تصفير العداد للجميع أو لكل طالب بمفرده، أو افتح لهم المرحلة التالية في نافس، أو أوقف/فعّل صلاحية أي طالب:
                    </p>

                    {/* شريط الإجراءات السريعة للتحكم بنقاط الطلاب وتصفير العداد للجميع */}
                    <div
                      style={{
                        background: '#fff1f2',
                        border: '1.5px solid #fecdd3',
                        borderRadius: 12,
                        padding: '10px 14px',
                        marginBottom: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>⚡</span>
                        <div>
                          <strong style={{ fontSize: 13.5, color: '#9f1239', display: 'block' }}>
                            التحكم في نقاط الطلاب وتصفير العداد:
                          </strong>
                          <span style={{ fontSize: 12, color: '#be123c' }}>
                            يمكنك تصفير عداد النقاط لجميع الطلاب دفعة واحدة، أو تصفير نقاط كل طالب لوحده من جدول الفرسان بالأسفل.
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn"
                        style={{
                          background: '#e11d48',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 12,
                          padding: '7px 16px',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(225, 29, 72, 0.25)'
                        }}
                        onClick={handleAdminResetAllStudentsPoints}
                        title="تصفير عداد النقاط لجميع الطلاب دفعة واحدة لتصبح 0⭐"
                      >
                        🔄 تصفير العداد للجميع (0⭐)
                      </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: 13
                        }}
                      >
                        <thead>
                          <tr style={{ background: '#eef7f5', textAlign: 'right' }}>
                            <th style={{ padding: 8 }}>#</th>
                            <th style={{ padding: 8 }}>الطالب</th>
                            <th style={{ padding: 8 }}>الفصل</th>
                            <th style={{ padding: 8 }}>كلمة السر (الرمز)</th>
                            <th style={{ padding: 8 }}>النقاط</th>
                            <th style={{ padding: 8 }}>مرحلة نافس</th>
                            <th style={{ padding: 8 }}>يوم التحدي</th>
                            <th style={{ padding: 8 }}>الحالة</th>
                            <th style={{ padding: 8 }}>إجراءات المعلم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardStudents.map((st, idx) => (
                            <tr key={st.profileId} style={{ borderBottom: '1px solid #e5efed' }}>
                              <td style={{ padding: 8, fontWeight: 800 }}>{idx + 1}</td>
                              <td style={{ padding: 8, fontWeight: 800 }}>
                                {inlineEditStudentId === st.profileId ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                      type="text"
                                      value={inlineEditNameInput}
                                      onChange={e => setInlineEditNameInput(e.target.value)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 8,
                                        border: '1.5px solid #11666c',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        width: '130px',
                                        background: '#fff'
                                      }}
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') handleAdminEditStudentName(st, inlineEditNameInput);
                                        if (e.key === 'Escape') setInlineEditStudentId(null);
                                      }}
                                    />
                                    <button
                                      className="btn green"
                                      style={{ padding: '3px 7px', fontSize: 11 }}
                                      onClick={() => handleAdminEditStudentName(st, inlineEditNameInput)}
                                      title="حفظ الاسم الجديد"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn light"
                                      style={{ padding: '3px 7px', fontSize: 11 }}
                                      onClick={() => setInlineEditStudentId(null)}
                                      title="إلغاء التعديل"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>{st.name}</span>
                                    <button
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 2,
                                        fontSize: 13,
                                        color: '#0284c7'
                                      }}
                                      onClick={() => {
                                        setInlineEditStudentId(st.profileId);
                                        setInlineEditNameInput(st.name);
                                      }}
                                      title="تعديل اسم الطالب سريعاً"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: 8 }}>{st.cls}</td>
                              <td style={{ padding: 8 }}>
                                <span
                                  style={{
                                    background: '#f1f5f9',
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    letterSpacing: '1px'
                                  }}
                                  title="كلمة السر ورمز الدخول الخاص بالطالب"
                                >
                                  🔑 {st.code}
                                </span>
                              </td>
                              <td style={{ padding: 8, fontWeight: 800, color: '#197a56' }}>
                                {st.points}
                              </td>
                              <td style={{ padding: 8 }}>المرحلة {st.nafesStageIndex + 1}</td>
                              <td style={{ padding: 8 }}>اليوم {st.dailyCurrentIndex + 1}</td>
                              <td style={{ padding: 8 }}>
                                {st.isBlocked ? (
                                  <span style={{ color: '#b4232c', fontWeight: 800 }}>موقوف</span>
                                ) : (
                                  <span style={{ color: '#197a56', fontWeight: 800 }}>نشط</span>
                                )}
                              </td>
                              <td style={{ padding: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                <button
                                  className="btn"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: 11,
                                    background: '#f0fdf4',
                                    color: '#15803d',
                                    border: '1px solid #bbf7d0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    fontWeight: 700
                                  }}
                                  onClick={() => {
                                    setStudentToEditName(st);
                                    setEditNameInput(st.name);
                                    setEditCodeInput(st.code || '1234');
                                  }}
                                  title="تعديل اسم الطالب وكلمة السر"
                                >
                                  ✏️ تعديل الاسم وكلمة السر
                                </button>
                                <button
                                  className="btn green"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() =>
                                    handleAdminModifyStudent(st, { points: st.points + 20 })
                                  }
                                >
                                  +20 نقطة
                                </button>
                                <button
                                  className="btn"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: 11,
                                    background: '#fff1f2',
                                    color: '#be123c',
                                    border: '1px solid #fecdd3',
                                    fontWeight: 700
                                  }}
                                  onClick={() => handleAdminResetStudentPoints(st)}
                                  title={`تصفير وحذف نقاط الطالب ${st.name} لتصبح 0⭐`}
                                >
                                  🔄 تصفير النقاط (0⭐)
                                </button>
                                <button
                                  className="btn gold"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() =>
                                    handleAdminModifyStudent(st, {
                                      dailyCurrentIndex: st.dailyCurrentIndex + 1,
                                      dailyNextUnlockMs: 0
                                    })
                                  }
                                >
                                  فتح تحدي الغد
                                </button>
                                <button
                                  className="btn blue"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() =>
                                    handleAdminModifyStudent(st, {
                                      nafesStageIndex: Math.min(
                                        NAFES_STAGES.length - 1,
                                        st.nafesStageIndex + 1
                                      )
                                    })
                                  }
                                >
                                  ترقية مرحلة نافس
                                </button>
                                <button
                                  className="btn coral"
                                  style={{ padding: '4px 8px', fontSize: 11 }}
                                  onClick={() =>
                                    handleAdminModifyStudent(st, { isBlocked: !st.isBlocked })
                                  }
                                >
                                  {st.isBlocked ? 'تفعيل' : 'إيقاف'}
                                </button>
                                <button
                                  className="btn"
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: 11,
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5'
                                  }}
                                  onClick={() => setStudentToDelete(st)}
                                  title="حذف ملف الطالب نهائياً من قاعدة البيانات"
                                >
                                  🗑️ حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* EDIT STUDENT NAME & PASSWORD MODAL / BANNER */}
                    {studentToEditName && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 16,
                          background: '#f0fdf4',
                          border: '2px solid #86efac',
                          borderRadius: 14,
                          boxShadow: '0 4px 14px rgba(22, 101, 52, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <span style={{ fontSize: 26 }}>✏️🔑</span>
                          <div>
                            <h4 style={{ margin: 0, color: '#166534', fontSize: 16 }}>
                              تعديل اسم الطالب وكلمة السر في لوحة التحكم
                            </h4>
                            <p style={{ margin: '3px 0 0', color: '#14532d', fontSize: 13 }}>
                              يمكنك كمعلم تعديل اسم الطالب <strong>«{studentToEditName.name}»</strong> أو تعيين كلمة سر جديدة (رمز سري من 4 أرقام). سيتم التحديث فوراً في قاعدة البيانات السحابية ومضمار السباق.
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                              👤 اسم الطالب الجديد:
                            </label>
                            <input
                              type="text"
                              value={editNameInput}
                              onChange={e => setEditNameInput(e.target.value)}
                              placeholder="اكتب اسم الطالب الجديد..."
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #22c55e',
                                fontSize: 14,
                                fontWeight: 700,
                                background: '#fff'
                              }}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAdminEditStudentCredentials(studentToEditName, editNameInput, editCodeInput);
                                if (e.key === 'Escape') setStudentToEditName(null);
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 4 }}>
                              🔑 كلمة السر / الرمز السري (4 أرقام):
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={editCodeInput}
                              onChange={e => setEditCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="مثال: 1234"
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1.5px solid #22c55e',
                                fontSize: 14,
                                fontWeight: 700,
                                background: '#fff',
                                letterSpacing: '2px',
                                fontFamily: 'monospace'
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleAdminEditStudentCredentials(studentToEditName, editNameInput, editCodeInput);
                                if (e.key === 'Escape') setStudentToEditName(null);
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                          <button
                            className="btn green"
                            style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}
                            onClick={() => handleAdminEditStudentCredentials(studentToEditName, editNameInput, editCodeInput)}
                          >
                            💾 حفظ التعديلات (الاسم وكلمة السر)
                          </button>
                          <button
                            className="btn light"
                            style={{ padding: '8px 16px', fontSize: 13 }}
                            onClick={() => setStudentToEditName(null)}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONFIRM DELETE STUDENT MODAL / BANNER */}
                    {studentToDelete && (
                      <div
                        style={{
                          marginTop: 16,
                          padding: 16,
                          background: '#fff1f2',
                          border: '2px solid #fda4af',
                          borderRadius: 14,
                          boxShadow: '0 4px 12px rgba(225, 29, 72, 0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 24 }}>⚠️</span>
                          <div>
                            <h4 style={{ margin: 0, color: '#9f1239', fontSize: 16 }}>
                              تأكيد حذف ملف الطالب نهائياً
                            </h4>
                            <p style={{ margin: '4px 0 0', color: '#881337', fontSize: 13 }}>
                              هل أنت متأكد من رغبتك في حذف ملف الطالب <strong>«{studentToDelete.name}»</strong> (فصل: {studentToDelete.cls}، رصيد النقاط: {studentToDelete.points})؟
                              <br />
                              <span style={{ fontSize: 12, color: '#e11d48' }}>
                                ⚠️ سيتم مسح سجله ونقاطه نهائياً من قاعدة البيانات السحابية ولوحة الصدارة فوراً.
                              </span>
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                          <button
                            className="btn light"
                            style={{ padding: '7px 16px', fontSize: 13 }}
                            onClick={() => setStudentToDelete(null)}
                          >
                            إلغاء التراجع
                          </button>
                          <button
                            className="btn"
                            style={{
                              padding: '7px 18px',
                              fontSize: 13,
                              background: '#e11d48',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 800
                            }}
                            onClick={() => handleAdminDeleteStudent(studentToDelete)}
                          >
                            🗑️ نعم، احذف الملف نهائياً
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ADD & MANAGE DAILY CHALLENGES */}
                {adminTab === 'challenges' && (
                  <div>
                    <div
                      style={{
                        background: '#f7fbfa',
                        border: '1px solid #d4eae6',
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 16
                      }}
                    >
                      <h4 style={{ margin: '0 0 10px', color: 'var(--t)' }}>
                        ➕ إضافة سؤال تحدٍّ جديد إلى قاعدة البيانات
                      </h4>
                      <div className="grid">
                        <div className="field">
                          <label>رقم اليوم في السلسلة</label>
                          <input
                            type="number"
                            value={newChDay}
                            onChange={e => setNewChDay(Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>مستوى الصعوبة</label>
                          <select
                            value={newChLevel}
                            onChange={e =>
                              setNewChLevel(e.target.value as DailyChallengeItem['level'])
                            }
                          >
                            <option value="سهل">سهل</option>
                            <option value="متوسط">متوسط</option>
                            <option value="صعب">صعب</option>
                            <option value="صعب جدًا">صعب جدًا</option>
                            <option value="تحدي العباقرة (صعب جدًا+)">
                              تحدي العباقرة (صعب جدًا+)
                            </option>
                          </select>
                        </div>
                        <div className="field">
                          <label>النقاط الممنوحة</label>
                          <input
                            type="number"
                            value={newChPoints}
                            onChange={e => setNewChPoints(Number(e.target.value))}
                          />
                        </div>
                        <div className="field">
                          <label>الوحدة والدرس المرتبط</label>
                          <input
                            value={newChTopic}
                            onChange={e => setNewChTopic(e.target.value)}
                            placeholder="مثال: الوحدة الثانية — الأفعال الناسخة"
                          />
                        </div>
                        <div className="field" style={{ gridColumn: '1/-1' }}>
                          <label>نص سؤال التحدي</label>
                          <input
                            value={newChQuestion}
                            onChange={e => setNewChQuestion(e.target.value)}
                            placeholder="اكتب السؤال الصعب هنا..."
                          />
                        </div>
                        <div className="field">
                          <label>الخيار (أ)</label>
                          <input value={newChOpt0} onChange={e => setNewChOpt0(e.target.value)} />
                        </div>
                        <div className="field">
                          <label>الخيار (ب)</label>
                          <input value={newChOpt1} onChange={e => setNewChOpt1(e.target.value)} />
                        </div>
                        <div className="field">
                          <label>الخيار (ج)</label>
                          <input value={newChOpt2} onChange={e => setNewChOpt2(e.target.value)} />
                        </div>
                        <div className="field">
                          <label>الخيار (د)</label>
                          <input value={newChOpt3} onChange={e => setNewChOpt3(e.target.value)} />
                        </div>
                        <div className="field">
                          <label>الخيار الصحيح</label>
                          <select
                            value={newChAnswer}
                            onChange={e => setNewChAnswer(Number(e.target.value))}
                          >
                            <option value={0}>أ (الخيار الأول)</option>
                            <option value={1}>ب (الخيار الثاني)</option>
                            <option value={2}>ج (الخيار الثالث)</option>
                            <option value={3}>د (الخيار الرابع)</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>شرح القاعدة والتغذية الراجعة</label>
                          <input
                            value={newChExplain}
                            onChange={e => setNewChExplain(e.target.value)}
                            placeholder="تفسير الإجابة الصحيحة..."
                          />
                        </div>
                      </div>
                      <div className="actions">
                        <button className="btn green" onClick={handleAddCustomChallenge}>
                          💾 حفظ وإضافة التحدي لقاعدة البيانات
                        </button>
                      </div>
                    </div>

                    <h4>📋 قائمة التحديات المضافة من المعلم ({customChallenges.length}):</h4>
                    {customChallenges.length === 0 ? (
                      <div className="note">
                        تعمل حاليًا التحديات العشرة الأساسية المتدرجة، وأي تحدٍّ تضيفه هنا سيظهر للطلاب مباشرة.
                      </div>
                    ) : (
                      customChallenges.map(c => (
                        <div key={c.docId} className="commonCard" style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <b>
                              اليوم {c.day} ({c.level} — +{c.points} نقطة): {c.question}
                            </b>
                            <button
                              className="btn coral"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => handleDeleteCustomChallenge(c.docId)}
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: APP SETTINGS & PERMISSIONS */}
                {adminTab === 'settings' && (
                  <div className="grid">
                    <div className="field" style={{ gridColumn: '1/-1' }}>
                      <label>📣 رسالة المعلم والتوجيهات في أعلى التطبيق للطلاب</label>
                      <input
                        value={appSettings.announcement}
                        onChange={e =>
                          setAppSettings(s => ({ ...s, announcement: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label>🔒 قفل سؤال التحدي التالي لمدة 24 ساعة بعد الحل</label>
                      <select
                        value={appSettings.enforce24hChallengeLock ? 'yes' : 'no'}
                        onChange={e =>
                          setAppSettings(s => ({
                            ...s,
                            enforce24hChallengeLock: e.target.value === 'yes'
                          }))
                        }
                      >
                        <option value="yes">مفعّل (لا يفتح التالي إلا بعد 24 ساعة من الحل)</option>
                        <option value="no">مفتوح (السماح بالانتقال الفوري)</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>🏆 صلاحية دخول اختبارات نافس</label>
                      <select
                        value={appSettings.enableNafes ? 'yes' : 'no'}
                        onChange={e =>
                          setAppSettings(s => ({ ...s, enableNafes: e.target.value === 'yes' }))
                        }
                      >
                        <option value="yes">متاح لجميع الطلاب</option>
                        <option value="no">مغلق مؤقتًا</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>🎮 صلاحية مركز الألعاب اللغوية</label>
                      <select
                        value={appSettings.enableGames ? 'yes' : 'no'}
                        onChange={e =>
                          setAppSettings(s => ({ ...s, enableGames: e.target.value === 'yes' }))
                        }
                      >
                        <option value="yes">متاح لجميع الطلاب</option>
                        <option value="no">مغلق مؤقتًا</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>🔑 رمز الدخول السريع للمعلم (PIN)</label>
                      <input
                        value={appSettings.adminPin}
                        maxLength={12}
                        onChange={e => setAppSettings(s => ({ ...s, adminPin: e.target.value }))}
                      />
                    </div>
                    {/* لوحة تحكم المعلم في إقفال وفتح الوحدات الدراسية (الوحدات 1، 2، 3) */}
                    <div
                      style={{
                        gridColumn: '1/-1',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)',
                        border: '2px solid #16a34a',
                        borderRadius: 16,
                        padding: '18px 20px',
                        boxShadow: '0 4px 18px rgba(22, 163, 74, 0.12)',
                        marginTop: 10
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 12,
                          marginBottom: 16
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 34 }}>🔐</span>
                          <div>
                            <h3 style={{ margin: 0, color: '#166534', fontSize: 18, fontWeight: 800 }}>
                              لوحة تحكم المعلم في إقفال وفتح الوحدات الدراسية (الدروس والاختبارات والتحديات)
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#14532d' }}>
                              تحكّم مباشر في إتاحة الوحدات للطلاب. الافتراضي: إقفال الوحدتين الثانية والثالثة حتى تأذن بفتحهما.
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn coral"
                            style={{ fontSize: 12, padding: '7px 14px', fontWeight: 700 }}
                            onClick={() => {
                              const updated: AppSettings = {
                                ...appSettings,
                                unit1Open: true,
                                unit2Open: false,
                                unit3Open: false,
                                orderUnit1Open: true,
                                orderUnit2Open: false,
                                orderUnit3Open: false,
                                orderUnlockAll: false
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice('🔒 تم إقفال الوحدتين الثانية والثالثة حتى إذن المعلم بفتحهما.');
                            }}
                          >
                            🔒 إقفال الوحدة 2 و 3 (الافتراضي)
                          </button>
                          <button
                            type="button"
                            className="btn purple"
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => {
                              const updated: AppSettings = {
                                ...appSettings,
                                unit2Open: true,
                                orderUnit2Open: true
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice('🔓 تم الإذن بفتح الوحدة الثانية (الأعلام) للطلاب بنجاح!');
                            }}
                          >
                            🔓 الإذن بفتح الوحدة 2 (الأعلام)
                          </button>
                          <button
                            type="button"
                            className="btn blue"
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => {
                              const updated: AppSettings = {
                                ...appSettings,
                                unit3Open: true,
                                orderUnit3Open: true
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice('🔓 تم الإذن بفتح الوحدة الثالثة (وطني) للطلاب بنجاح!');
                            }}
                          >
                            🔓 الإذن بفتح الوحدة 3 (وطني)
                          </button>
                          <button
                            type="button"
                            className="btn green"
                            style={{ fontSize: 12, padding: '7px 14px' }}
                            onClick={() => {
                              const updated: AppSettings = {
                                ...appSettings,
                                unit1Open: true,
                                unit2Open: true,
                                unit3Open: true,
                                orderUnit1Open: true,
                                orderUnit2Open: true,
                                orderUnit3Open: true,
                                orderUnlockAll: true
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice('🔓 تم فتح جميع الوحدات الثلاث لجميع الطلاب فوراً!');
                            }}
                          >
                            🔓 فتح كل الوحدات (1 و 2 و 3) للجميع
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 14
                        }}
                      >
                        {/* Unit 1 */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #86efac',
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>🕌</span>
                              <div>
                                <b style={{ color: '#15803d', fontSize: 15 }}>الوحدة 1: القيم الإسلامية</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  دروس وقواعد وتحديات الوحدة الأولى
                                </span>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534' }}>
                              {appSettings.unit1Open !== false ? 'مفتوحة ✅' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة الوحدة:
                          </label>
                          <select
                            value={appSettings.unit1Open !== false ? 'open' : 'closed'}
                            onChange={e => {
                              const isOpen = e.target.value === 'open';
                              const updated: AppSettings = {
                                ...appSettings,
                                unit1Open: isOpen,
                                orderUnit1Open: isOpen
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                            }}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="open">✅ مفتوحة ومتاحة لجميع الطلاب (الافتراضي)</option>
                            <option value="closed">🔒 مغلقة مؤقتاً بقرار المعلم</option>
                          </select>
                        </div>

                        {/* Unit 2 */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.unit2Open ? '#c084fc' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>📚</span>
                              <div>
                                <b style={{ color: '#7e22ce', fontSize: 15 }}>الوحدة 2: الأعلام</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  دروس وقواعد وتحديات الوحدة الثانية
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.unit2Open ? '#f3e8ff' : '#fee2e2',
                                color: appSettings.unit2Open ? '#6b21a8' : '#991b1b'
                              }}
                            >
                              {appSettings.unit2Open ? 'مفتوحة بإذن المعلم 🔓' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة الوحدة:
                          </label>
                          <select
                            value={appSettings.unit2Open ? 'open' : 'closed'}
                            onChange={e => {
                              const isOpen = e.target.value === 'open';
                              const updated: AppSettings = {
                                ...appSettings,
                                unit2Open: isOpen,
                                orderUnit2Open: isOpen,
                                orderUnlockAll: false
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice(
                                isOpen
                                  ? '🔓 تم فتح الوحدة الثانية للطلاب بنجاح!'
                                  : '🔒 تم إقفال الوحدة الثانية حتى إذن المعلم بفتحها.'
                              );
                            }}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="closed">
                              🔒 مقفلة حتى يأذن المعلم بفتحها (الافتراضي المطلوب)
                            </option>
                            <option value="open">
                              🔓 مأذون بفتحها ومتاحة لجميع الطلاب
                            </option>
                          </select>
                        </div>

                        {/* Unit 3 */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.unit3Open ? '#93c5fd' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>🇸🇦</span>
                              <div>
                                <b style={{ color: '#1d4ed8', fontSize: 15 }}>الوحدة 3: وطني</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  دروس وقواعد وتحديات الوحدة الثالثة
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.unit3Open ? '#dbeafe' : '#fee2e2',
                                color: appSettings.unit3Open ? '#1e40af' : '#991b1b'
                              }}
                            >
                              {appSettings.unit3Open ? 'مفتوحة بإذن المعلم 🔓' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة الوحدة:
                          </label>
                          <select
                            value={appSettings.unit3Open ? 'open' : 'closed'}
                            onChange={e => {
                              const isOpen = e.target.value === 'open';
                              const updated: AppSettings = {
                                ...appSettings,
                                unit3Open: isOpen,
                                orderUnit3Open: isOpen,
                                orderUnlockAll: false
                              };
                              setAppSettings(updated);
                              handleSaveSettingsToCloud(updated);
                              showNotice(
                                isOpen
                                  ? '🔓 تم فتح الوحدة الثالثة للطلاب بنجاح!'
                                  : '🔒 تم إقفال الوحدة الثالثة حتى إذن المعلم بفتحها.'
                              );
                            }}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="closed">
                              🔒 مقفلة حتى يأذن المعلم بفتحها (الافتراضي المطلوب)
                            </option>
                            <option value="open">
                              🔓 مأذون بفتحها ومتاحة لجميع الطلاب
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* لوحة تحكم المعلم في إقفال وفتح ألعاب مركز الألعاب اللغوية */}
                    <div
                      style={{
                        gridColumn: '1/-1',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #fdf4ff 100%)',
                        border: '2px solid #8b5cf6',
                        borderRadius: 16,
                        padding: '18px 20px',
                        boxShadow: '0 4px 18px rgba(139, 92, 246, 0.12)',
                        marginTop: 14
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: 12,
                          marginBottom: 16
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 34 }}>🎮</span>
                          <div>
                            <h3 style={{ margin: 0, color: '#5b21b6', fontSize: 18, fontWeight: 800 }}>
                              لوحة تحكم المعلم في قفل وفتح ألعاب مركز الألعاب (الألعاب الـ 4)
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b21a8' }}>
                              تحكّم مباشر في قفل الأسئلة أو فتحها أمام كل لعبة. لا يستطيع الطالب تجاوز القفل أبداً إلا إذا سمح المعلم بفتحها.
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn coral"
                            style={{ fontSize: 12, padding: '7px 14px', fontWeight: 700 }}
                            onClick={() => handleSetAllGames(false)}
                          >
                            🔒 إقفال جميع الألعاب (4 ألعاب)
                          </button>
                          <button
                            type="button"
                            className="btn green"
                            style={{ fontSize: 12, padding: '7px 14px', fontWeight: 700 }}
                            onClick={() => handleSetAllGames(true)}
                          >
                            🔓 فتح جميع الألعاب للطلاب
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 14
                        }}
                      >
                        {/* 1. المحقق اللغوي */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.gameDetectiveOpen !== false ? '#86efac' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>🔍</span>
                              <div>
                                <b style={{ color: '#0f766e', fontSize: 15 }}>1. المحقق اللغوي</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  اكتشاف الأخطاء وتصويبها في النصوص
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.gameDetectiveOpen !== false ? '#dcfce7' : '#fee2e2',
                                color: appSettings.gameDetectiveOpen !== false ? '#15803d' : '#991b1b'
                              }}
                            >
                              {appSettings.gameDetectiveOpen !== false ? 'مفتوحة ✅' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة اللعبة للطلاب:
                          </label>
                          <select
                            value={appSettings.gameDetectiveOpen !== false ? 'open' : 'closed'}
                            onChange={e => handleToggleGameByTeacher('detective', e.target.value === 'open')}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="open">✅ مفتوحة ومتاحة للطلاب</option>
                            <option value="closed">🔒 مقفلة بأمر المعلم (لا يمكن للطالب الدخول)</option>
                          </select>
                        </div>

                        {/* 2. سباق الترتيب وبناء الجمل */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.gameOrderOpen !== false ? '#c084fc' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>🧩</span>
                              <div>
                                <b style={{ color: '#7e22ce', fontSize: 15 }}>2. ركّب الجملة (الترتيب)</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  ترتيب الكلمات المبعثرة وصياغة التراكيب
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.gameOrderOpen !== false ? '#f3e8ff' : '#fee2e2',
                                color: appSettings.gameOrderOpen !== false ? '#6b21a8' : '#991b1b'
                              }}
                            >
                              {appSettings.gameOrderOpen !== false ? 'مفتوحة ✅' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة اللعبة للطلاب:
                          </label>
                          <select
                            value={appSettings.gameOrderOpen !== false ? 'open' : 'closed'}
                            onChange={e => handleToggleGameByTeacher('order', e.target.value === 'open')}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="open">✅ مفتوحة ومتاحة للطلاب</option>
                            <option value="closed">🔒 مقفلة بأمر المعلم (لا يمكن للطالب الدخول)</option>
                          </select>
                        </div>

                        {/* 3. معاني الكلمات والمفردات */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.gameMeaningOpen !== false ? '#93c5fd' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>🧠</span>
                              <div>
                                <b style={{ color: '#1d4ed8', fontSize: 15 }}>3. معنى الكلمة والمفردات</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  تحديد المعاني والترادفات والأضداد
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.gameMeaningOpen !== false ? '#dbeafe' : '#fee2e2',
                                color: appSettings.gameMeaningOpen !== false ? '#1e40af' : '#991b1b'
                              }}
                            >
                              {appSettings.gameMeaningOpen !== false ? 'مفتوحة ✅' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة اللعبة للطلاب:
                          </label>
                          <select
                            value={appSettings.gameMeaningOpen !== false ? 'open' : 'closed'}
                            onChange={e => handleToggleGameByTeacher('meaning', e.target.value === 'open')}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="open">✅ مفتوحة ومتاحة للطلاب</option>
                            <option value="closed">🔒 مقفلة بأمر المعلم (لا يمكن للطالب الدخول)</option>
                          </select>
                        </div>

                        {/* 4. تحدي السرعة اللغوي */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: `1.5px solid ${appSettings.gameSpeedOpen !== false ? '#fcd34d' : '#fca5a5'}`,
                            borderRadius: 12,
                            padding: '14px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 22 }}>⚡</span>
                              <div>
                                <b style={{ color: '#b45309', fontSize: 15 }}>4. تحدي السرعة اللغوي</b>
                                <span style={{ display: 'block', color: '#64748b', fontSize: 11 }}>
                                  أسئلة سريعة خاطفة خلال 30 ثانية
                                </span>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: appSettings.gameSpeedOpen !== false ? '#fef3c7' : '#fee2e2',
                                color: appSettings.gameSpeedOpen !== false ? '#92400e' : '#991b1b'
                              }}
                            >
                              {appSettings.gameSpeedOpen !== false ? 'مفتوحة ✅' : 'مقفلة 🔒'}
                            </span>
                          </div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                            إذن وحالة اللعبة للطلاب:
                          </label>
                          <select
                            value={appSettings.gameSpeedOpen !== false ? 'open' : 'closed'}
                            onChange={e => handleToggleGameByTeacher('speed', e.target.value === 'open')}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                          >
                            <option value="open">✅ مفتوحة ومتاحة للطلاب</option>
                            <option value="closed">🔒 مقفلة بأمر المعلم (لا يمكن للطالب الدخول)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* صندوق تحميل ملف الحزم الجاهزة ZIP (خاص بالمعلم فقط) */}
                    <div
                      style={{
                        gridColumn: '1/-1',
                        background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
                        border: '2px solid #6366f1',
                        borderRadius: 16,
                        padding: '18px 20px',
                        boxShadow: '0 4px 18px rgba(99, 102, 241, 0.1)',
                        marginTop: 10
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 12,
                          marginBottom: 12
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 32 }}>📦</span>
                          <div>
                            <h3 style={{ margin: 0, color: '#3730a3', fontSize: 17, fontWeight: 800 }}>
                              ملف الحزم الجاهزة (ZIP) ونشر الموقع المستقل (خاص بالمعلم فقط)
                            </h3>
                            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#4338ca' }}>
                              تم إغلاق وحجب هذا الخيار بالكامل عن الطلاب. يمكنك كمعلم تحميل ملف الحزمة الجاهزة لتشغيل المنصة أو رفعها برابط دائم عبر (Netlify Drop).
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <a
                            href="/initiative_web_app.zip"
                            download="initiative_web_app.zip"
                            className="btn purple"
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 16px',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: 13
                            }}
                          >
                            📦 تحميل ملف الحزمة الجاهزة (ZIP)
                          </a>
                        </div>
                      </div>

                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #c7d2fe',
                          borderRadius: 12,
                          padding: '12px 14px',
                          fontSize: 13,
                          lineHeight: '1.8',
                          color: '#312e81'
                        }}
                      >
                        <b>🚀 طريقة الرفع السريع برابط دائم مستقل للمعلم (Netlify Drop):</b>
                        <ol style={{ margin: '6px 0 0', paddingRight: 20 }}>
                          <li>اضغط زر <b>«تحميل ملف الحزمة الجاهزة (ZIP)»</b> أعلاه.</li>
                          <li>افتح الرابط: <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>app.netlify.com/drop</a> في متصفحك.</li>
                          <li>اسحب ملف الـ ZIP مباشرة إلى الصفحة، وستحصل فوراً على رابط دائم خاص بمبادرتك ينتهي بـ <code>.netlify.app</code>.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="actions" style={{ gridColumn: '1/-1' }}>
                      <button
                        className="btn green"
                        onClick={() => handleSaveSettingsToCloud(appSettings)}
                      >
                        💾 حفظ التحديثات والصلاحيات في قاعدة البيانات
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: STUDENT FEEDBACK AND NOTES (TEACHER PRIVATE INBOX) */}
                {adminTab === 'feedback' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <p className="sub" style={{ margin: 0 }}>
                        📥 صندوق رسائل الطلاب الخاص بالمعلم (خاص وسري - لا يظهر للطلاب):
                      </p>
                      <span className="pill" style={{ background: '#ecfdf5', color: '#065f46', fontSize: 12, padding: '4px 10px', borderRadius: 8 }}>
                        🔒 خاص بالمعلم فقط
                      </span>
                    </div>
                    {cloudFeedback.length === 0 ? (
                      <div className="note">لا توجد رسائل جديدة من الطلاب في قاعدة البيانات حتى الآن.</div>
                    ) : (
                      cloudFeedback.map((fb, i) => (
                        <div
                          key={fb.id || i}
                          className="feedback"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            background: '#f8fafc',
                            borderRadius: 10,
                            marginBottom: 8,
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <b style={{ color: '#1e293b' }}>
                                👤 الطالب: {fb.role}
                              </b>
                              {fb.cls && fb.cls !== 'بدون تحديد' && (
                                <span style={{ fontSize: 12, background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 6 }}>
                                  فصل {fb.cls}
                                </span>
                              )}
                              <small style={{ color: '#64748b', marginRight: 'auto' }}>
                                {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('ar-SA') : ''}
                              </small>
                            </div>
                            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
                              {fb.text}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: fb.status === 'تمت القراءة' ? '#059669' : '#d97706' }}>
                              الحالة: {fb.status || 'وارد جديد'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button
                              className={`btn ${
                                fb.status === 'تمت القراءة' ? 'light' : 'green'
                              }`}
                              style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                              onClick={() => handleToggleFeedbackApproval(fb)}
                            >
                              {fb.status === 'تمت القراءة' ? 'وضع كغير مقروء' : '✅ تم الإطلاع'}
                            </button>
                            <button
                              className="btn coral"
                              style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
                              onClick={() => handleDeleteFeedback(fb.id)}
                            >
                              🗑️ حذف
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: TEACHER ANNOUNCEMENTS MANAGER */}
                {adminTab === 'announcements' && (
                  <TeacherAnnouncementsManager
                    announcements={appSettings.tickerAnnouncements || []}
                    customSingleText={appSettings.tickerCustomText || ''}
                    onUpdateAnnouncements={(updated, single) => {
                      const newSettings: AppSettings = {
                        ...appSettings,
                        tickerAnnouncements: updated,
                        tickerCustomText: single !== undefined ? single : appSettings.tickerCustomText
                      };
                      setAppSettings(newSettings);
                      handleSaveSettingsToCloud(newSettings);
                    }}
                    onSaveToCloud={() => {
                      handleSaveSettingsToCloud(appSettings);
                      showNotice('✅ تم حفظ وتحديث نصوص شريط البث والتوجيهات في الخادم السحابي بنجاح!');
                    }}
                  />
                )}

                {/* TAB 6: PARENT MESSAGES SUITE */}
                {adminTab === 'parentMessages' && (
                  <TeacherMessagesManager
                    messages={parentMessages}
                    onReply={handleReplyParentMessage}
                    onMarkRead={handleMarkParentMessageRead}
                    onDelete={handleDeleteParentMessage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Remediation Clinic Modal (علاج الأخطاء) */}
      <div
        id="mistakesModal"
        className={`modal ${activeModal === 'mistakesModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog">
          <div className="head" style={{ background: 'linear-gradient(135deg,#b93b40,#e0565b)' }}>
            <h2>🩺 عيادة لغتي — تشخيص وعلاج الأخطاء</h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            <div className="tabRow">
              <button
                className={`btn ${mistakesTab === 'myMistakes' ? 'coral' : 'light'}`}
                onClick={() => setMistakesTab('myMistakes')}
              >
                📓 دفتر أخطائي ({studentMistakes.length})
              </button>
              <button
                className={`btn ${mistakesTab === 'commonMistakes' ? 'primary' : 'light'}`}
                onClick={() => setMistakesTab('commonMistakes')}
              >
                💡 الأخطاء اللغوية الشائعة وعلاجها
              </button>
            </div>

            {mistakesTab === 'myMistakes' ? (
              <div>
                <div className="quizMeta" style={{ background: '#fff5f5' }}>
                  <span>
                    📌 الأخطاء المتبقية: <b>{studentMistakes.length}</b>
                  </span>
                  <span>
                    ✅ أخطاء تمت معالجتها وإتقانها: <b>{currentProfile?.resolvedMistakesCount || 0}</b>
                  </span>
                </div>

                {studentMistakes.length > 0 ? (
                  <>
                    <p className="sub">
                      هذه الأسئلة أخطأت فيها سابقًا أثناء التدريبات. راجع الشرح العلاجي لكل سؤال، ثم اضغط على <b>«ابدأ جلسة العلاج»</b> لإعادة الإجابة عنها؛ وعند إجابتك بشكل صحيح ستختفي من قائمة الأخطاء وتكسب نقاطًا وشارة <b>«معالج الأخطاء»</b>!
                    </p>
                    <div className="actions" style={{ marginBottom: 16 }}>
                      <button className="btn green" onClick={startMyMistakesRemedialQuiz}>
                        🚀 ابدأ جلسة علاج أخطائي ({studentMistakes.length} أسئلة)
                      </button>
                    </div>
                    <div>
                      {studentMistakes.map((m, idx) => (
                        <div key={idx} className="mistakeItem">
                          <div className="mistakeMeta">
                            <span className="mistakeTag">{m.sourceTitle}</span>
                            <span>المستوى: {m.question[4] || 'متنوع'}</span>
                            <span>التاريخ: {m.timestamp}</span>
                          </div>
                          <h4>
                            {idx + 1}. {m.question[0]}
                          </h4>
                          <div style={{ fontSize: 14, color: '#b4383d', marginBottom: 4 }}>
                            ❌ إجابتك السابقة: «{m.question[1][m.wrongChoiceIndex]}»
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              color: '#1f7a58',
                              fontWeight: 700,
                              marginBottom: 6
                            }}
                          >
                            ✅ الصواب: «{m.question[1][m.question[2]]}»
                          </div>
                          <div className="explain" style={{ marginTop: 6 }}>
                            <b>💊 العلاج والقاعدة:</b> {m.question[3]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="score" style={{ background: '#f2fbf7' }}>
                    <strong style={{ fontSize: 42 }}>🎉 سجلّك خالٍ من الأخطاء!</strong>
                    <p>
                      أحسنت يا بطل! ليس لديك أي أخطاء متراكمة حاليًا. كلما أخطأت في سؤال أثناء حل الدروس أو الاختبارات، سيظهر هنا تلقائيًا لمساعدتك على معالجته.
                    </p>
                    <div className="actions" style={{ justifyContent: 'center' }}>
                      <button
                        className="btn primary"
                        onClick={() => setMistakesTab('commonMistakes')}
                      >
                        استعرض الأخطاء اللغوية الشائعة
                      </button>
                      <button className="btn green" onClick={startCommonMistakesQuiz}>
                        ابدأ تدريب الأخطاء الشائعة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="sub">
                  ملخص لأبرز الأخطاء الإملائية والنحوية الشائعة بين طلاب الصف الأول المتوسط مع القاعدة العلاجية لكل منها:
                </p>
                <div className="actions" style={{ marginBottom: 16 }}>
                  <button className="btn green" onClick={startCommonMistakesQuiz}>
                    📝 اختبر نفسك في علاج الأخطاء الشائعة (6 أسئلة)
                  </button>
                </div>
                {COMMON_MISTAKES_GUIDES.map((g, i) => (
                  <div key={i} className="commonCard">
                    <h4 style={{ margin: '0 0 8px', color: 'var(--t)' }}>📌 {g.title}</h4>
                    <div style={{ display: 'grid', gap: 6, fontSize: 14, marginBottom: 8 }}>
                      <div
                        style={{
                          background: '#fff0f2',
                          padding: '6px 10px',
                          borderRadius: 10,
                          color: '#9e2a35'
                        }}
                      >
                        <b>❌ خطأ شائع:</b> {g.wrong}
                      </div>
                      <div
                        style={{
                          background: '#e8f8f0',
                          padding: '6px 10px',
                          borderRadius: 10,
                          color: '#1b6b4a'
                        }}
                      >
                        <b>✅ الصواب:</b> {g.right}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--ink)' }}>
                      <b>💡 القاعدة العلاجية:</b> {g.rule}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <div
        id="profileModal"
        className={`modal ${activeModal === 'profileModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog">
          <div className="head">
            <h2>👤 ملف الطالب</h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            {profileMode === 'chooser' ? (
              <div id="chooser">
                {currentProfile && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                      border: '1.5px solid #fecaca',
                      borderRadius: 14,
                      padding: '12px 14px',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: 14 }}>
                        👤 الحساب النشط حالياً: {currentProfile.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 2 }}>
                        فصل: {currentProfile.cls} • النقاط: {currentProfile.points} ⭐ • كلمة السر/الرمز: 🔑 {currentProfile.code}
                      </div>
                    </div>
                    <button
                      className="btn"
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: 8
                      }}
                      onClick={handleStudentLogout}
                    >
                      🚪 تسجيل خروج الطالب
                    </button>
                  </div>
                )}
                <p>اختر ملفًا محفوظًا على هذا الجهاز، أو سجّل دخولك من جهاز آخر، أو أنشئ ملفًا جديدًا:</p>
                <div id="profiles" className="options">
                  {Object.keys(profiles).length > 0 ? (
                    Object.keys(profiles).map(id => {
                      const x = profiles[id];
                      return (
                        <button
                          key={id}
                          className={`option ${activeId === id ? 'ok' : ''}`}
                          onClick={() => {
                            setActiveId(id);
                            syncProfileToCloud(id, x);
                            setActiveModal(null);
                          }}
                        >
                          👤 {x.name} — الفصل {x.cls} — ⭐ {x.points} نقطة — 🏅 {x.badges.length} شارات
                        </button>
                      );
                    })
                  ) : (
                    <div className="note">لا توجد ملفات محفوظة محليًا على هذا المتصفح. يمكنك تسجيل الدخول باسمك ورمزك أو إنشاء ملف جديد.</div>
                  )}
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="btn green" onClick={() => setProfileMode('login')}>
                    📲 تسجيل دخول طالب من جهاز آخر (بالاسم والرمز)
                  </button>
                  <button className="btn primary" onClick={() => setProfileMode('create')}>
                    ➕ إنشاء ملف طالب جديد
                  </button>
                </div>
                <div className="note" style={{ marginTop: 12 }}>
                  ✨ جميع ملفات الطلاب ودرجاتهم ونقاطهم في سباق الفرسان متزامنة سحابيًا عبر قاعدة بيانات Firestore.
                </div>
              </div>
            ) : profileMode === 'login' ? (
              <div id="studentLogin">
                <p className="sub">
                  إذا كنت قد أنشأت ملفك مسبقًا من هاتف أو حاسوب آخر، اكتب اسمك ورمزك السري (4 أرقام) لتحميل درجاتك ونقاطك فورًا:
                </p>
                <div className="grid">
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label>اسم الطالب المسجل</label>
                    <input
                      placeholder="اكتب اسمك كما سجلته أول مرة..."
                      value={loginName}
                      onChange={e => setLoginName(e.target.value)}
                    />
                  </div>
                  <div className="field" style={{ gridColumn: '1/-1' }}>
                    <label>الرمز السري الخاص بك (4 أرقام)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="مثال: 1234"
                      value={loginPin}
                      onChange={e => setLoginPin(e.target.value)}
                    />
                  </div>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="btn green" onClick={handleStudentLoginFromAnyDevice}>
                    🚀 دخول وتحميل ملفي السحابي
                  </button>
                  <button className="btn light" onClick={() => setProfileMode('chooser')}>
                    رجوع
                  </button>
                </div>
              </div>
            ) : (
              <div id="create">
                <div className="grid">
                  <div className="field">
                    <label>اسم الطالب</label>
                    <input
                      maxLength={40}
                      placeholder="مثال: محمد أحمد"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>رمز الطالب من 4 أرقام</label>
                    <input
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>الصف</label>
                    <select>
                      <option>أول متوسط</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>الفصل</label>
                    <select value={newCls} onChange={e => setNewCls(e.target.value)}>
                      <option>أ</option>
                      <option>ب</option>
                      <option>ج</option>
                    </select>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn green" onClick={handleCreateProfile}>
                    حفظ الملف
                  </button>
                  <button className="btn light" onClick={() => setProfileMode('chooser')}>
                    رجوع
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Modal */}
      <div
        id="badgesModal"
        className={`modal ${activeModal === 'badgesModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog" style={{ maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          <div className="head" style={{ background: 'linear-gradient(135deg, #11666c 0%, #1e828a 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>🏆</span>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>خزانة الأوسمة والألقاب التحفيزية والرتب</h2>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                  ألقاب إتقان الوحدات، ألقاب التحديات والألعاب، ورتب فرسان لغتي الخالدة
                </div>
              </div>
            </div>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body" style={{ overflowY: 'auto', padding: '16px 20px' }}>
            {currentProfile ? (() => {
              const currentRank = getStudentRank(currentProfile.points);
              const pointsNeeded = currentRank.nextRankPoints
                ? Math.max(0, currentRank.nextRankPoints - currentProfile.points)
                : 0;
              const nextTierPercent = currentRank.nextRankPoints
                ? Math.min(100, Math.round((currentProfile.points / currentRank.nextRankPoints) * 100))
                : 100;

              const filteredTitles = MOTIVATIONAL_TITLES.filter(t => {
                if (titleCategoryFilter === 'الكل') return true;
                return t.category === titleCategoryFilter;
              });

              const earnedCount = MOTIVATIONAL_TITLES.filter(t =>
                hasEarnedTitle(t, currentProfile.badges, currentProfile.points, currentStudentIsLeader)
              ).length;

              return (
                <div>
                  {/* البطاقة العلوية لرتبة الفارس الحالية */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fffdf2 0%, #fef8db 100%)',
                      border: '2px solid #fde047',
                      borderRadius: 18,
                      padding: '16px 20px',
                      marginBottom: 16,
                      boxShadow: '0 4px 16px rgba(234, 179, 8, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            fontSize: 34,
                            width: 58,
                            height: 58,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            background: '#fff',
                            border: `2.5px solid ${currentRank.color}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                          }}
                        >
                          {currentRank.icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>
                              {currentProfile.name}
                            </span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '2px 8px',
                                borderRadius: 8,
                                border: '1px solid #fde68a'
                              }}
                            >
                              فصل {currentProfile.cls}
                            </span>
                            {currentStudentIsLeader && (
                              <span className="leadSeizedBadge">
                                🔥 انتزع الصدارة 🏆
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: currentRank.color, fontWeight: 800, marginTop: 3 }}>
                            الرتبة الحالية: {currentRank.title} (المستوى {currentRank.tier} من 6)
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#0d9488' }}>
                            ⭐ {currentProfile.points}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>مجموع النقاط</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#c026d3' }}>
                            🏅 {earnedCount}/{MOTIVATIONAL_TITLES.length}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>الألقاب المحرزة</div>
                        </div>
                      </div>
                    </div>

                    {/* شريط التقدم نحو الرتبة التالية */}
                    {currentRank.nextRankTitle && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #fde68a' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                          <span style={{ color: '#854d0e' }}>
                            التقدم نحو: <b>{currentRank.nextRankTitle}</b>
                          </span>
                          <span style={{ color: '#0d9488' }}>
                            {pointsNeeded > 0 ? `متبقي ${pointsNeeded} نقطة` : 'تم بلوغ الرتبة!'}
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#fef3c7', borderRadius: 999, overflow: 'hidden', border: '1px solid #fde047' }}>
                          <div
                            style={{
                              width: `${nextTierPercent}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                              borderRadius: 999,
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* وسام انتزع الصدارة التكريمي الحصري */}
                  {currentStudentIsLeader && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
                        border: '2px solid #ef4444',
                        borderRadius: 14,
                        padding: '12px 16px',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      <span style={{ fontSize: 32 }}>🔥</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#b91c1c' }}>
                          وسام «انتزع الصدارة» الاستثنائي 🏆
                        </div>
                        <div style={{ fontSize: 13, color: '#7f1d1d' }}>
                          مبارك يا بطل! لقد تفوقت نقاطك على الجميع وتربع جوادك في المركز الأول على قمة مضمار فرسان لغتي الخالدة.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* أزرار التبويب لتصنيفات الألقاب */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {(['الكل', 'وحدات المنهج', 'التحديات والألعاب', 'رتب النقاط', 'الصدارة'] as const).map(cat => {
                      const isActive = titleCategoryFilter === cat;
                      const count = MOTIVATIONAL_TITLES.filter(t => cat === 'الكل' || t.category === cat).length;
                      return (
                        <button
                          key={cat}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isActive ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                            background: isActive ? '#0f766e' : '#fff',
                            color: isActive ? '#fff' : '#334155',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setTitleCategoryFilter(cat)}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* شبكة بطاقات الألقاب التحفيزية */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: 12
                    }}
                  >
                    {filteredTitles.map(title => {
                      const isEarned = hasEarnedTitle(
                        title,
                        currentProfile.badges,
                        currentProfile.points,
                        currentStudentIsLeader
                      );

                      return (
                        <div
                          key={title.id}
                          style={{
                            background: title.bgGradient || '#fff',
                            border: isEarned ? `2px solid ${title.color}` : '1.5px dashed #cbd5e1',
                            borderRadius: 14,
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: isEarned
                              ? `0 4px 14px ${title.color}26`
                              : '0 2px 6px rgba(0,0,0,0.03)',
                            opacity: isEarned ? 1 : 0.82
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 26 }}>{title.icon}</span>
                                <div>
                                  <div style={{ fontSize: 14.5, fontWeight: 900, color: title.color }}>
                                    {title.name}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 10.5,
                                      padding: '1px 6px',
                                      borderRadius: 6,
                                      background: 'rgba(0,0,0,0.06)',
                                      color: '#475569',
                                      fontWeight: 600
                                    }}
                                  >
                                    {title.category}
                                  </span>
                                </div>
                              </div>
                              {isEarned ? (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: '1px solid #bbf7d0',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  ✅ نلت اللقب
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    border: '1px solid #e2e8f0',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  🔒 لم يُحرز بعد
                                </span>
                              )}
                            </div>

                            <p style={{ margin: '4px 0 8px', fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
                              {title.description}
                            </p>
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: '1px solid rgba(0,0,0,0.07)',
                              fontSize: 11.5,
                              color: isEarned ? '#15803d' : '#64748b',
                              fontWeight: 600
                            }}
                          >
                            <b>📌 شرط الاستحقاق: </b>
                            <span>{title.requirement}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : (
              <div className="note" style={{ textAlign: 'center', padding: 24 }}>
                يرجى اختيار أو إنشاء ملف طالب أولًا للاطلاع على رتبتك وسجل الألقاب المحرزة.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson Modal (الدروس والاختبار الشامل لكل وحدة) */}
      <div
        id="lessonModal"
        className={`modal ${activeModal === 'lessonModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog">
          <div
            className="head"
            style={{
              background:
                selectedUnit === 1
                  ? 'linear-gradient(135deg,#126b70,#299d82)'
                  : selectedUnit === 2
                  ? 'linear-gradient(135deg,#7142b9,#9562dc)'
                  : 'linear-gradient(135deg,#2377b8,#3d96dd)'
            }}
          >
            <h2>
              📚 {selectedUnit === 1 ? 'الوحدة الأولى: القيم الإسلامية' : selectedUnit === 2 ? 'الوحدة الثانية: الأعلام' : 'الوحدة الثالثة: وطني'} — الدروس والتقويم
            </h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            {/* Quick Unit Tabs inside Modal */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className={`btn ${selectedUnit === 1 ? 'green' : 'light'}`}
                style={{ padding: '6px 14px', fontSize: 13 }}
                onClick={() => setSelectedUnit(1)}
              >
                🕌 الوحدة 1: القيم الإسلامية {appSettings.unit1Open !== false ? '✅' : '🔒'}
              </button>
              <button
                className={`btn ${selectedUnit === 2 ? 'purple' : 'light'}`}
                style={{ padding: '6px 14px', fontSize: 13 }}
                onClick={() => setSelectedUnit(2)}
              >
                📚 الوحدة 2: الأعلام {appSettings.unit2Open ? '🔓' : '🔒 (مقفلة)'}
              </button>
              <button
                className={`btn ${selectedUnit === 3 ? 'blue' : 'light'}`}
                style={{ padding: '6px 14px', fontSize: 13 }}
                onClick={() => setSelectedUnit(3)}
              >
                🇸🇦 الوحدة 3: وطني {appSettings.unit3Open ? '🔓' : '🔒 (مقفلة)'}
              </button>

              {isTeacherAdmin && (
                <div style={{ marginRight: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                    تحكم المعلم:
                  </span>
                  {selectedUnit === 1 && (
                    <button
                      className={`btn ${appSettings.unit1Open !== false ? 'light' : 'green'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => handleToggleUnitByTeacher(1, appSettings.unit1Open === false)}
                    >
                      {appSettings.unit1Open !== false ? '🔒 إقفال الوحدة 1 للطلاب' : '🔓 إذن بفتح الوحدة 1 للطلاب'}
                    </button>
                  )}
                  {selectedUnit === 2 && (
                    <button
                      className={`btn ${appSettings.unit2Open ? 'light' : 'green'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => handleToggleUnitByTeacher(2, !appSettings.unit2Open)}
                    >
                      {appSettings.unit2Open ? '🔒 إقفال الوحدة 2 للطلاب' : '🔓 إذن بفتح الوحدة 2 للطلاب'}
                    </button>
                  )}
                  {selectedUnit === 3 && (
                    <button
                      className={`btn ${appSettings.unit3Open ? 'light' : 'green'}`}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => handleToggleUnitByTeacher(3, !appSettings.unit3Open)}
                    >
                      {appSettings.unit3Open ? '🔒 إقفال الوحدة 3 للطلاب' : '🔓 إذن بفتح الوحدة 3 للطلاب'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {(() => {
              const lockStatus = isCurriculumUnitUnlocked(selectedUnit, appSettings, isTeacherAdmin);
              if (!lockStatus.unlocked) {
                return (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '44px 20px',
                      background: '#ffffff',
                      borderRadius: 18,
                      border: '2px dashed #fca5a5',
                      boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)'
                    }}
                  >
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🔒</div>
                    <h3 style={{ fontSize: 22, color: '#991b1b', margin: '0 0 10px' }}>
                      {selectedUnit === 1
                        ? 'الوحدة الأولى (القيم الإسلامية) مقفلة حالياً'
                        : selectedUnit === 2
                        ? 'الوحدة الثانية (الأعلام) مقفلة حالياً'
                        : 'الوحدة الثالثة (وطني) مقفلة حالياً'}
                    </h3>
                    <p style={{ color: '#475569', fontSize: 15, maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.7 }}>
                      أهلاً بك يا بطل! هذه الوحدة مقفلة بأمر المعلم <b>(أ. مساعد سليمان الصخري)</b> حتى يأذن بفتحها لجميع الطلاب. لا يمكن تجاوز القفل إلا بعد إتاحة المعلم لها من لوحة التحكم. 🏇🌟
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {appSettings.unit1Open !== false && selectedUnit !== 1 && (
                        <button
                          className="btn green"
                          style={{ padding: '10px 24px', fontSize: 14 }}
                          onClick={() => setSelectedUnit(1)}
                        >
                          🕌 الانتقال إلى دروس الوحدة الأولى المتاحة ←
                        </button>
                      )}
                      <button
                        className="btn light"
                        style={{ padding: '10px 20px', fontSize: 14 }}
                        onClick={() => setActiveModal(null)}
                      >
                        ← العودة إلى الصفحة الرئيسية
                      </button>
                    </div>
                  </div>
                );
              }

              const currentLessons =
                selectedUnit === 1
                  ? UNIT1_LESSONS
                  : selectedUnit === 2
                  ? UNIT2_LESSONS
                  : UNIT3_LESSONS;
              const unitInfo = U[selectedUnit] || U[1];
              const unitBg =
                selectedUnit === 1
                  ? '#effbf8'
                  : selectedUnit === 2
                  ? '#f8f3ff'
                  : '#eff8ff';
              const unitBorder =
                selectedUnit === 1
                  ? '#299d82'
                  : selectedUnit === 2
                  ? '#8051cf'
                  : '#378fd8';

              return (
                <>
                  <p className="sub">
                    اختر الدرس، وسيعرض التطبيق تدريبات تفاعلية مستخرجة من بنك الأسئلة دون تكرار، أو ابدأ <b>التقويم الشامل للوحدة (10 أسئلة)</b>:
                  </p>
                  <div className="lessonGrid">
                    {currentLessons.map(lesson => (
                      <button
                        key={lesson.id}
                        className="lessonCard"
                        onClick={() => handleStartLesson(lesson.title, lesson.bank)}
                      >
                        <span>{lesson.icon}</span>
                        <b>{lesson.title}</b>
                        <small>{lesson.countText}</small>
                      </button>
                    ))}

                    {/* 10-Question Comprehensive Assessment for the Selected Unit */}
                    <button
                      className="lessonCard"
                      style={{
                        gridColumn: '1/-1',
                        background: unitBg,
                        borderColor: unitBorder,
                        borderWidth: 2,
                        padding: '18px 20px'
                      }}
                      onClick={() =>
                        startQuiz(
                          `الوحدة ${selectedUnit}: ${unitInfo.n} — تقويم شامل`,
                          unitInfo.q,
                          `الوحدة ${selectedUnit} (تقويم شامل - 10 أسئلة)`
                        )
                      }
                    >
                      <span style={{ fontSize: 32 }}>🌟</span>
                      <b style={{ fontSize: 18 }}>
                        التقويم الشامل للوحدة {selectedUnit} ({unitInfo.n})
                      </b>
                      <small style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        10 أسئلة تقويمية شاملة لجميع مهارات ودروس وقواعد الوحدة
                      </small>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <div
        id="quizModal"
        className={`modal ${activeModal === 'quizModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        {quiz && (
          <div className="dialog">
            <div className="head">
              <h2 id="qtitle">{quiz.title}</h2>
              <button className="close" onClick={() => setActiveModal(null)}>
                ×
              </button>
            </div>
            <div className="body">
              <div className="quizMeta">
                <span id="qtype">{quiz.type}</span>
                <span id="qlevel">{quiz.qs[qi]?.[4] || 'متنوع'}</span>
                <span id="qnum">
                  السؤال {qi + 1} من {quiz.qs.length}
                </span>
              </div>
              <div className="bar">
                <i
                  id="qbar"
                  style={{
                    width: quizFinished ? '100%' : `${(qi / quiz.qs.length) * 100}%`
                  }}
                />
              </div>

              {!quizFinished ? (
                <div id="quiz">
                  {quiz.hasPassage && quiz.passageData && (
                    <div className="passage">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: showPassage ? 8 : 0
                        }}
                      >
                        <div>
                          <b style={{ fontSize: 17, color: 'var(--t)' }}>
                            📖 {quiz.passageData.title}
                          </b>
                          <small style={{ display: 'block', color: 'var(--mut)' }}>
                            ({quiz.passageData.genre}) — اقرأ النص بتركيز للإجابة عن الأسئلة
                          </small>
                        </div>
                        <button
                          className="btn light"
                          style={{ padding: '5px 12px', fontSize: 13 }}
                          onClick={() => setShowPassage(p => !p)}
                        >
                          {showPassage ? 'إخفاء النص ▲' : 'عرض النص ▼'}
                        </button>
                      </div>
                      {showPassage && (
                        <div
                          style={{
                            maxHeight: 220,
                            overflowY: 'auto',
                            paddingLeft: 6,
                            fontSize: 15,
                            lineHeight: 1.85
                          }}
                        >
                          {quiz.passageData.paragraphs.map((para, pIdx) => (
                            <p key={pIdx} style={{ margin: '0 0 8px' }}>
                              {para}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(() => {
                    const z = quiz.qs[qi];
                    const isEssay = z[5] === 'essay';
                    return (
                      <>
                        <div className="q">
                          <h3>
                            {qi + 1}. {z[0]}
                          </h3>
                          {isEssay ? (
                            <>
                              <textarea
                                className="essayBox"
                                placeholder="اكتب إجابتك المقالية هنا من فهمك للنص والقواعد..."
                                disabled={isCurrentAnswered}
                                value={
                                  isCurrentAnswered ? currentQAnswer.essay || '' : essayDraft
                                }
                                onChange={e => setEssayDraft(e.target.value)}
                              />
                              <div className="essayHint">
                                اضغط على «إرسال الإجابة» لعرض النموذج الإرشادي واحتساب الدرجة.
                              </div>
                            </>
                          ) : (
                            <div className="options">
                              {z[1].map((o, i) => {
                                let cls = 'option';
                                if (isCurrentAnswered) {
                                  if (i === z[2]) cls += ' ok';
                                  else if (i === currentQAnswer.selected && i !== z[2])
                                    cls += ' bad';
                                }
                                return (
                                  <button
                                    key={i}
                                    className={cls}
                                    disabled={isCurrentAnswered}
                                    onClick={() => handleAnswerMcq(i)}
                                  >
                                    {OPTION_LABELS[i] || `${i + 1}-`} {o}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {isCurrentAnswered && (
                            <div className="explain">
                              {isEssay ? (
                                <>
                                  <b>📝 تم تسجيل إجابتك المقالية.</b> قارن إجابتك بالنموذج الإرشادي:
                                  <br />
                                  {z[3]}
                                </>
                              ) : (
                                <>
                                  <b>
                                    {currentQAnswer.selected === z[2]
                                      ? '✅ أحسنت! '
                                      : '❌ راجع إجابتك (تم حفظ السؤال في دفتر أخطائك لمعالجته). '}
                                  </b>
                                  {z[3]}
                                </>
                              )}
                              <br />
                              <button
                                className="btn light"
                                style={{ marginTop: 8 }}
                                onClick={() => showNotice(z[3])}
                              >
                                ⓘ شرح المهارة
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="nav">
                          <button
                            className="btn light"
                            disabled={qi === 0}
                            onClick={() => {
                              if (qi > 0) {
                                setQi(qi - 1);
                                setEssayDraft(userAnswers[qi - 1]?.essay || '');
                              }
                            }}
                          >
                            السابق
                          </button>

                          {isEssay && !isCurrentAnswered ? (
                            <button className="btn primary" onClick={handleAnswerEssay}>
                              إرسال الإجابة
                            </button>
                          ) : (
                            <button
                              className="btn primary"
                              onClick={() => {
                                if (!isCurrentAnswered) {
                                  showNotice('أجب عن السؤال أولًا.');
                                  return;
                                }
                                if (qi < quiz.qs.length - 1) {
                                  setQi(qi + 1);
                                  setEssayDraft(userAnswers[qi + 1]?.essay || '');
                                } else {
                                  handleFinishQuiz();
                                }
                              }}
                            >
                              {qi === quiz.qs.length - 1 ? 'إنهاء الاختبار' : 'التالي'}
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="score">
                  <strong>
                    {score}/{quiz.qs.length}
                  </strong>
                  <p>نسبتك {Math.round((score / quiz.qs.length) * 100)}%</p>
                  <p>⭐ حصلت على {score} {score === 1 ? 'نقطة' : score === 2 ? 'نقطتين' : 'نقاط'} (نقطة واحدة فقط لكل سؤال) وتقدّم جوادك في سباق الفرسان 🐎</p>
                  {quiz.nafesStageIdx !== undefined && (
                    <div
                      style={{
                        background: '#fffdf2',
                        border: '1px solid #f0d799',
                        padding: 12,
                        borderRadius: 14,
                        margin: '12px 0'
                      }}
                    >
                      🎉 <b>تم إتمام هذه المرحلة من اختبار نافس!</b> لن يتكرر لك هذا الاختبار، وقد فُتحت لك الآن المرحلة التالية بنص جديد وأسئلة جديدة.
                    </div>
                  )}
                  <div className="actions" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      className="btn gold"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => fireCelebratoryFireworks()}
                    >
                      🎆 ألعاب نارية احتفالية
                    </button>
                    {quiz.nafesStageIdx !== undefined &&
                      quiz.nafesStageIdx + 1 < NAFES_STAGES.length && (
                        <button
                          className="btn gold"
                          onClick={() => {
                            const nextIdx = quiz.nafesStageIdx! + 1;
                            launchNafesStage(NAFES_STAGES[nextIdx], nextIdx);
                          }}
                        >
                          🚀 انتقل للمرحلة التالية من نافس ({NAFES_STAGES[quiz.nafesStageIdx + 1].unitLabel}) ←
                        </button>
                      )}
                    {score < quiz.qs.length && (
                      <button className="btn coral" onClick={openMistakesClinic}>
                        🩺 راجع وعالج أخطاءك الآن
                      </button>
                    )}
                    <button className="btn primary" onClick={() => setActiveModal(null)}>
                      العودة للرئيسية
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Games Modal */}
      <div
        id="gamesModal"
        className={`modal ${activeModal === 'gamesModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) {
            if (speedTimerRef.current) clearInterval(speedTimerRef.current);
            setActiveModal(null);
          }
        }}
      >
        <div className="dialog">
          <div className="head">
            <h2>🎮 مركز الألعاب اللغوية</h2>
            <button
              className="close"
              onClick={() => {
                if (speedTimerRef.current) clearInterval(speedTimerRef.current);
                setActiveModal(null);
              }}
            >
              ×
            </button>
          </div>
          <div className="body">
            {gameView === 'menu' && (() => {
              const unlockedUnits = getUnlockedGameUnits();
              const u1Active = appSettings.unit1Open !== false;
              const u2Active = appSettings.unit2Open || isTeacherAdmin;
              const u3Active = appSettings.unit3Open || isTeacherAdmin;
              const detCount = getDetectiveBankByUnits(unlockedUnits).length;
              const meanCount = getMeaningBankByUnits(unlockedUnits).length;
              const speedCount = getSpeedBankByUnits(unlockedUnits).length;
              const orderCount = getOrderBankByUnits(unlockedUnits).length;

              const detCooldown = getGameCooldown('detective');
              const orderCooldown = getGameCooldown('order');
              const meanCooldown = getGameCooldown('meaning');
              const speedCooldown = getGameCooldown('speed');

              return (
                <div>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #eef9f6 0%, #fefcf3 100%)',
                      border: '1.5px solid #c8e6df',
                      borderRadius: 16,
                      padding: '14px 18px',
                      marginBottom: 14,
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(17,102,108,0.06)'
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#11666c', marginBottom: 4 }}>
                      🎯 مركز الألعاب اللغوية المترابط مع دروس الوحدات الثلاث
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#2b6e72', lineHeight: 1.6 }}>
                      جميع الأسئلة مستخلصة حصريًا من دروس الوحدات الثلاث، وتظهر أسئلة كل وحدة فور فتحها بإذن المعلم، بينما تظل أسئلة الوحدات المقفلة محجوبة تلقائيًا!
                    </p>
                    
                    {/* شريط حالة الوحدات في الألعاب */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 700,
                          background: u1Active ? '#dcfce7' : '#fee2e2',
                          color: u1Active ? '#15803d' : '#b91c1c',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        🕌 الوحدة 1 (القيم): {u1Active ? 'مفتوحة وتظهر أسئلتها ✅' : '🔒 مقفلة بأمر المعلم'}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 700,
                          background: u2Active ? '#dcfce7' : '#fee2e2',
                          color: u2Active ? '#15803d' : '#b91c1c',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        📚 الوحدة 2 (الأعلام): {u2Active ? 'مفتوحة وتظهر أسئلتها ✅' : '🔒 مقفلة بأمر المعلم (محجوبة)'}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontWeight: 700,
                          background: u3Active ? '#dcfce7' : '#fee2e2',
                          color: u3Active ? '#15803d' : '#b91c1c',
                          border: '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        🇸🇦 الوحدة 3 (وطني): {u3Active ? 'مفتوحة وتظهر أسئلتها ✅' : '🔒 مقفلة بأمر المعلم (محجوبة)'}
                      </span>
                    </div>
                  </div>

                  {/* شريط تنبيه سياسة المحاولات اليومية الـ 24 ساعة */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 14,
                      padding: '12px 16px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>⏱️</span>
                      <div>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>
                          نظام المحاولات: محاولة واحدة فقط لكل لعبة كل 24 ساعة
                        </strong>
                        <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
                          تتاح لكل طالب محاولة يومية واحدة لكل لعبة، وتتجدد تلقائياً بعد مرور 24 ساعة لضمان تكافؤ الفرص والتنافس العادل.
                        </span>
                      </div>
                    </div>
                    {isTeacherAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                          👨‍🏫 وضع المعلم (بلا قيود)
                        </span>
                        {activeId && (
                          <button
                            className="btn gold"
                            style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={() => resetStudentGameCooldowns(activeId)}
                          >
                            🔄 تصفير محاولات الطالب الحالي
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div id="gameMenu" className="gameGrid">
                    {/* 1. المحقق اللغوي */}
                    {(() => {
                      const detTeacherLock = isGameUnlockedByTeacher('detective', appSettings, isTeacherAdmin);
                      const isTeacherClosed = !detTeacherLock.unlocked;
                      return (
                        <div
                          className="game"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isTeacherClosed
                              ? '1.5px solid #fca5a5'
                              : detCooldown.isLocked
                              ? '1.5px solid #fecaca'
                              : undefined,
                            background: isTeacherClosed
                              ? '#fff5f5'
                              : detCooldown.isLocked
                              ? '#fffbfb'
                              : undefined
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <h3 style={{ margin: 0 }}>🔎 المحقق اللغوي</h3>
                              <span
                                style={{
                                  fontSize: 11,
                                  background: isTeacherClosed
                                    ? '#fee2e2'
                                    : detCooldown.isLocked
                                    ? '#fee2e2'
                                    : '#e0f3ee',
                                  color: isTeacherClosed || detCooldown.isLocked ? '#991b1b' : '#0d6b63',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  fontWeight: 700
                                }}
                              >
                                {isTeacherClosed
                                  ? '🔒 مقفلة بأمر المعلم'
                                  : detCooldown.isLocked
                                  ? '🔒 استنفدت محاولة اليوم'
                                  : `${detCount} سؤالاً متاحاً`}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#446468', margin: '4px 0 12px' }}>
                              اكتشف الصواب والخطأ اللغوي في دروس الوحدات المفتوحة (محاولة واحدة يومياً 5 أسئلة).
                            </p>
                          </div>

                          {isTeacherClosed && !isTeacherAdmin ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b', fontWeight: 800 }}>
                                🔒 أسئلة هذه اللعبة مقفلة حالياً بأمر المعلم
                                <div style={{ fontSize: 11, fontWeight: 500, color: '#b91c1c', marginTop: 2 }}>
                                  لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها
                                </div>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#fee2e2', color: '#991b1b', cursor: 'not-allowed', border: '1.5px dashed #f87171', fontWeight: 800 }}
                                onClick={() => showNotice(detTeacherLock.reason || '🔒 أسئلة لعبة «المحقق اللغوي» مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل أبداً إلا إذا سمح المعلم بفتحها من لوحة التحكم.')}
                              >
                                🔒 مقفلة بأمر المعلم — غير متاحة
                              </button>
                            </div>
                          ) : isTeacherAdmin && appSettings.gameDetectiveOpen === false ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: '6px 10px', textAlign: 'center', marginBottom: 6, fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                                🔒 مقفلة للطلاب (المعلم يمكنه المعاينة والتجربة)
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn green full" onClick={startDetective} style={{ flex: 1, fontSize: 12 }}>
                                  معاينة المعلم 👁️
                                </button>
                                <button
                                  className="btn light"
                                  style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                                  onClick={() => handleToggleGameByTeacher('detective', true)}
                                >
                                  🔓 فتح للطلاب
                                </button>
                              </div>
                            </div>
                          ) : detCooldown.isLocked ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b' }}>
                                ⏳ تتجدد المحاولة بعد: <strong>{detCooldown.formattedRemaining}</strong>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                onClick={() => showNotice(`🔒 استنفدت محاولتك اليومية في المحقق اللغوي! تتجدد المحاولة بعد: ${detCooldown.formattedRemaining}`)}
                              >
                                🔒 متاح بعد: {detCooldown.formattedRemaining}
                              </button>
                            </div>
                          ) : (
                            <button className="btn green full" onClick={startDetective}>
                              ابدأ محاولة اليوم (5 أسئلة)
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* 2. ركّب الجملة */}
                    {(() => {
                      const orderTeacherLock = isGameUnlockedByTeacher('order', appSettings, isTeacherAdmin);
                      const isTeacherClosed = !orderTeacherLock.unlocked;
                      return (
                        <div
                          className="game"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isTeacherClosed
                              ? '1.5px solid #fca5a5'
                              : orderCooldown.isLocked
                              ? '1.5px solid #fecaca'
                              : '1.5px solid #d8b4fe',
                            background: isTeacherClosed
                              ? '#fff5f5'
                              : orderCooldown.isLocked
                              ? '#fffbfb'
                              : undefined
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <h3 style={{ margin: 0 }}>🧩 ركّب الجملة</h3>
                              <span
                                style={{
                                  fontSize: 11,
                                  background: isTeacherClosed
                                    ? '#fee2e2'
                                    : orderCooldown.isLocked
                                    ? '#fee2e2'
                                    : '#f2e8fc',
                                  color: isTeacherClosed || orderCooldown.isLocked ? '#991b1b' : '#662d91',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  fontWeight: 700
                                }}
                              >
                                {isTeacherClosed
                                  ? '🔒 مقفلة بأمر المعلم'
                                  : orderCooldown.isLocked
                                  ? '🔒 استنفدت محاولة اليوم'
                                  : `${orderCount} جملة بالوحدات المفتوحة`}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#446468', margin: '4px 0 8px' }}>
                              رتب الكلمات المبعثرة وفق دروس الوحدات المفتوحة (محاولة واحدة يومياً 5 جمل).
                            </p>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                              <span style={{ fontSize: 11, background: u1Active ? '#e0f2fe' : '#fee2e2', color: u1Active ? '#0369a1' : '#b91c1c', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>
                                🕌 الوحدة 1 {u1Active ? '(مفتوحة)' : '(🔒 مقفلة)'}
                              </span>
                              <span style={{ fontSize: 11, background: u2Active ? '#fef3c7' : '#fee2e2', color: u2Active ? '#b45309' : '#b91c1c', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>
                                📚 الوحدة 2 {u2Active ? '(مفتوحة)' : '(🔒 مقفلة للمعلم)'}
                              </span>
                              <span style={{ fontSize: 11, background: u3Active ? '#dcfce7' : '#fee2e2', color: u3Active ? '#15803d' : '#b91c1c', padding: '2px 6px', borderRadius: 6, fontWeight: 600 }}>
                                🇸🇦 الوحدة 3 {u3Active ? '(مفتوحة)' : '(🔒 مقفلة للمعلم)'}
                              </span>
                            </div>
                          </div>

                          {isTeacherClosed && !isTeacherAdmin ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b', fontWeight: 800 }}>
                                🔒 لعبة ركّب الجملة مقفلة حالياً بأمر المعلم
                                <div style={{ fontSize: 11, fontWeight: 500, color: '#b91c1c', marginTop: 2 }}>
                                  لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها
                                </div>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#fee2e2', color: '#991b1b', cursor: 'not-allowed', border: '1.5px dashed #f87171', fontWeight: 800 }}
                                onClick={() => showNotice(orderTeacherLock.reason || '🔒 لعبة «ركّب الجملة» مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل أبداً إلا إذا سمح المعلم بفتحها من لوحة التحكم.')}
                              >
                                🔒 مقفلة بأمر المعلم — غير متاحة
                              </button>
                            </div>
                          ) : isTeacherAdmin && appSettings.gameOrderOpen === false ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: '6px 10px', textAlign: 'center', marginBottom: 6, fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                                🔒 مقفلة للطلاب (المعلم يمكنه المعاينة والتجربة)
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn purple full" onClick={() => startOrderGame(unlockedUnits[0] || 1)} style={{ flex: 1, fontSize: 12 }}>
                                  معاينة المعلم 👁️
                                </button>
                                <button
                                  className="btn light"
                                  style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                                  onClick={() => handleToggleGameByTeacher('order', true)}
                                >
                                  🔓 فتح للطلاب
                                </button>
                              </div>
                            </div>
                          ) : orderCooldown.isLocked ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b' }}>
                                ⏳ تتجدد المحاولة بعد: <strong>{orderCooldown.formattedRemaining}</strong>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                onClick={() => showNotice(`🔒 استنفدت محاولتك اليومية في لعبة ركّب الجملة! تتجدد المحاولة بعد: ${orderCooldown.formattedRemaining}`)}
                              >
                                🔒 متاح بعد: {orderCooldown.formattedRemaining}
                              </button>
                            </div>
                          ) : (
                            <button className="btn purple full" onClick={() => startOrderGame(unlockedUnits[0] || 1)}>
                              ابدأ محاولة اليوم (الوحدة {unlockedUnits[0] || 1} ←)
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* 3. معنى الكلمة */}
                    {(() => {
                      const meanTeacherLock = isGameUnlockedByTeacher('meaning', appSettings, isTeacherAdmin);
                      const isTeacherClosed = !meanTeacherLock.unlocked;
                      return (
                        <div
                          className="game"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isTeacherClosed
                              ? '1.5px solid #fca5a5'
                              : meanCooldown.isLocked
                              ? '1.5px solid #fecaca'
                              : undefined,
                            background: isTeacherClosed
                              ? '#fff5f5'
                              : meanCooldown.isLocked
                              ? '#fffbfb'
                              : undefined
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <h3 style={{ margin: 0 }}>🧠 معنى الكلمة</h3>
                              <span
                                style={{
                                  fontSize: 11,
                                  background: isTeacherClosed
                                    ? '#fee2e2'
                                    : meanCooldown.isLocked
                                    ? '#fee2e2'
                                    : '#e3f0fc',
                                  color: isTeacherClosed || meanCooldown.isLocked ? '#991b1b' : '#1864ab',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  fontWeight: 700
                                }}
                              >
                                {isTeacherClosed
                                  ? '🔒 مقفلة بأمر المعلم'
                                  : meanCooldown.isLocked
                                  ? '🔒 استنفدت محاولة اليوم'
                                  : `${meanCount} مفردة بالوحدات المفتوحة`}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#446468', margin: '4px 0 12px' }}>
                              اختر المعنى الدقيق لمفردات نصوص الوحدات المفتوحة والمعاجم التراثية (محاولة واحدة يومياً 5 مفردات).
                            </p>
                          </div>

                          {isTeacherClosed && !isTeacherAdmin ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b', fontWeight: 800 }}>
                                🔒 أسئلة هذه اللعبة مقفلة حالياً بأمر المعلم
                                <div style={{ fontSize: 11, fontWeight: 500, color: '#b91c1c', marginTop: 2 }}>
                                  لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها
                                </div>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#fee2e2', color: '#991b1b', cursor: 'not-allowed', border: '1.5px dashed #f87171', fontWeight: 800 }}
                                onClick={() => showNotice(meanTeacherLock.reason || '🔒 أسئلة لعبة «معنى الكلمة» مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل أبداً إلا إذا سمح المعلم بفتحها من لوحة التحكم.')}
                              >
                                🔒 مقفلة بأمر المعلم — غير متاحة
                              </button>
                            </div>
                          ) : isTeacherAdmin && appSettings.gameMeaningOpen === false ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: '6px 10px', textAlign: 'center', marginBottom: 6, fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                                🔒 مقفلة للطلاب (المعلم يمكنه المعاينة والتجربة)
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn blue full" onClick={startMeaning} style={{ flex: 1, fontSize: 12 }}>
                                  معاينة المعلم 👁️
                                </button>
                                <button
                                  className="btn light"
                                  style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                                  onClick={() => handleToggleGameByTeacher('meaning', true)}
                                >
                                  🔓 فتح للطلاب
                                </button>
                              </div>
                            </div>
                          ) : meanCooldown.isLocked ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b' }}>
                                ⏳ تتجدد المحاولة بعد: <strong>{meanCooldown.formattedRemaining}</strong>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                onClick={() => showNotice(`🔒 استنفدت محاولتك اليومية في معنى الكلمة! تتجدد المحاولة بعد: ${meanCooldown.formattedRemaining}`)}
                              >
                                🔒 متاح بعد: {meanCooldown.formattedRemaining}
                              </button>
                            </div>
                          ) : (
                            <button className="btn blue full" onClick={startMeaning}>
                              ابدأ محاولة اليوم (5 مفردات)
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* 4. تحدي السرعة */}
                    {(() => {
                      const speedTeacherLock = isGameUnlockedByTeacher('speed', appSettings, isTeacherAdmin);
                      const isTeacherClosed = !speedTeacherLock.unlocked;
                      return (
                        <div
                          className="game"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isTeacherClosed
                              ? '1.5px solid #fca5a5'
                              : speedCooldown.isLocked
                              ? '1.5px solid #fecaca'
                              : undefined,
                            background: isTeacherClosed
                              ? '#fff5f5'
                              : speedCooldown.isLocked
                              ? '#fffbfb'
                              : undefined
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <h3 style={{ margin: 0 }}>⚡ تحدي السرعة</h3>
                              <span
                                style={{
                                  fontSize: 11,
                                  background: isTeacherClosed
                                    ? '#fee2e2'
                                    : speedCooldown.isLocked
                                    ? '#fee2e2'
                                    : '#fdf3d8',
                                  color: isTeacherClosed || speedCooldown.isLocked ? '#991b1b' : '#976a06',
                                  padding: '3px 8px',
                                  borderRadius: 10,
                                  fontWeight: 700
                                }}
                              >
                                {isTeacherClosed
                                  ? '🔒 مقفلة بأمر المعلم'
                                  : speedCooldown.isLocked
                                  ? '🔒 استنفدت محاولة اليوم'
                                  : `${speedCount} تحدٍ بالوحدات المفتوحة`}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#446468', margin: '4px 0 12px' }}>
                              أسئلة سريعة وخاطفة في دروس الوحدات المفتوحة بإذن المعلم خلال 30 ثانية (محاولة واحدة يومياً).
                            </p>
                          </div>

                          {isTeacherClosed && !isTeacherAdmin ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b', fontWeight: 800 }}>
                                🔒 أسئلة هذه اللعبة مقفلة حالياً بأمر المعلم
                                <div style={{ fontSize: 11, fontWeight: 500, color: '#b91c1c', marginTop: 2 }}>
                                  لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها
                                </div>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#fee2e2', color: '#991b1b', cursor: 'not-allowed', border: '1.5px dashed #f87171', fontWeight: 800 }}
                                onClick={() => showNotice(speedTeacherLock.reason || '🔒 أسئلة لعبة «تحدي السرعة» مقفلة حالياً بأمر المعلم، ولا يمكن للطالب تجاوز القفل أبداً إلا إذا سمح المعلم بفتحها من لوحة التحكم.')}
                              >
                                🔒 مقفلة بأمر المعلم — غير متاحة
                              </button>
                            </div>
                          ) : isTeacherAdmin && appSettings.gameSpeedOpen === false ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: 8, padding: '6px 10px', textAlign: 'center', marginBottom: 6, fontSize: 11, color: '#854d0e', fontWeight: 700 }}>
                                🔒 مقفلة للطلاب (المعلم يمكنه المعاينة والتجربة)
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn gold full" onClick={startSpeed} style={{ flex: 1, fontSize: 12 }}>
                                  معاينة المعلم 👁️
                                </button>
                                <button
                                  className="btn light"
                                  style={{ fontSize: 11, padding: '4px 8px', whiteSpace: 'nowrap' }}
                                  onClick={() => handleToggleGameByTeacher('speed', true)}
                                >
                                  🔓 فتح للطلاب
                                </button>
                              </div>
                            </div>
                          ) : speedCooldown.isLocked ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '7px 10px', textAlign: 'center', marginBottom: 8, fontSize: 12, color: '#991b1b' }}>
                                ⏳ تتجدد المحاولة بعد: <strong>{speedCooldown.formattedRemaining}</strong>
                              </div>
                              <button
                                className="btn full"
                                style={{ background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed', border: '1px solid #cbd5e1', fontWeight: 700 }}
                                onClick={() => showNotice(`🔒 استنفدت محاولتك اليومية في تحدي السرعة! تتجدد المحاولة بعد: ${speedCooldown.formattedRemaining}`)}
                              >
                                🔒 متاح بعد: {speedCooldown.formattedRemaining}
                              </button>
                            </div>
                          ) : (
                            <button className="btn gold full" onClick={startSpeed}>
                              ابدأ محاولة اليوم (30 ثانية)
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {gameView === 'detective' && (
              <div id="gameArea">
                {!isGameUnlockedByTeacher('detective', appSettings, isTeacherAdmin).unlocked ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff5f5', borderRadius: 16, border: '2px dashed #fca5a5' }}>
                    <div style={{ fontSize: 50, marginBottom: 8 }}>🔒</div>
                    <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>لعبة المحقق اللغوي مقفلة حالياً</h3>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 16px' }}>
                      تم قفل هذه اللعبة بواسطة المعلم المشرف (أ. مساعد الصخري). لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها من لوحة التحكم.
                    </p>
                    <button className="btn primary" onClick={() => setGameView('menu')}>
                      ← العودة إلى قائمة الألعاب
                    </button>
                  </div>
                ) : !detDone ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                      <button className="btn light" onClick={() => setGameView('menu')}>
                        ← قائمة الألعاب
                      </button>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {gameDetectiveList[detIndex]?.unit && (
                          <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                            الوحدة {gameDetectiveList[detIndex].unit}: {gameDetectiveList[detIndex].lessonTitle}
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: '#eef8f5', color: '#0d6b63', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                          {gameDetectiveList[detIndex]?.category || 'لغويات'}
                        </span>
                        <span style={{ fontSize: 11, background: '#fef3dc', color: '#946608', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                          🔄 غير مكرر
                        </span>
                      </div>
                    </div>
                    <h3>
                      🔎 المحقق اللغوي ({detIndex + 1}/{gameDetectiveList.length || 5})
                    </h3>
                    <div className="word" style={{ fontSize: 22 }}>
                      {gameDetectiveList[detIndex]?.prompt}
                    </div>
                    <div className="options">
                      {gameDetectiveList[detIndex]?.options.map((o, j) => {
                        let cls = 'option';
                        if (detSelected !== null) {
                          if (j === gameDetectiveList[detIndex].answer) cls += ' ok';
                          else if (j === detSelected) cls += ' bad';
                        }
                        return (
                          <button
                            key={j}
                            className={cls}
                            disabled={detSelected !== null}
                            onClick={() => answerDetective(j)}
                          >
                            {OPTION_LABELS[j]} {o}
                          </button>
                        );
                      })}
                    </div>
                    {detSelected !== null && (
                      <>
                        <div className="explain">
                          <b>
                            {detSelected === gameDetectiveList[detIndex].answer
                              ? '✅ أحسنت يا بطل! '
                              : '❌ غير صحيح. '}
                          </b>
                          {gameDetectiveList[detIndex].explain}
                        </div>
                        <div className="actions">
                          <button className="btn green" onClick={nextDetective}>
                            {detIndex + 1 < gameDetectiveList.length ? 'السؤال التالي ←' : 'عرض النتيجة 🏆'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="score">
                    <strong>
                      {detScore}/{gameDetectiveList.length}
                    </strong>
                    <p style={{ fontSize: 16, margin: '8px 0' }}>
                      {detScore === gameDetectiveList.length
                        ? '🌟 أداء استثنائي متكامل أيها المحقق اللغوي!'
                        : 'أحسنت أيها المحقق اللغوي! استمر في التدرب وتطوير مهاراتك.'}
                    </p>
                    <p style={{ fontSize: 13, color: '#567073' }}>
                      تمت إضافة {detScore} {detScore === 1 ? 'نقطة' : detScore === 2 ? 'نقطتين' : 'نقاط'} لرصيدك (نقطة واحدة فقط لكل سؤال صحيح)!
                    </p>
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 10, padding: '10px 14px', margin: '14px auto', maxWidth: 420, textAlign: 'center' }}>
                      <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 800 }}>
                        🔒 تم إنجاز محاولة اليوم في المحقق اللغوي
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7f1d1d' }}>
                        تتجدد المحاولة تلقائياً بعد مرور 24 ساعة لضمان المنافسة العادلة.
                      </p>
                    </div>
                    <div className="actions" style={{ justifyContent: 'center', marginTop: 14 }}>
                      {isTeacherAdmin && (
                        <button className="btn purple" onClick={startDetective}>
                          🔄 جولة جديدة (وضع المعلم)
                        </button>
                      )}
                      <button className="btn green" onClick={() => setGameView('menu')}>
                        ← العودة لمركز الألعاب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {gameView === 'order' && (() => {
              const teacherLock = isGameUnlockedByTeacher('order', appSettings, isTeacherAdmin);
              if (!teacherLock.unlocked) {
                return (
                  <div id="gameArea">
                    <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff5f5', borderRadius: 16, border: '2px dashed #fca5a5' }}>
                      <div style={{ fontSize: 50, marginBottom: 8 }}>🔒</div>
                      <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>لعبة ركّب الجملة مقفلة حالياً</h3>
                      <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 16px' }}>
                        تم قفل هذه اللعبة بواسطة المعلم المشرف (أ. مساعد الصخري). لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها من لوحة التحكم.
                      </p>
                      <button className="btn primary" onClick={() => setGameView('menu')}>
                        ← العودة إلى قائمة الألعاب
                      </button>
                    </div>
                  </div>
                );
              }
              const orderProgress = getOrderGameProgress(activeId);
              const currentQ = gameOrderList[gameOrderActiveIdx];
              const currentUnitSolved = orderProgress.unitSolvedCount[orderSelectedUnit] || 0;
              const unit1Status = isOrderUnitUnlocked(1, appSettings, orderProgress, isTeacherAdmin);
              const unit2Status = isOrderUnitUnlocked(2, appSettings, orderProgress, isTeacherAdmin);
              const unit3Status = isOrderUnitUnlocked(3, appSettings, orderProgress, isTeacherAdmin);

              return (
                <div id="gameArea">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 12
                    }}
                  >
                    <button className="btn light" onClick={() => setGameView('menu')}>
                      ← قائمة الألعاب
                    </button>
                    <span
                      style={{
                        fontSize: 12,
                        background: '#fef3dc',
                        color: '#946608',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontWeight: 700
                      }}
                    >
                      🔄 أسئلة متجددة بدون تكرار
                    </span>
                  </div>

                  {/* شريط اختيار وحدات المنهج مع مؤشرات القفل والفتح التلقائي */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: 15, color: '#115e59', fontWeight: 800 }}>
                        📚 مسار وحدات لغتي المتاحة بالألعاب (وفق إذن المعلم):
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        تظهر فقط أسئلة الوحدات المفتوحة، والمقفلة محجوبة تلقائيًا
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                        gap: 8
                      }}
                    >
                      {/* UNIT 1 */}
                      <div
                        onClick={() => {
                          if (unit1Status.unlocked) {
                            switchOrderUnit(1);
                          } else {
                            showNotice(unit1Status.reason || 'الوحدة الأولى مغلقة بأمر المعلم 🔒');
                          }
                        }}
                        style={{
                          cursor: unit1Status.unlocked ? 'pointer' : 'not-allowed',
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: orderSelectedUnit === 1 ? '2px solid #0d9488' : '1px solid #e2e8f0',
                          background:
                            orderSelectedUnit === 1
                              ? 'linear-gradient(135deg, #e6fffa 0%, #ffffff 100%)'
                              : unit1Status.unlocked
                              ? '#ffffff'
                              : '#f8fafc',
                          boxShadow: orderSelectedUnit === 1 ? '0 3px 12px rgba(13,148,136,0.18)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: unit1Status.unlocked ? 1 : 0.65
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#0f766e' }}>
                            🕌 الوحدة 1: القيم الإسلامية
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontWeight: 700,
                              background:
                                (orderProgress.unitSolvedCount[1] || 0) >= 5
                                   ? '#dcfce7'
                                  : unit1Status.unlocked
                                  ? '#ccfbf1'
                                  : '#fee2e2',
                              color:
                                (orderProgress.unitSolvedCount[1] || 0) >= 5
                                  ? '#15803d'
                                  : unit1Status.unlocked
                                  ? '#0f766e'
                                  : '#b91c1c'
                            }}
                          >
                            {(orderProgress.unitSolvedCount[1] || 0) >= 5
                              ? 'مكتملة ⭐'
                              : unit1Status.unlocked
                              ? 'مفتوحة ✅'
                              : '🔒 مغلقة'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          المنجز: {orderProgress.unitSolvedCount[1] || 0} / 5 جمل
                        </div>
                      </div>

                      {/* UNIT 2 */}
                      <div
                        onClick={() => {
                          if (unit2Status.unlocked) {
                            switchOrderUnit(2);
                          } else {
                            showNotice(unit2Status.reason || '🔒 الوحدة الثانية (الأعلام) مقفلة حالياً بأمر المعلم، ولن تظهر أسئلتها حتى يأذن بفتحها.');
                          }
                        }}
                        style={{
                          cursor: unit2Status.unlocked ? 'pointer' : 'not-allowed',
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: orderSelectedUnit === 2 ? '2px solid #ea580c' : '1px solid #e2e8f0',
                          background:
                            orderSelectedUnit === 2
                              ? 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
                              : unit2Status.unlocked
                              ? '#ffffff'
                              : '#f8fafc',
                          boxShadow: orderSelectedUnit === 2 ? '0 3px 12px rgba(234,88,12,0.18)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: unit2Status.unlocked ? 1 : 0.65
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#c2410c' }}>
                            📚 الوحدة 2: الأعلام
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontWeight: 700,
                              background:
                                (orderProgress.unitSolvedCount[2] || 0) >= 5
                                  ? '#dcfce7'
                                  : unit2Status.unlocked
                                  ? '#ffedd5'
                                  : '#fee2e2',
                              color:
                                (orderProgress.unitSolvedCount[2] || 0) >= 5
                                  ? '#15803d'
                                  : unit2Status.unlocked
                                  ? '#c2410c'
                                  : '#b91c1c'
                            }}
                          >
                            {(orderProgress.unitSolvedCount[2] || 0) >= 5
                              ? 'مكتملة ⭐'
                              : unit2Status.unlocked
                              ? 'مفتوحة ✅'
                              : '🔒 مقفلة بأمر المعلم'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          المنجز: {orderProgress.unitSolvedCount[2] || 0} / 5 جمل
                        </div>
                      </div>

                      {/* UNIT 3 */}
                      <div
                        onClick={() => {
                          if (unit3Status.unlocked) {
                            switchOrderUnit(3);
                          } else {
                            showNotice(unit3Status.reason || '🔒 الوحدة الثالثة (وطني) مقفلة حالياً بأمر المعلم، ولن تظهر أسئلتها حتى يأذن بفتحها.');
                          }
                        }}
                        style={{
                          cursor: unit3Status.unlocked ? 'pointer' : 'not-allowed',
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: orderSelectedUnit === 3 ? '2px solid #16a34a' : '1px solid #e2e8f0',
                          background:
                            orderSelectedUnit === 3
                              ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
                              : unit3Status.unlocked
                              ? '#ffffff'
                              : '#f8fafc',
                          boxShadow: orderSelectedUnit === 3 ? '0 3px 12px rgba(22,163,74,0.18)' : 'none',
                          transition: 'all 0.2s ease',
                          opacity: unit3Status.unlocked ? 1 : 0.65
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#15803d' }}>
                            🇸🇦 الوحدة 3: وطني
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 6px',
                              borderRadius: 6,
                              fontWeight: 700,
                              background:
                                (orderProgress.unitSolvedCount[3] || 0) >= 5
                                  ? '#dcfce7'
                                  : unit3Status.unlocked
                                  ? '#dcfce7'
                                  : '#fee2e2',
                              color:
                                (orderProgress.unitSolvedCount[3] || 0) >= 5
                                  ? '#15803d'
                                  : unit3Status.unlocked
                                  ? '#15803d'
                                  : '#b91c1c'
                            }}
                          >
                            {(orderProgress.unitSolvedCount[3] || 0) >= 5
                              ? 'مكتملة ⭐'
                              : unit3Status.unlocked
                              ? 'مفتوحة ✅'
                              : '🔒 مقفلة بأمر المعلم'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          المنجز: {orderProgress.unitSolvedCount[3] || 0} / 5 جمل
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* بطاقة السؤال والدرس والقاعدة */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: '14px 16px',
                      marginBottom: 14,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 6
                      }}
                    >
                      <span
                        style={{
                          background:
                            orderSelectedUnit === 1
                              ? '#ccfbf1'
                              : orderSelectedUnit === 2
                              ? '#ffedd5'
                              : '#dcfce7',
                          color:
                            orderSelectedUnit === 1
                              ? '#0f766e'
                              : orderSelectedUnit === 2
                              ? '#c2410c'
                              : '#15803d',
                          fontWeight: 800,
                          fontSize: 13,
                          padding: '3px 10px',
                          borderRadius: 8
                        }}
                      >
                        🏷️ {currentQ?.lessonTitle ? `درس: ${currentQ.lessonTitle}` : 'درس القواعد'}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        ⭐ جملة رقم {currentUnitSolved + 1} في الوحدة {orderSelectedUnit}
                      </span>
                    </div>

                    {currentQ?.hint && (
                      <p style={{ margin: '4px 0 2px', fontSize: 13, color: '#334155', fontWeight: 600 }}>
                        💡 <b>الموضوع:</b> {currentQ.hint}
                      </p>
                    )}
                    {currentQ?.ruleExplanation && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#0d9488' }}>
                        📖 <b>القاعدة الإرشادية:</b> {currentQ.ruleExplanation}
                      </p>
                    )}
                  </div>

                  <p className="sub" style={{ margin: '0 0 10px', fontSize: 13 }}>
                    اضغط على الكلمات بالترتيب لتكوين الجملة الصحيحة (اضغط على الكلمة الأخيرة للتراجع عنها):
                  </p>

                  <div
                    className="word"
                    style={{
                      cursor: orderChosen.length > 0 ? 'pointer' : 'default',
                      minHeight: 58,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      borderRadius: 12
                    }}
                    onClick={() => {
                      if (orderChosen.length > 0) {
                        setOrderChosen(prev => prev.slice(0, -1));
                      }
                    }}
                    title="اضغط للتراجع عن آخر كلمة"
                  >
                    {orderChosen.length > 0
                      ? orderChosen.map(i => orderWords[i]).join(' ')
                      : '— اضغط الكلمات بالترتيب لتكوين الجملة —'}
                  </div>

                  <div
                    className="options"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', margin: '14px 0' }}
                  >
                    {orderWords.map((x, idx) => (
                      <button
                        key={idx}
                        className="option"
                        style={{ width: 'auto', padding: '9px 18px', fontWeight: 700, fontSize: 17 }}
                        disabled={orderChosen.includes(idx)}
                        onClick={() => setOrderChosen(prev => [...prev, idx])}
                      >
                        {x}
                      </button>
                    ))}
                  </div>

                  <div className="actions" style={{ marginTop: 18, justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <button className="btn green" onClick={checkOrderGame}>
                      ✅ تحقق من الترتيب (+20 نقطة)
                    </button>
                    <button
                      className="btn light"
                      disabled={orderChosen.length === 0}
                      onClick={() => setOrderChosen(prev => prev.slice(0, -1))}
                    >
                      تراجع عن كلمة
                    </button>
                    <button
                      className="btn light"
                      onClick={() => {
                        if (gameOrderList[gameOrderActiveIdx]) {
                          setupOrderSentence(gameOrderList[gameOrderActiveIdx]);
                        }
                      }}
                    >
                      إعادة ترتيب
                    </button>
                    <button className="btn purple" onClick={nextOrderSentence}>
                      🔀 جملة أخرى في الوحدة (بدون تكرار)
                    </button>
                  </div>
                </div>
              );
            })()}

            {gameView === 'meaning' && (
              <div id="gameArea">
                {!isGameUnlockedByTeacher('meaning', appSettings, isTeacherAdmin).unlocked ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff5f5', borderRadius: 16, border: '2px dashed #fca5a5' }}>
                    <div style={{ fontSize: 50, marginBottom: 8 }}>🔒</div>
                    <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>لعبة معنى الكلمة مقفلة حالياً</h3>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 16px' }}>
                      تم قفل هذه اللعبة بواسطة المعلم المشرف (أ. مساعد الصخري). لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها من لوحة التحكم.
                    </p>
                    <button className="btn primary" onClick={() => setGameView('menu')}>
                      ← العودة إلى قائمة الألعاب
                    </button>
                  </div>
                ) : !meanDone ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                      <button className="btn light" onClick={() => setGameView('menu')}>
                        ← قائمة الألعاب
                      </button>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {gameMeaningList[meanIndex]?.unit && (
                          <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                            الوحدة {gameMeaningList[meanIndex].unit}: {gameMeaningList[meanIndex].lessonTitle}
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: '#fef3dc', color: '#946608', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                          🔄 غير مكرر
                        </span>
                      </div>
                    </div>
                    <h3>
                      🧠 معنى الكلمة ({meanIndex + 1}/{gameMeaningList.length || 5})
                    </h3>
                    <div className="word" style={{ fontSize: 26, fontWeight: 800 }}>
                      «{gameMeaningList[meanIndex]?.word}»
                    </div>
                    <p style={{ textAlign: 'center', fontSize: 14, color: '#527074', margin: '-4px 0 12px' }}>
                      ما المعنى الصحيح للكلمة في المعجم العربي؟
                    </p>
                    <div className="options">
                      {meanOpts.map((o, idx) => (
                        <button key={idx} className="option" onClick={() => answerMeaning(o)}>
                          {OPTION_LABELS[idx]} {o}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="score">
                    <strong>
                      {meanScore}/{gameMeaningList.length}
                    </strong>
                    <p style={{ fontSize: 16, margin: '8px 0' }}>
                      {meanScore === gameMeaningList.length
                        ? '🌟 معجم لغوي ثري ومتقن! أحسنت يا بطل.'
                        : 'أحسنت! المعاجم اللغوية تزيد من فصاحتك وحصيلتك اللغوية.'}
                    </p>
                    <p style={{ fontSize: 13, color: '#567073' }}>
                      تمت إضافة {meanScore} {meanScore === 1 ? 'نقطة' : meanScore === 2 ? 'نقطتين' : 'نقاط'} لرصيدك (نقطة واحدة فقط لكل سؤال صحيح)!
                    </p>
                    <div className="actions" style={{ justifyContent: 'center', marginTop: 16 }}>
                      <button className="btn purple" onClick={startMeaning}>
                        🔀 جولة جديدة بمفردات أخرى (بدون تكرار)
                      </button>
                      <button className="btn green" onClick={() => setGameView('menu')}>
                        العودة للألعاب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {gameView === 'speed' && (
              <div id="gameArea">
                {!isGameUnlockedByTeacher('speed', appSettings, isTeacherAdmin).unlocked ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff5f5', borderRadius: 16, border: '2px dashed #fca5a5' }}>
                    <div style={{ fontSize: 50, marginBottom: 8 }}>🔒</div>
                    <h3 style={{ color: '#991b1b', margin: '0 0 8px' }}>لعبة تحدي السرعة مقفلة حالياً</h3>
                    <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460, margin: '0 auto 16px' }}>
                      تم قفل هذه اللعبة بواسطة المعلم المشرف (أ. مساعد الصخري). لا يمكن للطالب تجاوز القفل حتى يسمح المعلم بفتحها من لوحة التحكم.
                    </p>
                    <button className="btn primary" onClick={() => setGameView('menu')}>
                      ← العودة إلى قائمة الألعاب
                    </button>
                  </div>
                ) : !speedDone ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                      <button
                        className="btn light"
                        onClick={() => {
                          if (speedTimerRef.current) clearInterval(speedTimerRef.current);
                          setGameView('menu');
                        }}
                      >
                        ← قائمة الألعاب
                      </button>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {gameSpeedList[speedIndex]?.unit && (
                          <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                            الوحدة {gameSpeedList[speedIndex].unit}: {gameSpeedList[speedIndex].lessonTitle}
                          </span>
                        )}
                        <span style={{ fontSize: 11, background: '#fef3dc', color: '#946608', padding: '3px 8px', borderRadius: 8, fontWeight: 700 }}>
                          🔄 غير مكرر
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>
                        ⚡ تحدي السرعة ({speedIndex + 1}/{gameSpeedList.length || 8})
                      </h3>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: speedTime <= 5 ? '#e0565b' : '#11666c',
                          background: speedTime <= 5 ? '#ffebee' : '#eef8f5',
                          padding: '4px 12px',
                          borderRadius: 12
                        }}
                      >
                        ⏱️ 00:{String(speedTime).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="word" style={{ fontSize: 22, marginTop: 12 }}>
                      {gameSpeedList[speedIndex]?.prompt}
                    </div>
                    <div className="options">
                      {gameSpeedList[speedIndex]?.options.map((o, j) => (
                        <button key={j} className="option" onClick={() => answerSpeed(j)}>
                          {OPTION_LABELS[j]} {o}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="score">
                    <strong>
                      {speedScore}/{gameSpeedList.length}
                    </strong>
                    <p style={{ fontSize: 16, margin: '8px 0' }}>
                      {speedScore >= Math.floor(gameSpeedList.length * 0.7)
                        ? '⚡ سرعة بديهة مذهلة وإتقان عالٍ!'
                        : 'انتهى التحدي السريع! مارس المزيد لتزداد سرعتك.'}
                    </p>
                    <p style={{ fontSize: 13, color: '#567073' }}>
                      تمت إضافة {speedScore} {speedScore === 1 ? 'نقطة' : speedScore === 2 ? 'نقطتين' : 'نقاط'} لرصيدك (نقطة واحدة فقط لكل سؤال صحيح)!
                    </p>
                    <div className="actions" style={{ justifyContent: 'center', marginTop: 16 }}>
                      <button className="btn gold" onClick={startSpeed}>
                        🔀 تحدٍ سريع بأسئلة أخرى (بدون تكرار)
                      </button>
                      <button className="btn green" onClick={() => setGameView('menu')}>
                        العودة للألعاب
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal (خاص بالمعلم فقط) */}
      <div
        id="feedbackModal"
        className={`modal ${activeModal === 'feedbackModal' ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) setActiveModal(null);
        }}
      >
        <div className="dialog">
          <div className="head" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <h2>💬 تواصل مع معلم المادة (اقتراح / استفسار)</h2>
            <button className="close" onClick={() => setActiveModal(null)}>
              ×
            </button>
          </div>
          <div className="body">
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '12px 14px', borderRadius: 10, marginBottom: 14, color: '#5b21b6', fontSize: 13, lineHeight: 1.6 }}>
              🔒 <b>ملاحظة:</b> رسالتك واقتراحك يتم إرسالها بشكل خاص وسري للمعلم فقط ولا تظهر لباقي الطلاب.
            </div>
            <div className="grid">
              <div className="field">
                <label>اسم الطالب</label>
                <input
                  type="text"
                  placeholder={currentProfile?.name || 'اكتب اسمك...'}
                  value={fbStudentName || (currentProfile?.name || '')}
                  onChange={e => setFbStudentName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>الفصل</label>
                <select value={fbCls !== 'بدون تحديد' ? fbCls : currentProfile?.cls || 'بدون تحديد'} onChange={e => setFbCls(e.target.value)}>
                  <option>بدون تحديد</option>
                  <option>أ</option>
                  <option>ب</option>
                  <option>ج</option>
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>الاقتراح أو الملاحظة</label>
                <textarea
                  rows={4}
                  maxLength={500}
                  placeholder="اكتب مقترحك أو سؤالك هنا ليصل مباشرة لمعلمك..."
                  value={fbText}
                  onChange={e => setFbText(e.target.value)}
                />
              </div>
            </div>
            <div className="actions">
              <button className="btn purple full" onClick={handleSendFeedback}>
                ✉️ إرسال مباشرة للمعلم
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share / WhatsApp Modal */}
      {activeModal === 'shareModal' && (
        <div
          className="modal show"
          style={{ zIndex: 90 }}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div className="dialog" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="head" style={{ background: 'linear-gradient(135deg, #1f7a55, #126b70)' }}>
              <h2>📱 مشاركة المنصة عبر الواتساب</h2>
              <button className="close" onClick={() => setActiveModal(null)}>
                ×
              </button>
            </div>
            <div className="body" style={{ textAlign: 'right' }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: 16,
                  padding: '14px 16px',
                  marginBottom: 16
                }}
              >
                <h4 style={{ margin: '0 0 6px', color: '#166534', fontSize: 16 }}>
                  ✨ رابط المنصة العام والمباشر (شغال لجميع الطلاب والمعلمين بدون تسجيل دخول):
                </h4>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontFamily: 'monospace',
                    direction: 'ltr',
                    textAlign: 'left',
                    fontSize: 13,
                    wordBreak: 'break-all',
                    color: '#0f172a',
                    marginBottom: 10,
                    userSelect: 'all'
                  }}
                >
                  {(() => {
                    const cur = window.location.origin || window.location.href;
                    if (cur.includes('ais-dev-')) return cur.replace('ais-dev-', 'ais-pre-');
                    if (cur.includes('localhost') || cur.includes('127.0.0.1')) return 'https://ais-pre-zx4ojc322jmrrwbkpqxia3-923277338572.europe-west2.run.app';
                    return cur;
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn gold"
                    style={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => {
                      const cur = window.location.origin || window.location.href;
                      const shareUrl = cur.includes('ais-dev-')
                        ? cur.replace('ais-dev-', 'ais-pre-')
                        : (cur.includes('localhost') || cur.includes('127.0.0.1'))
                        ? 'https://ais-pre-zx4ojc322jmrrwbkpqxia3-923277338572.europe-west2.run.app'
                        : cur;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareUrl);
                        showNotice('✅ تم نسخ الرابط العام بنجاح! يمكنك الآن لصقه في الواتساب أو الرسائل النصية للطلاب.');
                      } else {
                        showNotice(`الرابط: ${shareUrl}`);
                      }
                    }}
                  >
                    📋 نسخ الرابط العام المباشر
                  </button>
                  <button
                    className="btn green"
                    style={{
                      flex: 1.2,
                      minWidth: 170,
                      background: '#25D366',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onClick={() => {
                      const cur = window.location.origin || window.location.href;
                      const shareUrl = cur.includes('ais-dev-')
                        ? cur.replace('ais-dev-', 'ais-pre-')
                        : (cur.includes('localhost') || cur.includes('127.0.0.1'))
                        ? 'https://ais-pre-zx4ojc322jmrrwbkpqxia3-923277338572.europe-west2.run.app'
                        : cur;
                      const msg = `📚 *منصة لُغتي تحكي... وأنا أصنع الحكاية*\n🎓 للصف الأول المتوسط - إعداد وتنفيذ المعلم مساعد سليمان الصخري\n\n📌 رابط المنصة المباشر للطلاب:\n${shareUrl}`;
                      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                  >
                    💬 إرسال رسالة جاهزة عبر واتساب
                  </button>
                    <a
                      href={(() => {
                        const cur = window.location.origin || window.location.href;
                        if (cur.includes('ais-dev-')) return cur.replace('ais-dev-', 'ais-pre-');
                        if (cur.includes('localhost') || cur.includes('127.0.0.1')) return 'https://ais-pre-zx4ojc322jmrrwbkpqxia3-923277338572.europe-west2.run.app';
                        return cur;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn light"
                      style={{ flex: 1, minWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      🌐 تجربة وفتح الرابط في نافذة جديدة
                    </a>
                  </div>
                </div>

                {/* خاص بالمعلم فقط: تحميل الحزم الجاهزة ZIP والنشر المباشر */}
                {isTeacherAdmin && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                      border: '1.5px solid #c4b5fd',
                      borderRadius: 16,
                      padding: '14px 16px',
                      fontSize: 14,
                      lineHeight: '1.8',
                      marginBottom: 16,
                      boxShadow: '0 2px 10px rgba(124, 58, 237, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                      <h4 style={{ margin: 0, color: '#5b21b6', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>🔐</span>
                        <span>خاص بالمعلم فقط (أ. مساعد): تحميل ملف الحزمة الجاهزة (ZIP)</span>
                      </h4>
                      <a
                        href="/initiative_web_app.zip"
                        download="initiative_web_app.zip"
                        className="btn purple"
                        style={{
                          background: '#7c3aed',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textDecoration: 'none',
                          padding: '6px 14px',
                          fontSize: 13,
                          fontWeight: 700
                        }}
                      >
                        📦 تحميل ملف الحزمة الجاهزة (ZIP)
                      </a>
                    </div>
                    <p style={{ margin: '0 0 6px', color: '#6d28d9', fontSize: 13 }}>
                      تم إغلاق وحجب هذا الخيار بالكامل عن الطلاب، ويظهر لك فقط كمعلم مشرف لرفع المنصة مستقلاً عبر (Netlify Drop):
                    </p>
                    <ol style={{ margin: 0, paddingRight: 20, color: '#4c1d95', fontSize: 13 }}>
                      <li>اضغط على زر <b>«تحميل ملف الحزمة الجاهزة (ZIP)»</b> أعلاه.</li>
                      <li>افتح صفحة: <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>app.netlify.com/drop</a> في المتصفح.</li>
                      <li>اسحب الملف المضغوط إلى الصفحة مباشرة للحصول فوراً على رابط دائم خاص بمبادرتك ينتهي بـ <code>.netlify.app</code>.</li>
                    </ol>
                  </div>
                )}

              {/* Troubleshooting guide for why WhatsApp link might not open */}
              <div
                style={{
                  background: '#fff8eb',
                  border: '1px solid #fde68a',
                  borderRadius: 16,
                  padding: '14px 16px',
                  fontSize: 14,
                  lineHeight: '1.8'
                }}
              >
                <h4 style={{ margin: '0 0 8px', color: '#92400e', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚠️</span>
                  <span>لماذا قد لا يفتح الرابط أحيانًا في الواتساب وكيف تحل المشكلة؟</span>
                </h4>
                <ol style={{ margin: '0 0 10px', paddingRight: 20, color: '#78350f' }}>
                  <li style={{ marginBottom: 8 }}>
                    <b>السبب الرئيسي لعدم فتح الرابط السابق (رابط التطوير مقابل الرابط العام):</b>
                    <br />
                    الرابط الذي كنت تنسخه من شريط المتصفح الداخلي يحتوي على كلمة (<code style={{ background: '#fee2e2', padding: '1px 5px', borderRadius: 4 }}>ais-dev</code>)، وهو رابط محمي ومغلق يتطلب تسجيل دخول حساب المطور!
                    <br />
                    <span style={{ color: '#047857' }}>
                      💡 <b>الحل:</b> الرابط المحدث بالأعلى يحتوي على (<code style={{ background: '#dcfce7', padding: '1px 5px', borderRadius: 4 }}>ais-pre</code>) وهو <b>الرابط العام المفتوح للجميع</b> بدون الحاجة لأي تسجيل دخول.
                    </span>
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <b>إرسال الرابط من رقم غير مسجل (حماية أمان الواتساب والرسائل):</b>
                    <br />
                    إذا كان الطالب أو ولي الأمر لا يحفظ رقم جوالك في جهات اتصاله، يقوم واتساب بتعطيل النقر على الروابط تلقائيًا كإجراء أمان.
                    <br />
                    <span style={{ color: '#047857' }}>
                      💡 <b>الحل:</b> اطلب من الطالب الرد على رسالتك بأي كلمة أو حفظ رقمك، وسيصبح الرابط فوراً أزرق وقابلاً للنقر، أو أن ينسخ الرابط ويلصقه في متصفح الجوال مباشرة.
                    </span>
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <b>هل لابد من رفعه على صفحة ويب / استضافة مستقلة؟</b>
                    <br />
                    <b>لا، ليس إجبارياً!</b> الرابط العام بالأعلى مرفوع ومستضاف بالفعل على سحابة جوجل السريعة ويعمل مباشرة من أي جهاز.
                    <br />
                    <span>
                      🌐 <i>اختياري:</i> إذا كنت ترغب برابط دائم ومختصر باسم مخصص (مثل <code dir="ltr">loghati.web.app</code>)، يمكنك رفعه بضغطة زر عبر خدمة الاستضافة المجانية (Firebase Hosting) لأن قاعدة البيانات مرتبطة بالفعل.
                    </span>
                  </li>
                </ol>
              </div>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button className="btn primary" onClick={() => setActiveModal(null)}>
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent-Teacher Private Messaging Modal */}
      <ParentMessagesModal
        show={activeModal === 'parentMessagesModal'}
        onClose={() => setActiveModal(null)}
        studentName={currentProfile?.name || 'طالب متميز'}
        studentCls={currentProfile?.cls || '1/1'}
        studentId={activeId || 'guest'}
        messages={parentMessages}
        onSendMessage={handleSendParentMessage}
      />

      {/* Race Finish Line Victory Celebration Modal */}
      <RaceFinishModal
        show={activeModal === 'raceFinishModal'}
        onClose={() => setActiveModal(null)}
        studentName={currentProfile?.name || 'فارس لغتي'}
        studentCls={currentProfile?.cls || '1/1'}
        points={currentProfile?.points || 0}
        completedAt={currentProfile?.raceCompletedAt}
      />

      {/* Custom Notification Modal */}
      {notice && (
        <div className="modal show" style={{ zIndex: 99 }} onClick={() => setNotice(null)}>
          <div className="dialog" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="head">
              <h2>💡 تنبيه</h2>
              <button className="close" onClick={() => setNotice(null)}>
                ×
              </button>
            </div>
            <div className="body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, margin: '8px 0 18px' }}>{notice}</p>
              <button className="btn primary" onClick={() => setNotice(null)}>
                حسنًا
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
