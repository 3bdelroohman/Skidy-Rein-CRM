# Implementation Notes — Phase 1

## ما الذي يشتغل الآن
- Central labels + status metadata
- Leads list + lead details + stage change
- New lead form with local persistence fallback
- Follow-ups page with working "تم" button + local persistence
- Students page from shared data layer
- Reports page from computed data layer
- Dashboard page from shared computed overview
- Quality scripts + CI workflow

## كيف تعمل طبقة البيانات الآن
1. تحاول القراءة من Supabase عبر `createBrowserClient`
2. لو فشل الاتصال أو لم تكتمل الأعمدة، ترجع إلى `localStorage`
3. لو لا يوجد `localStorage` بعد، تستخدم mock data كبداية

## لماذا هذا مهم؟
هذا يجعل الواجهة قابلة للعمل فوراً، وفي نفس الوقت يفتح الطريق لربط Supabase الحقيقي تدريجياً بدون إعادة كتابة كل صفحة مرة ثانية.

## ما الذي ما زال يحتاج المرحلة التالية؟
- مطابقة أعمدة Supabase الحقيقية 1:1 بعد استخراج schema النهائي
- Add/Edit Lead كامل عبر قاعدة البيانات
- CRUD كامل للطلاب والآباء والمدفوعات والمعلمين
- Reports حقيقية من جداول المدفوعات والمتابعات بدل أي fallback
- Role-based server actions / route handlers
