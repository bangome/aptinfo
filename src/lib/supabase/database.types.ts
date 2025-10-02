export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      apartment_complexes: {
        Row: {
          id: string
          kapt_code: string | null
          name: string
          address: string
          road_address: string | null
          region_code: string
          legal_dong: string | null
          jibun: string | null
          build_year: number | null
          use_approval_date: string | null
          dong_count: number | null
          household_count: number | null
          floor_count: number | null
          building_structure: string | null
          total_area: number | null
          private_area_total: number | null
          management_area: number | null
          households_60_under: number | null
          households_60_85: number | null
          households_85_135: number | null
          households_135_over: number | null
          construction_company: string | null
          project_company: string | null
          sale_type: string | null
          heating_type: string | null
          apartment_type: string | null
          management_type: string | null
          management_office_phone: string | null
          management_office_fax: string | null
          website_url: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
          data_source: string | null
        }
        Insert: {
          id?: string
          kapt_code?: string | null
          name: string
          address: string
          road_address?: string | null
          region_code: string
          legal_dong?: string | null
          jibun?: string | null
          build_year?: number | null
          use_approval_date?: string | null
          dong_count?: number | null
          household_count?: number | null
          floor_count?: number | null
          building_structure?: string | null
          total_area?: number | null
          private_area_total?: number | null
          management_area?: number | null
          households_60_under?: number | null
          households_60_85?: number | null
          households_85_135?: number | null
          households_135_over?: number | null
          construction_company?: string | null
          project_company?: string | null
          sale_type?: string | null
          heating_type?: string | null
          apartment_type?: string | null
          management_type?: string | null
          management_office_phone?: string | null
          management_office_fax?: string | null
          website_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Update: {
          id?: string
          kapt_code?: string | null
          name?: string
          address?: string
          road_address?: string | null
          region_code?: string
          legal_dong?: string | null
          jibun?: string | null
          build_year?: number | null
          use_approval_date?: string | null
          dong_count?: number | null
          household_count?: number | null
          floor_count?: number | null
          building_structure?: string | null
          total_area?: number | null
          private_area_total?: number | null
          management_area?: number | null
          households_60_under?: number | null
          households_60_85?: number | null
          households_85_135?: number | null
          households_135_over?: number | null
          construction_company?: string | null
          project_company?: string | null
          sale_type?: string | null
          heating_type?: string | null
          apartment_type?: string | null
          management_type?: string | null
          management_office_phone?: string | null
          management_office_fax?: string | null
          website_url?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Relationships: []
      }
      apartment_facilities: {
        Row: {
          id: string
          complex_id: string
          parking_total: number | null
          parking_surface: number | null
          parking_underground: number | null
          elevator_count: number | null
          elevator_management_type: string | null
          cctv_count: number | null
          fire_alarm_type: string | null
          emergency_power_capacity: string | null
          electrical_contract_type: string | null
          electrical_safety_manager: boolean | null
          water_supply_type: string | null
          corridor_type: string | null
          garbage_disposal_type: string | null
          general_management_staff: number | null
          security_management_staff: number | null
          cleaning_management_staff: number | null
          disinfection_annual_count: number | null
          general_management_company: string | null
          security_management_company: string | null
          disinfection_management_type: string | null
          disinfection_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          complex_id: string
          parking_total?: number | null
          parking_surface?: number | null
          parking_underground?: number | null
          elevator_count?: number | null
          elevator_management_type?: string | null
          cctv_count?: number | null
          fire_alarm_type?: string | null
          emergency_power_capacity?: string | null
          electrical_contract_type?: string | null
          electrical_safety_manager?: boolean | null
          water_supply_type?: string | null
          corridor_type?: string | null
          garbage_disposal_type?: string | null
          general_management_staff?: number | null
          security_management_staff?: number | null
          cleaning_management_staff?: number | null
          disinfection_annual_count?: number | null
          general_management_company?: string | null
          security_management_company?: string | null
          disinfection_management_type?: string | null
          disinfection_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          complex_id?: string
          parking_total?: number | null
          parking_surface?: number | null
          parking_underground?: number | null
          elevator_count?: number | null
          elevator_management_type?: string | null
          cctv_count?: number | null
          fire_alarm_type?: string | null
          emergency_power_capacity?: string | null
          electrical_contract_type?: string | null
          electrical_safety_manager?: boolean | null
          water_supply_type?: string | null
          corridor_type?: string | null
          garbage_disposal_type?: string | null
          general_management_staff?: number | null
          security_management_staff?: number | null
          cleaning_management_staff?: number | null
          disinfection_annual_count?: number | null
          general_management_company?: string | null
          security_management_company?: string | null
          disinfection_management_type?: string | null
          disinfection_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_facilities_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "apartment_complexes"
            referencedColumns: ["id"]
          }
        ]
      }
      apartment_trade_transactions: {
        Row: {
          id: string
          complex_id: string | null
          apartment_name: string
          region_code: string
          legal_dong: string
          jibun: string | null
          deal_amount: number
          deal_date: string
          exclusive_area: number | null
          floor_number: number | null
          build_year: number | null
          deal_type: string | null
          deal_cancel_type: string | null
          deal_cancel_date: string | null
          registration_date: string | null
          apartment_dong: string | null
          seller_type: string | null
          buyer_type: string | null
          land_lease_type: string | null
          estate_agent_location: string | null
          created_at: string
          updated_at: string
          data_source: string | null
        }
        Insert: {
          id?: string
          complex_id?: string | null
          apartment_name: string
          region_code: string
          legal_dong: string
          jibun?: string | null
          deal_amount: number
          deal_date: string
          exclusive_area?: number | null
          floor_number?: number | null
          build_year?: number | null
          deal_type?: string | null
          deal_cancel_type?: string | null
          deal_cancel_date?: string | null
          registration_date?: string | null
          apartment_dong?: string | null
          seller_type?: string | null
          buyer_type?: string | null
          land_lease_type?: string | null
          estate_agent_location?: string | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Update: {
          id?: string
          complex_id?: string | null
          apartment_name?: string
          region_code?: string
          legal_dong?: string
          jibun?: string | null
          deal_amount?: number
          deal_date?: string
          exclusive_area?: number | null
          floor_number?: number | null
          build_year?: number | null
          deal_type?: string | null
          deal_cancel_type?: string | null
          deal_cancel_date?: string | null
          registration_date?: string | null
          apartment_dong?: string | null
          seller_type?: string | null
          buyer_type?: string | null
          land_lease_type?: string | null
          estate_agent_location?: string | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_trade_transactions_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "apartment_complexes"
            referencedColumns: ["id"]
          }
        ]
      }
      apartment_rent_transactions: {
        Row: {
          id: string
          complex_id: string | null
          apartment_name: string
          region_code: string
          legal_dong: string
          jibun: string | null
          deposit_amount: number
          monthly_rent: number
          deal_date: string
          exclusive_area: number | null
          floor_number: number | null
          build_year: number | null
          contract_term: string | null
          contract_type: string | null
          renewal_right_used: string | null
          previous_deposit: number | null
          previous_monthly_rent: number | null
          created_at: string
          updated_at: string
          data_source: string | null
        }
        Insert: {
          id?: string
          complex_id?: string | null
          apartment_name: string
          region_code: string
          legal_dong: string
          jibun?: string | null
          deposit_amount: number
          monthly_rent?: number
          deal_date: string
          exclusive_area?: number | null
          floor_number?: number | null
          build_year?: number | null
          contract_term?: string | null
          contract_type?: string | null
          renewal_right_used?: string | null
          previous_deposit?: number | null
          previous_monthly_rent?: number | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Update: {
          id?: string
          complex_id?: string | null
          apartment_name?: string
          region_code?: string
          legal_dong?: string
          jibun?: string | null
          deposit_amount?: number
          monthly_rent?: number
          deal_date?: string
          exclusive_area?: number | null
          floor_number?: number | null
          build_year?: number | null
          contract_term?: string | null
          contract_type?: string | null
          renewal_right_used?: string | null
          previous_deposit?: number | null
          previous_monthly_rent?: number | null
          created_at?: string
          updated_at?: string
          data_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apartment_rent_transactions_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "apartment_complexes"
            referencedColumns: ["id"]
          }
        ]
      }
      facility_categories: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      apartment_facility_mapping: {
        Row: {
          id: string
          complex_id: string
          facility_id: string
          created_at: string
        }
        Insert: {
          id?: string
          complex_id: string
          facility_id: string
          created_at?: string
        }
        Update: {
          id?: string
          complex_id?: string
          facility_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_facility_mapping_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "apartment_complexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartment_facility_mapping_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facility_categories"
            referencedColumns: ["id"]
          }
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

// Convenience types for tables
export type ApartmentComplex = Database['public']['Tables']['apartment_complexes']['Row']
export type ApartmentComplexInsert = Database['public']['Tables']['apartment_complexes']['Insert']
export type ApartmentComplexUpdate = Database['public']['Tables']['apartment_complexes']['Update']

export type ApartmentFacility = Database['public']['Tables']['apartment_facilities']['Row']
export type ApartmentFacilityInsert = Database['public']['Tables']['apartment_facilities']['Insert']
export type ApartmentFacilityUpdate = Database['public']['Tables']['apartment_facilities']['Update']

export type ApartmentTradeTransaction = Database['public']['Tables']['apartment_trade_transactions']['Row']
export type ApartmentTradeTransactionInsert = Database['public']['Tables']['apartment_trade_transactions']['Insert']
export type ApartmentTradeTransactionUpdate = Database['public']['Tables']['apartment_trade_transactions']['Update']

export type ApartmentRentTransaction = Database['public']['Tables']['apartment_rent_transactions']['Row']
export type ApartmentRentTransactionInsert = Database['public']['Tables']['apartment_rent_transactions']['Insert']
export type ApartmentRentTransactionUpdate = Database['public']['Tables']['apartment_rent_transactions']['Update']

export type FacilityCategory = Database['public']['Tables']['facility_categories']['Row']
export type FacilityCategoryInsert = Database['public']['Tables']['facility_categories']['Insert']
export type FacilityCategoryUpdate = Database['public']['Tables']['facility_categories']['Update']

export type ApartmentFacilityMapping = Database['public']['Tables']['apartment_facility_mapping']['Row']
export type ApartmentFacilityMappingInsert = Database['public']['Tables']['apartment_facility_mapping']['Insert']
export type ApartmentFacilityMappingUpdate = Database['public']['Tables']['apartment_facility_mapping']['Update']

// Extended types with relationships
export type ApartmentComplexWithFacilities = ApartmentComplex & {
  apartment_facilities?: ApartmentFacility
  facility_mappings?: (ApartmentFacilityMapping & {
    facility_categories: FacilityCategory
  })[]
  trade_transactions?: ApartmentTradeTransaction[]
  rent_transactions?: ApartmentRentTransaction[]
}