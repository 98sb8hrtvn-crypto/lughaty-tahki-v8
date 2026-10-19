import React, { useState } from 'react';
import { TeacherAnnouncementItem } from './parentMessagesTypes';

interface TeacherAnnouncementsManagerProps {
  announcements: TeacherAnnouncementItem[];
  customSingleText?: string;
  onUpdateAnnouncements: (updated: TeacherAnnouncementItem[], singleText?: string) => void;
  onSaveToCloud: () => void;
}

export const TeacherAnnouncementsManager: React.FC<TeacherAnnouncementsManagerProps> = ({
  announcements,
  customSingleText = '',
  onUpdateAnnouncements,
  onSaveToCloud
}) => {
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'توجيه' | 'تنبيه' | 'تحفيز' | 'عام'>('توجيه');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [singleTextDraft, setSingleTextDraft] = useState(customSingleText);

  const presets = [
    { cat: 'تحفيز' as const, text: '🏆 أبطال لغتي الخالدة: المنافسة تشتد في مضمار السباق، باركوا للفرسان المتصدرين!' },
    { cat: 'تنبيه' as const, text: '⏳ تنبيه هام: سؤال تحدي اليوم متاح لجميع الطلاب.. لا تفوت حصد نقاط الصدارة!' },
    { cat: 'توجيه' as const, text: '🩺 توجيه المعلم: راجعوا عيادة الأخطاء اللغوية لمعالجة العثرات وإتقان المهارات!' },
    { cat: 'عام' as const, text: '🇸🇦 نعتز بلغتنا العربية وهويتنا الوطنية.. استعدوا لمراحل نافس المعيارية القادمة!' }
  ];

  const handleAdd = (cat?: 'توجيه' | 'تنبيه' | 'تحفيز' | 'عام', txt?: string) => {
    const textToAdd = txt || newText.trim();
    const catToAdd = cat || newCategory;
    if (!textToAdd) return;

    const newItem: TeacherAnnouncementItem = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: textToAdd,
      active: true,
      order: announcements.length + 1,
      category: catToAdd,
      createdAt: Date.now()
    };

    const next = [...announcements, newItem];
    onUpdateAnnouncements(next, singleTextDraft);
    if (!txt) setNewText('');
  };

  const handleToggle = (id: string) => {
    const next = announcements.map(a => (a.id === id ? { ...a, active: !a.active } : a));
    onUpdateAnnouncements(next, singleTextDraft);
  };

  const handleDelete = (id: string) => {
    const next = announcements.filter(a => a.id !== id);
    onUpdateAnnouncements(next, singleTextDraft);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;
    const next = [...announcements];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    const reordered = next.map((item, idx) => ({ ...item, order: idx + 1 }));
    onUpdateAnnouncements(reordered, singleTextDraft);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const next = announcements.map(a => (a.id === id ? { ...a, text: editingText.trim() } : a));
    onUpdateAnnouncements(next, singleTextDraft);
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* رأس القسم */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)',
          color: '#fff',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📢</span> إدارة نصوص شريط البث المباشر وتوجيهات المعلم
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#d1fae5' }}>
            تحكم في نصوص التوجيهات والرسائل التي تظهر بشكل مستمر في شريط السباق أمام جميع الطلاب، مع إمكانية كتابة ما تشاء وحفظه سحابياً فوراً.
          </p>
        </div>
        <button
          className="btn gold"
          onClick={onSaveToCloud}
          style={{ padding: '8px 16px', fontWeight: 800, fontSize: 13 }}
        >
          💾 حفظ وتطبيق التعديلات سحابياً
        </button>
      </div>

      {/* قسم كتابة نص حر للمعلم يظهر في شريط السباق فوراً */}
      <div
        style={{
          background: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <strong style={{ fontSize: 14, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>✍️</span> كتابة حرة للمعلم تظهر مباشرة في شريط السباق أمام جميع الطلاب:
          </strong>
          <span style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>
            {singleTextDraft.trim() ? '🟢 النص منشور حالياً في الشريط' : '⚪ لا يوجد نص مخصص حالياً'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={singleTextDraft}
            onChange={e => setSingleTextDraft(e.target.value)}
            placeholder="اكتب هنا أي نص تريده ليظهر في شريط السباق أمام جميع الطلاب (مثال: موعد اختبار الوحدة، أو تهنئة للمتفوقين)..."
            style={{
              flex: 1,
              minWidth: 260,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #d97706',
              fontSize: 13,
              fontFamily: 'inherit',
              background: '#fff'
            }}
          />
          <button
            className="btn gold"
            onClick={() => {
              onUpdateAnnouncements(announcements, singleTextDraft.trim());
              onSaveToCloud();
            }}
            style={{ padding: '8px 18px', fontWeight: 800, fontSize: 13 }}
          >
            نشر في شريط السباق 🚀
          </button>
          {singleTextDraft && (
            <button
              className="btn light"
              onClick={() => {
                setSingleTextDraft('');
                onUpdateAnnouncements(announcements, '');
                onSaveToCloud();
              }}
              style={{ padding: '8px 14px', fontSize: 12 }}
              title="مسح النص"
            >
              مسح ✕
            </button>
          )}
        </div>
        <small style={{ color: '#78350f', fontSize: 11.5 }}>
          💡 اكتب ما تشاء وسيظهر مباشرة في شريط السباق المتدفق أمام جميع الطلاب، ويمكنك تعديله أو حذفه في أي وقت.
        </small>
      </div>

      {/* نموذج إضافة توجيه جديد لشريط السباق */}
      <div
        style={{
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <strong style={{ fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>➕</span> إضافة توجيه أو رسالة إضافية لشريط السباق:
          </strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>النوع:</span>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 700,
                background: '#fff'
              }}
            >
              <option value="توجيه">👨‍🏫 توجيه المعلم</option>
              <option value="تنبيه">⚠️ تنبيه عاجل</option>
              <option value="تحفيز">🔥 تحفيز وتشجيع</option>
              <option value="عام">📢 رسالة عامة</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="اكتب التوجيه أو الرسالة هنا (مثال: موعد التحدي القادم، أو تنبيه لمراجعة درس الحروف الناسخة)..."
            style={{
              flex: 1,
              minWidth: 260,
              padding: '9px 12px',
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 13,
              fontFamily: 'inherit'
            }}
          />
          <button
            className="btn green"
            onClick={() => handleAdd()}
            disabled={!newText.trim()}
            style={{ padding: '8px 18px', fontWeight: 800, fontSize: 13 }}
          >
            إضافة للشريط ➕
          </button>
        </div>

        {/* قوالب جاهزة سريعة بنقرة واحدة */}
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>
            ⚡ قوالب وتوجيهات جاهزة بنقرة واحدة:
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="btn light"
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999 }}
                onClick={() => handleAdd(p.cat, p.text)}
              >
                + {p.text.slice(0, 45)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* قائمة التوجيهات الحالية مع التحكم بالترتيب والتشغيل */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>
            📋 قائمة التوجيهات المخصصة ({announcements.length})
          </h4>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            المفعّلة حالياً: {announcements.filter(a => a.active).length}
          </span>
        </div>

        {announcements.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '25px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px dashed #cbd5e1',
              color: '#64748b',
              fontSize: 13
            }}
          >
            لم تقم بإضافة توجيهات إضافية بعد. يمكنك كتابة نص فوري في الأعلى أو اختيار أحد القوالب الجاهزة.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {announcements.map((item, idx) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    background: item.active ? '#ffffff' : '#f8fafc',
                    border: item.active ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                    opacity: item.active ? 1 : 0.65
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: '#f1f5f9',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#475569'
                      }}
                    >
                      #{idx + 1}
                    </span>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background:
                          item.category === 'تنبيه'
                            ? '#fee2e2'
                            : item.category === 'تحفيز'
                            ? '#fef3c7'
                            : '#d1fae5',
                        color:
                          item.category === 'تنبيه'
                            ? '#991b1b'
                            : item.category === 'تحفيز'
                            ? '#92400e'
                            : '#065f46',
                        fontSize: 11,
                        fontWeight: 800
                      }}
                    >
                      {item.category || 'توجيه'}
                    </span>

                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                        <input
                          type="text"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1.5px solid #047857',
                            fontSize: 13
                          }}
                        />
                        <button
                          className="btn green"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleSaveEdit(item.id)}
                        >
                          حفظ
                        </button>
                        <button
                          className="btn light"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => setEditingId(null)}
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13.5, color: '#1e293b', fontWeight: 600 }}>
                        {item.text}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* زر التشغيل والإيقاف */}
                    <button
                      className={`btn ${item.active ? 'green' : 'light'}`}
                      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                      onClick={() => handleToggle(item.id)}
                      title={item.active ? 'التوجيه مفعّل، انقر للإيقاف' : 'التوجيه متوقف، انقر للتشغيل'}
                    >
                      {item.active ? '🟢 شغال' : '⏸️ متوقف'}
                    </button>

                    {/* زر التعديل */}
                    {!isEditing && (
                      <button
                        className="btn light"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => {
                          setEditingId(item.id);
                          setEditingText(item.text);
                        }}
                      >
                        ✏️
                      </button>
                    )}

                    {/* أزرار الترتيب */}
                    <button
                      className="btn light"
                      disabled={idx === 0}
                      style={{ padding: '3px 7px', fontSize: 11 }}
                      onClick={() => handleMove(idx, 'up')}
                      title="تحريك لأعلى"
                    >
                      ⬆️
                    </button>
                    <button
                      className="btn light"
                      disabled={idx === announcements.length - 1}
                      style={{ padding: '3px 7px', fontSize: 11 }}
                      onClick={() => handleMove(idx, 'down')}
                      title="تحريك لأسفل"
                    >
                      ⬇️
                    </button>

                    {/* زر الحذف */}
                    <button
                      className="btn coral"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => handleDelete(item.id)}
                      title="حذف التوجيه"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
