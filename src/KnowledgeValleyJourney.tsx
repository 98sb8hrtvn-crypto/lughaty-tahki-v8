import React, { useEffect, useState } from 'react';
import './KnowledgeValleyJourney.css';

type JourneyView = 'intro' | 'map';

type Gate = {
  id: number;
  title: string;
  subtitle: string;
  symbol: string;
  unit?: number;
  description: string;
};

type Props = {
  studentId: string;
  studentName: string;
  canEnterUnit: (unit: number) => boolean;
  onStartUnit: (unit: number) => void;
};

const GATES: Gate[] = [
  { id: 1, title: 'بوابة القيم الإسلامية', subtitle: 'المحطة الأولى', symbol: '🕌', unit: 1, description: 'ابدأ رحلتك بالقيم التي تهدي خطواتك وتفتح أول أبواب المعرفة.' },
  { id: 2, title: 'مدينة الأعلام', subtitle: 'المحطة الثانية', symbol: '🏛️', unit: 2, description: 'اكتشف أثر الأعلام، وتأمل ما تحمله النصوص من معرفة ومعانٍ.' },
  { id: 3, title: 'حصن الوطن', subtitle: 'المحطة الثالثة', symbol: '🇸🇦', unit: 3, description: 'واصل الطريق، واجعل لغتك جسرًا إلى الاعتزاز بالوطن.' },
  { id: 4, title: 'غابة الكلمات', subtitle: 'الباب الرابع', symbol: '🌳', description: 'ممرّ للألفاظ والتراكيب ينتظرك في أسرار الوادي.' },
  { id: 5, title: 'قلعة النحو', subtitle: 'الباب الخامس', symbol: '🏰', description: 'هنا تنتظم الكلمات وتكشف التراكيب عن أسرارها.' },
  { id: 6, title: 'جبال البلاغة', subtitle: 'الباب السادس', symbol: '⛰️', description: 'اصعد نحو دقة التعبير وجمال التصوير.' },
  { id: 7, title: 'مكتبة الأسرار', subtitle: 'الباب السابع', symbol: '📚', description: 'المحطة التي تقود إلى سر المنارة ونور الوادي.' }
];

function readJourneyState(studentId: string): JourneyView {
  if (typeof window === 'undefined') return 'intro';
  try {
    return window.localStorage.getItem(`lt-knowledge-valley-v1:${studentId}`) === 'started' ? 'map' : 'intro';
  } catch {
    return 'intro';
  }
}

export function KnowledgeValleyJourney({ studentId, studentName, canEnterUnit, onStartUnit }: Props) {
  const [view, setView] = useState<JourneyView>(() => readJourneyState(studentId));

  useEffect(() => {
    setView(readJourneyState(studentId));
  }, [studentId]);

  const beginJourney = () => {
    try {
      window.localStorage.setItem(`lt-knowledge-valley-v1:${studentId}`, 'started');
    } catch {
      // The journey remains usable if browser storage is unavailable.
    }
    setView('map');
  };

  return (
    <section className="kvj" dir="rtl" aria-label="رحلة سر وادي المعرفة">
      <div className="kvj-sky">
        <div className="kvj-stars" aria-hidden="true">✦　·　✧　　　✦　　·　✧</div>
        <div className="kvj-heading">
          <span className="kvj-eyebrow">مغامرتك التعليمية تبدأ من هنا</span>
          <h2>سر وادي المعرفة</h2>
          <p>رحلة لغوية يقودها الفضول، وتفتح أبوابها بالمعرفة</p>
        </div>
        <div className="kvj-landscape" aria-hidden="true">
          <span className="kvj-moon">☾</span>
          <span className="kvj-mountain kvj-mountain-back" />
          <span className="kvj-mountain kvj-mountain-front" />
          <span className="kvj-tower">🏯</span>
          <span className="kvj-falcon">🦅</span>
          <span className="kvj-path" />
        </div>
      </div>

      {view === 'intro' ? (
        <div className="kvj-story">
          <div className="kvj-story-mark"><span>📜</span><span>الفصل الافتتاحي</span></div>
          <h3>اختفى نور المنارة… وأُغلقت أبواب الوادي السبعة!</h3>
          <p>
            في ليلة هادئة، خفت نور المنارة التي تهدي السائرين في وادي المعرفة،
            وأُغلقت أبوابه السبعة. ظهر الحكيم حارس أسرار اللغة، وأخبرك أن إعادة
            النور لا تكون بالقوة، بل بالفهم والتأمل وحسن استخدام اللغة.
          </p>
          <p>
            ستكون أنت بطل الحكاية، ويرافقك صقر الوادي في الطريق، أما الحكيم
            فسيكون مرشدك؛ يطرح عليك الأسئلة، ويمنحك التلميحات حين تحتاج إليها،
            دون أن يكشف لك الإجابة.
          </p>
          <div className="kvj-mentor-note">
            <span className="kvj-mentor-icon">🧭</span>
            <div>
              <strong>رسالة الحكيم إلى {studentName.split(/\s+/)[0] || 'بطلنا'}</strong>
              <span>تأنَّ في التفكير؛ فكل إجابة صحيحة تقرّبك من سر المنارة.</span>
            </div>
          </div>
          <button className="kvj-primary" type="button" onClick={beginJourney}>
            ابدأ الرحلة وافتح خريطة الوادي <span>←</span>
          </button>
          <small className="kvj-safety-note">تقدمك في القصة يُحفظ على هذا الجهاز، ولا تُضاف نقاط لمجرد مشاهدة القصة.</small>
        </div>
      ) : (
        <div className="kvj-map">
          <div className="kvj-map-heading">
            <div>
              <span className="kvj-eyebrow">خريطة المغامرة</span>
              <h3>اختر بوابتك التالية يا بطل</h3>
            </div>
            <button className="kvj-story-link" type="button" onClick={() => setView('intro')}>📜 تذكّر القصة</button>
          </div>
          <div className="kvj-companion">
            <span className="kvj-companion-bird">🦅</span>
            <p><strong>الصقر رفيقك:</strong> راقب العلامات، واقرأ وصف كل بوابة قبل دخولها.</p>
          </div>
          <div className="kvj-gates">
            {GATES.map((gate) => {
              const curriculumGate = Boolean(gate.unit);
              const open = curriculumGate ? canEnterUnit(gate.unit as number) : false;
              return (
                <article className={`kvj-gate ${curriculumGate ? (open ? 'is-open' : 'is-closed') : 'is-mystery'}`} key={gate.id}>
                  <div className="kvj-gate-symbol">{gate.symbol}</div>
                  <div className="kvj-gate-copy">
                    <span className="kvj-gate-step">{gate.subtitle}</span>
                    <h4>{gate.title}</h4>
                    <p>{gate.description}</p>
                  </div>
                  {curriculumGate ? (
                    <button
                      type="button"
                      className="kvj-gate-action"
                      disabled={!open}
                      onClick={() => onStartUnit(gate.unit as number)}
                    >
                      {open ? 'ادخل البوابة ←' : '🔒 مغلقة بإذن المعلم'}
                    </button>
                  ) : (
                    <span className="kvj-gate-sealed">🔒 سيُكشف لاحقًا</span>
                  )}
                </article>
              );
            })}
          </div>
          <div className="kvj-rule">
            <span>💡</span>
            <p><strong>قاعدة الرحلة:</strong> فكّر أولًا، واستعن بتلميحات الحكيم عند الحاجة. تبقى نقاطك التعليمية مرتبطة بالإجابة الصحيحة من أول محاولة، ولا تمنحك مشاهدة القصة نقاطًا إضافية.</p>
          </div>
        </div>
      )}
    </section>
  );
}
