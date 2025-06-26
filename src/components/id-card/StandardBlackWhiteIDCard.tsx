
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface StandardBlackWhiteIDCardProps {
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

export const StandardBlackWhiteIDCard: React.FC<StandardBlackWhiteIDCardProps> = ({
  user,
  onPrint,
  onDownload,
  className = "",
  showActions = true
}) => {
  const publicId = user.public_user_id || user.public_id || 'N/A';
  
  const qrData = JSON.stringify({
    public_id: publicId,
    name: user.name,
    nic: user.nic,
    mobile: user.mobile,
    address: user.address
  });

  return (
    <div className={`bg-white ${className}`}>
      {/* Print-ready ID Card - Exact match to reference */}
      <div 
        className="id-card-print-area bg-white border-2 border-black text-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontSize: '10px',
          lineHeight: '1.1',
          fontFamily: 'Arial, sans-serif',
          padding: '3mm',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with logos - minimized height */}
        <div className="flex justify-between items-center" style={{ height: '8mm', marginBottom: '2mm' }}>
          <div className="w-6 h-6 border border-black flex items-center justify-center rounded-full">
            <span className="text-xs font-bold">L1</span>
          </div>
          <div className="text-center flex-1 mx-2">
            <div className="font-bold text-xs leading-tight">
              Divisional Secretariat
            </div>
            <div className="font-bold text-xs">
              Kalmunai
            </div>
          </div>
          <div className="w-6 h-6 border border-black flex items-center justify-center rounded-full">
            <span className="text-xs font-bold">L2</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex gap-3 flex-1">
          {/* Left side - User details */}
          <div className="flex-1 space-y-1">
            <div className="flex">
              <span className="font-bold w-16 text-xs">Name:</span>
              <span className="text-xs">{user.name}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-16 text-xs">NIC:</span>
              <span className="text-xs">{user.nic}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-16 text-xs">DOB:</span>
              <span className="text-xs">{user.dateOfBirth || user.date_of_birth || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-16 text-xs">Address:</span>
              <span className="text-xs leading-tight">{user.address}</span>
            </div>
            <div className="flex mt-2">
              <span className="font-bold w-20 text-xs">ID Number:</span>
              <span className="text-sm font-bold">{publicId}</span>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex flex-col items-center justify-center" style={{ width: '18mm' }}>
            <QRCodeSVG
              value={qrData}
              size={50}
              level="M"
              includeMargin={false}
              style={{
                width: '16mm',
                height: '16mm'
              }}
            />
          </div>
        </div>

        {/* Bottom border line */}
        <div className="absolute bottom-1 left-2 right-2">
          <div className="border-t border-black"></div>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4 justify-center no-print">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Print Card
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download PDF
            </button>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print { display: none !important; }
            .id-card-print-area {
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              transform: none !important;
              margin: 0 !important;
            }
            body { margin: 0; padding: 20px; }
          }
        `
      }} />
    </div>
  );
};

export default StandardBlackWhiteIDCard;
