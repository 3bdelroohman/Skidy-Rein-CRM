import { LoadingState } from "@/components/shared/page-state";

export default function DashboardLoading() {
  return (
    <LoadingState
      titleAr="جارِ تجهيز لوحة التحكم"
      titleEn="Preparing the dashboard"
      descriptionAr="يتم الآن تحميل البيانات الأساسية وتجهيز الصفحة."
      descriptionEn="Core data is loading and the page is being prepared."
    />
  );
}
