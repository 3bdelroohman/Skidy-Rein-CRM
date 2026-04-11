افك هذا الملف داخل root المشروع ثم شغّل:
1) powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-artifacts.ps1
2) npm run build
3) npm run dev

إذا اشتغل بدون أخطاء:
 git add -A
 git commit -m "stabilize schema services bundle v2"
 git push origin main
