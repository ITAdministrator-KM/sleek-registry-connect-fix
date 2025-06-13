
import React from 'react';
import QRCode from 'qrcode.react';

interface StandardIDCardProps {
  userData: {
    name: string;
    nic: string;
    public_id: string;
    mobile?: string;
    address: string;
    date_of_birth?: string;
    qr_code_data?: string;
  };
  showBack?: boolean;
}

const StandardIDCard: React.FC<StandardIDCardProps> = ({ userData, showBack = false }) => {
  const qrData = userData.qr_code_data || JSON.stringify({
    public_id: userData.public_id,
    name: userData.name,
    nic: userData.nic,
    url: `https://dskalmunai.lk/qr-scan/${userData.public_id}`
  });

  // Truncate address if too long
  const truncateAddress = (address: string, maxLength: number = 45) => {
    return address.length > maxLength ? address.substring(0, maxLength) + '...' : address;
  };

  const cardStyle = {
    width: '85.6mm',
    height: '54mm',
    backgroundColor: 'white',
    border: '2px solid black',
    fontFamily: 'Arial, sans-serif',
    fontSize: '8px',
    lineHeight: '1.2',
    color: 'black',
    position: 'relative' as const,
    padding: '3mm',
    boxSizing: 'border-box' as const,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2mm',
    borderBottom: '1px solid black',
    paddingBottom: '1mm',
  };

  const logoStyle = {
    width: '12mm',
    height: '12mm',
    border: '1px solid black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '6px',
  };

  const titleStyle = {
    textAlign: 'center' as const,
    fontWeight: 'bold',
    fontSize: '9px',
    flex: 1,
    margin: '0 2mm',
  };

  const contentStyle = {
    display: 'flex',
    height: 'calc(100% - 15mm)',
  };

  const leftSideStyle = {
    flex: '1',
    paddingRight: '2mm',
  };

  const rightSideStyle = {
    width: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const fieldStyle = {
    marginBottom: '1.5mm',
    display: 'flex',
    fontSize: '7px',
  };

  const labelStyle = {
    fontWeight: 'bold',
    width: '25mm',
    minWidth: '25mm',
  };

  const valueStyle = {
    wordBreak: 'break-word' as const,
    flex: 1,
  };

  return (
    <div style={cardStyle}>
      {/* Header with logos and title */}
      <div style={headerStyle}>
        <div style={logoStyle}>
          <img 
            src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
            alt="Logo 1" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        
        <div style={titleStyle}>
          <div>DIVISIONAL SECRETARIAT</div>
          <div>KALMUNAI</div>
        </div>
        
        <div style={logoStyle}>
          <img 
            src="/lovable-uploads/e73a2c54-9e18-43f7-baf6-bfb62be56894.png" 
            alt="Logo 2" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={contentStyle}>
        {/* Left side - User details */}
        <div style={leftSideStyle}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Name:</span>
            <span style={valueStyle}>{userData.name}</span>
          </div>
          
          <div style={fieldStyle}>
            <span style={labelStyle}>NIC:</span>
            <span style={valueStyle}>{userData.nic}</span>
          </div>
          
          {userData.date_of_birth && (
            <div style={fieldStyle}>
              <span style={labelStyle}>DOB:</span>
              <span style={valueStyle}>{userData.date_of_birth}</span>
            </div>
          )}
          
          {userData.mobile && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Mobile:</span>
              <span style={valueStyle}>{userData.mobile}</span>
            </div>
          )}
          
          <div style={fieldStyle}>
            <span style={labelStyle}>Address:</span>
            <span style={valueStyle}>{truncateAddress(userData.address)}</span>
          </div>
          
          <div style={fieldStyle}>
            <span style={labelStyle}>Public ID:</span>
            <span style={valueStyle}>{userData.public_id}</span>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div style={rightSideStyle}>
          <QRCode
            value={qrData}
            size={120}
            level="M"
            includeMargin={false}
            renderAs="svg"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '35mm',
              maxHeight: '35mm',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StandardIDCard;
