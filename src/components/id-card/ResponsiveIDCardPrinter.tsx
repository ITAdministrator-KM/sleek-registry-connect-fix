import { PublicUser } from '@/services/apiService';
import QRCode from 'qrcode';

export class ResponsiveIDCardPrinter {
  static async generateQRCode(user: PublicUser): Promise<string> {
    try {
      const qrData = JSON.stringify({
        id: user.public_id,
        name: user.name,
        nic: user.nic,
        mobile: user.mobile,
        address: user.address,
        email: user.email || '',
        issued: new Date().toISOString().split('T')[0]
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 120
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  }

  static async printSingleCard(user: PublicUser, autoPrint: boolean = false, toast: any) {
    try {
      const qrCode = await this.generateQRCode(user);
      const cardHTML = this.generateCardHTML(user, qrCode);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }

      printWindow.document.write(cardHTML);
      printWindow.document.close();

      if (autoPrint) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };
      }

      toast({
        title: "Success",
        description: `ID card generated for ${user.name}`,
      });

    } catch (error) {
      console.error('Error printing card:', error);
      toast({
        title: "Error",
        description: "Failed to generate ID card",
        variant: "destructive",
      });
    }
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean = false, toast: any) {
    try {
      let allCardsHTML = this.getPrintStyles();
      
      for (let i = 0; i < users.length; i += 2) {
        const user1 = users[i];
        const user2 = users[i + 1];
        
        const qr1 = await this.generateQRCode(user1);
        const qr2 = user2 ? await this.generateQRCode(user2) : '';
        
        allCardsHTML += this.generatePageHTML(user1, qr1, user2, qr2);
      }
      
      allCardsHTML += '</body></html>';
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }

      printWindow.document.write(allCardsHTML);
      printWindow.document.close();

      if (autoPrint) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 1000);
        };
      }

      toast({
        title: "Success",
        description: `Generated ${users.length} ID cards successfully`,
      });

    } catch (error) {
      console.error('Error printing multiple cards:', error);
      toast({
        title: "Error",
        description: "Failed to generate ID cards",
        variant: "destructive",
      });
    }
  }

  private static getPrintStyles(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>DSK ID Cards</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: white;
            color: black;
          }
          
          .page {
            width: 100%;
            height: 297mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 20mm;
          }
          
          .page:last-child {
            page-break-after: avoid;
          }
          
          .id-card {
            width: 85.6mm;
            height: 54mm;
            border: 2px solid #000;
            border-radius: 8px;
            padding: 4mm;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
          }
          
          .card-header {
            text-align: center;
            margin-bottom: 2mm;
          }
          
          .org-name {
            font-size: 8px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 1mm;
          }
          
          .card-title {
            font-size: 6px;
            color: #374151;
            font-weight: 600;
          }
          
          .card-body {
            display: flex;
            flex: 1;
            gap: 2mm;
          }
          
          .user-info {
            flex: 1;
            font-size: 5px;
            line-height: 1.3;
          }
          
          .qr-section {
            width: 15mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .qr-code {
            width: 12mm;
            height: 12mm;
            border: 1px solid #ddd;
          }
          
          .qr-label {
            font-size: 4px;
            text-align: center;
            margin-top: 1mm;
            color: #6b7280;
          }
          
          .info-row {
            margin-bottom: 1mm;
            display: flex;
            gap: 1mm;
          }
          
          .label {
            font-weight: bold;
            color: #374151;
            min-width: 8mm;
          }
          
          .value {
            color: #111827;
            word-break: break-word;
          }
          
          .public-id {
            background: #1e40af;
            color: white;
            padding: 0.5mm 1mm;
            border-radius: 2mm;
            font-weight: bold;
            font-size: 6px;
            text-align: center;
            margin-bottom: 2mm;
          }
          
          .card-footer {
            border-top: 1px solid #d1d5db;
            padding-top: 1mm;
            margin-top: 1mm;
            text-align: center;
            font-size: 4px;
            color: #6b7280;
          }
          
          @media print {
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
    `;
  }

  private static generatePageHTML(user1: PublicUser, qr1: string, user2?: PublicUser, qr2?: string): string {
    const card1 = this.generateSingleCardHTML(user1, qr1);
    const card2 = user2 ? this.generateSingleCardHTML(user2, qr2!) : '';
    
    return `
      <div class="page">
        ${card1}
        ${card2}
      </div>
    `;
  }

  private static generateCardHTML(user: PublicUser, qrCode: string): string {
    return `
      ${this.getPrintStyles()}
      <div class="page">
        ${this.generateSingleCardHTML(user, qrCode)}
      </div>
      </body>
      </html>
    `;
  }

  private static generateSingleCardHTML(user: PublicUser, qrCode: string): string {
    const truncateAddress = (address: string, maxLength: number = 35): string => {
      return address.length > maxLength ? address.substring(0, maxLength) + '...' : address;
    };

    return `
      <div class="id-card">
        <div class="card-header">
          <div class="org-name">DIVISIONAL SECRETARIAT KALMUNAI</div>
          <div class="card-title">Public Service ID Card</div>
        </div>
        
        <div class="public-id">${user.public_id}</div>
        
        <div class="card-body">
          <div class="user-info">
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${user.name}</span>
            </div>
            <div class="info-row">
              <span class="label">NIC:</span>
              <span class="value">${user.nic}</span>
            </div>
            <div class="info-row">
              <span class="label">Mobile:</span>
              <span class="value">${user.mobile}</span>
            </div>
            <div class="info-row">
              <span class="label">Address:</span>
              <span class="value">${truncateAddress(user.address)}</span>
            </div>
            ${user.email ? `
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${user.email}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="qr-section">
            ${qrCode ? `<img src="${qrCode}" alt="QR Code" class="qr-code" />` : '<div class="qr-code" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 4px;">QR Code</div>'}
            <div class="qr-label">Scan for Details</div>
          </div>
        </div>
        
        <div class="card-footer">
          Issued: ${new Date().toLocaleDateString()} | Valid for Government Services
        </div>
      </div>
    `;
  }
}
