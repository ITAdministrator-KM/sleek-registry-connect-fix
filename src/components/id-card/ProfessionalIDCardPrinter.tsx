
import { PublicUser } from '@/services/apiService';
import QRCode from 'qrcode';

export class ProfessionalIDCardPrinter {
  private static readonly CARD_WIDTH_MM = 85.6;
  private static readonly CARD_HEIGHT_MM = 54;
  private static readonly CARDS_PER_ROW = 2;
  private static readonly CARDS_PER_COLUMN = 3;
  private static readonly CARDS_PER_PAGE = 6;

  static async generateQRCode(user: PublicUser): Promise<string> {
    try {
      const qrData = JSON.stringify({
        public_id: user.public_id,
        name: user.name,
        nic: user.nic,
        mobile: user.mobile,
        address: user.address,
        issued: new Date().toISOString().split('T')[0],
        authority: 'Divisional Secretariat Kalmunai'
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
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
      const cardHTML = this.generateSingleCardHTML(user, qrCode);
      
      const printWindow = window.open('', '_blank', 'width=900,height=600');
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
          }, 1000);
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
      let allCardsHTML = this.getBasePrintHTML();
      
      // Process users in batches of 6 (cards per page)
      for (let i = 0; i < users.length; i += this.CARDS_PER_PAGE) {
        const pageUsers = users.slice(i, i + this.CARDS_PER_PAGE);
        const pageHTML = await this.generatePageHTML(pageUsers);
        allCardsHTML += pageHTML;
      }
      
      allCardsHTML += '</body></html>';
      
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
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
          }, 1500);
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

  private static getBasePrintHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>DSK Professional ID Cards</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
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
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .page {
            width: 100%;
            height: 297mm;
            page-break-after: always;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(3, 1fr);
            gap: 8mm;
            padding: 5mm;
          }
          
          .page:last-child {
            page-break-after: avoid;
          }
          
          .id-card {
            width: ${this.CARD_WIDTH_MM}mm;
            height: ${this.CARD_HEIGHT_MM}mm;
            border: 2px solid #1e40af;
            border-radius: 4mm;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            position: relative;
            overflow: hidden;
            justify-self: center;
            align-self: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .card-header {
            background: linear-gradient(90deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 2mm;
            text-align: center;
            position: relative;
          }
          
          .header-logos {
            position: absolute;
            top: 1mm;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2mm;
          }
          
          .logo {
            width: 8mm;
            height: 8mm;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.5mm;
          }
          
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .org-title {
            font-size: 7px;
            font-weight: bold;
            margin-top: 8mm;
            letter-spacing: 0.5px;
          }
          
          .card-subtitle {
            font-size: 5px;
            opacity: 0.9;
            margin-top: 0.5mm;
          }
          
          .card-body {
            padding: 2mm;
            display: flex;
            height: calc(100% - 12mm);
            gap: 2mm;
          }
          
          .user-details {
            flex: 1;
            font-size: 5px;
            line-height: 1.4;
          }
          
          .detail-row {
            margin-bottom: 1mm;
            display: flex;
            align-items: flex-start;
          }
          
          .detail-label {
            font-weight: bold;
            color: #1e40af;
            width: 12mm;
            font-size: 4.5px;
            text-transform: uppercase;
          }
          
          .detail-value {
            color: #1f2937;
            font-weight: 600;
            font-size: 5px;
            flex: 1;
            word-wrap: break-word;
          }
          
          .public-id-badge {
            background: #dc2626;
            color: white;
            padding: 0.5mm 1.5mm;
            border-radius: 1mm;
            font-size: 5px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 1.5mm;
            letter-spacing: 0.3px;
          }
          
          .qr-section {
            width: 18mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            border-radius: 2mm;
            padding: 1mm;
            border: 1px solid #e5e7eb;
          }
          
          .qr-code {
            width: 15mm;
            height: 15mm;
            display: block;
          }
          
          .qr-label {
            font-size: 3.5px;
            text-align: center;
            margin-top: 1mm;
            color: #6b7280;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .card-footer {
            position: absolute;
            bottom: 1mm;
            left: 2mm;
            right: 2mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 3.5px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 0.5mm;
          }
          
          .official-seal {
            color: #dc2626;
            font-weight: bold;
            font-size: 4px;
          }
          
          @media print {
            body { 
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
    `;
  }

  private static async generatePageHTML(users: PublicUser[]): Promise<string> {
    let pageHTML = '<div class="page">';
    
    for (let i = 0; i < this.CARDS_PER_PAGE; i++) {
      if (i < users.length) {
        const user = users[i];
        const qrCode = await this.generateQRCode(user);
        pageHTML += this.generateCardHTML(user, qrCode);
      } else {
        pageHTML += '<div></div>'; // Empty slot
      }
    }
    
    pageHTML += '</div>';
    return pageHTML;
  }

  private static generateSingleCardHTML(user: PublicUser, qrCode: string): string {
    return `
      ${this.getBasePrintHTML()}
      <div class="page" style="display: flex; align-items: center; justify-content: center;">
        ${this.generateCardHTML(user, qrCode)}
      </div>
      </body>
      </html>
    `;
  }

  private static generateCardHTML(user: PublicUser, qrCode: string): string {
    const truncateText = (text: string, maxLength: number): string => {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return `
      <div class="id-card">
        <div class="card-header">
          <div class="header-logos">
            <div class="logo">
              <img src="/emblem.svg" alt="Government Emblem" />
            </div>
            <div class="logo">
              <img src="/logo.svg" alt="DS Logo" />
            </div>
          </div>
          <div class="org-title">DIVISIONAL SECRETARIAT</div>
          <div class="org-title">KALMUNAI</div>
          <div class="card-subtitle">OFFICIAL GOVERNMENT ID</div>
        </div>
        
        <div class="card-body">
          <div class="user-details">
            <div class="public-id-badge">${user.public_id}</div>
            
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${truncateText(user.name, 20)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">NIC:</span>
              <span class="detail-value">${user.nic}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">DOB:</span>
              <span class="detail-value">${user.date_of_birth || 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Mobile:</span>
              <span class="detail-value">${user.mobile}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span class="detail-value">${truncateText(user.address, 30)}</span>
            </div>
          </div>
          
          <div class="qr-section">
            ${qrCode ? `<img src="${qrCode}" alt="QR Code" class="qr-code" />` : '<div class="qr-code" style="background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 3px;">QR</div>'}
            <div class="qr-label">Scan to Verify</div>
          </div>
        </div>
        
        <div class="card-footer">
          <span>Issued: ${new Date().toLocaleDateString()}</span>
          <span class="official-seal">OFFICIAL DOCUMENT</span>
        </div>
      </div>
    `;
  }
}
