import type { CourseType, Locale } from "@/types/common.types";

export interface CourseRoadmapOption {
  value: CourseType;
  shortLabelAr: string;
  shortLabelEn: string;
  formLabelAr: string;
  formLabelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  tracksAr: string[];
  tracksEn: string[];
}

export interface CourseTrackOption {
  id: string;
  family: CourseType;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const COURSE_ROADMAP_OPTIONS: CourseRoadmapOption[] = [
  {
    value: "scratch",
    shortLabelAr: "Scratch",
    shortLabelEn: "Scratch",
    formLabelAr: "مرحلة التأسيس الإبداعي",
    formLabelEn: "Creative foundations",
    descriptionAr: "مدخل مناسب للمبتدئين قبل المسارات البرمجية الأعمق.",
    descriptionEn: "Best starting family for beginners before deeper programming tracks.",
    tracksAr: ["Scratch", "App Inventor", "روبوتكس أساسي", "مقدمة في الذكاء الاصطناعي"],
    tracksEn: ["Scratch", "App Inventor", "Basic Robotics", "Intro to AI"],
  },
  {
    value: "python",
    shortLabelAr: "Python",
    shortLabelEn: "Python",
    formLabelAr: "مرحلة البرمجة العملية",
    formLabelEn: "Practical programming",
    descriptionAr: "عائلة تطوير منطق البرمجة وبناء المشاريع العملية والمتوسطة.",
    descriptionEn: "Programming-logic family for practical and intermediate projects.",
    tracksAr: ["Python", "Godot", "Robotics / IoT", "FastAPI"],
    tracksEn: ["Python", "Godot", "Robotics / IoT", "FastAPI"],
  },
  {
    value: "web",
    shortLabelAr: "Front-End",
    shortLabelEn: "Front-End",
    formLabelAr: "مرحلة التطبيقات والويب",
    formLabelEn: "Apps and web",
    descriptionAr: "عائلة الويب والتطبيقات والواجهات للمستوى المتوسط إلى المتقدم.",
    descriptionEn: "Web, apps, and interface-building family for intermediate to advanced learners.",
    tracksAr: ["HTML / CSS", "JavaScript / Tailwind", "Front End"],
    tracksEn: ["HTML / CSS", "JavaScript / Tailwind", "Front End"],
  },
  {
    value: "ai",
    shortLabelAr: "AI / Data",
    shortLabelEn: "AI / Data",
    formLabelAr: "مرحلة الذكاء الاصطناعي والبيانات",
    formLabelEn: "AI and data",
    descriptionAr: "عائلة المسارات المتقدمة للذكاء الاصطناعي والبيانات والباك إند.",
    descriptionEn: "Advanced family for AI, data, and back-end oriented tracks.",
    tracksAr: ["AI & Machine Learning", "Data Science", "Back End", "Raspberry Pi"],
    tracksEn: ["AI & Machine Learning", "Data Science", "Back End", "Raspberry Pi"],
  },
];

export const COURSE_TRACK_OPTIONS: CourseTrackOption[] = [
  { id: "scratch", family: "scratch", labelAr: "Scratch", labelEn: "Scratch", descriptionAr: "بداية مناسبة للأطفال في البرمجة المرئية.", descriptionEn: "A visual coding starting point for kids." },
  { id: "app_inventor", family: "scratch", labelAr: "App Inventor", labelEn: "App Inventor", descriptionAr: "بناء تطبيقات بسيطة للمبتدئين.", descriptionEn: "Build simple beginner-friendly apps." },
  { id: "robotics_basic", family: "scratch", labelAr: "روبوتكس أساسي", labelEn: "Basic Robotics", descriptionAr: "مدخل عملي للهاردوير والمنطق الحركي.", descriptionEn: "A practical introduction to hardware and motion logic." },
  { id: "ai_intro", family: "scratch", labelAr: "مقدمة في الذكاء الاصطناعي", labelEn: "Intro to AI", descriptionAr: "تعريف مبسط بمفاهيم الذكاء الاصطناعي.", descriptionEn: "A simplified introduction to AI concepts." },
  { id: "python", family: "python", labelAr: "Python", labelEn: "Python", descriptionAr: "المسار الأساسي للبرمجة النصية والمنطق.", descriptionEn: "Core text-based programming and logic track." },
  { id: "godot", family: "python", labelAr: "Godot", labelEn: "Godot", descriptionAr: "مدخل لتطوير الألعاب والمشاهد التفاعلية.", descriptionEn: "An introduction to game development and interactive scenes." },
  { id: "robotics_iot", family: "python", labelAr: "Robotics / IoT", labelEn: "Robotics / IoT", descriptionAr: "مشاريع تجمع بين البرمجة والهاردوير والاتصال.", descriptionEn: "Projects that combine code, hardware, and connectivity." },
  { id: "fastapi", family: "python", labelAr: "FastAPI", labelEn: "FastAPI", descriptionAr: "خطوة أولى في بناء واجهات back-end بسيطة.", descriptionEn: "A first step into simple back-end API building." },
  { id: "html_css", family: "web", labelAr: "HTML / CSS", labelEn: "HTML / CSS", descriptionAr: "أساس تصميم صفحات الويب.", descriptionEn: "The foundation of web page design." },
  { id: "javascript_tailwind", family: "web", labelAr: "JavaScript / Tailwind", labelEn: "JavaScript / Tailwind", descriptionAr: "التفاعل والواجهات الحديثة على الويب.", descriptionEn: "Interactivity and modern web interfaces." },
  { id: "front_end", family: "web", labelAr: "Front End", labelEn: "Front End", descriptionAr: "المسار المتكامل لبناء الواجهات الأمامية.", descriptionEn: "A complete front-end engineering path." },
  { id: "ai_ml", family: "ai", labelAr: "AI & Machine Learning", labelEn: "AI & Machine Learning", descriptionAr: "المسار المتقدم لبناء نماذج وتطبيقات ذكية.", descriptionEn: "An advanced path for intelligent models and apps." },
  { id: "data_science", family: "ai", labelAr: "Data Science", labelEn: "Data Science", descriptionAr: "تحليل البيانات وبناء قصص وقراءات منها.", descriptionEn: "Analyze data and turn it into insights." },
  { id: "back_end", family: "ai", labelAr: "Back End", labelEn: "Back End", descriptionAr: "بناء المنطق الخلفي وربط الخدمات.", descriptionEn: "Build back-end logic and connect services." },
  { id: "raspberry_pi", family: "ai", labelAr: "Raspberry Pi", labelEn: "Raspberry Pi", descriptionAr: "مشاريع واقعية تربط البرمجة بالأجهزة.", descriptionEn: "Real-world projects linking code with devices." },
];

export function getCourseRoadmapOption(value: CourseType | null | undefined): CourseRoadmapOption | null {
  if (!value) return null;
  return COURSE_ROADMAP_OPTIONS.find((item) => item.value === value) ?? null;
}

export function getCourseFormLabel(value: CourseType, locale: Locale = "ar"): string {
  const option = getCourseRoadmapOption(value);
  if (!option) return value;
  return locale === "ar" ? option.formLabelAr : option.formLabelEn;
}

export function getCourseTracks(value: CourseType, locale: Locale = "ar"): string[] {
  const option = getCourseRoadmapOption(value);
  if (!option) return [];
  return locale === "ar" ? option.tracksAr : option.tracksEn;
}

export function getCourseTrackOptions(locale: Locale = "ar"): Array<{ value: string; label: string; family: CourseType; description: string }> {
  return COURSE_TRACK_OPTIONS.map((item) => ({
    value: item.id,
    family: item.family,
    label: locale === "ar" ? item.labelAr : item.labelEn,
    description: locale === "ar" ? item.descriptionAr : item.descriptionEn,
  }));
}

export function getCourseFamilyFromTrack(trackId: string | null | undefined): CourseType | null {
  if (!trackId) return null;
  return COURSE_TRACK_OPTIONS.find((item) => item.id === trackId)?.family ?? null;
}

export function getDefaultTrackIdForFamily(family: CourseType | null | undefined): string {
  return COURSE_TRACK_OPTIONS.find((item) => item.family === family)?.id ?? "";
}

export function getCourseTrackLabel(trackId: string | null | undefined, locale: Locale = "ar"): string {
  const track = COURSE_TRACK_OPTIONS.find((item) => item.id === trackId);
  if (!track) return "";
  return locale === "ar" ? track.labelAr : track.labelEn;
}

export function suggestCourseByAge(age: number, hasPriorExperience = false): CourseType {
  if (age <= 11) return "scratch";
  if (age <= 14) return hasPriorExperience ? "python" : "scratch";
  if (age <= 16) return hasPriorExperience ? "web" : "python";
  return hasPriorExperience ? "ai" : "web";
}
