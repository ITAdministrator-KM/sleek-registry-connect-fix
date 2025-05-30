
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from 'lucide-react';

interface UserSelectionControlsProps {
  autoPrint: boolean;
  setAutoPrint: (value: boolean) => void;
  selectedCount: number;
  filteredCount: number;
  isLoading: boolean;
  onSelectAll: () => void;
  onPrint: () => void;
}

export const UserSelectionControls = ({
  autoPrint,
  setAutoPrint,
  selectedCount,
  filteredCount,
  isLoading,
  onSelectAll,
  onPrint
}: UserSelectionControlsProps) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="auto-print" 
          checked={autoPrint} 
          onCheckedChange={(checked) => setAutoPrint(checked === true)}
        />
        <label htmlFor="auto-print" className="text-sm font-medium">
          Auto Print
        </label>
      </div>
      <Button
        variant="outline"
        onClick={onSelectAll}
        disabled={isLoading || filteredCount === 0}
      >
        {selectedCount === filteredCount ? 'Deselect All' : 'Select All'}
      </Button>
      <Button
        variant="default"
        onClick={onPrint}
        disabled={isLoading || selectedCount === 0}
        className="bg-green-600 hover:bg-green-700"
      >
        <Printer className="mr-2 h-4 w-4" />
        {autoPrint ? 'Print' : 'Generate'} ({selectedCount})
      </Button>
    </div>
  );
};
