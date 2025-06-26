
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
  const publicId = user.public_user_id || user.public_id || user.public_user_id || 'N/A';
  
  const qrData = JSON.stringify({
    public_id: publicId,
    name: user.name,
    nic: user.nic,
    mobile: user.mobile,
    address: user.address
  });

  return (
    <div className={`bg-white ${className}`}>
      {/* Print-ready ID Card - Exact match to uploaded reference */}
      <div 
        className="id-card-print-area bg-white text-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontSize: '11px',
          lineHeight: '1.2',
          fontFamily: 'Arial, sans-serif',
          padding: '4mm',
          margin: '0 auto',
          position: 'relative',
          border: '2px solid black',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with logos */}
        <div className="flex justify-between items-center mb-3" style={{ height: '12mm' }}>
          <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center bg-white">
            <img 
              src="/lovable-uploads/ce961be2-8ad0-4e63-868b-11e111e724f3.png" 
              alt="Logo 1" 
              className="w-8 h-8 object-contain"
              style={{ filter: 'grayscale(100%) contrast(1000%)' }}
            />
          </div>
          <div className="text-center flex-1 mx-3">
            <div className="font-bold text-sm leading-tight" style={{ fontSize: '13px' }}>
              Divisional Secretariat
            </div>
            <div className="font-bold text-sm" style={{ fontSize: '13px' }}>
              Kalmunai
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center bg-white">
            <img 
              src="/lovable-uploads/ce961be2-8ad0-4e63-868b-11e111e724f3.png" 
              alt="Logo 2" 
              className="w-8 h-8 object-contain"
              style={{ filter: 'grayscale(100%) contrast(1000%)' }}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex gap-4 flex-1">
          {/* Left side - User details */}
          <div className="flex-1 space-y-1">
            <div className="flex">
              <span className="font-bold text-black" style={{ width: '60px', fontSize: '11px' }}>Name:</span>
              <span className="text-black" style={{ fontSize: '11px' }}>{user.name}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-black" style={{ width: '60px', fontSize: '11px' }}>NIC:</span>
              <span className="text-black" style={{ fontSize: '11px' }}>{user.nic}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-black" style={{ width: '60px', fontSize: '11px' }}>DOB:</span>
              <span className="text-black" style={{ fontSize: '11px' }}>{user.dateOfBirth || user.date_of_birth || '10/08/1991'}</span>
            </div>
            <div className="flex">
              <span className="font-bold text-black" style={{ width: '60px', fontSize: '11px' }}>Address:</span>
              <span className="text-black leading-tight" style={{ fontSize: '11px' }}>{user.address}</span>
            </div>
            <div className="flex mt-2 pt-2">
              <span className="font-bold text-black" style={{ fontSize: '12px' }}>ID Number:</span>
              <span className="text-black font-bold ml-2" style={{ fontSize: '14px' }}>{publicId}</span>
            </div>
          </div>

          {/* Right side - QR Code */}
          <div className="flex flex-col items-center justify-center" style={{ width: '20mm' }}>
            <div className="border border-black p-1 bg-white">
              <QRCodeSVG
                value={qrData}
                size={60}
                level="M"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
                style={{
                  width: '18mm',
                  height: '18mm'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom border line */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="border-t-2 border-black"></div>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4 justify-center no-print">
          {onPrint && (
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Print Card
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
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
              background: white !important;
            }
            body { 
              margin: 0; 
              padding: 20px; 
              background: white !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default StandardBlackWhiteIDCard;
