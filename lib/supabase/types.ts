// Gerado a partir do schema do projeto ciajeyaoqyjnozeewest (`npm run db:types` regenera).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          author_id: string | null
          contact_id: string | null
          content: string | null
          created_at: string
          deal_id: string | null
          id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          author_id?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          type: string
        }
        Update: {
          author_id?: string | null
          contact_id?: string | null
          content?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          origem: string
          phone: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          origem?: string
          phone?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          origem?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          attendance: string
          calendly_event_uid: string | null
          contact_id: string
          created_at: string
          deal_type: string
          id: string
          lost_reason: string | null
          mrr: number | null
          next_action: string | null
          next_action_date: string | null
          owner_id: string | null
          position: number
          qualified_at: string | null
          reaquecer_em: string | null
          stage_id: string
          status: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          attendance?: string
          calendly_event_uid?: string | null
          contact_id: string
          created_at?: string
          deal_type?: string
          id?: string
          lost_reason?: string | null
          mrr?: number | null
          next_action?: string | null
          next_action_date?: string | null
          owner_id?: string | null
          position?: number
          qualified_at?: string | null
          reaquecer_em?: string | null
          stage_id: string
          status?: string
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          attendance?: string
          calendly_event_uid?: string | null
          contact_id?: string
          created_at?: string
          deal_type?: string
          id?: string
          lost_reason?: string | null
          mrr?: number | null
          next_action?: string | null
          next_action_date?: string | null
          owner_id?: string | null
          position?: number
          qualified_at?: string | null
          reaquecer_em?: string | null
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          month: string
          owner_id: string | null
          target_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          owner_id?: string | null
          target_value: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          owner_id?: string | null
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name: string
          role?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string
          deal_id: string
          doc_url: string | null
          id: string
          status: string
          valid_until: string | null
          value: number
          version: number
        }
        Insert: {
          created_at?: string
          deal_id: string
          doc_url?: string | null
          id?: string
          status?: string
          valid_until?: string | null
          value?: number
          version?: number
        }
        Update: {
          created_at?: string
          deal_id?: string
          doc_url?: string | null
          id?: string
          status?: string
          valid_until?: string | null
          value?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          color: string | null
          id: string
          key: string | null
          kind: string
          name: string
          position: number
          probability: number
        }
        Insert: {
          color?: string | null
          id?: string
          key?: string | null
          kind?: string
          name: string
          position: number
          probability?: number
        }
        Update: {
          color?: string | null
          id?: string
          key?: string | null
          kind?: string
          name?: string
          position?: number
          probability?: number
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      move_deal: {
        Args: {
          p_deal_id: string
          p_index: number
          p_patch?: Json
          p_stage_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicTables = Database["public"]["Tables"]
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"]
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"]
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"]
