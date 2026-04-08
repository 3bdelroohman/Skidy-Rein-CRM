# Skidy Rein CRM

لوحة تحكم CRM عربية (RTL) لأكاديمية Skidy Rein لتعليم البرمجة للأطفال أونلاين.

## ما الذي تم في هذه الحزمة؟
- توحيد الترجمات والحالات داخل `src/config/labels.ts`
- إضافة metadata مركزية للألوان والحالات داخل `src/config/status-meta.ts`
- إصلاح `database.types.ts` وتحويله لملف UTF-8 صحيح بدل placeholder معطوب
- إنشاء طبقة خدمات قابلة للتوسعة:
  - `src/services/leads.service.ts`
  - `src/services/follow-ups.service.ts`
  - `src/services/students.service.ts`
  - `src/services/reports.service.ts`
  - `src/services/dashboard.service.ts`
- تحويل صفحات `dashboard / leads / lead details / follow-ups / students / reports` لاستخدام نفس الطبقة
- تشغيل fallback محلي عبر `localStorage` بحيث يستمر النظام بالعمل حتى لو تعطل الاتصال بـ Supabase أو لم تكتمل الـ schema بعد
- إضافة quality gates:
  - `npm run typecheck`
  - `npm run check`
  - GitHub Actions workflow داخل `.github/workflows/ci.yml`

## المبدأ الحالي
المشروع الآن ليس Demo صِرف، وليس Production مكتمل 100%.
هو الآن في مرحلة **Foundation + Realistic Data Flow**:
- يقرأ من Supabase إذا كان الجدول/الأعمدة متاحة
- ويرجع تلقائياً إلى `localStorage + mock data` عند الفشل

هذا يسمح لك بالتطوير التدريجي بدون كسر الواجهة كل مرة.

## التشغيل المحلي
```bash
npm install
npm run dev
```

## فحص الجودة قبل أي push
```bash
npm run typecheck
npm run build
```
أو:
```bash
npm run check
```

## الملفات الأهم للمرحلة القادمة
- `src/config/labels.ts`
- `src/config/status-meta.ts`
- `src/services/leads.service.ts`
- `src/services/follow-ups.service.ts`
- `src/services/dashboard.service.ts`
- `src/services/reports.service.ts`

## المرحلة القادمة المقترحة
1. ربط أعمدة Supabase الحقيقية 1:1 بعد استخراج schema النهائي.
2. بناء Add/Edit Lead على جداول حقيقية بالكامل.
3. إنشاء Activity Timeline كامل من قاعدة البيانات.
4. تحويل Payments وParents وTeachers لنفس طبقة الخدمات.
5. إضافة Server Actions أو Route Handlers للوصول الأكثر أماناً.
