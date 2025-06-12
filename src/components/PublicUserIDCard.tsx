
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
    public_user_id: string;
    public_id?: string;
    qr_code_url?: string;
    department_name?: string;
    division_name?: string;
    email?: string;
    [key: string]: any;
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
    documentTitle: `ID_Card_${user.public_user_id}`,
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
      handlePrint();
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      {showActions && (
        <div className="flex justify-between mb-6 print:hidden">
          <h2 className="text-2xl font-bold">Government ID Card</h2>
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
      )}
      
      {/* ID Card */}
      <div 
        ref={cardRef}
        className="bg-white border-2 border-black rounded-none p-2 flex flex-col"
        style={{
          width: '85mm',
          height: '54mm',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Header with Logos and Title */}
        <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
          {/* Left Logo */}
          <div className="w-12 h-12 flex-shrink-0">
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
            <h1 className="text-xs font-bold uppercase tracking-wide leading-tight">
              DIVISIONAL SECRETARIAT
            </h1>
            <h2 className="text-xs font-bold tracking-wide">KALMUNAI</h2>
          </div>
          
          {/* Right Logo */}
          <div className="w-12 h-12 flex-shrink-0">
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
        
        {/* Main Content Area */}
        <div className="flex flex-1">
          {/* Left Side - User Information */}
          <div className="w-1/2 pr-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div>
                <p className="text-[8px] font-bold uppercase text-black">Name:</p>
                <p className="text-[9px] font-semibold leading-tight">{user.name}</p>
              </div>
              
              <div>
                <p className="text-[8px] font-bold uppercase text-black">NIC:</p>
                <p className="text-[9px] font-mono font-semibold">{user.nic}</p>
              </div>
              
              {user.dateOfBirth && (
                <div>
                  <p className="text-[8px] font-bold uppercase text-black">Date of Birth:</p>
                  <p className="text-[9px] font-semibold">{user.dateOfBirth}</p>
                </div>
              )}
              
              <div>
                <p className="text-[8px] font-bold uppercase text-black">Mobile:</p>
                <p className="text-[9px] font-semibold">{user.mobile}</p>
              </div>
              
              <div>
                <p className="text-[8px] font-bold uppercase text-black">Address:</p>
                <p className="text-[8px] leading-tight" style={{ wordBreak: 'break-word' }}>
                  {user.address.length > 40 ? user.address.substring(0, 40) + '...' : user.address}
                </p>
              </div>
              
              <div>
                <p className="text-[8px] font-bold uppercase text-black">ID:</p>
                <p className="text-[9px] font-mono font-bold">{user.public_user_id}</p>
              </div>
            </div>
          </div>
          
          {/* Right Side - QR Code */}
          <div className="w-1/2 flex flex-col items-center justify-center border-l-2 border-black pl-2">
            <div className="bg-white p-1 border border-black">
              <QRCodeSVG 
                value={user.qr_code_url || user.public_user_id} 
                size={100}
                level="H"
                includeMargin={false}
                className="w-full h-auto"
              />
            </div>
            <p className="text-[6px] text-center mt-1 font-semibold uppercase">
              SCAN TO VERIFY
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-2 pt-1 border-t border-black">
          <div className="flex justify-between items-center">
            <p className="text-[6px] font-semibold">
              Issued: {new Date().toLocaleDateString('en-GB')}
            </p>
            <p className="text-[6px] font-semibold">
              OFFICIAL DOCUMENT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUserIDCard;
