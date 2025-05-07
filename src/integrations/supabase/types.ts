export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      amenities: {
        Row: {
          amenity_id: number
          amenity_name: string
          created_at: string | null
        }
        Insert: {
          amenity_id?: never
          amenity_name: string
          created_at?: string | null
        }
        Update: {
          amenity_id?: never
          amenity_name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      building_amenities: {
        Row: {
          amenity_id: number
          building_id: number
          created_at: string | null
          floor: string | null
        }
        Insert: {
          amenity_id: number
          building_id: number
          created_at?: string | null
          floor?: string | null
        }
        Update: {
          amenity_id?: number
          building_id?: number
          created_at?: string | null
          floor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["amenity_id"]
          },
          {
            foreignKeyName: "building_amenities_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["building_id"]
          },
        ]
      }
      buildings: {
        Row: {
          building_id: number
          building_name: string
          created_at: string | null
          region_id: number
        }
        Insert: {
          building_id?: never
          building_name: string
          created_at?: string | null
          region_id: number
        }
        Update: {
          building_id?: never
          building_name?: string
          created_at?: string | null
          region_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "buildings_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["region_id"]
          },
        ]
      }
      deleted_events: {
        Row: {
          created_at: string | null
          event_id: number
          excluded_date: string
        }
        Insert: {
          created_at?: string | null
          event_id: number
          excluded_date: string
        }
        Update: {
          created_at?: string | null
          event_id?: number
          excluded_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "deleted_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      event_types: {
        Row: {
          color_code: string | null
          created_at: string | null
          event_type_id: number
          event_type_name: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          event_type_id?: never
          event_type_name: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          event_type_id?: never
          event_type_name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          amenity_id: number
          attachment_url: string | null
          building_id: number
          contact_email: string | null
          contact_phone: string | null
          cost: number | null
          created_at: string | null
          end_time: string
          event_id: number
          event_title: string
          event_type_id: number
          is_recurring: boolean | null
          notes: string | null
          one_time_date: string | null
          recurring_end_date: string | null
          recurring_pattern_id: number | null
          recurring_start_date: string | null
          start_time: string
        }
        Insert: {
          amenity_id: number
          attachment_url?: string | null
          building_id: number
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          end_time: string
          event_id?: never
          event_title: string
          event_type_id: number
          is_recurring?: boolean | null
          notes?: string | null
          one_time_date?: string | null
          recurring_end_date?: string | null
          recurring_pattern_id?: number | null
          recurring_start_date?: string | null
          start_time: string
        }
        Update: {
          amenity_id?: number
          attachment_url?: string | null
          building_id?: number
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          end_time?: string
          event_id?: never
          event_title?: string
          event_type_id?: number
          is_recurring?: boolean | null
          notes?: string | null
          one_time_date?: string | null
          recurring_end_date?: string | null
          recurring_pattern_id?: number | null
          recurring_start_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["amenity_id"]
          },
          {
            foreignKeyName: "events_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["event_type_id"]
          },
          {
            foreignKeyName: "events_recurring_pattern_id_fkey"
            columns: ["recurring_pattern_id"]
            isOneToOne: false
            referencedRelation: "recurring_patterns"
            referencedColumns: ["pattern_id"]
          },
        ]
      }
      modified_events: {
        Row: {
          amenity_id: number
          building_id: number
          contact_email: string | null
          contact_phone: string | null
          cost: number | null
          created_at: string | null
          end_time: string
          event_id: number
          event_title: string
          event_type_id: number
          modified_date: string
          notes: string | null
          start_time: string
        }
        Insert: {
          amenity_id: number
          building_id: number
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          end_time: string
          event_id: number
          event_title: string
          event_type_id: number
          modified_date: string
          notes?: string | null
          start_time: string
        }
        Update: {
          amenity_id?: number
          building_id?: number
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          end_time?: string
          event_id?: number
          event_title?: string
          event_type_id?: number
          modified_date?: string
          notes?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "modified_events_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["amenity_id"]
          },
          {
            foreignKeyName: "modified_events_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["building_id"]
          },
          {
            foreignKeyName: "modified_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "modified_events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["event_type_id"]
          },
        ]
      }
      recurring_patterns: {
        Row: {
          created_at: string | null
          custom_pattern: string | null
          days: string[] | null
          frequency: string
          pattern_id: number
          pattern_name: string
        }
        Insert: {
          created_at?: string | null
          custom_pattern?: string | null
          days?: string[] | null
          frequency: string
          pattern_id?: number
          pattern_name: string
        }
        Update: {
          created_at?: string | null
          custom_pattern?: string | null
          days?: string[] | null
          frequency?: string
          pattern_id?: number
          pattern_name?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string | null
          region_id: number
          region_name: string
        }
        Insert: {
          created_at?: string | null
          region_id?: never
          region_name: string
        }
        Update: {
          created_at?: string | null
          region_id?: never
          region_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_conflicting_events: {
        Args: {
          b_id: number
          a_id: number
          target_date: string
          s_time: string
          e_time: string
        }
        Returns: {
          event_id: number
          building_id: number
          amenity_id: number
          event_type_id: number
          event_title: string
          start_time: string
          end_time: string
          one_time_date: string
          recurring_start_date: string
          recurring_end_date: string
          recurring_pattern_id: number
          notes: string
          cost: number
        }[]
      }
      find_events_by_building: {
        Args: { b_id: number; target_date: string }
        Returns: {
          event_id: number
          building_id: number
          amenity_id: number
          event_type_id: number
          event_title: string
          start_time: string
          end_time: string
          one_time_date: string
          recurring_start_date: string
          recurring_end_date: string
          recurring_pattern_id: number
          notes: string
          cost: number
        }[]
      }
    }
    Enums: {
      event_type: "agency" | "tenant-led" | "internal" | "priority" | "other"
      region_type: "North West" | "North East" | "South West" | "South East"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: ["agency", "tenant-led", "internal", "priority", "other"],
      region_type: ["North West", "North East", "South West", "South East"],
    },
  },
} as const
