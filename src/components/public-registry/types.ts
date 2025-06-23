export interface Department {
  id: string | number;
  name: string;
}

export interface Division {
  id: string | number;
  name: string;
  department_id: string | number;
}

export interface Visitor {
  id: string | number;
  name: string;
  nic: string;
  phone?: string;
  address?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

// Base registry entry that matches our UI needs
export interface RegistryEntry {
  // Required fields
  id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_nic: string;
  department_id: number;
  purpose_of_visit: string;
  check_in: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Optional fields
  visitor_phone?: string;
  visitor_address?: string;
  department_name?: string;
  division_id?: number;
  division_name?: string;
  remarks?: string;
  check_out?: string;
  
  // Additional fields that might come from the API
  registry_id?: string | number; // Can be string or number to handle API variations
  entry_time?: string;
  exit_time?: string;
  visitor_type?: string;
  
  // Allow any other properties to handle API changes
  [key: string]: any;
}

export interface PublicRegistryFormProps {
  departments?: Department[];
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultTab?: 'new' | 'existing';
  initialValues?: {
    newVisitor?: Partial<NewVisitorFormData>;
    existingVisitor?: Partial<ExistingVisitorFormData>;
  };
}

export interface NewVisitorFormData {
  name: string;
  nic: string;
  address: string;
  phone: string;
  email?: string;
  department_id: string;
  division_id?: string;
  purpose: string;
  remarks?: string;
  create_account: boolean;
}

export interface ExistingVisitorFormData {
  visitor_id: string | number;
  purpose: string;
  remarks?: string;
}

export interface VisitorSearchProps {
  onSelectVisitor: (visitor: Visitor) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  selectedVisitorId?: string | number;
  isLoading: boolean;
  searchResults: Visitor[];
  error?: string | null;
}

export interface DepartmentDivisionSelectProps {
  departmentField: string;
  divisionField: string;
  label?: string;
  className?: string;
  required?: boolean;
  control: any; // From react-hook-form
  departments: Department[];
  divisions: Division[];
  onDepartmentChange?: (departmentId: string | number) => void;
  isLoading?: boolean;
}

export interface EntryLogPanelProps {
  entries: RegistryEntry[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  onCheckOut?: (entryId: string | number) => Promise<void>;
  onExport?: (format: 'csv' | 'pdf') => void;
}
