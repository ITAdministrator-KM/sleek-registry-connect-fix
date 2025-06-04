
import { toast } from '@/hooks/use-toast';
import type { PublicUser } from '@/services/api';

interface IDCardData {
  public_id: string;
  name: string;
  nic: string;
  mobile: string;
  address: string;
  qr_code_data?: string;
}

export class ResponsiveIDCardPrinter {
  private static truncateAddress(address: string, maxLength: number = 40): string {
    if (address.length <= maxLength) return address;
    
    // Try to break at a word boundary
    const truncated = address.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  private static createIDCardHTML(user: IDCardData): string {
    const truncatedAddress = this.truncateAddress(user.address);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ID Card - ${user.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          background: #f0f0f0; 
          padding: 20px;
        }
        .card-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10mm;
          justify-content: center;
        }
        .id-card {
          width: 85.6mm;
          height: 54mm;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border-radius: 8px;
          padding: 3mm;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          page-break-inside: avoid;
          margin-bottom: 5mm;
        }
        .header {
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.3);
          padding-bottom: 2mm;
          margin-bottom: 2mm;
        }
        .logo {
          width: 12mm;
          height: 12mm;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          margin: 0 auto 1mm;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 8px;
        }
        .org-name {
          font-size: 9px;
          font-weight: bold;
          line-height: 1.1;
        }
        .content {
          display: flex;
          gap: 2mm;
          height: calc(100% - 18mm);
        }
        .info {
          flex: 1;
          font-size: 7px;
          line-height: 1.2;
        }
        .field {
          margin-bottom: 1mm;
          word-wrap: break-word;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          width: 12mm;
        }
        .value {
          font-weight: normal;
        }
        .name {
          font-size: 8px;
          font-weight: bold;
          margin-bottom: 2mm;
          color: #fbbf24;
        }
        .qr-section {
          width: 18mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-code {
          width: 16mm;
          height: 16mm;
          background: white;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1mm;
        }
        .qr-text {
          font-size: 5px;
          text-align: center;
          line-height: 1.1;
        }
        .footer {
          position: absolute;
          bottom: 1mm;
          left: 3mm;
          right: 3mm;
          text-align: center;
          font-size: 5px;
          opacity: 0.8;
          border-top: 1px solid rgba(255,255,255,0.3);
          padding-top: 1mm;
        }
        @media print {
          body { padding: 0; background: white; }
          .card-container { gap: 5mm; }
        }
        @page {
          size: A4;
          margin: 10mm;
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <div class="id-card">
          <div class="header">
            <div class="logo">DSK</div>
            <div class="org-name">Divisional Secretariat<br>Kalmunai</div>
          </div>
          
          <div class="content">
            <div class="info">
              <div class="name">${user.name}</div>
              <div class="field">
                <span class="label">NIC:</span>
                <span class="value">${user.nic}</span>
              </div>
              <div class="field">
                <span class="label">Mobile:</span>
                <span class="value">${user.mobile}</span>
              </div>
              <div class="field">
                <span class="label">ID:</span>
                <span class="value">${user.public_id}</span>
              </div>
              <div class="field">
                <span class="label">Address:</span>
                <span class="value">${truncatedAddress}</span>
              </div>
            </div>
            
            <div class="qr-section">
              <div class="qr-code" id="qr-${user.public_id}">
                <div style="font-size: 6px; color: #666;">QR Code</div>
              </div>
              <div class="qr-text">Scan for<br>verification</div>
            </div>
          </div>
          
          <div class="footer">
            Generated: ${new Date().toLocaleDateString()} | Valid for official purposes
          </div>
        </div>
      </div>
    </body>
    </html>`;
  }

  static async printSingleCard(user: PublicUser, autoPrint: boolean = false, toast: any) {
    try {
      const cardData: IDCardData = {
        public_id: user.public_id,
        name: user.name,
        nic: user.nic,
        mobile: user.mobile,
        address: user.address,
        qr_code_data: user.qr_code_data
      };

      const htmlContent = this.createIDCardHTML(cardData);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for printing.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Generate QR code after the window loads
      printWindow.onload = () => {
        if (user.qr_code_data) {
          this.generateQRCodeInWindow(printWindow, user.public_id, user.qr_code_data);
        }
        
        if (autoPrint) {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      };

      toast({
        title: "ID Card Generated",
        description: `ID card for ${user.name} (${user.public_id}) is ready`,
      });

    } catch (error) {
      console.error('Error generating ID card:', error);
      throw error;
    }
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean = false, toast: any) {
    try {
      if (users.length === 0) {
        throw new Error('No users selected for printing');
      }

      let allCardsHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ID Cards Batch Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            background: #f0f0f0; 
            padding: 10mm;
          }
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10mm;
            max-width: 190mm;
            margin: 0 auto;
          }
          .id-card {
            width: 85.6mm;
            height: 54mm;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            border-radius: 8px;
            padding: 3mm;
            color: white;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            page-break-inside: avoid;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .logo {
            width: 12mm;
            height: 12mm;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            margin: 0 auto 1mm;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8px;
          }
          .org-name {
            font-size: 9px;
            font-weight: bold;
            line-height: 1.1;
          }
          .content {
            display: flex;
            gap: 2mm;
            height: calc(100% - 18mm);
          }
          .info {
            flex: 1;
            font-size: 7px;
            line-height: 1.2;
          }
          .field {
            margin-bottom: 1mm;
            word-wrap: break-word;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            width: 12mm;
          }
          .value {
            font-weight: normal;
          }
          .name {
            font-size: 8px;
            font-weight: bold;
            margin-bottom: 2mm;
            color: #fbbf24;
          }
          .qr-section {
            width: 18mm;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-code {
            width: 16mm;
            height: 16mm;
            background: white;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1mm;
          }
          .qr-text {
            font-size: 5px;
            text-align: center;
            line-height: 1.1;
          }
          .footer {
            position: absolute;
            bottom: 1mm;
            left: 3mm;
            right: 3mm;
            text-align: center;
            font-size: 5px;
            opacity: 0.8;
            border-top: 1px solid rgba(255,255,255,0.3);
            padding-top: 1mm;
          }
          @media print {
            body { padding: 5mm; background: white; }
            .cards-grid { gap: 5mm; }
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        </style>
      </head>
      <body>
        <div class="cards-grid">`;

      users.forEach(user => {
        const truncatedAddress = this.truncateAddress(user.address);
        allCardsHTML += `
          <div class="id-card">
            <div class="header">
              <div class="logo">DSK</div>
              <div class="org-name">Divisional Secretariat<br>Kalmunai</div>
            </div>
            
            <div class="content">
              <div class="info">
                <div class="name">${user.name}</div>
                <div class="field">
                  <span class="label">NIC:</span>
                  <span class="value">${user.nic}</span>
                </div>
                <div class="field">
                  <span class="label">Mobile:</span>
                  <span class="value">${user.mobile}</span>
                </div>
                <div class="field">
                  <span class="label">ID:</span>
                  <span class="value">${user.public_id}</span>
                </div>
                <div class="field">
                  <span class="label">Address:</span>
                  <span class="value">${truncatedAddress}</span>
                </div>
              </div>
              
              <div class="qr-section">
                <div class="qr-code" id="qr-${user.public_id}">
                  <div style="font-size: 6px; color: #666;">QR Code</div>
                </div>
                <div class="qr-text">Scan for<br>verification</div>
              </div>
            </div>
            
            <div class="footer">
              Generated: ${new Date().toLocaleDateString()} | Valid for official purposes
            </div>
          </div>`;
      });

      allCardsHTML += `
        </div>
      </body>
      </html>`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for printing.');
      }

      printWindow.document.write(allCardsHTML);
      printWindow.document.close();

      if (autoPrint) {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }

      toast({
        title: "ID Cards Generated",
        description: `${users.length} ID cards generated successfully`,
      });

    } catch (error) {
      console.error('Error generating ID cards:', error);
      throw error;
    }
  }

  private static generateQRCodeInWindow(printWindow: Window, publicId: string, qrData: string) {
    // Simple QR code placeholder - in production, you'd use a QR library
    const qrElement = printWindow.document.getElementById(`qr-${publicId}`);
    if (qrElement) {
      qrElement.innerHTML = `<div style="font-size: 4px; color: #333; text-align: center; word-break: break-all;">${publicId}</div>`;
    }
  }
}
