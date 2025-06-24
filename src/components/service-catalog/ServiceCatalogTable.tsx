
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import type { ServiceCatalog } from "@/services/apiService";

interface ServiceCatalogTableProps {
  services: ServiceCatalog[];
  onEdit: (service: ServiceCatalog) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

const ServiceCatalogTable = ({ services, onEdit, onDelete, isLoading }: ServiceCatalogTableProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading services...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No services found</p>
        <p className="text-gray-400 text-sm mt-2">Create your first service to get started</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Service</TableHead>
              <TableHead className="min-w-[100px]">Code</TableHead>
              <TableHead className="min-w-[150px]">Department</TableHead>
              <TableHead className="min-w-[120px]">Division</TableHead>
              <TableHead className="min-w-[100px]">Fee</TableHead>
              <TableHead className="min-w-[100px]">Processing</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl flex-shrink-0">{service.icon || '📄'}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{service.service_name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {service.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{service.service_code}</TableCell>
                <TableCell className="truncate">{service.department_name || 'N/A'}</TableCell>
                <TableCell className="truncate">{service.division_name || 'N/A'}</TableCell>
                <TableCell>Rs. {service.fee_amount.toFixed(2)}</TableCell>
                <TableCell>{service.processing_time_days} days</TableCell>
                <TableCell>
                  <Badge variant={service.status === 'active' ? "default" : "secondary"}>
                    {service.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(service)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(service.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ServiceCatalogTable;
