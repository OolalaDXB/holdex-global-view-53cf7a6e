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
          acquisition_from: string | null
          acquisition_type: string | null
          address: string | null
          amount_paid: number | null
          certainty: string | null
          country: string
          created_at: string | null
          currency: string
          current_value: number
          developer: string | null
          entity_id: string | null
          expected_delivery: string | null
          id: string
          image_url: string | null
          institution: string | null
          is_shariah_compliant: boolean | null
          latitude: number | null
          lease_end_date: string | null
          liquidity_status: string | null
          longitude: number | null
          name: string
          notes: string | null
          ownership_allocation: Json | null
          ownership_percentage: number | null
          platform: string | null
          project_name: string | null
          property_status: string | null
          property_type: string | null
          purchase_date: string | null
          purchase_value: number | null
          quantity: number | null
          reference_balance: number | null
          reference_date: string | null
          rental_income: number | null
          rooms: number | null
          shariah_certification: string | null
          size_sqm: number | null
          tenure_type: string | null
          ticker: string | null
          total_price: number | null
          type: string
          unit_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acquisition_from?: string | null
          acquisition_type?: string | null
          address?: string | null
          amount_paid?: number | null
          certainty?: string | null
          country: string
          created_at?: string | null
          currency: string
          current_value: number
          developer?: string | null
          entity_id?: string | null
          expected_delivery?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          is_shariah_compliant?: boolean | null
          latitude?: number | null
          lease_end_date?: string | null
          liquidity_status?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          ownership_allocation?: Json | null
          ownership_percentage?: number | null
          platform?: string | null
          project_name?: string | null
          property_status?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          reference_balance?: number | null
          reference_date?: string | null
          rental_income?: number | null
          rooms?: number | null
          shariah_certification?: string | null
          size_sqm?: number | null
          tenure_type?: string | null
          ticker?: string | null
          total_price?: number | null
          type: string
          unit_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acquisition_from?: string | null
          acquisition_type?: string | null
          address?: string | null
          amount_paid?: number | null
          certainty?: string | null
          country?: string
          created_at?: string | null
          currency?: string
          current_value?: number
          developer?: string | null
          entity_id?: string | null
          expected_delivery?: string | null
          id?: string
          image_url?: string | null
          institution?: string | null
          is_shariah_compliant?: boolean | null
          latitude?: number | null
          lease_end_date?: string | null
          liquidity_status?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          ownership_allocation?: Json | null
          ownership_percentage?: number | null
          platform?: string | null
          project_name?: string | null
          property_status?: string | null
          property_type?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          quantity?: number | null
          reference_balance?: number | null
          reference_date?: string | null
          rental_income?: number | null
          rooms?: number | null
          shariah_certification?: string | null
          size_sqm?: number | null
          tenure_type?: string | null
          ticker?: string | null
          total_price?: number | null
          type?: string
          unit_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
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
          acquisition_from: string | null
          acquisition_type: string | null
          brand: string | null
          called_amount: number | null
          commitment_amount: number | null
          country: string
          created_at: string | null
          currency: string
          current_value: number
          description: string | null
          distribution_status: string | null
          entity_id: string | null
          fund_name: string | null
          id: string
          image_url: string | null
          model: string | null
          name: string
          notes: string | null
          ownership_allocation: Json | null
          purchase_date: string | null
          purchase_value: number | null
          type: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          acquisition_from?: string | null
          acquisition_type?: string | null
          brand?: string | null
          called_amount?: number | null
          commitment_amount?: number | null
          country: string
          created_at?: string | null
          currency: string
          current_value: number
          description?: string | null
          distribution_status?: string | null
          entity_id?: string | null
          fund_name?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name: string
          notes?: string | null
          ownership_allocation?: Json | null
          purchase_date?: string | null
          purchase_value?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          acquisition_from?: string | null
          acquisition_type?: string | null
          brand?: string | null
          called_amount?: number | null
          commitment_amount?: number | null
          country?: string
          created_at?: string | null
          currency?: string
          current_value?: number
          description?: string | null
          distribution_status?: string | null
          entity_id?: string | null
          fund_name?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          ownership_allocation?: Json | null
          purchase_date?: string | null
          purchase_value?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          asset_id: string | null
          collection_id: string | null
          created_at: string | null
          document_date: string | null
          entity_id: string | null
          expiry_date: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          is_verified: boolean | null
          liability_id: string | null
          name: string
          notes: string | null
          receivable_id: string | null
          tags: string[] | null
          type: string
          updated_at: string | null
          user_id: string
          verification_date: string | null
        }
        Insert: {
          asset_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          document_date?: string | null
          entity_id?: string | null
          expiry_date?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          is_verified?: boolean | null
          liability_id?: string | null
          name: string
          notes?: string | null
          receivable_id?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string | null
          user_id: string
          verification_date?: string | null
        }
        Update: {
          asset_id?: string | null
          collection_id?: string | null
          created_at?: string | null
          document_date?: string | null
          entity_id?: string | null
          expiry_date?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          is_verified?: boolean | null
          liability_id?: string | null
          name?: string
          notes?: string | null
          receivable_id?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string | null
          user_id?: string
          verification_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_liability_id_fkey"
            columns: ["liability_id"]
            isOneToOne: false
            referencedRelation: "liabilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          beneficiaries: Json | null
          color: string | null
          coparceners: Json | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          dissolution_date: string | null
          formation_date: string | null
          icon: string | null
          id: string
          is_active: boolean
          jurisdiction: string | null
          karta_name: string | null
          legal_form: string | null
          legal_name: string | null
          marriage_country: string | null
          marriage_date: string | null
          matrimonial_regime: string | null
          name: string
          nationality: string | null
          notes: string | null
          owned_by_entity_id: string | null
          ownership_percentage: number | null
          registration_number: string | null
          share_capital: number | null
          share_capital_currency: string | null
          tax_residence: string | null
          trust_type: string | null
          trustee_name: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          beneficiaries?: Json | null
          color?: string | null
          coparceners?: Json | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dissolution_date?: string | null
          formation_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string | null
          karta_name?: string | null
          legal_form?: string | null
          legal_name?: string | null
          marriage_country?: string | null
          marriage_date?: string | null
          matrimonial_regime?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          owned_by_entity_id?: string | null
          ownership_percentage?: number | null
          registration_number?: string | null
          share_capital?: number | null
          share_capital_currency?: string | null
          tax_residence?: string | null
          trust_type?: string | null
          trustee_name?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          beneficiaries?: Json | null
          color?: string | null
          coparceners?: Json | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dissolution_date?: string | null
          formation_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string | null
          karta_name?: string | null
          legal_form?: string | null
          legal_name?: string | null
          marriage_country?: string | null
          marriage_date?: string | null
          matrimonial_regime?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          owned_by_entity_id?: string | null
          ownership_percentage?: number | null
          registration_number?: string | null
          share_capital?: number | null
          share_capital_currency?: string | null
          tax_residence?: string | null
          trust_type?: string | null
          trustee_name?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_owned_by_entity_id_fkey"
            columns: ["owned_by_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          bank_ownership_percentage: number | null
          certainty: string | null
          cost_price: number | null
          country: string
          created_at: string | null
          currency: string
          current_balance: number
          end_date: string | null
          entity_id: string | null
          financing_type: string | null
          id: string
          institution: string | null
          interest_rate: number | null
          is_shariah_compliant: boolean | null
          linked_asset_id: string | null
          monthly_payment: number | null
          monthly_rental: number | null
          name: string
          notes: string | null
          original_amount: number | null
          profit_margin: number | null
          residual_value: number | null
          shariah_advisor: string | null
          start_date: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_ownership_percentage?: number | null
          certainty?: string | null
          cost_price?: number | null
          country: string
          created_at?: string | null
          currency: string
          current_balance: number
          end_date?: string | null
          entity_id?: string | null
          financing_type?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_shariah_compliant?: boolean | null
          linked_asset_id?: string | null
          monthly_payment?: number | null
          monthly_rental?: number | null
          name: string
          notes?: string | null
          original_amount?: number | null
          profit_margin?: number | null
          residual_value?: number | null
          shariah_advisor?: string | null
          start_date?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_ownership_percentage?: number | null
          certainty?: string | null
          cost_price?: number | null
          country?: string
          created_at?: string | null
          currency?: string
          current_balance?: number
          end_date?: string | null
          entity_id?: string | null
          financing_type?: string | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_shariah_compliant?: boolean | null
          linked_asset_id?: string | null
          monthly_payment?: number | null
          monthly_rental?: number | null
          name?: string
          notes?: string | null
          original_amount?: number | null
          profit_margin?: number | null
          residual_value?: number | null
          shariah_advisor?: string | null
          start_date?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
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
      loan_payments: {
        Row: {
          actual_amount: number | null
          actual_payment_date: string | null
          created_at: string | null
          id: string
          interest_amount: number | null
          loan_schedule_id: string
          notes: string | null
          payment_date: string
          payment_number: number
          principal_amount: number | null
          remaining_principal: number | null
          status: string | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          actual_amount?: number | null
          actual_payment_date?: string | null
          created_at?: string | null
          id?: string
          interest_amount?: number | null
          loan_schedule_id: string
          notes?: string | null
          payment_date: string
          payment_number: number
          principal_amount?: number | null
          remaining_principal?: number | null
          status?: string | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          actual_amount?: number | null
          actual_payment_date?: string | null
          created_at?: string | null
          id?: string
          interest_amount?: number | null
          loan_schedule_id?: string
          notes?: string | null
          payment_date?: string
          payment_number?: number
          principal_amount?: number | null
          remaining_principal?: number | null
          status?: string | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_schedule_id_fkey"
            columns: ["loan_schedule_id"]
            isOneToOne: false
            referencedRelation: "loan_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_schedules: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          imported_schedule: Json | null
          interest_rate: number | null
          is_imported: boolean | null
          liability_id: string
          loan_type: string | null
          monthly_payment: number | null
          next_payment_date: string | null
          notes: string | null
          payment_frequency: string | null
          payments_made: number | null
          principal_amount: number
          rate_type: string | null
          remaining_principal: number | null
          start_date: string
          term_months: number | null
          total_cost: number | null
          total_interest: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          imported_schedule?: Json | null
          interest_rate?: number | null
          is_imported?: boolean | null
          liability_id: string
          loan_type?: string | null
          monthly_payment?: number | null
          next_payment_date?: string | null
          notes?: string | null
          payment_frequency?: string | null
          payments_made?: number | null
          principal_amount: number
          rate_type?: string | null
          remaining_principal?: number | null
          start_date: string
          term_months?: number | null
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          imported_schedule?: Json | null
          interest_rate?: number | null
          is_imported?: boolean | null
          liability_id?: string
          loan_type?: string | null
          monthly_payment?: number | null
          next_payment_date?: string | null
          notes?: string | null
          payment_frequency?: string | null
          payments_made?: number | null
          principal_amount?: number
          rate_type?: string | null
          remaining_principal?: number | null
          start_date?: string
          term_months?: number | null
          total_cost?: number | null
          total_interest?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedules_liability_id_fkey"
            columns: ["liability_id"]
            isOneToOne: false
            referencedRelation: "liabilities"
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
      payment_schedules: {
        Row: {
          amount: number
          asset_id: string
          created_at: string | null
          currency: string
          description: string | null
          due_date: string
          id: string
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_number: number
          payment_reference: string | null
          percentage: number | null
          receipt_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asset_id: string
          created_at?: string | null
          currency?: string
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_number: number
          payment_reference?: string | null
          percentage?: number | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asset_id?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_number?: number
          payment_reference?: string | null
          percentage?: number | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_unit: string | null
          base_currency: string | null
          blur_amounts: boolean | null
          compliance_mode: string | null
          created_at: string | null
          dark_mode: boolean | null
          dashboard_widgets: Json | null
          email: string
          favorite_cities: Json | null
          fiscal_year_start: string | null
          full_name: string | null
          id: string
          news_sources: Json | null
          secondary_currency_1: string | null
          secondary_currency_2: string | null
          updated_at: string | null
        }
        Insert: {
          area_unit?: string | null
          base_currency?: string | null
          blur_amounts?: boolean | null
          compliance_mode?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          dashboard_widgets?: Json | null
          email: string
          favorite_cities?: Json | null
          fiscal_year_start?: string | null
          full_name?: string | null
          id: string
          news_sources?: Json | null
          secondary_currency_1?: string | null
          secondary_currency_2?: string | null
          updated_at?: string | null
        }
        Update: {
          area_unit?: string | null
          base_currency?: string | null
          blur_amounts?: boolean | null
          compliance_mode?: string | null
          created_at?: string | null
          dark_mode?: boolean | null
          dashboard_widgets?: Json | null
          email?: string
          favorite_cities?: Json | null
          fiscal_year_start?: string | null
          full_name?: string | null
          id?: string
          news_sources?: Json | null
          secondary_currency_1?: string | null
          secondary_currency_2?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receivable_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          receivable_id: string
          reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          receivable_id: string
          reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          receivable_id?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivable_payments_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      receivables: {
        Row: {
          certainty: string | null
          created_at: string | null
          currency: string
          current_balance: number
          debtor_contact: string | null
          debtor_name: string
          debtor_type: string | null
          deposit_type: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          id: string
          interest_rate: number | null
          issue_date: string | null
          last_payment_amount: number | null
          last_payment_date: string | null
          linked_asset_id: string | null
          name: string
          notes: string | null
          original_amount: number
          recovery_probability: string | null
          refund_conditions: string | null
          repayment_schedule: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certainty?: string | null
          created_at?: string | null
          currency: string
          current_balance: number
          debtor_contact?: string | null
          debtor_name: string
          debtor_type?: string | null
          deposit_type?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          id?: string
          interest_rate?: number | null
          issue_date?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          linked_asset_id?: string | null
          name: string
          notes?: string | null
          original_amount: number
          recovery_probability?: string | null
          refund_conditions?: string | null
          repayment_schedule?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certainty?: string | null
          created_at?: string | null
          currency?: string
          current_balance?: number
          debtor_contact?: string | null
          debtor_name?: string
          debtor_type?: string | null
          deposit_type?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          id?: string
          interest_rate?: number | null
          issue_date?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          linked_asset_id?: string | null
          name?: string
          notes?: string | null
          original_amount?: number
          recovery_probability?: string | null
          refund_conditions?: string | null
          repayment_schedule?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
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
