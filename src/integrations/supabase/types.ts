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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      advice_outcomes: {
        Row: {
          connection_id: string | null
          created_at: string
          felt_natural: boolean | null
          got_date: boolean | null
          id: string
          moved_forward: boolean | null
          reflection: string | null
          sent_message: string | null
          source_id: string | null
          source_kind: string | null
          their_response: string | null
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          felt_natural?: boolean | null
          got_date?: boolean | null
          id?: string
          moved_forward?: boolean | null
          reflection?: string | null
          sent_message?: string | null
          source_id?: string | null
          source_kind?: string | null
          their_response?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          felt_natural?: boolean | null
          got_date?: boolean | null
          id?: string
          moved_forward?: boolean | null
          reflection?: string | null
          sent_message?: string | null
          source_id?: string | null
          source_kind?: string | null
          their_response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advice_outcomes_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          parts: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          parts?: Json | null
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          parts?: Json | null
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          archived: boolean
          connection_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          connection_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          connection_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_preferences: {
        Row: {
          directness: string | null
          emoji_usage: string | null
          flirting_style: string | null
          formality: string | null
          humor_level: string | null
          notes: string | null
          typical_length: string | null
          updated_at: string
          user_id: string
          warmth: string | null
          words_i_use: string[] | null
          words_to_avoid: string[] | null
        }
        Insert: {
          directness?: string | null
          emoji_usage?: string | null
          flirting_style?: string | null
          formality?: string | null
          humor_level?: string | null
          notes?: string | null
          typical_length?: string | null
          updated_at?: string
          user_id: string
          warmth?: string | null
          words_i_use?: string[] | null
          words_to_avoid?: string[] | null
        }
        Update: {
          directness?: string | null
          emoji_usage?: string | null
          flirting_style?: string | null
          formality?: string | null
          humor_level?: string | null
          notes?: string | null
          typical_length?: string | null
          updated_at?: string
          user_id?: string
          warmth?: string | null
          words_i_use?: string[] | null
          words_to_avoid?: string[] | null
        }
        Relationships: []
      }
      connection_health_categories: {
        Row: {
          category: string
          connection_id: string
          id: string
          label: Database["public"]["Enums"]["health_label"]
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          connection_id: string
          id?: string
          label: Database["public"]["Enums"]["health_label"]
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          connection_id?: string
          id?: string
          label?: Database["public"]["Enums"]["health_label"]
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_health_categories_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_insights: {
        Row: {
          connection_id: string
          created_at: string
          dismissed: boolean
          id: string
          observation: string
          supporting_refs: Json | null
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          dismissed?: boolean
          id?: string
          observation: string
          supporting_refs?: Json | null
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          observation?: string
          supporting_refs?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_insights_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_timeline_events: {
        Row: {
          body: string | null
          connection_id: string
          created_at: string
          event_type: string
          id: string
          occurred_at: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          connection_id: string
          created_at?: string
          event_type: string
          id?: string
          occurred_at?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          connection_id?: string
          created_at?: string
          event_type?: string
          id?: string
          occurred_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_timeline_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          archived: boolean
          concerns: string | null
          created_at: string
          dating_app: string | null
          first_name: string | null
          id: string
          important_context: string | null
          intentions: string | null
          known_boundaries: string | null
          matched_on: string | null
          nickname: string | null
          positive_developments: string | null
          private_label: string | null
          stage: Database["public"]["Enums"]["connection_stage"]
          status: string | null
          updated_at: string
          user_goal: string | null
          user_id: string
          where_met: string | null
        }
        Insert: {
          archived?: boolean
          concerns?: string | null
          created_at?: string
          dating_app?: string | null
          first_name?: string | null
          id?: string
          important_context?: string | null
          intentions?: string | null
          known_boundaries?: string | null
          matched_on?: string | null
          nickname?: string | null
          positive_developments?: string | null
          private_label?: string | null
          stage?: Database["public"]["Enums"]["connection_stage"]
          status?: string | null
          updated_at?: string
          user_goal?: string | null
          user_id: string
          where_met?: string | null
        }
        Update: {
          archived?: boolean
          concerns?: string | null
          created_at?: string
          dating_app?: string | null
          first_name?: string | null
          id?: string
          important_context?: string | null
          intentions?: string | null
          known_boundaries?: string | null
          matched_on?: string | null
          nickname?: string | null
          positive_developments?: string | null
          private_label?: string | null
          stage?: Database["public"]["Enums"]["connection_stage"]
          status?: string | null
          updated_at?: string
          user_goal?: string | null
          user_id?: string
          where_met?: string | null
        }
        Relationships: []
      }
      conversation_starter_requests: {
        Row: {
          connection_id: string | null
          created_at: string
          dating_app: string | null
          desired_tone: string | null
          goal: string | null
          id: string
          match_bio: string | null
          match_prompts: Json | null
          options: Json | null
          screenshot_ids: string[] | null
          standout_details: string | null
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          dating_app?: string | null
          desired_tone?: string | null
          goal?: string | null
          id?: string
          match_bio?: string | null
          match_prompts?: Json | null
          options?: Json | null
          screenshot_ids?: string[] | null
          standout_details?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          dating_app?: string | null
          desired_tone?: string | null
          goal?: string | null
          id?: string
          match_bio?: string | null
          match_prompts?: Json | null
          options?: Json | null
          screenshot_ids?: string[] | null
          standout_details?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starter_requests_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_connection_links: {
        Row: {
          connection_id: string
          journal_id: string
          user_id: string
        }
        Insert: {
          connection_id: string
          journal_id: string
          user_id: string
        }
        Update: {
          connection_id?: string
          journal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_connection_links_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_connection_links_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ai_context_optin: boolean
          body: string
          created_at: string
          entry_date: string
          favorite: boolean
          id: string
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_context_optin?: boolean
          body: string
          created_at?: string
          entry_date?: string
          favorite?: boolean
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_context_optin?: boolean
          body?: string
          created_at?: string
          entry_date?: string
          favorite?: boolean
          id?: string
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_reviews: {
        Row: {
          bio: string | null
          created_at: string
          dating_app: string | null
          desired_audience: string | null
          feedback: string | null
          id: string
          photo_paths: string[] | null
          prompts: Json | null
          relationship_goal: string | null
          suggested_bio: string | null
          suggested_prompts: Json | null
          user_id: string
          voice_notes: string | null
          what_isnt_working: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          dating_app?: string | null
          desired_audience?: string | null
          feedback?: string | null
          id?: string
          photo_paths?: string[] | null
          prompts?: Json | null
          relationship_goal?: string | null
          suggested_bio?: string | null
          suggested_prompts?: Json | null
          user_id: string
          voice_notes?: string | null
          what_isnt_working?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          dating_app?: string | null
          desired_audience?: string | null
          feedback?: string | null
          id?: string
          photo_paths?: string[] | null
          prompts?: Json | null
          relationship_goal?: string | null
          suggested_bio?: string | null
          suggested_prompts?: Json | null
          user_id?: string
          voice_notes?: string | null
          what_isnt_working?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          onboarding_completed: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_suggestions: {
        Row: {
          chosen_option: number | null
          connection_id: string | null
          created_at: string
          desired_outcome: string | null
          desired_tone: string | null
          id: string
          input_context: string | null
          kind: string
          options: Json
          sent_message: string | null
          user_id: string
        }
        Insert: {
          chosen_option?: number | null
          connection_id?: string | null
          created_at?: string
          desired_outcome?: string | null
          desired_tone?: string | null
          id?: string
          input_context?: string | null
          kind: string
          options: Json
          sent_message?: string | null
          user_id: string
        }
        Update: {
          chosen_option?: number | null
          connection_id?: string | null
          created_at?: string
          desired_outcome?: string | null
          desired_tone?: string | null
          id?: string
          input_context?: string | null
          kind?: string
          options?: Json
          sent_message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_suggestions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshot_analyses: {
        Row: {
          analysis: string | null
          connection_id: string | null
          created_at: string
          id: string
          request_type: string | null
          screenshot_ids: string[] | null
          suggested_responses: Json | null
          user_context: string | null
          user_id: string
        }
        Insert: {
          analysis?: string | null
          connection_id?: string | null
          created_at?: string
          id?: string
          request_type?: string | null
          screenshot_ids?: string[] | null
          suggested_responses?: Json | null
          user_context?: string | null
          user_id: string
        }
        Update: {
          analysis?: string | null
          connection_id?: string | null
          created_at?: string
          id?: string
          request_type?: string | null
          screenshot_ids?: string[] | null
          suggested_responses?: Json | null
          user_context?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_analyses_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          note: string | null
          ordinal: number
          storage_path: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          ordinal?: number
          storage_path: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          ordinal?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          renews_at: string | null
          store: string | null
          store_product_id: string | null
          store_transaction_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          renews_at?: string | null
          store?: string | null
          store_product_id?: string | null
          store_transaction_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          renews_at?: string | null
          store?: string | null
          store_product_id?: string | null
          store_transaction_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          count: number
          id: string
          metric: string
          period: string
          period_start: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          metric: string
          period: string
          period_start: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          metric?: string
          period?: string
          period_start?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          communication_style: string | null
          created_at: string
          dating_apps: string[] | null
          help_with: string[] | null
          journal_ai_context_optin: boolean
          onboarding_skipped: boolean
          preferred_tone: string | null
          relationship_goal: string | null
          updated_at: string
          user_id: string
          writelikeme_enabled: boolean
        }
        Insert: {
          communication_style?: string | null
          created_at?: string
          dating_apps?: string[] | null
          help_with?: string[] | null
          journal_ai_context_optin?: boolean
          onboarding_skipped?: boolean
          preferred_tone?: string | null
          relationship_goal?: string | null
          updated_at?: string
          user_id: string
          writelikeme_enabled?: boolean
        }
        Update: {
          communication_style?: string | null
          created_at?: string
          dating_apps?: string[] | null
          help_with?: string[] | null
          journal_ai_context_optin?: boolean
          onboarding_skipped?: boolean
          preferred_tone?: string | null
          relationship_goal?: string | null
          updated_at?: string
          user_id?: string
          writelikeme_enabled?: boolean
        }
        Relationships: []
      }
      writelikeme_samples: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          sample: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          sample: string
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          sample?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_message: {
        Args: { _limit: number }
        Returns: {
          allowed: boolean
          limit: number
          used: number
        }[]
      }
      get_ai_usage: {
        Args: never
        Returns: {
          used: number
        }[]
      }
    }
    Enums: {
      chat_role: "user" | "assistant" | "system"
      connection_stage:
        | "new_match"
        | "messaging"
        | "planning_first_date"
        | "first_date_scheduled"
        | "casually_dating"
        | "exclusively_dating"
        | "in_relationship"
        | "paused"
        | "ended"
        | "unsure"
      health_label: "strong" | "mixed" | "needs_more_info" | "concerning"
      subscription_tier: "free" | "premium"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chat_role: ["user", "assistant", "system"],
      connection_stage: [
        "new_match",
        "messaging",
        "planning_first_date",
        "first_date_scheduled",
        "casually_dating",
        "exclusively_dating",
        "in_relationship",
        "paused",
        "ended",
        "unsure",
      ],
      health_label: ["strong", "mixed", "needs_more_info", "concerning"],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
