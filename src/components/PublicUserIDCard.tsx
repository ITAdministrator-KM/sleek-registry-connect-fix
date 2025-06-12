import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';

export interface PublicUserIDCardProps {
  user: {
    name: string;
    nic: string;
    dateOfBirth?: string;
    mobile: string;
    address: string;
    public_id: string;
    qr_code_url?: string;
    department_name?: string;
    division_name?: string;
    email?: string;
    [key: string]: any; // Allow additional properties
  };
  onPrint?: () => void;
  onDownload?: () => void;
  className?: string;
  showActions?: boolean;
}

export const PublicUserIDCard = ({ 
  user, 
  onPrint, 
  onDownload, 
  className = '',
  showActions = true 
}: PublicUserIDCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => cardRef.current,
    onAfterPrint: onPrint,
    documentTitle: `ID_Card_${user.public_id}`,
    pageStyle: `
      @page { 
        size: 85mm 54mm;
        margin: 0;
      }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  } as any);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      handlePrint();
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between mb-6 print:hidden">
        <h2 className="text-2xl font-bold">Public User ID Card</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="default" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
      
      {/* ID Card */}
      <div 
        ref={cardRef}
        className="bg-white border-2 border-gray-800 rounded-lg p-3 w-[85mm] h-[54mm] flex flex-col"
        style={{
          width: '85mm',
          height: '54mm',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3 px-2">
          {/* Left Logo - Emblem */}
          <div className="w-14 h-14 flex-shrink-0">
            <img 
              src="/emblem.svg" 
              alt="Government Emblem"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          
          {/* Center Title */}
          <div className="text-center px-2 flex-1">
            <h1 className="text-sm font-bold uppercase tracking-wider">Divisional Secretariat</h1>
            <h2 className="text-xs font-semibold text-gray-700">Kalmunai</h2>
          </div>
          
          {/* Right Logo */}
          <div className="w-14 h-14 flex-shrink-0">
            <img 
              src="/logo.svg" 
              alt="DS Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-0.5 bg-gray-200 my-1"></div>
        
        <div className="flex h-48">
          {/* Left Side - User Info */}
          <div className="w-1/2 pr-2">
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-gray-500">Name</p>
              <p className="text-xs font-medium">{user.name}</p>
            </div>
            
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-gray-500">NIC</p>
              <p className="text-xs font-mono">{user.nic}</p>
            </div>
            
            {user.dateOfBirth && (
              <div className="mb-2">
                <p className="text-[10px] font-semibold uppercase text-gray-500">Date of Birth</p>
                <p className="text-xs">{user.dateOfBirth}</p>
              </div>
            )}
            
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-gray-500">Mobile</p>
              <p className="text-xs">{user.mobile}</p>
            </div>
            
            <div className="mb-2">
              <p className="text-[10px] font-semibold uppercase text-gray-500">Address</p>
              <p className="text-xs">{user.address}</p>
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase text-gray-500">Public ID</p>
              <p className="text-xs font-mono font-bold">{user.public_id}</p>
            </div>
          </div>
          
          {/* Right Side - QR Code */}
          <div className="w-1/2 flex flex-col items-center justify-center border-l-2 border-gray-800 pl-2">
            <div className="bg-white p-1 border border-gray-300 rounded">
              <QRCodeSVG 
                value={user.qr_code_url || user.public_id} 
                size={120}
                level="H"
                includeMargin={false}
                className="w-full h-auto"
              />
            </div>
            <p className="text-[6px] text-center mt-1 text-gray-600 font-medium">
              SCAN TO VERIFY AUTHENTICITY
            </p>
            <div className="mt-1 text-center">
              <p className="text-[5px] text-gray-500">Issued by:</p>
              <p className="text-[6px] font-semibold">Divisional Secretariat - Kalmunai</p>
              <p className="text-[5px] text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-1">
          <div className="border-t-2 border-gray-800 my-1"></div>
          <p className="text-[6px] text-center text-gray-500">
            This is an official ID card. Any misuse is punishable by law.
          </p>
        </div>
      </div>
    </div>
  );
};

// Export as both default and named export for backward compatibility
export default PublicUserIDCard;
