
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
    date_of_birth?: string;
    mobile: string;
    address: string;
    public_user_id?: string;
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
  
  // Format date of birth for display
  const formattedDateOfBirth = user.dateOfBirth 
    ? new Date(user.dateOfBirth).toLocaleDateString('en-GB')
    : user.date_of_birth 
      ? new Date(user.date_of_birth).toLocaleDateString('en-GB')
      : 'N/A';
      
  // Ensure public user ID is available
  const publicUserId = user.public_user_id || user.public_id || 'N/A';
  
  // Generate QR code data for verification
  const qrCodeData = JSON.stringify({
    public_id: publicUserId,
    name: user.name,
    nic: user.nic,
    issued: new Date().toISOString().split('T')[0],
    authority: 'Divisional Secretariat Kalmunai'
  });

  const handlePrint = useReactToPrint({
    content: () => cardRef.current,
    onAfterPrint: onPrint,
    documentTitle: `ID_Card_${publicUserId}`,
    pageStyle: `
      @page { 
        size: 85.6mm 54mm;
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
        }
        .id-card-print {
          width: 85.6mm !important;
          height: 54mm !important;
          border: 2px solid #000 !important;
          background: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
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
        className="id-card-print bg-white border-2 border-black font-mono text-black p-1"
        style={{
          width: '85.6mm',
          height: '54mm',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          fontFamily: 'Arial, sans-serif',
          fontSize: '8px',
          lineHeight: '1.2'
        }}
      >
        {/* Header with Logos and Title */}
        <div className="flex justify-between items-center mb-1 border-b-2 border-black pb-1">
          {/* Left Logo */}
          <div className="w-10 h-10 flex-shrink-0 border border-black bg-white">
            <img 
              src="/emblem.svg" 
              alt="Government Emblem"
              className="w-full h-full object-contain"
              style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                filter: 'contrast(1) brightness(1)'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:6px;font-weight:bold;">LOGO1</div>';
                }
              }}
            />
          </div>
          
          {/* Center Title */}
          <div className="text-center px-1 flex-1">
            <div className="text-xs font-bold uppercase tracking-tight leading-tight">
              DIVISIONAL SECRETARIAT
            </div>
            <div className="text-xs font-bold tracking-wide">KALMUNAI</div>
          </div>
          
          {/* Right Logo */}
          <div className="w-10 h-10 flex-shrink-0 border border-black bg-white">
            <img 
              src="/logo.svg" 
              alt="DS Logo"
              className="w-full h-full object-contain"
              style={{
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                filter: 'contrast(1) brightness(1)'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:6px;font-weight:bold;">LOGO2</div>';
                }
              }}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex h-full">
          {/* Left Side - User Information (50%) */}
          <div className="w-1/2 pr-1 flex flex-col justify-around">
            <div className="space-y-0.5">
              <div>
                <span className="text-xs font-bold uppercase text-black block">Name:</span>
                <span className="text-xs font-semibold leading-tight block">{user.name}</span>
              </div>
              
              <div>
                <span className="text-xs font-bold uppercase text-black block">NIC:</span>
                <span className="text-xs font-mono font-semibold block">{user.nic}</span>
              </div>
              
              {formattedDateOfBirth !== 'N/A' && (
                <div>
                  <span className="text-xs font-bold uppercase text-black block">Date of Birth:</span>
                  <span className="text-xs font-semibold block">{formattedDateOfBirth}</span>
                </div>
              )}
              
              <div>
                <span className="text-xs font-bold uppercase text-black block">Mobile:</span>
                <span className="text-xs font-semibold block">{user.mobile || 'N/A'}</span>
              </div>
              
              <div>
                <span className="text-xs font-bold uppercase text-black block">Address:</span>
                <span className="text-xs leading-tight block" style={{ wordBreak: 'break-word' }}>
                  {user.address.length > 35 ? user.address.substring(0, 35) + '...' : user.address}
                </span>
              </div>
              
              <div>
                <span className="text-xs font-bold uppercase text-black block">Public ID:</span>
                <span className="text-xs font-mono font-bold block">{publicUserId}</span>
              </div>
            </div>
          </div>
          
          {/* Right Side - QR Code (50%) */}
          <div className="w-1/2 flex flex-col items-center justify-center border-l-2 border-black pl-1">
            <div className="bg-white p-0.5 border border-black">
              <QRCodeSVG 
                value={qrCodeData}
                size={80}
                level="H"
                includeMargin={false}
                className="w-full h-auto"
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact'
                }}
              />
            </div>
            <div className="text-xs text-center mt-0.5 font-semibold uppercase">
              QR CODE
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-1 pt-0.5 border-t border-black">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold">
              Issued: {new Date().toLocaleDateString('en-GB')}
            </span>
            <span className="text-xs font-semibold">
              OFFICIAL DOCUMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUserIDCard;
