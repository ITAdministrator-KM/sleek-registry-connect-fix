
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { PublicUser } from '@/services/api';

export class EnhancedIDCardPrinter {
  static async printSingleCard(user: PublicUser, autoPrint: boolean, toast: any) {
    const cards = [user];
    await this.printMultipleCards(cards, autoPrint, toast);
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean, toast: any) {
    try {
      const usersWithQR = await Promise.all(
        users.map(async (user) => {
          try {
            const qrData = {
              id: user.public_id,
              name: user.name,
              nic: user.nic,
              mobile: user.mobile,
              email: user.email,
              address: user.address,
              issued: new Date().toISOString().split('T')[0],
              authority: 'DSK Kalmunai',
              type: 'public_user',
              verified: true,
              scan_url: `${window.location.origin}/qr-scan/${user.public_id}`
            };
            
            const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
              width: 400,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              },
              errorCorrectionLevel: 'H'
            });
            
            return { ...user, qr_data_url: qrDataUrl };
          } catch (error) {
            console.error('QR generation error for user:', user.public_id, error);
            return { ...user, qr_data_url: '' };
          }
        })
      );

      const htmlContent = this.generateIDCardHTML(usersWithQR);
      
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup settings.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          if (autoPrint) {
            printWindow.print();
            printWindow.onafterprint = () => {
              setTimeout(() => printWindow.close(), 1000);
            };
          } else {
            const userConfirmed = confirm('ID cards are ready. Do you want to print now?');
            if (userConfirmed) {
              printWindow.print();
              printWindow.onafterprint = () => {
                setTimeout(() => printWindow.close(), 1000);
              };
            }
          }
        }, 1500);
      };

      toast({
        title: "✅ Enhanced ID Cards Generated",
        description: `${users.length} professional ID card(s) prepared with QR codes`,
      });

    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: error instanceof Error ? error.message : "Failed to prepare ID cards",
        variant: "destructive",
      });
    }
  }

  private static generateIDCardHTML(users: any[]): string {
    const cardsPerRow = 2;
    let cardRows = '';
    
    for (let i = 0; i < users.length; i += cardsPerRow) {
      const rowUsers = users.slice(i, i + cardsPerRow);
      cardRows += `
        <div class="card-row">
          ${rowUsers.map(user => this.generateSingleCardHTML(user)).join('')}
          ${rowUsers.length === 1 ? '<div class="id-card empty-card"></div>' : ''}
        </div>
      `;
      
      if ((i + cardsPerRow) % 8 === 0 && i + cardsPerRow < users.length) {
        cardRows += '<div class="page-break"></div>';
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DSK Professional ID Cards</title>
        <style>
          ${this.getEnhancedIDCardStyles()}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${cardRows}
        </div>
      </body>
      </html>
    `;
  }

  private static generateSingleCardHTML(user: any): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    return `
      <div class="id-card">
        <div class="card-header">
          <div class="logo-container">
            <img src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" alt="DSK Logo" class="logo" />
          </div>
          <div class="header-text">
            <div class="org-title">Divisional Secretariat</div>
            <div class="org-subtitle">Kalmunai</div>
          </div>
        </div>
        
        <div class="card-content">
          <div class="user-details">
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${user.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">NIC:</span>
              <span class="value">${user.nic}</span>
            </div>
            <div class="detail-row">
              <span class="label">Mobile:</span>
              <span class="value">${user.mobile}</span>
            </div>
            <div class="detail-row">
              <span class="label">ID:</span>
              <span class="value id-highlight">${user.public_id}</span>
            </div>
          </div>
          
          <div class="qr-container">
            ${user.qr_data_url ? 
              `<img src="${user.qr_data_url}" alt="QR Code" class="qr-code" />` : 
              '<div class="qr-error">QR Unavailable</div>'
            }
          </div>
        </div>
        
        <div class="card-footer">
          <div class="issue-info">
            <span class="issue-text">Generated: ${currentDate}</span>
            <span class="validity-text">Valid for official purposes</span>
          </div>
        </div>
      </div>
    `;
  }

  private static getEnhancedIDCardStyles(): string {
    return `
      @page {
        size: A4;
        margin: 6mm;
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        background: white;
        color: black;
        line-height: 1.3;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
      }
      
      .card-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5mm;
        width: 100%;
        gap: 4mm;
      }
      
      .id-card {
        width: 85.6mm;
        height: 54mm;
        border: 2.5px solid #1e40af;
        border-radius: 6px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        overflow: hidden;
        position: relative;
        page-break-inside: avoid;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      
      .empty-card {
        visibility: hidden;
      }
      
      .card-header {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        padding: 2.5mm;
        display: flex;
        align-items: center;
        gap: 2mm;
        border-bottom: 2px solid #1e40af;
      }
      
      .logo-container {
        flex-shrink: 0;
      }
      
      .logo {
        width: 12mm;
        height: 12mm;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid white;
        background: white;
      }
      
      .header-text {
        flex: 1;
        text-align: center;
      }
      
      .org-title {
        font-size: 10pt;
        font-weight: bold;
        line-height: 1.1;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      }
      
      .org-subtitle {
        font-size: 8pt;
        font-weight: 600;
        opacity: 0.9;
        margin-top: 1px;
      }
      
      .card-content {
        padding: 3mm;
        display: flex;
        gap: 3mm;
        height: 32mm;
      }
      
      .user-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      
      .detail-row {
        display: flex;
        align-items: baseline;
        margin-bottom: 1.5mm;
      }
      
      .label {
        font-size: 8pt;
        font-weight: bold;
        color: #374151;
        min-width: 16mm;
        flex-shrink: 0;
      }
      
      .value {
        font-size: 9pt;
        color: #111827;
        font-weight: 600;
        word-break: break-word;
        line-height: 1.2;
      }
      
      .id-highlight {
        color: #1e40af;
        font-weight: bold;
        font-size: 10pt;
      }
      
      .qr-container {
        width: 20mm;
        height: 20mm;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #1e40af;
        border-radius: 4px;
        flex-shrink: 0;
        margin-top: 2mm;
      }
      
      .qr-code {
        width: 18mm;
        height: 18mm;
        object-fit: contain;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      
      .qr-error {
        font-size: 6pt;
        color: #dc2626;
        text-align: center;
        font-weight: bold;
      }
      
      .card-footer {
        background: #f3f4f6;
        padding: 1.5mm 3mm;
        border-top: 1px solid #e5e7eb;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
      }
      
      .issue-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .issue-text {
        font-size: 6pt;
        color: #6b7280;
      }
      
      .validity-text {
        font-size: 6pt;
        color: #059669;
        font-weight: bold;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .id-card {
          box-shadow: none !important;
        }
        
        .qr-code {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      }
    `;
  }
}
