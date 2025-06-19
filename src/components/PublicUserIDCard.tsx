
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
  
  const publicUserId = user.public_user_id || user.public_id || 'N/A';
  
  // Generate QR code data for verification
  const qrCodeData = JSON.stringify({
    public_id: publicUserId,
    name: user.name,
    nic: user.nic,
    mobile: user.mobile,
    address: user.address,
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
          border: 4px solid #000 !important;
          background: white !important;
          color: black !important;
          font-family: 'Arial Black', Arial, sans-serif !important;
          font-weight: 900 !important;
        }
        .qr-code-container {
          background: white !important;
          border: 3px solid black !important;
        }
        .logo-container {
          background: white !important;
          border: 3px solid black !important;
          filter: contrast(3) brightness(0.5) !important;
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
        className="id-card-print bg-white border-4 border-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '10px',
          lineHeight: '1.2',
          fontWeight: '900',
          padding: '3mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Header with Logos and Title */}
        <div className="flex justify-between items-center mb-2" style={{ borderBottom: '3px solid black', paddingBottom: '2mm' }}>
          {/* Left Logo */}
          <div 
            className="logo-container flex-shrink-0" 
            style={{ 
              width: '15mm', 
              height: '15mm', 
              border: '3px solid black', 
              backgroundColor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <img 
              src="/lovable-uploads/46b85adb-92bd-446b-80a8-15b57ff39dcf.png" 
              alt="Government Emblem"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                filter: 'contrast(3) brightness(0.5)'
              }}
            />
          </div>
          
          {/* Center Title */}
          <div className="text-center px-2 flex-1">
            <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.8px', lineHeight: '1.1' }}>
              DIVISIONAL SECRETARIAT
            </div>
            <div style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1.5px', marginTop: '1mm' }}>KALMUNAI</div>
          </div>
          
          {/* Right Logo */}
          <div 
            className="logo-container flex-shrink-0" 
            style={{ 
              width: '15mm', 
              height: '15mm', 
              border: '3px solid black', 
              backgroundColor: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <img 
              src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
              alt="DS Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
                filter: 'contrast(3) brightness(0.5)'
              }}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex h-full">
          {/* Left Side - User Information (50%) */}
          <div style={{ width: '50%', paddingRight: '2mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ marginBottom: '1.5mm' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>Name:</span>
              <span style={{ fontSize: '11px', fontWeight: '900', lineHeight: '1.1', display: 'block' }}>{user.name}</span>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>NIC:</span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: '900', display: 'block' }}>{user.nic}</span>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>DOB:</span>
              <span style={{ fontSize: '10px', fontWeight: '900', display: 'block' }}>
                {user.date_of_birth || user.dateOfBirth || 'N/A'}
              </span>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>Mobile:</span>
              <span style={{ fontSize: '10px', fontWeight: '900', display: 'block' }}>{user.mobile || 'N/A'}</span>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>Address:</span>
              <span style={{ fontSize: '9px', lineHeight: '1.1', display: 'block', wordBreak: 'break-word', fontWeight: '800' }}>
                {user.address.length > 35 ? user.address.substring(0, 35) + '...' : user.address}
              </span>
            </div>
            
            <div>
              <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'black', display: 'block' }}>Public ID:</span>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: '900', display: 'block' }}>{publicUserId}</span>
            </div>
          </div>
          
          {/* Right Side - QR Code (50%) */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '3px solid black', paddingLeft: '2mm' }}>
            <div 
              className="qr-code-container"
              style={{ 
                backgroundColor: 'white', 
                padding: '2mm', 
                border: '3px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QRCodeSVG 
                value={qrCodeData}
                size={80}
                level="H"
                includeMargin={false}
                style={{
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                  width: '100%',
                  height: 'auto'
                }}
              />
            </div>
            <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '2mm', fontWeight: '900', textTransform: 'uppercase' }}>
              SCAN FOR VERIFICATION
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ marginTop: '2mm', paddingTop: '1mm', borderTop: '2px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '900' }}>
              Issued: {new Date().toLocaleDateString()}
            </span>
            <span style={{ fontSize: '9px', fontWeight: '900' }}>
              OFFICIAL DOCUMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUserIDCard;
