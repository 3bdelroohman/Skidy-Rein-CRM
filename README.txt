1) فك هذا الملف داخل root المشروع نفسه وليس داخل مجلد فرعي.
2) وافق على الاستبدال.
3) شغّل:
   powershell -ExecutionPolicy Bypass -File .\\scripts\\cleanup-artifacts.ps1
   npm run build
   npm run dev
4) إذا اشتغل بدون أخطاء:
   git add -A
   git commit -m "root bundled fix for leads schedule teachers and database types"
   git push origin main
