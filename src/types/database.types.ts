/**
 * Supabase database types - VERIFIED against real schema
 * DO NOT add columns that do not exist in Supabase.
 */

import type {
  CommChannel,
  CourseType,
  FollowUpType,
  LeadSource,
  LeadStage,
  LeadTemperature,
  LossReason,
  PaymentMethod,
  PaymentStatus,
  Priority,
  StudentStatus,
  UserRole,
} from "@/types/common.types";

export type EmploymentType = "full_time" | "part_time" | "freelance";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type ObjectionType =
  | "price"
  | "timing"
  | "online"
  | "uncertain"
  | "hyperactive_child"
  | "certificate"
  | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          full_name_ar: string | null;
          email: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };

      leads: {
        Row: {
          id: string;
          parent_id: string | null;
          parent_name: string;
          parent_phone: string;
          parent_whatsapp: string | null;
          child_name: string;
          child_age: number;
          stage: LeadStage;
          temperature: LeadTemperature;
          source: LeadSource;
          has_laptop: boolean | null;
          has_prior_experience: boolean | null;
          child_interests: string | null;
          suggested_course: CourseType | null;
          price_range_shared: boolean;
          whatsapp_collected: boolean;
          main_objection: ObjectionType | null;
          loss_reason: LossReason | null;
          loss_notes: string | null;
          assigned_to: string;
          first_contact_at: string | null;
          last_contact_at: string | null;
          next_follow_up_at: string | null;
          won_at: string | null;
          lost_at: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          parent_name: string;
          parent_phone: string;
          child_name: string;
          child_age: number;
          stage: LeadStage;
          temperature: LeadTemperature;
          source: LeadSource;
          assigned_to: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };

      follow_ups: {
        Row: {
          id: string;
          lead_id: string | null;
          student_id: string | null;
          parent_id: string | null;
          type: FollowUpType;
          channel: CommChannel;
          priority: Priority;
          scheduled_at: string;
          completed_at: string | null;
          is_completed: boolean;
          title: string;
          title_ar: string | null;
          description: string | null;
          outcome: string | null;
          assigned_to: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]> & {
          type: FollowUpType;
          channel: CommChannel;
          priority: Priority;
          scheduled_at: string;
          title: string;
          assigned_to: string;
        };
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
        Relationships: [];
      };

      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          action: string;
          from_stage: LeadStage | null;
          to_stage: LeadStage | null;
          channel: CommChannel | null;
          description: string | null;
          metadata: Record<string, unknown> | null;
          performed_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]> & {
          lead_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_activities"]["Row"]>;
        Relationships: [];
      };

      students: {
        Row: {
          id: string;
          lead_id: string | null;
          parent_id: string;
          full_name: string;
          full_name_ar: string | null;
          age: number;
          date_of_birth: string | null;
          status: StudentStatus;
          current_class_id: string | null;
          current_course: CourseType | null;
          enrollment_date: string;
          total_paid: number;
          sessions_attended: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          parent_id: string;
          full_name: string;
          age: number;
          status: StudentStatus;
          enrollment_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };

      parents: {
        Row: {
          id: string;
          full_name: string;
          full_name_ar: string | null;
          phone: string;
          whatsapp: string | null;
          email: string | null;
          city: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["parents"]["Row"]> & {
          full_name: string;
          phone: string;
        };
        Update: Partial<Database["public"]["Tables"]["parents"]["Row"]>;
        Relationships: [];
      };

      payments: {
        Row: {
          id: string;
          student_id: string;
          parent_id: string;
          class_id: string | null;
          amount: number;
          status: PaymentStatus;
          method: PaymentMethod | null;
          due_date: string;
          paid_at: string | null;
          period_start: string | null;
          period_end: string | null;
          receipt_url: string | null;
          notes: string | null;
          collected_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payments"]["Row"]> & {
          student_id: string;
          parent_id: string;
          amount: number;
          status: PaymentStatus;
          due_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
        Relationships: [];
      };

      courses: {
        Row: {
          id: string;
          name: string;
          name_ar: string;
          type: CourseType;
          description: string | null;
          age_min: number;
          age_max: number;
          duration_weeks: number;
          sessions_per_week: number;
          session_duration_minutes: number;
          price: number;
          max_students: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & {
          name: string;
          name_ar: string;
          type: CourseType;
          age_min: number;
          age_max: number;
          duration_weeks: number;
          sessions_per_week: number;
          session_duration_minutes: number;
          price: number;
          max_students: number;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };

      classes: {
        Row: {
          id: string;
          name: string;
          name_ar: string | null;
          course_id: string;
          teacher_id: string;
          max_students: number;
          current_students: number;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          meeting_link: string | null;
          schedule_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classes"]["Row"]> & {
          name: string;
          course_id: string;
          teacher_id: string;
          max_students: number;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Row"]>;
        Relationships: [];
      };

      sessions: {
        Row: {
          id: string;
          class_id: string;
          teacher_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
          topic: string | null;
          notes: string | null;
          meeting_link: string | null;
          is_cancelled: boolean;
          cancel_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sessions"]["Row"]> & {
          class_id: string;
          teacher_id: string;
          session_date: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
        Relationships: [];
      };

      teachers: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          full_name_ar: string | null;
          phone: string | null;
          email: string | null;
          specialization: string[] | null;
          employment: EmploymentType;
          hourly_rate: number | null;
          max_classes_per_week: number;
          is_active: boolean;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["teachers"]["Row"]> & {
          full_name: string;
          employment: EmploymentType;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Row"]>;
        Relationships: [];
      };

      class_enrollments: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          enrolled_at: string;
          dropped_at: string | null;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]> & {
          student_id: string;
          class_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["class_enrollments"]["Row"]>;
        Relationships: [];
      };

      attendance: {
        Row: {
          id: string;
          session_id: string;
          student_id: string;
          status: AttendanceStatus;
          joined_at: string | null;
          left_at: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["attendance"]["Row"]> & {
          session_id: string;
          student_id: string;
          status: AttendanceStatus;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Row"]>;
        Relationships: [];
      };

      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Record<string, unknown>;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_settings"]["Row"]> & {
          key: string;
          value: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
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

    Enums: {
      attendance_status: AttendanceStatus;
      comm_channel: CommChannel;
      course_type: CourseType;
      employment_type: EmploymentType;
      follow_up_type: FollowUpType;
      lead_source: LeadSource;
      lead_stage: LeadStage;
      lead_temperature: LeadTemperature;
      loss_reason: LossReason;
      objection_type: ObjectionType;
      payment_method: PaymentMethod;
      priority: Priority;
      student_status: StudentStatus;
      user_role: UserRole;
    };
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = Database["public"]["Tables"][T]["Update"];
