
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { QRCodeSVG } from 'qrcode.react';

export interface StandardIDCardProps {
  user: {
    name: string;
    nic: string;
    dateOfBirth?: string;
    date_of_birth?: string;
    mobile: string;
    address: string;
    public_user_id?: string;
    public_id?: string;
    [key: string]: any;
  };
  onPrint?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
}

export const StandardBlackWhiteIDCard = ({ 
  user, 
  onPrint, 
  onDownload, 
  showActions = true 
}: StandardIDCardProps) => {
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
          <h2 className="text-2xl font-bold text-black">Government ID Card</h2>
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
        className="bg-white border-2 border-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
          lineHeight: '1.1',
          fontWeight: 'bold',
          padding: '2mm',
          boxSizing: 'border-box',
          color: 'black',
          position: 'relative'
        }}
      >
        {/* Header with Logos and Title */}
        <div className="flex justify-between items-center mb-1" style={{ height: '12mm' }}>
          {/* Left Logo - No Border */}
          <div 
            className="flex-shrink-0" 
            style={{ 
              width: '12mm', 
              height: '12mm',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <img 
              src="/emblem.svg" 
              alt="Government Emblem"
              style={{
                width: '11mm',
                height: '11mm',
                objectFit: 'contain',
                filter: 'contrast(1) brightness(0)'
              }}
            />
          </div>
          
          {/* Center Title */}
          <div className="text-center px-1 flex-1">
            <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: '1' }}>
              DIVISIONAL SECRETARIAT
            </div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '1mm', lineHeight: '1' }}>
              KALMUNAI
            </div>
          </div>
          
          {/* Right Logo - No Border */}
          <div 
            className="flex-shrink-0" 
            style={{ 
              width: '12mm', 
              height: '12mm',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <img 
              src="/logo.svg" 
              alt="DS Logo"
              style={{
                width: '11mm',
                height: '11mm',
                objectFit: 'contain',
                filter: 'contrast(1) brightness(0)'
              }}
            />
          </div>
        </div>
        
        {/* Separator Line */}
        <div style={{ borderBottom: '1px solid black', marginBottom: '2mm' }}></div>
        
        {/* Main Content Area */}
        <div className="flex" style={{ height: 'calc(100% - 16mm)' }}>
          {/* Left Side - User Information (50%) */}
          <div style={{ width: '50%', paddingRight: '2mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ marginBottom: '1mm' }}>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>NAME:</div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', lineHeight: '1', wordBreak: 'break-word' }}>
                {user.name.length > 20 ? user.name.substring(0, 20) + '...' : user.name}
              </div>
            </div>
            
            <div style={{ marginBottom: '1mm' }}>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>NIC:</div>
              <div style={{ fontSize: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{user.nic}</div>
            </div>
            
            <div style={{ marginBottom: '1mm' }}>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>DATE OF BIRTH:</div>
              <div style={{ fontSize: '7px', fontWeight: 'bold' }}>
                {user.date_of_birth || user.dateOfBirth || 'N/A'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1mm' }}>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>MOBILE NUMBER:</div>
              <div style={{ fontSize: '7px', fontWeight: 'bold' }}>{user.mobile || 'N/A'}</div>
            </div>
            
            <div style={{ marginBottom: '1mm' }}>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>ADDRESS:</div>
              <div style={{ fontSize: '6px', lineHeight: '1', wordBreak: 'break-word', fontWeight: 'bold' }}>
                {user.address.length > 40 ? user.address.substring(0, 40) + '...' : user.address}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '7px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>PUBLIC ID:</div>
              <div style={{ fontSize: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{publicUserId}</div>
            </div>
          </div>
          
          {/* Right Side - QR Code (50% width) */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid black', paddingLeft: '2mm' }}>
            <div 
              style={{ 
                backgroundColor: 'white', 
                padding: '1mm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QRCodeSVG 
                value={qrCodeData}
                size={60}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#FFFFFF"
                style={{
                  width: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '1mm', left: '2mm', right: '2mm', paddingTop: '1mm', borderTop: '1px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '6px', fontWeight: 'bold' }}>
              Issued: {new Date().toLocaleDateString()}
            </span>
            <span style={{ fontSize: '6px', fontWeight: 'bold' }}>
              OFFICIAL DOCUMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardBlackWhiteIDCard;
