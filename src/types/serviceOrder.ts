export interface DeletedServiceOrder {
  id: string;
  title?: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  owner_id: string;
  owner_name?: string;
  total_count?: number;
  // Service order specific fields
  client_id?: string | null;
  device_type?: string;
  device_model?: string;
  imei_serial?: string | null;
  reported_issue?: string;
  total_price?: number;
  labor_cost?: number;
  parts_cost?: number;
  is_paid?: boolean;
  delivery_date?: string | null;
  warranty_months?: number;
  notes?: string | null;
  deleted_by?: string;
}