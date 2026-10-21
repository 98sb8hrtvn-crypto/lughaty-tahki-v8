import React, { useState, useMemo } from 'react';
import { CloudStudentRow } from './App';

interface StudentStatsManagerProps {
  students: CloudStudentRow[];
  onRefresh?: () => void;
  isTeacherAdmin: boolean;
}

// ---------------------------------------------------------------------------
// دوال مساعدة لحساب التوقيت والتواريخ بتوقيت المملكة العربية السعودية (Asia/Riyadh)
// ---------------------------------------------------------------------------

/**
 * تنسيق التاريخ والوقت بتوقيت مكة المكرمة / السعودية
 */
export function formatSaudiDateTime(timestamp?: number | null): string {
  if (!timestamp || timestamp <= 0) return 'غير متوفر';
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString('ar-SA');
  }
}

/**
 * تنسيق التاريخ فقط بتوقيت السعودية
 */
export function formatSaudiDateOnly(timestamp?: number | null): string {
  if (!timestamp || timestamp <= 0) return 'غير متوفر';
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString('ar-SA');
  }
}

/**
 * حساب بداية اليوم الحالي (منتصف الليل 00:00:00) بتوقيت السعودية
 * توقيت مكة المكرمة هو دائماً UTC+3 بدون توقيت صيفي
 */
export function getSaudiMidnight(referenceDate: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(referenceDate);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    if (year && month && day) {
      return new Date(`${year}-${month}-${day}T00:00:00+03:00`).getTime();
    }
  } catch {}
  // احتياطي في حال عدم دعم Intl
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * تحويل فرق الوقت إلى نص عربي وصفي مقروء
 */
export function getRelativeTimeArabic(timestamp?: number | null, nowMs: number = Date.now()): string {
  if (!timestamp || timestamp <= 0) return 'غير متوفر';
  const diffSec = Math.floor((nowMs - timestamp) / 1000);
  if (diffSec < 0) return 'الآن';
  if (diffSec < 60) return `منذ ${diffSec} ثانية`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'منذ دقيقة واحدة';
  if (diffMin === 2) return 'منذ دقيقتين';
  if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'منذ ساعة واحدة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'منذ يوم';
  if (diffDays === 2) return 'منذ يومين';
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  return `منذ ${diffDays} يومًا`;
}

// ثوابت الفترات الزمنية للاتصال
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // متصل الآن: خلال آخر دقيقتين
const RECENT_THRESHOLD_MS = 30 * 60 * 1000; // نشط مؤخرًا: بين دقيقتين و 30 دقيقة

export type ActivityStatus = 'online' | 'recent' | 'inactive';

export function getStudentActivityStatus(
  student: CloudStudentRow,
  nowMs: number = Date.now()
): ActivityStatus {
  const lastTime = student.lastActiveAt || student.updatedAt || 0;
  if (!lastTime || lastTime <= 0) return 'inactive';
  const diff = nowMs - lastTime;
  if (diff <= ONLINE_THRESHOLD_MS) return 'online';
  if (diff <= RECENT_THRESHOLD_MS) return 'recent';
  return 'inactive';
}

export const StudentStatsManager: React.FC<StudentStatsManagerProps> = ({
  students,
  onRefresh,
  isTeacherAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'all' | 'أ' | 'ب' | 'ج'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ActivityStatus>('all');
  const [sortBy, setSortBy] = useState<'lastActive' | 'name' | 'registered' | 'points' | 'sessions'>('lastActive');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const nowMs = Date.now();
  const saudiMidnight = useMemo(() => getSaudiMidnight(new Date()), []);
  const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = nowMs - 30 * 24 * 60 * 60 * 1000;

  // إحصائيات عامة شاملة لكل المدرسة
  const globalStats = useMemo(() => {
    const total = students.length;
    let onlineCount = 0;
    let recentCount = 0;
    let todayCount = 0;
    let sevenDaysCount = 0;
    let thirtyDaysCount = 0;

    let countA = 0;
    let countB = 0;
    let countC = 0;

    students.forEach(s => {
      // تصنيف الفصول
      if (s.cls === 'أ') countA++;
      else if (s.cls === 'ب') countB++;
      else if (s.cls === 'ج') countC++;

      const lastTime = s.lastActiveAt || s.updatedAt || 0;
      const status = getStudentActivityStatus(s, nowMs);

      if (status === 'online') onlineCount++;
      else if (status === 'recent') recentCount++;

      if (lastTime >= saudiMidnight) todayCount++;
      if (lastTime >= sevenDaysAgo) sevenDaysCount++;
      if (lastTime >= thirtyDaysAgo) thirtyDaysCount++;
    });

    return {
      total,
      onlineCount,
      recentCount,
      todayCount,
      sevenDaysCount,
      thirtyDaysCount,
      countA,
      countB,
      countC
    };
  }, [students, nowMs, saudiMidnight, sevenDaysAgo, thirtyDaysAgo]);

  // الطلاب المصفون حسب شروط البحث والفصل والحالة
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // بحث بالاسم أو الكود
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesCode = s.code.includes(query);
        if (!matchesName && !matchesCode) return false;
      }

      // فلترة الفصل
      if (sectionFilter !== 'all' && s.cls !== sectionFilter) {
        return false;
      }

      // فلترة حالة النشاط
      if (statusFilter !== 'all') {
        const status = getStudentActivityStatus(s, nowMs);
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [students, searchTerm, sectionFilter, statusFilter, nowMs]);

  // إحصائيات النتائج المصفاة الحالية
  const filteredStats = useMemo(() => {
    const total = filteredStudents.length;
    let onlineCount = 0;
    let recentCount = 0;
    let todayCount = 0;
    let sevenDaysCount = 0;
    let thirtyDaysCount = 0;

    filteredStudents.forEach(s => {
      const lastTime = s.lastActiveAt || s.updatedAt || 0;
      const status = getStudentActivityStatus(s, nowMs);
      if (status === 'online') onlineCount++;
      else if (status === 'recent') recentCount++;

      if (lastTime >= saudiMidnight) todayCount++;
      if (lastTime >= sevenDaysAgo) sevenDaysCount++;
      if (lastTime >= thirtyDaysAgo) thirtyDaysCount++;
    });

    return {
      total,
      onlineCount,
      recentCount,
      todayCount,
      sevenDaysCount,
      thirtyDaysCount
    };
  }, [filteredStudents, nowMs, saudiMidnight, sevenDaysAgo, thirtyDaysAgo]);

  // فرز الطلاب
  const sortedStudents = useMemo(() => {
    const list = [...filteredStudents];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === 'lastActive') {
        const timeA = a.lastActiveAt || a.updatedAt || 0;
        const timeB = b.lastActiveAt || b.updatedAt || 0;
        comparison = timeB - timeA;
      } else if (sortBy === 'registered') {
        const regA = a.registeredAt || 0;
        const regB = b.registeredAt || 0;
        comparison = regB - regA;
      } else if (sortBy === 'points') {
        comparison = (b.points || 0) - (a.points || 0);
      } else if (sortBy === 'sessions') {
        const sessA = typeof a.sessionCount === 'number' ? a.sessionCount : -1;
        const sessB = typeof b.sessionCount === 'number' ? b.sessionCount : -1;
        comparison = sessB - sessA;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    return list;
  }, [filteredStudents, sortBy, sortOrder]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const isFiltered = sectionFilter !== 'all' || statusFilter !== 'all' || searchTerm.trim().length > 0;
  const displayedStats = isFiltered ? filteredStats : globalStats;

  return (
    <div className="student-stats-activity-container" dir="rtl" style={{ textAlign: 'right' }}>
      {/* رأس القسم مع العنوان وزر التحديث */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid #bbf7d0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#166534' }}>
                لوحة إحصائيات ونشاط الطلاب
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#15803d' }}>
                متابعة الحضور المباشر، ومعدلات الدخول، وسجل نشاط الطلاب في الوقت الفعلي بتوقيت المملكة العربية السعودية
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn light"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ffffff',
              color: '#166534',
              borderColor: '#bbf7d0',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>
              🔄
            </span>
            <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث البيانات'}</span>
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات الرئيسية (7 بطاقات مطابقة لمتطلبات التكليف بدقة) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>
            {isFiltered ? '📈 الإحصائيات وفق النتائج المحددة:' : '📈 إحصائيات المدرسة الشاملة:'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            توقيت القياس: مكة المكرمة (GMT+3)
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          {/* 1. إجمالي الطلاب المسجلين */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRight: '5px solid #3b82f6',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 700 }}>إجمالي المسجلين</span>
              <span style={{ fontSize: 20 }}>👥</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#1d4ed8', marginTop: 4 }}>
              {displayedStats.total}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
              طالب مسجل بالمنصة
            </div>
          </div>

          {/* 2. المتصلون الآن (آلية تواجد دقيقة خلال دقيقتين) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #bbf7d0',
              borderRight: '5px solid #22c55e',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#166534', fontWeight: 700 }}>متصل الآن</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                    boxShadow: '0 0 8px #22c55e'
                  }}
                />
                <span style={{ fontSize: 18 }}>🟢</span>
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#15803d', marginTop: 4 }}>
              {displayedStats.onlineCount}
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
              نشط خلال آخر دقيقتين
            </div>
          </div>

          {/* 3. النشطون مؤخرًا (مميزون بدقة عن المتصلين الآن: بين دقيقتين و30 دقيقة) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #fef08a',
              borderRight: '5px solid #eab308',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#854d0e', fontWeight: 700 }}>نشط مؤخرًا</span>
              <span style={{ fontSize: 18 }}>🟡</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#a16207', marginTop: 4 }}>
              {displayedStats.recentCount}
            </div>
            <div style={{ fontSize: 11, color: '#ca8a04', marginTop: 2 }}>
              نشاط خلال 2 - 30 دقيقة
            </div>
          </div>

          {/* 4. النشطون اليوم (وفق حدود اليوم بتوقيت مكة المكرمة) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #fed7aa',
              borderRight: '5px solid #f97316',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#9a3412', fontWeight: 700 }}>نشط اليوم</span>
              <span style={{ fontSize: 18 }}>📅</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#c2410c', marginTop: 4 }}>
              {displayedStats.todayCount}
            </div>
            <div style={{ fontSize: 11, color: '#ea580c', marginTop: 2 }}>
              سجل دخول أو نشاط اليوم
            </div>
          </div>

          {/* 5. النشطون خلال آخر 7 أيام */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e9d5ff',
              borderRight: '5px solid #a855f7',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b21a8', fontWeight: 700 }}>آخر 7 أيام</span>
              <span style={{ fontSize: 18 }}>🗓️</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#7e22ce', marginTop: 4 }}>
              {displayedStats.sevenDaysCount}
            </div>
            <div style={{ fontSize: 11, color: '#9333ea', marginTop: 2 }}>
              نشط خلال الأسبوع المنصرم
            </div>
          </div>

          {/* 6. النشطون خلال آخر 30 يوماً */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #ccfbf1',
              borderRight: '5px solid #14b8a6',
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#115e59', fontWeight: 700 }}>آخر 30 يوماً</span>
              <span style={{ fontSize: 18 }}>🏆</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f766e', marginTop: 4 }}>
              {displayedStats.thirtyDaysCount}
            </div>
            <div style={{ fontSize: 11, color: '#0d9488', marginTop: 2 }}>
              نشط خلال الشهر الماضي
            </div>
          </div>
        </div>
      </div>

      {/* أزرار توزيع الطلاب حسب الفصول (أ، ب، ج) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
          توزيع الفصول الدراسية:
        </div>

        <button
          onClick={() => setSectionFilter('all')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: sectionFilter === 'all' ? '2px solid #2563eb' : '1px solid #cbd5e1',
            background: sectionFilter === 'all' ? '#eff6ff' : '#ffffff',
            color: sectionFilter === 'all' ? '#1d4ed8' : '#334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          كل الفصول ({globalStats.total})
        </button>

        <button
          onClick={() => setSectionFilter('أ')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: sectionFilter === 'أ' ? '2px solid #16a34a' : '1px solid #cbd5e1',
            background: sectionFilter === 'أ' ? '#f0fdf4' : '#ffffff',
            color: sectionFilter === 'أ' ? '#15803d' : '#334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          فصل أول / أ ({globalStats.countA} طالب)
        </button>

        <button
          onClick={() => setSectionFilter('ب')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: sectionFilter === 'ب' ? '2px solid #d97706' : '1px solid #cbd5e1',
            background: sectionFilter === 'ب' ? '#fffbeb' : '#ffffff',
            color: sectionFilter === 'ب' ? '#b45309' : '#334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          فصل أول / ب ({globalStats.countB} طالب)
        </button>

        <button
          onClick={() => setSectionFilter('ج')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: sectionFilter === 'ج' ? '2px solid #9333ea' : '1px solid #cbd5e1',
            background: sectionFilter === 'ج' ? '#faf5ff' : '#ffffff',
            color: sectionFilter === 'ج' ? '#7e22ce' : '#334155',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          فصل أول / ج ({globalStats.countC} طالب)
        </button>
      </div>

      {/* شريط البحث، الفلترة، والترتيب المتجاوب (متوافق مع iPhone والشاشات الذكية) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          marginBottom: 20
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            alignItems: 'end'
          }}
        >
          {/* البحث بالاسم */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              🔍 البحث باسم الطالب:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="اكتب اسم الطالب للبحث..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: 16
                  }}
                  title="مسح البحث"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* فلترة حسب حالة النشاط */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              🟢 تصفية حالة النشاط:
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
                background: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="all">كل حالات النشاط</option>
              <option value="online">🟢 متصل الآن فقط ({globalStats.onlineCount})</option>
              <option value="recent">🟡 نشط مؤخراً فقط ({globalStats.recentCount})</option>
              <option value="inactive">⚪ غير متصل حالياً</option>
            </select>
          </div>

          {/* الترتيب حسب */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              🔃 ترتيب الطلاب حسب:
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="lastActive">آخر نشاط مسجل</option>
                <option value="name">اسم الطالب أبجدياً</option>
                <option value="registered">تاريخ التسجيل بالمنصة</option>
                <option value="points">النقاط التراكمية</option>
                <option value="sessions">عدد الجلسات والزيارات</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                title={sortOrder === 'desc' ? 'تنازلي (من الأحدث/الأعلى)' : 'تصاعدي (من الأقدم/الأقل)'}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 700
                }}
              >
                {sortOrder === 'desc' ? '⬇️ تنازلي' : '⬆️ تصاعدي'}
              </button>
            </div>
          </div>

          {/* نمط العرض (جدول / بطاقات للهاتف) */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: viewMode === 'table' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: viewMode === 'table' ? '#eff6ff' : '#ffffff',
                color: viewMode === 'table' ? '#1d4ed8' : '#64748b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              📋 جدول مفصل
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '9px 14px',
                borderRadius: 8,
                border: viewMode === 'cards' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: viewMode === 'cards' ? '#eff6ff' : '#ffffff',
                color: viewMode === 'cards' ? '#1d4ed8' : '#64748b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              📱 بطاقات جوال
            </button>
          </div>
        </div>

        {/* شريط معلومات الفلترة الحالية والنتائج */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            fontSize: 13,
            color: '#475569'
          }}
        >
          <div>
            <b>النتائج المعروضة:</b>{' '}
            <span style={{ color: '#1d4ed8', fontWeight: 800 }}>{sortedStudents.length}</span> طالب{' '}
            (من إجمالي <span style={{ fontWeight: 800 }}>{students.length}</span> طالب مسجل)
            {isFiltered && (
              <span style={{ marginRight: 8, color: '#d97706', fontSize: 12 }}>
                (تم تطبيق تصفية نشطة)
              </span>
            )}
          </div>

          {isFiltered && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSectionFilter('all');
                setStatusFilter('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'underline'
              }}
            >
              إلغاء جميع التصفية وعرض الكل
            </button>
          )}
        </div>
      </div>

      {/* دليل وسجل الطلاب (Student Directory) */}
      {sortedStudents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#ffffff',
            borderRadius: 14,
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#334155' }}>لم يتم العثور على طلاب مطابقين</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            جرب تغيير معايير البحث أو اختيار فصل دراسي آخر أو إعادة ضبط الفلترة.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* عرض الجدول المتجاوب الكامل */
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            overflowX: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              minWidth: 780
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>#</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>اسم الطالب</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>المرحلة الدراسية</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>الفصل</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>تاريخ التسجيل</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>حالة النشاط</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>آخر نشاط مسجل</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>الجلسات والزيارات</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>النقاط</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((st, index) => {
                const status = getStudentActivityStatus(st, nowMs);
                const lastTime = st.lastActiveAt || st.updatedAt || 0;
                const regDateText = st.registeredAt ? formatSaudiDateOnly(st.registeredAt) : 'غير متوفر';
                const lastDateTimeText = lastTime ? formatSaudiDateTime(lastTime) : 'غير متوفر';
                const relativeTime = getRelativeTimeArabic(lastTime, nowMs);
                const sessionsText = typeof st.sessionCount === 'number' && st.sessionCount >= 0 ? `${st.sessionCount} زيارة` : 'غير متوفر';

                return (
                  <tr
                    key={st.profileId || st.docId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.2s',
                      background: status === 'online' ? '#f0fdf4' : index % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}
                  >
                    {/* الترقيم */}
                    <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 600 }}>
                      {index + 1}
                    </td>

                    {/* اسم الطالب ورمزه */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        رمز الدخول: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{st.code}</code>
                      </div>
                    </td>

                    {/* المرحلة الدراسية */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                      {st.gradeLevel || 'الأول المتوسط'}
                    </td>

                    {/* الفصل */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontWeight: 800,
                          fontSize: 12,
                          background: st.cls === 'أ' ? '#dcfce7' : st.cls === 'ب' ? '#fef3c7' : '#f3e8ff',
                          color: st.cls === 'أ' ? '#166534' : st.cls === 'ب' ? '#92400e' : '#6b21a8'
                        }}
                      >
                        فصل {st.cls}
                      </span>
                    </td>

                    {/* تاريخ التسجيل */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#475569', fontSize: 12 }}>
                      {regDateText}
                    </td>

                    {/* حالة النشاط */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {status === 'online' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontWeight: 800,
                            fontSize: 12,
                            boxShadow: '0 0 8px rgba(34,197,94,0.3)'
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                          متصل الآن
                        </span>
                      ) : status === 'recent' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#fef9c3',
                            color: '#a16207',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 12
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#eab308' }} />
                          نشط مؤخرًا
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#f1f5f9',
                            color: '#64748b',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: 12
                          }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#cbd5e1' }} />
                          غير متصل
                        </span>
                      )}
                    </td>

                    {/* تاريخ ووقت آخر نشاط */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600 }}>{lastDateTimeText}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        <span>⏱️ {relativeTime}</span>
                        {st.lastActivityType && st.lastActivityType !== '—' && (
                          <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                            {st.lastActivityType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* عدد الجلسات أو الزيارات */}
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                      {sessionsText}
                    </td>

                    {/* النقاط */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: 6 }}>
                        ⭐ {st.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* عرض بطاقات متجاوبة مصممة للأجهزة الذكية والجوالات */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14
          }}
        >
          {sortedStudents.map(st => {
            const status = getStudentActivityStatus(st, nowMs);
            const lastTime = st.lastActiveAt || st.updatedAt || 0;
            const regDateText = st.registeredAt ? formatSaudiDateOnly(st.registeredAt) : 'غير متوفر';
            const lastDateTimeText = lastTime ? formatSaudiDateTime(lastTime) : 'غير متوفر';
            const relativeTime = getRelativeTimeArabic(lastTime, nowMs);
            const sessionsText = typeof st.sessionCount === 'number' && st.sessionCount >= 0 ? `${st.sessionCount} زيارة` : 'غير متوفر';

            return (
              <div
                key={st.profileId || st.docId}
                style={{
                  background: '#ffffff',
                  borderRadius: 14,
                  border: status === 'online' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* الرأس: الاسم والحالة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                      {st.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {st.gradeLevel || 'الأول المتوسط'} •{' '}
                      <span
                        style={{
                          fontWeight: 700,
                          color: st.cls === 'أ' ? '#166534' : st.cls === 'ب' ? '#92400e' : '#6b21a8'
                        }}
                      >
                        فصل {st.cls}
                      </span>
                    </div>
                  </div>

                  {status === 'online' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '3px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 800
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                      متصل الآن
                    </span>
                  ) : status === 'recent' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#fef9c3',
                        color: '#a16207',
                        padding: '3px 8px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#eab308' }} />
                      نشط مؤخراً
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#64748b',
                        padding: '3px 8px',
                        borderRadius: 20,
                        fontSize: 11
                      }}
                    >
                      غير متصل
                    </span>
                  )}
                </div>

                {/* تفاصيل النشاط والبيانات */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>آخر نشاط:</span>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{lastDateTimeText}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>المدة المنقضية:</span>
                    <span style={{ color: '#0369a1', fontWeight: 600 }}>{relativeTime}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>تاريخ التسجيل:</span>
                    <span style={{ color: '#334155' }}>{regDateText}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>عدد الجلسات:</span>
                    <span style={{ fontWeight: 700, color: '#334155' }}>{sessionsText}</span>
                  </div>
                </div>

                {/* شريط الإنجاز والنقاط */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #f1f5f9',
                    fontSize: 12
                  }}
                >
                  <span style={{ color: '#64748b' }}>
                    رمز الطالب: <code style={{ fontWeight: 700 }}>{st.code}</code>
                  </span>
                  <span style={{ fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 6 }}>
                    ⭐ {st.points} نقطة
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* تنبيه خصوصية وحماية بيانات الطلاب للمشرف المعلم */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          background: '#f0f9ff',
          borderRadius: 12,
          border: '1px solid #bae6fd',
          fontSize: 12,
          color: '#0369a1',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <span style={{ fontSize: 20 }}>🔒</span>
        <div>
          <b>أمان وحماية السجلات:</b> هذه الإحصائيات وسجل حضور ونشاط الطلاب محمية بقواعد أمان Firebase المعتمدة ولا تظهر إلا بحساب المعلم المعتمد. يتم قياس التواجد المباشر بناءً على نبضات التفاعل الفعلي عبر المنصة.
        </div>
      </div>
    </div>
  );
};
