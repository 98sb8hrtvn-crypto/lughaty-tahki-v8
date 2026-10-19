// =========================================================================
// أنواع وبيانات نظام تواصل أولياء الأمور مع المعلم (بوابة الرسائل الخاصة)
// =========================================================================

export type MessageCategory =
  | 'متابعة المستوى'
  | 'الواجبات'
  | 'المشكلات التقنية'
  | 'الاقتراحات والآراء';

export type MessageStatus = 'جديد' | 'مقروءة' | 'تم الرد';

export interface ParentMessage {
  id: string;
  studentId: string;
  studentName: string; // يُعرض اسم الطالب فقط في المحادثة احتراماً للخصوصية
  studentCls: string;
  category: MessageCategory;
  text: string;
  status: MessageStatus;
  createdAt: number;
  replyText?: string;
  replyAt?: number;
  teacherName?: string;
}

export interface TeacherAnnouncementItem {
  id: string;
  text: string;
  active: boolean;
  order: number;
  createdAt: number;
  category: 'توجيه' | 'تنبيه' | 'تحفيز' | 'عام';
}
