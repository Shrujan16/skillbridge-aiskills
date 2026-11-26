export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          id: string
          level: number
          skill_id: number
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level: number
          skill_id: number
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          skill_id?: number
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          helpful: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful: string
          id?: string
          rating: number
          user_id?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          estimated_finish: string | null
          hours_per_week: number
          last_rebalanced_at: string | null
          start_date: string
          target_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          estimated_finish?: string | null
          hours_per_week: number
          last_rebalanced_at?: string | null
          start_date: string
          target_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          estimated_finish?: string | null
          hours_per_week?: number
          last_rebalanced_at?: string | null
          start_date?: string
          target_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          github_username: string | null
          id: string
          name: string
          target_role_id: number | null
          username: string
        }
        Insert: {
          created_at?: string
          github_username?: string | null
          id: string
          name?: string
          target_role_id?: number | null
          username: string
        }
        Update: {
          created_at?: string
          github_username?: string | null
          id?: string
          name?: string
          target_role_id?: number | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_index: number
          id: number
          options: Json
          question: string
          skill_id: number
        }
        Insert: {
          correct_index: number
          id?: number
          options: Json
          question: string
          skill_id: number
        }
        Update: {
          correct_index?: number
          id?: number
          options?: Json
          question?: string
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_tasks: {
        Row: {
          description: string
          est_hours: number
          id: number
          resource_url: string
          seq: number
          skill_id: number
          title: string
        }
        Insert: {
          description: string
          est_hours: number
          id?: number
          resource_url: string
          seq?: number
          skill_id: number
          title: string
        }
        Update: {
          description?: string
          est_hours?: number
          id?: number
          resource_url?: string
          seq?: number
          skill_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_tasks_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skills: {
        Row: {
          demand_weight: number
          role_id: number
          skill_id: number
        }
        Insert: {
          demand_weight: number
          role_id: number
          skill_id: number
        }
        Update: {
          demand_weight?: number
          role_id?: number
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          active: boolean
          id: number
          name: string
        }
        Insert: {
          active?: boolean
          id?: number
          name: string
        }
        Update: {
          active?: boolean
          id?: number
          name?: string
        }
        Relationships: []
      }
      skill_projects: {
        Row: {
          description: string
          est_hours: number
          id: number
          skill_id: number
          title: string
        }
        Insert: {
          description: string
          est_hours?: number
          id?: number
          skill_id: number
          title: string
        }
        Update: {
          description?: string
          est_hours?: number
          id?: number
          skill_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_projects_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: true
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          id: number
          languages: string[]
          name: string
          prerequisites: string[]
          slug: string
        }
        Insert: {
          category: string
          id?: number
          languages?: string[]
          name: string
          prerequisites?: string[]
          slug: string
        }
        Update: {
          category?: string
          id?: number
          languages?: string[]
          name?: string
          prerequisites?: string[]
          slug?: string
        }
        Relationships: []
      }
      user_tasks: {
        Row: {
          completed_at: string | null
          status: string
          task_id: number
          updated_at: string
          user_id: string
          week: number | null
        }
        Insert: {
          completed_at?: string | null
          status?: string
          task_id: number
          updated_at?: string
          user_id: string
          week?: number | null
        }
        Update: {
          completed_at?: string | null
          status?: string
          task_id?: number
          updated_at?: string
          user_id?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "roadmap_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          checked_at: string
          details: Json
          id: string
          repo_url: string
          skill_id: number
          status: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          details?: Json
          id?: string
          repo_url: string
          skill_id: number
          status: string
          user_id: string
        }
        Update: {
          checked_at?: string
          details?: Json
          id?: string
          repo_url?: string
          skill_id?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_cohort_insights: { Args: { _role_id?: number }; Returns: Json }
      get_public_profile: { Args: { _username: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
