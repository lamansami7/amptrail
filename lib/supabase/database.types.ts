export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProjectRow = {
  id: string;
  company_id: string;
  name: string;
  project_number: string | null;
  site_address: string | null;
  general_contractor: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkTicketRow = {
  id: string;
  company_id: string;
  project_id: string;
  created_by: string | null;
  ticket_number: string;
  occurred_at: string;
  location: string | null;
  description: string;
  out_of_scope_reason: string | null;
  status: Database['public']['Enums']['ticket_status'];
  gc_representative: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LaborEntryRow = {
  id: string;
  company_id: string;
  ticket_id: string;
  worker_name: string;
  hours: number;
  rate: number;
  line_total: number;
  created_at: string;
};

export type MaterialEntryRow = {
  id: string;
  company_id: string;
  ticket_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
};

export type TicketCostRow = {
  id: string;
  company_id: string;
  ticket_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
};

export type EvidenceRow = {
  id: string;
  company_id: string;
  project_id: string;
  ticket_id: string | null;
  uploaded_by: string | null;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  caption: string | null;
  notes: string | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; email: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; email?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; email?: string | null; updated_at?: string };
        Relationships: [];
      };
      companies: {
        Row: { id: string; name: string; slug: string; ticket_counter: number; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; ticket_counter?: number; created_at?: string; updated_at?: string };
        Update: { name?: string; updated_at?: string };
        Relationships: [];
      };
      company_memberships: {
        Row: { id: string; company_id: string; user_id: string; role: 'owner' | 'member'; created_at: string };
        Insert: { id?: string; company_id: string; user_id: string; role?: 'owner' | 'member'; created_at?: string };
        Update: { role?: 'owner' | 'member' };
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: { id?: string; company_id: string; name: string; project_number?: string | null; site_address?: string | null; general_contractor?: string | null; notes?: string | null; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; project_number?: string | null; site_address?: string | null; general_contractor?: string | null; notes?: string | null; is_archived?: boolean; updated_at?: string };
        Relationships: [];
      };
      work_tickets: {
        Row: WorkTicketRow;
        Insert: { id?: string; company_id: string; project_id: string; created_by?: string | null; ticket_number?: string; occurred_at?: string; location?: string | null; description: string; out_of_scope_reason?: string | null; status?: Database['public']['Enums']['ticket_status']; gc_representative?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { project_id?: string; occurred_at?: string; location?: string | null; description?: string; out_of_scope_reason?: string | null; status?: Database['public']['Enums']['ticket_status']; gc_representative?: string | null; notes?: string | null; updated_at?: string };
        Relationships: [];
      };
      labor_entries: {
        Row: LaborEntryRow;
        Insert: { id?: string; company_id: string; ticket_id: string; worker_name: string; hours: number; rate: number; created_at?: string };
        Update: { worker_name?: string; hours?: number; rate?: number };
        Relationships: [];
      };
      material_entries: {
        Row: MaterialEntryRow;
        Insert: { id?: string; company_id: string; ticket_id: string; description: string; quantity: number; unit_cost: number; created_at?: string };
        Update: { description?: string; quantity?: number; unit_cost?: number };
        Relationships: [];
      };
      ticket_costs: {
        Row: TicketCostRow;
        Insert: { id?: string; company_id: string; ticket_id: string; description: string; quantity: number; unit_cost: number; created_at?: string };
        Update: { description?: string; quantity?: number; unit_cost?: number };
        Relationships: [];
      };
      evidence_files: {
        Row: EvidenceRow;
        Insert: { id?: string; company_id: string; project_id: string; ticket_id?: string | null; uploaded_by?: string | null; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; caption?: string | null; notes?: string | null; created_at?: string };
        Update: { caption?: string | null; notes?: string | null };
        Relationships: [];
      };
      activity_events: {
        Row: { id: string; company_id: string; actor_id: string | null; event_type: string; entity_type: string; entity_id: string | null; description: string; created_at: string };
        Insert: { id?: string; company_id: string; actor_id?: string | null; event_type: string; entity_type: string; entity_id?: string | null; description: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_work_ticket: {
        Args: {
          p_ticket_id: string | null;
          p_project_id: string;
          p_occurred_at: string;
          p_location: string | null;
          p_description: string;
          p_out_of_scope_reason: string | null;
          p_status: Database['public']['Enums']['ticket_status'];
          p_gc_representative: string | null;
          p_notes: string | null;
          p_labor: Json;
          p_materials: Json;
          p_costs: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      ticket_status: 'draft' | 'ready_for_review' | 'submitted' | 'approved' | 'rejected' | 'invoiced';
    };
    CompositeTypes: Record<string, never>;
  };
}
