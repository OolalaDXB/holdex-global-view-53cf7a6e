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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          country: string
          created_at: string | null
          currency: string
          current_value: number
          id: string
          institution: string | null
          name: string
          notes: string | null
          ownership_percentage: number | null
          purchase_date: string | null
          purchase_value: number | null
          quantity: number | null
          rental_income: number | null
          ticker: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string | null
          currency: string
          current_value: number
          id?: string
          institution?: string | null
          name: string
          notes?: string | null
          ownership_percentage?: number | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          rental_income?: number | null
          ticker?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string | null
          currency?: string
          current_value?: number
          id?: string
          institution?: string | null
          name?: string
          notes?: string | null
          ownership_percentage?: number | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          rental_income?: number | null
          ticker?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          brand: string | null
          called_amount: number | null
          commitment_amount: number | null
          country: string
          created_at: string | null
          currency: string
          current_value: number
          description: string | null
          distribution_status: string | null
          fund_name: string | null
          id: string
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          type: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          called_amount?: number | null
          commitment_amount?: number | null
          country: string
          created_at?: string | null
          currency: string
          current_value: number
          description?: string | null
          distribution_status?: string | null
          fund_name?: string | null
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          called_amount?: number | null
          commitment_amount?: number | null
          country?: string
          created_at?: string | null
          currency?: string
          current_value?: number
          description?: string | null
          distribution_status?: string | null
          fund_name?: string | null
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          country: string
          created_at: string | null
          currency: string
          current_balance: number
          end_date: string | null
          id: string
          institution: string | null
          interest_rate: number | null
          linked_asset_id: string | null
          monthly_payment: number | null
          name: string
          notes: string | null
          original_amount: number | null
          start_date: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string | null
          currency: string
          current_balance: number
          end_date?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          linked_asset_id?: string | null
          monthly_payment?: number | null
          name: string
          notes?: string | null
          original_amount?: number | null
          start_date?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string | null
          currency?: string
          current_balance?: number
          end_date?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          linked_asset_id?: string | null
          monthly_payment?: number | null
          name?: string
          notes?: string | null
          original_amount?: number | null
          start_date?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_history: {
        Row: {
          breakdown_by_country: Json | null
          breakdown_by_currency: Json | null
          breakdown_by_type: Json | null
          created_at: string | null
          crypto_prices_snapshot: Json | null
          exchange_rates_snapshot: Json | null
          id: string
          net_worth_eur: number
          snapshot_date: string
          total_assets_eur: number
          total_collections_eur: number
          total_liabilities_eur: number
          user_id: string
        }
        Insert: {
          breakdown_by_country?: Json | null
          breakdown_by_currency?: Json | null
          breakdown_by_type?: Json | null
          created_at?: string | null
          crypto_prices_snapshot?: Json | null
          exchange_rates_snapshot?: Json | null
          id?: string
          net_worth_eur: number
          snapshot_date: string
          total_assets_eur: number
          total_collections_eur: number
          total_liabilities_eur: number
          user_id: string
        }
        Update: {
          breakdown_by_country?: Json | null
          breakdown_by_currency?: Json | null
          breakdown_by_type?: Json | null
          created_at?: string | null
          crypto_prices_snapshot?: Json | null
          exchange_rates_snapshot?: Json | null
          id?: string
          net_worth_eur?: number
          snapshot_date?: string
          total_assets_eur?: number
          total_collections_eur?: number
          total_liabilities_eur?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_currency: string | null
          created_at: string | null
          dark_mode: boolean | null
          email: string
          full_name: string | null
          id: string
          secondary_currency_1: string | null
          secondary_currency_2: string | null
          updated_at: string | null
        }
        Insert: {
          base_currency?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          email: string
          full_name?: string | null
          id: string
          secondary_currency_1?: string | null
          secondary_currency_2?: string | null
          updated_at?: string | null
        }
        Update: {
          base_currency?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          email?: string
          full_name?: string | null
          id?: string
          secondary_currency_1?: string | null
          secondary_currency_2?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shared_access: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string
          shared_with_email: string
          shared_with_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id: string
          shared_with_email: string
          shared_with_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string
          shared_with_email?: string
          shared_with_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_access_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_access_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
