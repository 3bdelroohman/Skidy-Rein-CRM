/**
 * Minimal Supabase database typing for the current CRM modules.
 * This stays intentionally lightweight until the schema is generated from Supabase CLI.
 */

import type {
  CommChannel,
  CourseType,
  FollowUpType,
  LeadSource,
  LeadStage,
  LeadTemperature,
  LossReason,
  EmploymentType,
  PaymentStatus,
  Priority,
  StudentStatus,
  UserRole,
} from "@/types/common.types";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          full_name_ar: string | null;
          role: UserRole | null;
          avatar_url: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          parent_name: string | null;
          parent_phone: string | null;
          child_name: string | null;
          child_age: number | null;
          stage: LeadStage | null;
          temperature: LeadTemperature | null;
          source: LeadSource | null;
          suggested_course: CourseType | null;
          assigned_to: string | null;
          assigned_to_name: string | null;
          last_contact_at: string | null;
          next_follow_up_at: string | null;
          loss_reason: LossReason | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string | null;
          title: string | null;
          lead_name: string | null;
          parent_name: string | null;
          type: FollowUpType | null;
          channel: CommChannel | null;
          priority: Priority | null;
          scheduled_at: string | null;
          status: string | null;
          assigned_to: string | null;
          created_at: string | null;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
        Relationships: [];
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string | null;
          action: string | null;
          type: string | null;
          by_name: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          parent_id: string | null;
          parent_name: string | null;
          parent_phone: string | null;
          status: StudentStatus | null;
          current_course: CourseType | null;
          class_name: string | null;
          enrollment_date: string | null;
          sessions_attended: number | null;
          total_paid: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };
      parents: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          city: string | null;
          children_count: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["parents"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parents"]["Row"]>;
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          specialization: CourseType[] | null;
          employment: EmploymentType | null;
          classes_count: number | null;
          students_count: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["teachers"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Row"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          student_id: string | null;
          amount: number | null;
          status: PaymentStatus | null;
          method: string | null;
          due_date: string | null;
          paid_at: string | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          name: string | null;
          course: CourseType | null;
          teacher_id: string | null;
          day_of_week: number | null;
          start_time: string | null;
          end_time: string | null;
          is_trial: boolean | null;
          capacity: number | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          class_id: string | null;
          teacher_id: string | null;
          title: string | null;
          day_of_week: number | null;
          start_time: string | null;
          end_time: string | null;
          session_date: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sessions"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
        Relationships: [];
      };
      class_enrollments: {
        Row: {
          id: string;
          class_id: string | null;
          student_id: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: UserRole | null;
      };
    };
    Enums: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];
