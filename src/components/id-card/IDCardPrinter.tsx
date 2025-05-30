
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
      // Generate QR codes for all users with enhanced validation
      const usersWithQR = await Promise.all(
        users.map(async (user) => {
          try {
            let qrDataUrl = '';
            if (user.qr_code && user.qr_code.trim() !== '') {
              // If QR code is already a data URL, use it
              if (user.qr_code.startsWith('data:image/')) {
                qrDataUrl = user.qr_code;
              } else {
                // Generate new QR code with user data
                const qrData = {
                  id: user.public_id,
                  name: user.name,
                  nic: user.nic,
                  mobile: user.mobile,
                  issued: new Date().toISOString().split('T')[0],
                  authority: 'DSK Kalmunai'
                };
                
                qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                  width: 300,
                  margin: 2,
                  color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                  },
                  errorCorrectionLevel: 'H'
                });
              }
            } else {
              // Generate QR code if missing
              const qrData = {
                id: user.public_id,
                name: user.name,
                nic: user.nic,
                mobile: user.mobile,
                issued: new Date().toISOString().split('T')[0],
                authority: 'DSK Kalmunai'
              };
              
              qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                width: 300,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H'
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
      
      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Unable to open print window. Please check popup settings.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Handle printing based on autoPrint setting
      printWindow.onload = () => {
        setTimeout(() => {
          if (autoPrint) {
            printWindow.print();
            // Close window after printing
            printWindow.onafterprint = () => {
              setTimeout(() => printWindow.close(), 1000);
            };
          } else {
            // Show manual print dialog
            const userConfirmed = confirm('ID cards are ready. Do you want to print now?');
            if (userConfirmed) {
              printWindow.print();
              printWindow.onafterprint = () => {
                setTimeout(() => printWindow.close(), 1000);
              };
            }
          }
        }, 1000);
      };

      toast({
        title: "✅ ID Cards Generated Successfully",
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
              return;
            }
            
            images.forEach(img => {
              if (img.complete) {
                loadedImages++;
              } else {
                img.onload = () => {
                  loadedImages++;
                  console.log('Image loaded:', loadedImages, '/', images.length);
                };
                img.onerror = () => {
                  loadedImages++;
                  console.log('Image error:', loadedImages, '/', images.length);
                };
              }
            });
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
        <div class="card-front">
          <div class="card-header">
            <div class="logo-section">
              <img src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" alt="DSK Logo" class="logo" />
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
              ${user.qr_data_url ? 
                `<img src="${user.qr_data_url}" alt="QR Code" class="qr-code" crossorigin="anonymous" />` : 
                '<div class="qr-error">QR Code Unavailable</div>'
              }
            </div>
          </div>
          
          <div class="card-footer">
            <div class="generated-date">Generated: ${currentDate}</div>
            <div class="validity">Valid for official purposes</div>
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
        margin-bottom: 4mm;
        width: 100%;
      }
      
      .id-card {
        width: 85.6mm;
        height: 54mm;
        border: 2px solid #2563eb;
        border-radius: 8px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        overflow: hidden;
        position: relative;
        page-break-inside: avoid;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .empty-card {
        visibility: hidden;
      }
      
      .card-front {
        width: 100%;
        height: 100%;
        padding: 3mm;
        display: flex;
        flex-direction: column;
      }
      
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2mm;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 1.5mm;
      }
      
      .logo-section {
        flex-shrink: 0;
      }
      
      .logo {
        width: 10mm;
        height: 10mm;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid #2563eb;
      }
      
      .org-info {
        flex: 1;
        text-align: center;
        margin-left: 2mm;
      }
      
      .org-name {
        font-size: 8pt;
        font-weight: bold;
        color: #1e40af;
        line-height: 1.1;
      }
      
      .org-location {
        font-size: 7pt;
        color: #3730a3;
        font-weight: 600;
      }
      
      .card-body {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        gap: 3mm;
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
        margin-bottom: 1mm;
      }
      
      .label {
        font-size: 7pt;
        font-weight: bold;
        color: #374151;
        min-width: 14mm;
        flex-shrink: 0;
      }
      
      .value {
        font-size: 8pt;
        color: #111827;
        font-weight: 600;
        word-break: break-word;
        line-height: 1.1;
      }
      
      .qr-section {
        width: 18mm;
        height: 18mm;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid #2563eb;
        border-radius: 4px;
        flex-shrink: 0;
      }
      
      .qr-code {
        width: 16mm;
        height: 16mm;
        object-fit: contain;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      
      .qr-error {
        font-size: 5pt;
        color: #dc2626;
        text-align: center;
        font-weight: bold;
      }
      
      .card-footer {
        margin-top: 1.5mm;
        padding-top: 1mm;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      }
      
      .generated-date {
        font-size: 5pt;
        color: #6b7280;
        margin-bottom: 0.5mm;
      }
      
      .validity {
        font-size: 5pt;
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
        
        .print-container {
          max-width: none;
        }
      }
    `;
  }
}
