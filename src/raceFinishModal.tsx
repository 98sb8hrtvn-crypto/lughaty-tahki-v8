import React from 'react';

interface RaceFinishModalProps {
  show: boolean;
  onClose: () => void;
  studentName: string;
  studentCls: string;
  points: number;
  completedAt?: number;
}

export const RaceFinishModal: React.FC<RaceFinishModalProps> = ({
  show,
  onClose,
  studentName,
  studentCls,
  points,
  completedAt
}) => {
  if (!show) return null;

  const dateStr = new Date(completedAt || Date.now()).toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className="modal show"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="وسام إتمام السباق وعبور خط النهاية"
    >
      <div
        className="dialog"
        style={{
          width: 'min(640px, 94%)',
          background: 'linear-gradient(180deg, #fffdfa 0%, #ffffff 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          border: '3px solid #f59e0b',
          boxShadow: '0 12px 40px rgba(245, 158, 11, 0.35)'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
            color: '#fff',
            padding: '24px 20px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 4 }}>🏇🏆✨</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            مبارك! لقد عبرت خط النهاية وتوجت بطلاً للسباق
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#fef3c7', fontWeight: 600 }}>
            شهادة إتمام مضمار سباق فرسان لغتي الخالدة
          </p>
          <button
            className="close"
            onClick={onClose}
            style={{ position: 'absolute', top: 12, left: 16, color: '#fff', fontSize: 24 }}
          >
            ×
          </button>
        </div>

        <div className="body" style={{ padding: '24px 22px', textAlign: 'center' }}>
          <div
            style={{
              border: '2px dashed #f59e0b',
              borderRadius: 16,
              padding: '20px 16px',
              background: '#fffbeb',
              marginBottom: 18
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 999,
                background: '#fef3c7',
                border: '1px solid #fde047',
                color: '#92400e',
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 10
              }}
            >
              🎖️ وسام «فاتح خط النهاية الذهبي»
            </span>

            <h3 style={{ fontSize: 22, color: '#1e293b', margin: '0 0 6px' }}>
              الفارس البطل: <span style={{ color: '#047857' }}>{studentName}</span>
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
              الصف الأول المتوسط • فصل {studentCls}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                margin: '16px 0',
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '8px 16px',
                  minWidth: 120
                }}
              >
                <span style={{ display: 'block', fontSize: 11, color: '#78350f' }}>مجموع النقاط</span>
                <strong style={{ fontSize: 18, color: '#b45309' }}>{points}⭐ نقطة</strong>
              </div>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #fde68a',
                  borderRadius: 10,
                  padding: '8px 16px',
                  minWidth: 160
                }}
              >
                <span style={{ display: 'block', fontSize: 11, color: '#78350f' }}>تاريخ وتوقيت الإنجاز</span>
                <strong style={{ fontSize: 13, color: '#065f46' }}>{dateStr}</strong>
              </div>
            </div>

            <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#451a03', lineHeight: 1.7 }}>
              نحيّي فيك هذا الإصرار والاجتهاد؛ لقد أتقنت دروس الوحدات المقررة، وعالجت عثراتك اللغوية في العيادة، وتجاوزت تحديات اليوم ببراعة لتستحق هذا التتويج المستحق!
            </p>

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid #fde68a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: '#78350f'
              }}
            >
              <span>معلم المادة: <strong>أ. مساعد سليمان الصخري</strong></span>
              <span>المملكة العربية السعودية 🇸🇦</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              className="btn gold"
              style={{ padding: '10px 24px', fontWeight: 800, fontSize: 14 }}
              onClick={onClose}
            >
              متابعة التميز وخوض التحديات 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
