export interface TokenInfo {
  id?: number;
  token_number: string;
  estimated_wait_time: number;
  queue_position: number;
  status: string;
  service_name: string;
  is_next: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceCatalog {
  id: number;
  service_name: string;
  service_code: string;
  description: string;
  icon: string;
  fee_amount: number;
  processing_time_days: number;
  department_name: string;
  status: string;
  category: string;
  duration_minutes: number;
}

export interface UserApplication {
  id: number;
  request_number: string;
  service_name: string;
  status: string;
  created_at: string;
  estimated_completion: string;
  fee_amount: number;
  payment_status: string;
  progress_percentage: number;
}
