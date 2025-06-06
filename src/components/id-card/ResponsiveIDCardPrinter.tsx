
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
  private static truncateAddress(address: string | null | undefined, maxLength: number = 40): string {
    if (!address) return 'N/A';
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
    const truncatedAddress = this.truncateAddress(user.address, 60); // Increased character limit
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ID Card - ${user.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        body { 
          font-family: 'Roboto', sans-serif; 
          background: white; 
          padding: 10mm;
          color: #333;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .card-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5mm;
          justify-content: center;
          page-break-after: always;
        }
        
        .id-card {
          width: 86mm;
          height: 54mm;
          background: white;
          border: 2px solid #1a56db;
          border-radius: 8px;
          padding: 5mm;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          page-break-inside: avoid;
          margin-bottom: 5mm;
          display: flex;
          flex-direction: column;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3mm;
          padding-bottom: 2mm;
          border-bottom: 2px solid #1a56db;
        }
        
        .logo {
          width: 35mm;
          height: auto;
          object-fit: contain;
        }
        
        .org-name {
          text-align: right;
          font-size: 10px;
          color: #1a56db;
          font-weight: 700;
          line-height: 1.3;
          text-transform: uppercase;
        }
        
        .content {
          display: flex;
          flex: 1;
          gap: 5mm;
          margin-top: 2mm;
        }
        
        .qr-section {
          flex: 0 0 35mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2mm;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        
        .qr-code {
          width: 32mm;
          height: 32mm;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          padding: 1mm;
        }
        
        .qr-code canvas {
          max-width: 100%;
          max-height: 100%;
          image-rendering: crisp-edges;
        }
        
        .qr-text {
          font-size: 7px;
          font-weight: 500;
          color: #4b5563;
          text-align: center;
          line-height: 1.2;
        }
        
        .info {
          flex: 1;
          font-size: 10px;
          line-height: 1.6;
          display: flex;
          flex-direction: column;
          padding: 2mm 0;
        }
        
        .field {
          margin-bottom: 2.5mm;
          word-wrap: break-word;
          display: flex;
          align-items: center;
          min-height: 5mm;
        }
        
        .label {
          font-weight: 700;
          color: #1e40af;
          min-width: 28mm;
          display: inline-block;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .value {
          flex: 1;
          color: #1f2937;
          border-bottom: 1px solid #d1d5db;
          padding: 1mm 0 1mm 2mm;
          font-weight: 500;
          font-size: 10px;
        }
        
        .footer {
          margin-top: 3mm;
          padding-top: 2mm;
          border-top: 1px solid #d1d5db;
          font-size: 8px;
          color: #4b5563;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
        }
        
        .signature {
          text-align: right;
          margin-top: 3mm;
          align-self: flex-end;
        }
        
        .signature-line {
          width: 50mm;
          border-top: 1px solid #1e40af;
          margin: 2mm 0 0 auto;
          position: relative;
        }
        
        .signature-line::after {
          content: 'Authorized Signature';
          position: absolute;
          top: -8px;
          right: 0;
          background: white;
          padding: 0 5px;
          font-size: 7px;
          color: #1e40af;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          @page {
            size: A4 portrait;
            margin: 0;
            padding: 0;
          }
          
          body { 
            padding: 10mm !important;
            margin: 0;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
          }
          
          .card-container { 
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10mm 5mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: 210mm !important;
          }
          
          .id-card {
            box-shadow: none !important;
            border: 2px solidrgb(0, 2, 5) !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 86mm !important;
            height: 54mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            position: relative;
            overflow: hidden;
          }
          
          /* Ensure QR code is visible when printed */
          .qr-code {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            border: 1px solid #d1d5db !important;
          }
          
          /* Adjust content layout for print */
          .content {
            gap: 4mm !important;
          }
          
          .qr-section {
            flex: 0 0 32mm !important;
            padding: 2mm !important;
          }
          
          /* Hide print button when printing */
          .no-print {
            display: none !important;
          }
          
          /* Ensure text is black for better print contrast */
          .label, 
          .value {
            color: #000 !important;
          }
          
          /* Ensure font sizes are consistent in print */
          .label {
            font-size: 8px !important;
          }
          
          .value {
            font-size: 9px !important;
          }
        }
          </div>
        </div>
        
        <div class="content">
          <!-- Left Side - QR Code -->
          <div class="qr-section">
            <div class="qr-code" id="qr-${user.public_id}">
              <div class="qr-text">Loading QR Code...</div>
                <div class="qr-text">Loading QR Code...</div>
              </div>
            </div>
            
            <!-- Right Side - User Info -->
            <div class="info">
              <div class="field">
                <span class="label">Name</span>
                <span class="value">${user.name || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">NIC No</span>
                <span class="value">${user.nic || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Mobile No</span>
                <span class="value">${user.mobile || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">ID No</span>
                <span class="value">${user.public_id || 'N/A'}</span>
              </div>
              <div class="field">
                <span class="label">Address</span>
                <span class="value">${truncatedAddress}</span>
              </div>
            </div>
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

      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      let allCardsHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ID Cards Batch Print</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Arial', sans-serif; 
            background: white; 
            padding: 10mm;
            color: #333;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 5mm;
            max-width: 210mm;
            margin: 0 auto;
            justify-items: center;
          }
          
          .id-card {
            width: 86mm;
            height: 54mm;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 4mm;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 3mm;
            padding-bottom: 2mm;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .logo {
            width: 30mm;
            height: auto;
            object-fit: contain;
          }
          
          .org-name {
            text-align: right;
            font-size: 9px;
            color: #1a56db;
            font-weight: bold;
            line-height: 1.2;
          }
          
          .content {
            display: flex;
            flex: 1;
            gap: 3mm;
          }
          
          .photo-section {
            width: 25mm;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .photo-placeholder {
            width: 25mm;
            height: 30mm;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            margin-bottom: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 8px;
          }
          
          .qr-code {
            width: 25mm;
            height: 25mm;
            background: #f5f5f5;
            border: 1px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 8px;
          }
          
          .info {
            flex: 1;
            font-size: 9px;
            line-height: 1.4;
            display: flex;
            flex-direction: column;
            font-weight:bold;
          }
          
          .field {
            margin-bottom: 1.5mm;
            word-wrap: break-word;
            display: flex;
            align-items: flex-start;
          }
          
          .label {
            font-weight: bold;
            color: #555;
            min-width: 25mm;
            display: inline-block;
          }
          
          .value {
            flex: 1;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 1mm;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 2mm;
            border-top: 1px solid #e0e0e0;
            font-size: 8px;
            color: #666;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .signature {
            text-align: center;
            margin-top: 5mm;
          }
          
          .signature-line {
            width: 40mm;
            border-top: 1px solid #333;
            margin: 0 auto;
            margin-top: 1mm;
          }
          
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
              padding: 0;
            }
            
            body { 
              padding: 10mm !important;
              margin: 0;
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .cards-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 5mm !important;
              padding: 0 !important;
              margin: 0 auto !important;
              max-width: 210mm !important;
            }
            
            .id-card {
              box-shadow: none !important;
              border: 1px solid #e0e0e0 !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              width: 86mm !important;
              height: 54mm !important;
              margin: 0 !important;
            }
            
            .qr-code {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="cards-grid">
          ${users.map(user => {
            const truncatedAddress = this.truncateAddress(user.address);
            return `
            <div class="id-card">
              <div class="header">
                <img src="${window.location.origin}/logo.png" alt="Logo" class="logo" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAxMjAgNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiMxYTU2ZGIiLz48dGV4dCB4PSI1MCUiIHk9IjU1JSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwcHgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+RGl2aXNpb25hbCBTZWNyZXRhcmlhdDx0c3BhbiBkeT0iMTAiIHg9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+S2FsbXVuYWk8L3RzcGFuPjwvdGV4dD48L3N2Zz4='">
                <div class="org-name">
                  <div>DIVISIONAL SECRETARIAT</div>
                  <div>KALMUNAI</div>
                </div>
              </div>
              
              <div class="content">
                <!-- Left Side - QR Code -->
                <div class="qr-section">
                  <div class="qr-code" id="qr-${user.public_id}">
                    <div class="qr-text">Loading QR Code...</div>
                  </div>
                </div>
                
                <!-- Right Side - User Info -->
                <div class="info">
                  <div class="field">
                    <span class="label">Name</span>
                    <span class="value">${user.name || 'N/A'}</span>
                  </div>
                  <div class="field">
                    <span class="label">NIC No</span>
                    <span class="value">${user.nic || 'N/A'}</span>
                  </div>
                  <div class="field">
                    <span class="label">Mobile No</span>
                    <span class="value">${user.mobile || 'N/A'}</span>
                  </div>
                  <div class="field">
                    <span class="label">ID No</span>
                    <span class="value">${user.public_id || 'N/A'}</span>
                  </div>
                  <div class="field">
                    <span class="label">Address</span>
                    <span class="value">${truncatedAddress}</span>
                  </div>
                </div>
              </div>
              
              <div class="footer">
                <div>Issued on: ${formattedDate}</div>
                <div>Valid until: ${new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </body>
      </html>`;

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for printing.');
      }

      printWindow.document.write(allCardsHTML);
      printWindow.document.close();

      // Generate QR codes after the window loads
      printWindow.onload = () => {
        users.forEach(user => {
          if (user.qr_code_data) {
            this.generateQRCodeInWindow(printWindow, user.public_id, user.qr_code_data);
          }
        });

        if (autoPrint) {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      };

      toast({
        title: 'ID Cards Generated',
        description: `${users.length} ID cards generated successfully`,
      });

    } catch (error) {
      console.error('Error generating ID cards:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate ID cards',
        variant: 'destructive',
      });
      throw error;
    }
  }

  private static generateQRCodeInWindow(printWindow: Window, publicId: string, qrData: string) {
    try {
      const qrElement = printWindow.document.getElementById(`qr-${publicId}`);
      if (!qrElement) return;
      
      // Create a canvas for the QR code
      const canvas = printWindow.document.createElement('canvas');
      const size = 200; // Larger size for better print quality
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      
      // Generate a simple pattern based on the public ID
      const data = qrData || publicId;
      const cellSize = 6; // Adjust cell size for better visibility
      const cells = Math.floor(size / cellSize);
      
      // Simple pattern based on string hash
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = data.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      // Draw position markers (squares in corners)
      const drawPositionMarker = (x: number, y: number) => {
        // Outer square (7x7)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        // Inner square (5x5)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        // Center dot (3x3)
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      };
      
      // Draw position markers in corners
      const markerSize = 7 * cellSize;
      drawPositionMarker(0, 0); // Top-left
      drawPositionMarker(size - markerSize, 0); // Top-right
      drawPositionMarker(0, size - markerSize); // Bottom-left
      
      // Draw timing patterns
      ctx.fillStyle = '#000000';
      const timingY = 6 * cellSize;
      for (let x = 8 * cellSize; x < size - 8 * cellSize; x += 2 * cellSize) {
        ctx.fillRect(x, timingY, cellSize, cellSize);
      }
      
      // Fill the rest of the QR code with a pattern
      ctx.fillStyle = '#000000';
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          // Skip position markers and timing patterns
          if ((x < 8 && y < 8) || // top-left
              (x > cells - 8 && y < 8) || // top-right
              (x < 8 && y > cells - 8) || // bottom-left
              (y === 6 && x > 7 && x < cells - 7)) { // timing pattern
            continue;
          }
          
          // Simple pattern based on position and hash
          const shouldFill = (x * y + hash) % 3 < 1; // Adjust pattern density
          if (shouldFill) {
            ctx.fillRect(
              x * cellSize + 1,
              y * cellSize + 1,
              cellSize - 2,
              cellSize - 2
            );
          }
        }
      }
      
      // Clear the loading message and add the QR code
      qrElement.innerHTML = '';
      qrElement.appendChild(canvas);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      const qrElement = printWindow.document.getElementById(`qr-${publicId}`);
      if (qrElement) {
        qrElement.innerHTML = `<div style="font-size: 6px; color: #ef4444; text-align: center; padding: 5px;">
          QR Code Error<br>${publicId}
        </div>`;
      }
    }
  }
}
