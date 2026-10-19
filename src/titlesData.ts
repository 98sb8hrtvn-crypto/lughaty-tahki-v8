// =========================================================================
// نظام الألقاب التحفيزية والرتب اللغوية لفرسان لغتي الخالدة
// يشمل: ألقاب إتقان الوحدات، ألقاب الألعاب والتحديات، رتب النقاط، ووسام «انتزع الصدارة»
// =========================================================================

export interface MotivationalTitleInfo {
  id: string;
  name: string;
  badgeKey: string;
  icon: string;
  category: 'وحدات المنهج' | 'التحديات والألعاب' | 'رتب النقاط' | 'الصدارة';
  description: string;
  requirement: string;
  color: string;
  bgGradient: string;
}

export const MOTIVATIONAL_TITLES: MotivationalTitleInfo[] = [
  // -------------------------------------------------------------
  // 1. ألقاب إتقان وحدات المنهج الدراسي
  // -------------------------------------------------------------
  {
    id: 'unit1_hero',
    name: 'بطل الوحدة الأولى: فارس القيم الإسلامية',
    badgeKey: 'بطل الوحدة الأولى',
    icon: '🕌',
    category: 'وحدات المنهج',
    description: 'يُمنح للفارس الذي أتقن دروس واختبارات الوحدة الأولى بنجاح واقتدار.',
    requirement: 'إكمال اختبار الوحدة الأولى أو تقويم دروسها بدرجة 70% فأعلى.',
    color: '#0f766e',
    bgGradient: 'linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)'
  },
  {
    id: 'unit2_hero',
    name: 'بطل الوحدة الثانية: سليل الأعلام ونبراس الفصحاء',
    badgeKey: 'بطل الوحدة الثانية',
    icon: '📚',
    category: 'وحدات المنهج',
    description: 'يُمنح للفارس الذي أتقن سير الأعلام والأفعال الناسخة والمثنى والجموع.',
    requirement: 'إكمال اختبار الوحدة الثانية أو تقويم دروسها بدرجة 70% فأعلى.',
    color: '#c2410c',
    bgGradient: 'linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)'
  },
  {
    id: 'unit3_hero',
    name: 'بطل الوحدة الثالثة: حامي لغة الوطن وفارسها',
    badgeKey: 'بطل الوحدة الثالثة',
    icon: '🇸🇦',
    category: 'وحدات المنهج',
    description: 'يُمنح للفارس الذي تفوق في نصوص وطني والحروف الناسخة وأسلوب النداء.',
    requirement: 'إكمال اختبار الوحدة الثالثة أو تقويم دروسها بدرجة 70% فأعلى.',
    color: '#15803d',
    bgGradient: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)'
  },
  {
    id: 'all_units_master',
    name: 'فارس الفصحى الأكبر: تاج المنهج',
    badgeKey: 'فارس الفصحى الأكبر',
    icon: '👑',
    category: 'وحدات المنهج',
    description: 'اللقب الأسمى والأرفع لإتقان جميع وحدات مقرر لغتي الخالدة بنجاح استثنائي.',
    requirement: 'إكمال اختبارات وتقويمات الوحدات الثلاث جميعها.',
    color: '#b45309',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)'
  },

  // -------------------------------------------------------------
  // 2. ألقاب الألعاب والتحديات التخصصية
  // -------------------------------------------------------------
  {
    id: 'detective_master',
    name: 'محقق الضاد البارع',
    badgeKey: 'محقق الضاد البارع',
    icon: '🔎',
    category: 'التحديات والألعاب',
    description: 'يُمنح للمحقق الفطن الذي يكشف الصواب والخطأ اللغوي بدقة متناهية.',
    requirement: 'تحقيق علامة كاملة 5/5 في جولة لعبة «المحقق اللغوي».',
    color: '#0d9488',
    bgGradient: 'linear-gradient(135deg, #e6fffa 0%, #f0fdfa 100%)'
  },
  {
    id: 'order_architect',
    name: 'مهندس التراكيب والجمل',
    badgeKey: 'مهندس التراكيب والجمل',
    icon: '🧩',
    category: 'التحديات والألعاب',
    description: 'يُمنح للمبدع الذي يرتب الكلمات المبعثرة ويبني جملاً فصيحة متناسقة.',
    requirement: 'إتقان تركيب 5 جمل صحيحة في لعبة «ركّب الجملة».',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)'
  },
  {
    id: 'lexicon_keeper',
    name: 'خازن المعاجم والمفردات',
    badgeKey: 'خازن المعاجم والمفردات',
    icon: '🧠',
    category: 'التحديات والألعاب',
    description: 'يُمنح لصاحب الثروة اللغوية الثرية والفصاحة في معرفة معاني الكلمات التراثية.',
    requirement: 'إحراز 4 درجات فأعلى في جولة «معنى الكلمة».',
    color: '#0284c7',
    bgGradient: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)'
  },
  {
    id: 'speed_knight',
    name: 'فارس السرعة الخاطفة',
    badgeKey: 'فارس السرعة الخاطفة',
    icon: '⚡',
    category: 'التحديات والألعاب',
    description: 'يُمنح لصاحب البديهة السريعة التي تقتنص الإجابات الصائبة في 30 ثانية.',
    requirement: 'إحراز 6 إجابات صحيحة أو أكثر في جولة «تحدي السرعة».',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)'
  },
  {
    id: 'nafes_champion',
    name: 'صنديد نافس الذهبي',
    badgeKey: 'صنديد نافس الذهبي',
    icon: '🌟',
    category: 'التحديات والألعاب',
    description: 'يُمنح للفارس المتألق في نماذج الاختبارات الوطنية المعيارية نافس.',
    requirement: 'اجتياز أي مرحلة من مراحل نافس بنسبة 75% فأعلى.',
    color: '#ca8a04',
    bgGradient: 'linear-gradient(135deg, #fef9c3 0%, #fefce8 100%)'
  },
  {
    id: 'daily_conqueror',
    name: 'قاهر التحدي اليومي',
    badgeKey: 'قاهر التحدي اليومي',
    icon: '⏳',
    category: 'التحديات والألعاب',
    description: 'يُمنح للفارس المثابر الذي ينجز تحدي الـ 24 ساعة اليومي في وقته.',
    requirement: 'حل وإنجاز التحدي اليومي المتجدد.',
    color: '#4f46e5',
    bgGradient: 'linear-gradient(135deg, #e0e7ff 0%, #eef2ff 100%)'
  },
  {
    id: 'language_doctor',
    name: 'طبيب اللغة ومعالج الأخطاء',
    badgeKey: 'طبيب اللغة ومعالج الأخطاء',
    icon: '🩺',
    category: 'التحديات والألعاب',
    description: 'يُمنح لمن يراجع عيادة اللغة ويصوب أخطاءه ليحول العثرات إلى نقاط قوة.',
    requirement: 'تصويب ومعالجة 3 أخطاء في عيادة اللغة.',
    color: '#e11d48',
    bgGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)'
  },
  {
    id: 'games_champion',
    name: 'بطل مركز الألعاب',
    badgeKey: 'بطل مركز الألعاب',
    icon: '🎮',
    category: 'التحديات والألعاب',
    description: 'يُمنح للفارس الأبرع في حصد أعلى النقاط وتجاوز تحديات مركز الألعاب اللغوية بنجاح.',
    requirement: 'تحقيق إنجازات متقدمة في ألعاب المحقق، الترتيب، المعاني، أو سباق السرعة.',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)'
  },
  {
    id: 'finish_line_conqueror',
    name: 'فاتح خط النهاية الذهبي',
    badgeKey: 'فاتح خط النهاية',
    icon: '🎖️',
    category: 'التحديات والألعاب',
    description: 'يُمنح للفارس المثالي الذي استكمل جميع متطلبات السباق المفتوحة والمغلقة وتحدي اليوم وعبر خط النهاية بنجاح.',
    requirement: 'استكمال جميع الأسئلة المطلوبة وعيادة الأخطاء وتحدي اليوم وبلوغ خط النهاية.',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)'
  },

  // -------------------------------------------------------------
  // 3. رتب الفرسان حسب مجموع النقاط (موزونة بمقياس 1 نقطة لكل سؤال)
  // -------------------------------------------------------------
  {
    id: 'rank_trainee',
    name: 'فارس متدرب',
    badgeKey: 'رتبة: فارس متدرب',
    icon: '🐎',
    category: 'رتب النقاط',
    description: 'رتبة البداية لكل فارس يدخل مضمار سباق لغتي الخالدة.',
    requirement: 'من 0 إلى 9 نقاط.',
    color: '#0d9488',
    bgGradient: 'linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)'
  },
  {
    id: 'rank_starter',
    name: 'فارس منطلق',
    badgeKey: 'رتبة: فارس منطلق',
    icon: '🏇',
    category: 'رتب النقاط',
    description: 'انطلاقة واعدة في السباق بعد حل أول 10 أسئلة صحيحة.',
    requirement: 'بلوغ 10 نقاط.',
    color: '#16a34a',
    bgGradient: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)'
  },
  {
    id: 'rank_intrepid',
    name: 'فارس مقدام',
    badgeKey: 'رتبة: فارس مقدام',
    icon: '⚔️',
    category: 'رتب النقاط',
    description: 'عزيمة راسخة وخوض مستمر للاختبارات والمنافسات.',
    requirement: 'بلوغ 25 نقطة.',
    color: '#7c3aed',
    bgGradient: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)'
  },
  {
    id: 'rank_brilliant',
    name: 'فارس متألق',
    badgeKey: 'رتبة: فارس متألق',
    icon: '🌟',
    category: 'رتب النقاط',
    description: 'تألق لغوي بارز وحضور رفيع في قائمة متصدري السباق.',
    requirement: 'بلوغ 50 نقطة.',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)'
  },
  {
    id: 'rank_golden',
    name: 'فارس ذهبي متوج',
    badgeKey: 'رتبة: فارس ذهبي متوج',
    icon: '👑',
    category: 'رتب النقاط',
    description: 'قمة التتويج بين نخبة فرسان لغتي الخالدة.',
    requirement: 'بلوغ 80 نقطة.',
    color: '#b45309',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)'
  },
  {
    id: 'rank_legend',
    name: 'أسطورة فرسان لغتي',
    badgeKey: 'رتبة: أسطورة فرسان لغتي',
    icon: '💎',
    category: 'رتب النقاط',
    description: 'المرتبة الماسية العظمى لصفوة فرسان المملكة العربية السعودية.',
    requirement: 'بلوغ 120 نقطة فأعلى.',
    color: '#0284c7',
    bgGradient: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)'
  },

  // -------------------------------------------------------------
  // 4. وسام الصدارة الاستثنائي
  // -------------------------------------------------------------
  {
    id: 'lead_champion',
    name: 'انتزع الصدارة',
    badgeKey: 'انتزع الصدارة',
    icon: '🔥',
    category: 'الصدارة',
    description: 'الوسام الناري الأرفع لمن تربع على قمة المركز الأول وتجاوز جميع المنافسين!',
    requirement: 'احتلال المركز #1 في قائمة المتسابقين بنقاط أعلى من الجميع.',
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)'
  }
];

export interface StudentRank {
  title: string;
  icon: string;
  color: string;
  tier: number;
  nextRankTitle?: string;
  nextRankPoints?: number;
}

export const getStudentRank = (points: number): StudentRank => {
  if (points >= 120) {
    return { title: 'أسطورة فرسان لغتي', icon: '💎', color: '#0284c7', tier: 6 };
  }
  if (points >= 80) {
    return {
      title: 'فارس ذهبي متوج',
      icon: '👑',
      color: '#b45309',
      tier: 5,
      nextRankTitle: 'أسطورة فرسان لغتي 💎',
      nextRankPoints: 120
    };
  }
  if (points >= 50) {
    return {
      title: 'فارس متألق',
      icon: '🌟',
      color: '#d97706',
      tier: 4,
      nextRankTitle: 'فارس ذهبي متوج 👑',
      nextRankPoints: 80
    };
  }
  if (points >= 25) {
    return {
      title: 'فارس مقدام',
      icon: '⚔️',
      color: '#7c3aed',
      tier: 3,
      nextRankTitle: 'فارس متألق 🌟',
      nextRankPoints: 50
    };
  }
  if (points >= 10) {
    return {
      title: 'فارس منطلق',
      icon: '🏇',
      color: '#16a34a',
      tier: 2,
      nextRankTitle: 'فارس مقدام ⚔️',
      nextRankPoints: 25
    };
  }
  return {
    title: 'فارس متدرب',
    icon: '🐎',
    color: '#0d9488',
    tier: 1,
    nextRankTitle: 'فارس منطلق 🏇',
    nextRankPoints: 10
  };
};

// فحص ما إذا كان الطالب يستحق لقب أو شارة معينة
export const hasEarnedTitle = (
  title: MotivationalTitleInfo,
  badges: string[] = [],
  points: number = 0,
  isLead: boolean = false
): boolean => {
  if (title.id === 'lead_champion') {
    return isLead || badges.some(b => b.includes('انتزع الصدارة') || b.includes('الصدارة'));
  }
  if (title.category === 'رتب النقاط') {
    if (title.id === 'rank_trainee') return true;
    if (title.id === 'rank_starter') return points >= 100;
    if (title.id === 'rank_intrepid') return points >= 300;
    if (title.id === 'rank_brilliant') return points >= 600;
    if (title.id === 'rank_golden') return points >= 1000;
    if (title.id === 'rank_legend') return points >= 2000;
  }
  return badges.some(
    b => b.includes(title.badgeKey) || b.includes(title.name) || title.badgeKey.includes(b)
  );
};

