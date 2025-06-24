
export interface ServiceFormData {
  service_name: string;
  service_code: string;
  description: string;
  department_id: string;
  division_id: string;
  icon: string;
  fee_amount: string;
  required_documents: string[];
  processing_time_days: string;
  eligibility_criteria: string;
  form_template_url: string;
  status: 'active' | 'inactive';
}

export interface ServiceCatalogProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
