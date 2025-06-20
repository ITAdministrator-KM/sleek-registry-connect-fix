
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
        className="bg-white border-4 border-black"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          lineHeight: '1.2',
          fontWeight: 'bold',
          padding: '3mm',
          boxSizing: 'border-box',
          color: 'black'
        }}
      >
        {/* Header with Logos and Title */}
        <div className="flex justify-between items-center mb-2" style={{ borderBottom: '2px solid black', paddingBottom: '2mm' }}>
          {/* Left Logo */}
          <div 
            className="flex-shrink-0" 
            style={{ 
              width: '12mm', 
              height: '12mm', 
              border: '2px solid black',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'white'
            }}
          >
            <img 
              src="/emblem.svg" 
              alt="Government Emblem"
              style={{
                width: '10mm',
                height: '10mm',
                objectFit: 'contain',
                filter: 'contrast(1) brightness(0)'
              }}
            />
          </div>
          
          {/* Center Title */}
          <div className="text-center px-2 flex-1">
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              DIVISIONAL SECRETARIAT
            </div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '1mm' }}>
              KALMUNAI
            </div>
          </div>
          
          {/* Right Logo */}
          <div 
            className="flex-shrink-0" 
            style={{ 
              width: '12mm', 
              height: '12mm', 
              border: '2px solid black',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'white'
            }}
          >
            <img 
              src="/logo.svg" 
              alt="DS Logo"
              style={{
                width: '10mm',
                height: '10mm',
                objectFit: 'contain',
                filter: 'contrast(1) brightness(0)'
              }}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex" style={{ height: 'calc(100% - 20mm)' }}>
          {/* Left Side - User Information */}
          <div style={{ width: '50%', paddingRight: '2mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            <div style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>Name:</div>
              <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: '1.1' }}>{user.name}</div>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>NIC:</div>
              <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold' }}>{user.nic}</div>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>Date of Birth:</div>
              <div style={{ fontSize: '8px', fontWeight: 'bold' }}>
                {user.date_of_birth || user.dateOfBirth || 'N/A'}
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>Mobile Number:</div>
              <div style={{ fontSize: '8px', fontWeight: 'bold' }}>{user.mobile || 'N/A'}</div>
            </div>
            
            <div style={{ marginBottom: '1.5mm' }}>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>Address:</div>
              <div style={{ fontSize: '7px', lineHeight: '1.1', wordBreak: 'break-word', fontWeight: 'bold' }}>
                {user.address.length > 30 ? user.address.substring(0, 30) + '...' : user.address}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5mm' }}>Public ID:</div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>{publicUserId}</div>
            </div>
          </div>
          
          {/* Right Side - QR Code (50% of card width) */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '2px solid black', paddingLeft: '2mm' }}>
            <div 
              style={{ 
                backgroundColor: 'white', 
                padding: '2mm', 
                border: '2px solid black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <QRCodeSVG 
                value={qrCodeData}
                size={70}
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
            <div style={{ fontSize: '7px', textAlign: 'center', marginTop: '2mm', fontWeight: 'bold', textTransform: 'uppercase' }}>
              SCAN TO VERIFY
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '2mm', left: '3mm', right: '3mm', paddingTop: '1mm', borderTop: '1px solid black' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '7px', fontWeight: 'bold' }}>
              Issued: {new Date().toLocaleDateString()}
            </span>
            <span style={{ fontSize: '7px', fontWeight: 'bold' }}>
              OFFICIAL DOCUMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardBlackWhiteIDCard;
