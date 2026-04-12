import { listLeads } from "@/services/leads.service";
import { listParents } from "@/services/parents.service";
import { listStudents } from "@/services/students.service";

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[ً-ٟ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("20") && digits.length > 11) return digits.slice(2);
  if (digits.startsWith("2") && digits.length === 12) return digits.slice(1);
  return digits;
}

function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && left === right;
}

function samePhone(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

export interface DuplicateCheckResult {
  blocking: boolean;
  messageAr: string;
  messageEn: string;
}

export async function guardLeadDuplicate(input: {
  childName: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [leads, parents, students] = await Promise.all([listLeads(), listParents(), listStudents()]);

  const sameLeadPhone = leads.find((lead) => samePhone(lead.parentPhone, input.parentPhone) || samePhone(lead.parentPhone, input.parentWhatsapp));
  if (sameLeadPhone) {
    return {
      blocking: true,
      messageAr: `يوجد عميل محتمل بنفس رقم ولي الأمر بالفعل: ${sameLeadPhone.parentName} / ${sameLeadPhone.childName}`,
      messageEn: `A lead with the same parent phone already exists: ${sameLeadPhone.parentName} / ${sameLeadPhone.childName}`,
    };
  }

  const sameParent = parents.find((parent) => samePhone(parent.phone, input.parentPhone) || samePhone(parent.whatsapp, input.parentWhatsapp));
  if (sameParent) {
    return {
      blocking: true,
      messageAr: `يوجد ولي أمر مسجل بالفعل بنفس الرقم: ${sameParent.fullName}`,
      messageEn: `A parent with the same phone is already registered: ${sameParent.fullName}`,
    };
  }

  const sameStudent = students.find((student) => sameName(student.fullName, input.childName) && (samePhone(student.parentPhone, input.parentPhone) || sameName(student.parentName, input.parentName)));
  if (sameStudent) {
    return {
      blocking: true,
      messageAr: `يوجد طالب مسجل بالفعل بنفس الاسم وبيانات ولي الأمر: ${sameStudent.fullName}`,
      messageEn: `A student with the same name and parent details already exists: ${sameStudent.fullName}`,
    };
  }

  return null;
}

export async function guardParentDuplicate(input: {
  fullName: string;
  phone: string;
  whatsapp?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [parents, leads] = await Promise.all([listParents(), listLeads()]);

  const sameParent = parents.find((parent) => samePhone(parent.phone, input.phone) || samePhone(parent.whatsapp, input.whatsapp));
  if (sameParent) {
    return {
      blocking: true,
      messageAr: `يوجد ولي أمر بنفس الرقم بالفعل: ${sameParent.fullName}`,
      messageEn: `A parent with the same phone already exists: ${sameParent.fullName}`,
    };
  }

  const sameLead = leads.find((lead) => samePhone(lead.parentPhone, input.phone) || sameName(lead.parentName, input.fullName));
  if (sameLead) {
    return {
      blocking: true,
      messageAr: `هذا ولي أمر موجود بالفعل داخل العملاء المحتملين: ${sameLead.parentName}`,
      messageEn: `This parent already exists in leads: ${sameLead.parentName}`,
    };
  }

  return null;
}

export async function guardStudentDuplicate(input: {
  fullName: string;
  parentName: string;
  parentPhone: string;
  parentId?: string | null;
}): Promise<DuplicateCheckResult | null> {
  const [students, leads] = await Promise.all([listStudents(), listLeads()]);

  const sameStudent = students.find((student) => {
    if (input.parentId && student.parentId && student.parentId === input.parentId && sameName(student.fullName, input.fullName)) return true;
    if (sameName(student.fullName, input.fullName) && samePhone(student.parentPhone, input.parentPhone)) return true;
    return sameName(student.fullName, input.fullName) && sameName(student.parentName, input.parentName);
  });

  if (sameStudent) {
    return {
      blocking: true,
      messageAr: `يوجد طالب مسجل بالفعل بنفس الاسم تحت نفس ولي الأمر: ${sameStudent.fullName}`,
      messageEn: `A student with the same name already exists under the same parent: ${sameStudent.fullName}`,
    };
  }

  const sameLead = leads.find((lead) => sameName(lead.childName, input.fullName) && (samePhone(lead.parentPhone, input.parentPhone) || sameName(lead.parentName, input.parentName)));
  if (sameLead) {
    return {
      blocking: true,
      messageAr: `هذا الطالب موجود بالفعل في العملاء المحتملين: ${sameLead.childName}`,
      messageEn: `This student already exists in leads: ${sameLead.childName}`,
    };
  }

  return null;
}
