
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { PublicUser } from '@/services/api';

export class IDCardPrinter {
  static async printSingleCard(user: PublicUser, autoPrint: boolean, toast: any) {
    const cards = [user];
    await this.printMultipleCards(cards, autoPrint, toast);
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean, toast: any) {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup settings.');
      }

      // Generate QR codes for all users
      const usersWithQR = await Promise.all(
        users.map(async (user) => {
          try {
            let qrDataUrl = '';
            if (user.qr_code) {
              // Enhanced QR code generation for better printing
              qrDataUrl = await QRCode.toDataURL(user.qr_code, {
                width: 200,
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
              });
            }
            return { ...user, qr_data_url: qrDataUrl };
          } catch (error) {
            console.error('QR generation error for user:', user.public_id, error);
            return { ...user, qr_data_url: '' };
          }
        })
      );

      const htmlContent = this.generateIDCardHTML(usersWithQR);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          if (autoPrint) {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
          }
        }, 500);
      };

      toast({
        title: "ID Cards Ready ✅",
        description: `${users.length} ID card(s) prepared for printing with enhanced QR codes`,
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
    const cardsPerPage = 8; // 4 rows × 2 cards
    let cardRows = '';
    
    for (let i = 0; i < users.length; i += cardsPerRow) {
      const rowUsers = users.slice(i, i + cardsPerRow);
      cardRows += `
        <div class="card-row">
          ${rowUsers.map(user => this.generateSingleCardHTML(user)).join('')}
          ${rowUsers.length === 1 ? '<div class="id-card empty-card"></div>' : ''}
        </div>
      `;
      
      // Add page break after every 4 rows (8 cards)
      if ((i + cardsPerRow) % cardsPerPage === 0 && i + cardsPerRow < users.length) {
        cardRows += '<div class="page-break"></div>';
      }
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DSK ID Cards - Professional Print</title>
        <style>
          ${this.getIDCardStyles()}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${cardRows}
        </div>
        <script>
          window.onload = function() {
            // Ensure all images are loaded before printing
            const images = document.querySelectorAll('img');
            let loadedImages = 0;
            
            if (images.length === 0) {
              setTimeout(() => window.print(), 500);
              return;
            }
            
            images.forEach(img => {
              if (img.complete) {
                loadedImages++;
              } else {
                img.onload = () => {
                  loadedImages++;
                  if (loadedImages === images.length) {
                    setTimeout(() => window.print(), 500);
                  }
                };
                img.onerror = () => {
                  loadedImages++;
                  if (loadedImages === images.length) {
                    setTimeout(() => window.print(), 500);
                  }
                };
              }
            });
            
            if (loadedImages === images.length) {
              setTimeout(() => window.print(), 500);
            }
          }
        </script>
      </body>
      </html>
    `;
  }

  private static generateSingleCardHTML(user: any): string {
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    return `
      <div class="id-card">
        <!-- Front Side -->
        <div class="card-front">
          <div class="card-header">
            <div class="logo-section">
              <img src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" alt="Logo" class="logo" />
            </div>
            <div class="org-info">
              <div class="org-name">Divisional Secretariat</div>
              <div class="org-location">Kalmunai</div>
            </div>
          </div>
          
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
                <span class="label">ID:</span>
                <span class="value">${user.public_id}</span>
              </div>
            </div>
            
            <div class="qr-section">
              ${user.qr_data_url ? `<img src="${user.qr_data_url}" alt="QR Code" class="qr-code" />` : '<div class="qr-error">QR Code Error</div>'}
            </div>
          </div>
          
          <div class="card-footer">
            <div class="generated-date">Generated: ${currentDate}</div>
          </div>
        </div>
      </div>
    `;
  }

  private static getIDCardStyles(): string {
    return `
      @page {
        size: A4;
        margin: 8mm;
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
        line-height: 1.2;
      }
      
      .print-container {
        width: 100%;
        max-width: 210mm;
        margin: 0 auto;
      }
      
      .card-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4mm;
        width: 100%;
      }
      
      .id-card {
        width: 85.6mm;
        height: 54mm;
        border: 2px solid #333;
        border-radius: 6mm;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        overflow: hidden;
        position: relative;
        page-break-inside: avoid;
      }
      
      .empty-card {
        visibility: hidden;
      }
      
      .card-front {
        width: 100%;
        height: 100%;
        padding: 2mm;
        display: flex;
        flex-direction: column;
      }
      
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5mm;
        border-bottom: 1px solid #333;
        padding-bottom: 1mm;
      }
      
      .logo-section {
        flex-shrink: 0;
      }
      
      .logo {
        width: 8mm;
        height: 8mm;
        border-radius: 50%;
        object-fit: cover;
      }
      
      .org-info {
        flex: 1;
        text-align: center;
        margin-left: 2mm;
      }
      
      .org-name {
        font-size: 7pt;
        font-weight: bold;
        color: #1a365d;
        line-height: 1.1;
      }
      
      .org-location {
        font-size: 6pt;
        color: #2d3748;
        font-weight: 600;
      }
      
      .card-body {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        gap: 2mm;
      }
      
      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }
      
      .info-row {
        display: flex;
        align-items: baseline;
        margin-bottom: 0.8mm;
      }
      
      .label {
        font-size: 6pt;
        font-weight: bold;
        color: #2d3748;
        min-width: 12mm;
        flex-shrink: 0;
      }
      
      .value {
        font-size: 7pt;
        color: #1a202c;
        font-weight: 600;
        word-break: break-word;
        line-height: 1.1;
      }
      
      .qr-section {
        width: 16mm;
        height: 16mm;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 1px solid #333;
        border-radius: 2mm;
        flex-shrink: 0;
      }
      
      .qr-code {
        width: 14mm;
        height: 14mm;
        object-fit: contain;
      }
      
      .qr-error {
        font-size: 5pt;
        color: #e53e3e;
        text-align: center;
        font-weight: bold;
      }
      
      .card-footer {
        margin-top: 1mm;
        padding-top: 0.5mm;
        border-top: 1px solid #ccc;
      }
      
      .generated-date {
        font-size: 5pt;
        color: #666;
        text-align: center;
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
