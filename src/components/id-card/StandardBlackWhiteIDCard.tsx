
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
      {/* Print-ready ID Card */}
      <div 
        className="id-card-print-area bg-white border-2 border-black text-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontSize: '8px',
          lineHeight: '1.2',
          fontFamily: 'Arial, sans-serif',
          padding: '2mm',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Header with logos */}
        <div className="flex justify-between items-center mb-1">
          <div className="w-8 h-8 border border-black flex items-center justify-center">
            <span className="text-xs font-bold">LOGO1</span>
          </div>
          <div className="text-center flex-1 mx-2">
            <div className="font-bold text-xs leading-tight">
              DIVISIONAL SECRETARIAT
            </div>
            <div className="font-bold text-xs">
              KALMUNAI
            </div>
          </div>
          <div className="w-8 h-8 border border-black flex items-center justify-center">
            <span className="text-xs font-bold">LOGO2</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex gap-2" style={{ height: '35mm' }}>
          {/* Left side - User details */}
          <div className="flex-1 space-y-1 text-xs">
            <div>
              <span className="font-bold">Name: </span>
              <span>{user.name}</span>
            </div>
            <div>
              <span className="font-bold">ID Number: </span>
              <span>{publicId}</span>
            </div>
            <div>
              <span className="font-bold">NIC: </span>
              <span>{user.nic}</span>
            </div>
            <div>
              <span className="font-bold">DOB: </span>
              <span>{user.dateOfBirth || user.date_of_birth || 'N/A'}</span>
            </div>
            <div>
              <span className="font-bold">Mobile: </span>
              <span>{user.mobile}</span>
            </div>
            <div>
              <span className="font-bold">Address: </span>
              <span className="text-xs leading-tight">{user.address}</span>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex flex-col items-center justify-center" style={{ width: '20mm' }}>
            <QRCodeSVG
              value={qrData}
              size={60}
              level="M"
              includeMargin={false}
              style={{
                width: '18mm',
                height: '18mm'
              }}
            />
            <div className="text-xs mt-1 text-center font-bold">
              SCAN ME
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-1 left-2 right-2 text-center">
          <div className="text-xs font-bold border-t border-black pt-1">
            GOVERNMENT IDENTIFICATION CARD
          </div>
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
            }
          }
        `
      }} />
    </div>
  );
};

export default StandardBlackWhiteIDCard;
