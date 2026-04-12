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

export const COURSE_ROADMAP_OPTIONS: CourseRoadmapOption[] = [
  {
    value: "scratch",
    shortLabelAr: "Scratch",
    shortLabelEn: "Scratch",
    formLabelAr: "Scratch / App Inventor / تأسيس روبوتكس",
    formLabelEn: "Scratch / App Inventor / Robotics Basics",
    descriptionAr: "مدخل مناسب للمبتدئين قبل المسارات البرمجية الأعمق.",
    descriptionEn: "Best starting family for beginners before deeper programming tracks.",
    tracksAr: ["Scratch", "App Inventor", "روبوتكس أساسي", "مقدمة في الذكاء الاصطناعي"],
    tracksEn: ["Scratch", "App Inventor", "Basic Robotics", "Intro to AI"],
  },
  {
    value: "python",
    shortLabelAr: "Python",
    shortLabelEn: "Python",
    formLabelAr: "Python / Godot / Robotics & IoT",
    formLabelEn: "Python / Godot / Robotics & IoT",
    descriptionAr: "عائلة تطوير منطق البرمجة وبناء المشاريع العملية والمتوسطة.",
    descriptionEn: "Programming-logic family for practical and intermediate projects.",
    tracksAr: ["Python", "Godot", "Robotics / IoT", "FastAPI"],
    tracksEn: ["Python", "Godot", "Robotics / IoT", "FastAPI"],
  },
  {
    value: "web",
    shortLabelAr: "Front-End",
    shortLabelEn: "Front-End",
    formLabelAr: "HTML/CSS / JavaScript / Front-End",
    formLabelEn: "HTML/CSS / JavaScript / Front-End",
    descriptionAr: "عائلة الويب والتطبيقات والواجهات للمستوى المتوسط إلى المتقدم.",
    descriptionEn: "Web, apps, and interface-building family for intermediate to advanced learners.",
    tracksAr: ["HTML / CSS", "JavaScript / Tailwind", "Front End"],
    tracksEn: ["HTML / CSS", "JavaScript / Tailwind", "Front End"],
  },
  {
    value: "ai",
    shortLabelAr: "AI / Data",
    shortLabelEn: "AI / Data",
    formLabelAr: "AI / ML / Data Science / Back End",
    formLabelEn: "AI / ML / Data Science / Back End",
    descriptionAr: "عائلة المسارات المتقدمة للذكاء الاصطناعي والبيانات والباك إند.",
    descriptionEn: "Advanced family for AI, data, and back-end oriented tracks.",
    tracksAr: ["AI & Machine Learning", "Data Science", "Back End", "Raspberry Pi"],
    tracksEn: ["AI & Machine Learning", "Data Science", "Back End", "Raspberry Pi"],
  },
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

export function suggestCourseByAge(age: number, hasPriorExperience = false): CourseType {
  if (age <= 11) return "scratch";
  if (age <= 14) return hasPriorExperience ? "python" : "scratch";
  if (age <= 16) return hasPriorExperience ? "web" : "python";
  return hasPriorExperience ? "ai" : "web";
}
