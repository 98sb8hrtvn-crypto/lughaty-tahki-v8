import React, { useState } from 'react';
import { ParentMessage, MessageCategory } from './parentMessagesTypes';

interface ParentMessagesModalProps {
  show: boolean;
  onClose: () => void;
  studentName: string;
  studentCls: string;
  studentId: string;
  messages: ParentMessage[];
  onSendMessage: (category: MessageCategory, text: string) => Promise<void> | void;
}

export const ParentMessagesModal: React.FC<ParentMessagesModalProps> = ({
  show,
  onClose,
  studentName,
  studentCls,
  studentId,
  messages,
  onSendMessage
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory>('متابعة المستوى');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  // فلترة الرسائل الخاصة بهذا الطالب فقط لضمان الخصوصية التامة
  const studentMessages = messages
    .filter(m => m.studentId === studentId || m.studentName === studentName)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onSendMessage(selectedCategory, trimmed);
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ParentMessage['status']) => {
    switch (status) {
      case 'جديد':
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 999,
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #7dd3fc',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
            جديد (بانتظار قراءة المعلم)
          </span>
        );
      case 'مقروءة':
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 999,
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fcd34d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            👁️ مقروءة من قِبل المعلم
          </span>
        );
      case 'تم الرد':
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 999,
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #86efac',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            ✅ تم الرد من المعلم
          </span>
        );
    }
  };

  const getCategoryIcon = (cat: MessageCategory) => {
    switch (cat) {
      case 'متابعة المستوى':
        return '📊';
      case 'الواجبات':
        return '📝';
      case 'المشكلات التقنية':
        return '⚙️';
      case 'الاقتراحات والآراء':
        return '💡';
    }
  };

  return (
    <div
      className="modal show"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="نافذة تواصل ولي الأمر مع المعلم"
    >
      <div className="dialog" style={{ width: 'min(780px, 96%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div
          className="head"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0f766e 100%)',
            color: '#fff',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>📩</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>
                تواصل ولي أمر الطالب: {studentName} ({studentCls})
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#d1fae5' }}>
                قناة تواصل نصية خاصة وسرية ومباشرة مع معلم المادة (أ. مساعد سليمان الصخري)
              </p>
            </div>
          </div>
          <button className="close" onClick={onClose} aria-label="إغلاق">
            ×
          </button>
        </div>

        <div className="body" style={{ overflowY: 'auto', padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* تنبيه الخصوصية */}
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: '#166534'
            }}
          >
            <span style={{ fontSize: 22 }}>🔒</span>
            <div>
              <strong>خصوصية تامة ومحمية:</strong> هذه الرسائل خاصة فقط بينك وبين معلم المادة، ولا تظهر لأي طالب أو ولي أمر آخر، ولا تظهر في شريط السباق العام إطلاقاً.
            </div>
          </div>

          {/* نموذج إرسال رسالة جديدة */}
          <form
            onSubmit={handleSubmit}
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
              <label style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✍️</span> كتابة رسالة أو استفسار جديد للمعلم:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>التصنيف:</span>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value as MessageCategory)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #94a3b8',
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#fff'
                  }}
                >
                  <option value="متابعة المستوى">📊 متابعة المستوى الدراسي</option>
                  <option value="الواجبات">📝 الواجبات والاختبارات</option>
                  <option value="المشكلات التقنية">⚙️ المشكلات التقنية</option>
                  <option value="الاقتراحات والآراء">💡 الاقتراحات والآراء</option>
                </select>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="اكتب رسالتك أو استفسارك هنا بكل وضوح (مثال: استفسار عن نتائج اختبار نافس، أو طلب مساعدة في واجب القواعد)..."
              rows={3}
              maxLength={800}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: 1.6
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                المتبقي من الحروف: {800 - text.length}
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !text.trim()}
                className="btn primary"
                style={{
                  padding: '8px 20px',
                  fontWeight: 800,
                  fontSize: 14,
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: isSubmitting || !text.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !text.trim() ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة للمعلم 📤'}
              </button>
            </div>
          </form>

          {/* سجل المحادثات السابقة */}
          <div>
            <h3 style={{ fontSize: 16, color: '#1e293b', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💬</span> سجل الرسائل والردود ({studentMessages.length})
            </h3>

            {studentMessages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 16px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px dashed #cbd5e1',
                  color: '#64748b'
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>لا توجد رسائل سابقة حتى الآن.</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                  يمكنك إرسال أول رسالة للمعلم عبر النموذج أعلاه، وسيتم إشعارك فور رد المعلم.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {studentMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 14,
                      padding: 16,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{getCategoryIcon(msg.category)}</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#334155' }}>
                          {msg.category}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>•</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(msg.createdAt).toLocaleDateString('ar-SA', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div>{getStatusBadge(msg.status)}</div>
                    </div>

                    {/* نص رسالة ولي الأمر */}
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: 10,
                        borderRight: '4px solid #047857',
                        fontSize: 14,
                        color: '#1e293b',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* رد المعلم إن وجد */}
                    {msg.replyText && (
                      <div
                        style={{
                          marginTop: 12,
                          background: '#f0fdf4',
                          border: '1.5px solid #86efac',
                          borderRadius: 10,
                          padding: '12px 14px',
                          borderRight: '4px solid #16a34a'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>👨‍🏫</span> رد المعلم ({msg.teacherName || 'أ. مساعد سليمان الصخري'}):
                          </span>
                          {msg.replyAt && (
                            <span style={{ fontSize: 11, color: '#15803d' }}>
                              {new Date(msg.replyAt).toLocaleDateString('ar-SA', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: '#14532d', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {msg.replyText}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="foot" style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn light" onClick={onClose}>
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
