import React, { useState, useMemo } from 'react';
import { ParentMessage, MessageCategory, MessageStatus } from './parentMessagesTypes';

interface TeacherMessagesManagerProps {
  messages: ParentMessage[];
  onReply: (messageId: string, replyText: string) => Promise<void> | void;
  onMarkRead: (messageId: string) => Promise<void> | void;
  onDelete: (messageId: string) => Promise<void> | void;
}

export const TeacherMessagesManager: React.FC<TeacherMessagesManagerProps> = ({
  messages,
  onReply,
  onMarkRead,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MessageStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MessageCategory>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyingId, setActiveReplyingId] = useState<string | null>(null);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      // Search filter: student name, text, replyText, date
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const dateStr = new Date(msg.createdAt).toLocaleDateString('ar-SA');
        const matchName = msg.studentName.toLowerCase().includes(q);
        const matchText = msg.text.toLowerCase().includes(q);
        const matchReply = msg.replyText ? msg.replyText.toLowerCase().includes(q) : false;
        const matchDate = dateStr.includes(q);
        if (!matchName && !matchText && !matchReply && !matchDate) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && msg.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && msg.category !== categoryFilter) return false;

      return true;
    });
  }, [messages, searchTerm, statusFilter, categoryFilter]);

  const newCount = messages.filter(m => m.status === 'جديد').length;
  const readCount = messages.filter(m => m.status === 'مقروءة').length;
  const repliedCount = messages.filter(m => m.status === 'تم الرد').length;

  const handleSendReply = async (messageId: string) => {
    const text = replyDrafts[messageId]?.trim();
    if (!text) return;
    setSubmittingReplyId(messageId);
    try {
      await onReply(messageId, text);
      setReplyDrafts(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      setActiveReplyingId(null);
    } finally {
      setSubmittingReplyId(null);
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
            جديد
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
              border: '1px solid #fcd34d'
            }}
          >
            👁️ مقروءة
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
              border: '1px solid #86efac'
            }}
          >
            ✅ تم الرد
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* رأس القسم والتوجيه */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1.5px solid #a7f3d0',
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
          <h3 style={{ margin: 0, fontSize: 16, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📩</span> صندوق رسائل أولياء الأمور الخاص بالمعلم
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#047857' }}>
            استقبل استفسارات أولياء الأمور حول المستوى الدراسي، الواجبات، والمشكلات التقنية، ورد عليها مباشرة داخل التطبيق مع الحفاظ على الخصوصية التامة.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: '#047857',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800
            }}
          >
            إجمالي الرسائل: {messages.length}
          </span>
          {newCount > 0 && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: '#ef4444',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                animation: 'pulse 1.5s infinite'
              }}
            >
              🔥 جديد: {newCount}
            </span>
          )}
        </div>
      </div>

      {/* شريط البحث والفلترة */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* حقل البحث */}
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 ابحث باسم الطالب، محتوى الرسالة، أو التاريخ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
                fontSize: 13,
                fontFamily: 'inherit'
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
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* فلتر التصنيف */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 700,
              background: '#fff'
            }}
          >
            <option value="all">📂 جميع التصنيفات</option>
            <option value="متابعة المستوى">📊 متابعة المستوى</option>
            <option value="الواجبات">📝 الواجبات</option>
            <option value="المشكلات التقنية">⚙️ المشكلات التقنية</option>
            <option value="الاقتراحات والآراء">💡 الاقتراحات والآراء</option>
          </select>
        </div>

        {/* تابات فلترة الحالة */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn ${statusFilter === 'all' ? 'primary' : 'light'}`}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            الكل ({messages.length})
          </button>
          <button
            onClick={() => setStatusFilter('جديد')}
            className={`btn ${statusFilter === 'جديد' ? 'primary' : 'light'}`}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              background: statusFilter === 'جديد' ? '#0284c7' : undefined,
              color: statusFilter === 'جديد' ? '#fff' : undefined
            }}
          >
            🔵 رسائل جديدة ({newCount})
          </button>
          <button
            onClick={() => setStatusFilter('مقروءة')}
            className={`btn ${statusFilter === 'مقروءة' ? 'primary' : 'light'}`}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            👁️ مقروءة ({readCount})
          </button>
          <button
            onClick={() => setStatusFilter('تم الرد')}
            className={`btn ${statusFilter === 'تم الرد' ? 'primary' : 'light'}`}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            ✅ تم الرد عليها ({repliedCount})
          </button>
        </div>
      </div>

      {/* قائمة الرسائل */}
      {filteredMessages.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 16px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1.5px dashed #cbd5e1',
            color: '#64748b'
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>لا توجد رسائل مطابقة لخيارات البحث أو الفلترة.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredMessages.map(msg => {
            const isReplying = activeReplyingId === msg.id;
            const draft = replyDrafts[msg.id] || '';

            return (
              <div
                key={msg.id}
                style={{
                  background: msg.status === 'جديد' ? '#f0f9ff' : '#ffffff',
                  border: msg.status === 'جديد' ? '2px solid #7dd3fc' : '1.5px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'border 0.2s ease'
                }}
              >
                {/* رأس كارت الرسالة */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🎓</span>
                    <div>
                      <strong style={{ fontSize: 15, color: '#0f172a' }}>
                        ولي أمر الطالب: {msg.studentName}
                      </strong>
                      <span style={{ color: '#64748b', fontSize: 12, marginRight: 6 }}>
                        (فصل {msg.studentCls})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {msg.category}
                    </span>
                    <div>{getStatusBadge(msg.status)}</div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {new Date(msg.createdAt).toLocaleDateString('ar-SA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* نص رسالة ولي الأمر */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: 10,
                    borderRight: '4px solid #0284c7',
                    fontSize: 14,
                    color: '#1e293b',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    marginBottom: 10
                  }}
                >
                  {msg.text}
                </div>

                {/* الرد السابق إن وجد */}
                {msg.replyText && (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: 10,
                      padding: '10px 14px',
                      borderRight: '4px solid #16a34a',
                      marginBottom: 10
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>👨‍🏫</span> ردك السابق:
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
                    <p style={{ margin: 0, fontSize: 13, color: '#14532d', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {msg.replyText}
                    </p>
                  </div>
                )}

                {/* أزرار الإجراءات والرد */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn primary"
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}
                      onClick={() => setActiveReplyingId(isReplying ? null : msg.id)}
                    >
                      {isReplying ? 'إلغاء الرد' : msg.replyText ? '✏️ تعديل الرد أو إضافة رد جديد' : '✍️ الرد على الرسالة'}
                    </button>

                    {msg.status === 'جديد' && (
                      <button
                        className="btn light"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                        onClick={() => onMarkRead(msg.id)}
                      >
                        👁️ تحديد كمقروءة
                      </button>
                    )}
                  </div>

                  <button
                    className="btn coral"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف رسالة ولي أمر الطالب ${msg.studentName}؟`)) {
                        onDelete(msg.id);
                      }
                    }}
                  >
                    🗑️ حذف
                  </button>
                </div>

                {/* حقل إدخال الرد عند النقر */}
                {isReplying && (
                  <div
                    style={{
                      marginTop: 12,
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>
                      اكتب ردك التربوي المباشر لولي الأمر:
                    </label>
                    <textarea
                      value={draft || msg.replyText || ''}
                      onChange={e => setReplyDrafts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                      placeholder="أهلاً بك يا ولي الأمر الكريم، نشكر لك حرصك واهتمامك..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        lineHeight: 1.5
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        className="btn light"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() => setActiveReplyingId(null)}
                      >
                        إلغاء
                      </button>
                      <button
                        className="btn green"
                        style={{ padding: '6px 16px', fontSize: 12, fontWeight: 800 }}
                        disabled={submittingReplyId === msg.id || !(draft || msg.replyText)?.trim()}
                        onClick={() => handleSendReply(msg.id)}
                      >
                        {submittingReplyId === msg.id ? 'جاري الإرسال...' : 'إرسال الرد لولي الأمر فوراً ✅'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
