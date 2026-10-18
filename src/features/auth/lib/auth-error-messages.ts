export type AuthErrorContent = {
  title: string;
  description?: string;
};

const DEFAULT_AUTH_ERROR: AuthErrorContent = {
  title: 'حدث خطأ أثناء تسجيل الدخول',
  description: 'يرجى المحاولة مرة أخرى.',
};

const AUTH_ERROR_MESSAGES: Record<string, AuthErrorContent> = {
  Configuration: {
    title: 'تعذّر إكمال تسجيل الدخول',
    description:
      'خدمة تسجيل الدخول غير مهيأة بشكل صحيح حالياً. جرّب مزوداً آخر أو حاول لاحقاً. إذا استمرت المشكلة، تواصل مع الدعم.',
  },
  AccessDenied: {
    title: 'تم رفض الوصول',
    description: 'لم يُسمح بإتمام تسجيل الدخول. يمكنك المحاولة مرة أخرى.',
  },
  Verification: {
    title: 'انتهت صلاحية الرابط',
    description: 'رابط التحقق غير صالح أو منتهي. اطلب رابطاً جديداً.',
  },
  OAuthSignin: {
    title: 'تعذّر بدء تسجيل الدخول',
    description: 'حدث خطأ عند الاتصال بمزود تسجيل الدخول. جرّب مرة أخرى.',
  },
  OAuthCallback: {
    title: 'تعذّر إكمال تسجيل الدخول',
    description:
      'فشلت عملية المصادقة بعد العودة من مزود تسجيل الدخول. تأكد من السماح بالوصول ثم أعد المحاولة.',
  },
  OAuthCreateAccount: {
    title: 'تعذّر إنشاء الحساب',
    description: 'لم نتمكن من إنشاء حسابك. جرّب طريقة تسجيل دخول أخرى.',
  },
  EmailCreateAccount: {
    title: 'تعذّر إنشاء الحساب',
  },
  Callback: {
    title: 'حدث خطأ أثناء تسجيل الدخول',
  },
  OAuthAccountNotLinked: {
    title: 'البريد مرتبط بحساب آخر',
    description:
      'هذا البريد الإلكتروني مرتبط بطريقة تسجيل دخول أخرى. استخدم نفس المزود الذي سجّلت به سابقاً.',
  },
  SessionRequired: {
    title: 'يلزم تسجيل الدخول',
    description: 'سجّل الدخول للمتابعة إلى الصفحة المطلوبة.',
  },
};

export function getAuthErrorContent(
  code: string | null,
): AuthErrorContent | null {
  if (!code) return null;

  return AUTH_ERROR_MESSAGES[code] ?? DEFAULT_AUTH_ERROR;
}
