
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PublicUser } from '@/services/api';
import { IDCardValidator } from './IDCardValidator';

const CARD_WIDTH = 85.6;
const CARD_HEIGHT = 54;

export class IDCardPrinter {
  static createCardContent(user: PublicUser): HTMLDivElement {
    const cardContent = document.createElement('div');
    const qrCodeValid = IDCardValidator.validateQRCode(user.qr_code || '');
    
    cardContent.innerHTML = `
      <div style="width: ${CARD_WIDTH}mm; height: ${CARD_HEIGHT}mm; padding: 4mm; font-family: Arial, sans-serif; border: 2px solid #000; border-radius: 3mm; background: white; position: relative; box-sizing: border-box;">
        <!-- Header with logos and title -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3mm; border-bottom: 1px solid #333; padding-bottom: 2mm;">
          <img src="/lovable-uploads/e73a2c54-9e18-43f7-baf6-bfb62be56894.png" style="width: 12mm; height: 12mm; object-fit: contain;" alt="Logo 1" />
          <div style="text-align: center; flex: 1; padding: 0 2mm;">
            <h2 style="margin: 0; font-size: 12px; font-weight: bold; color: #000; line-height: 1.1;">Divisional Secretariat</h2>
            <h3 style="margin: 0; font-size: 11px; font-weight: bold; color: #000; margin-top: 1mm;">Kalmunai</h3>
          </div>
          <img src="/lovable-uploads/46b85adb-92bd-446b-80a8-15b57ff39dcf.png" style="width: 12mm; height: 12mm; object-fit: contain;" alt="Logo 2" />
        </div>

        <!-- Main content area -->
        <div style="display: flex; justify-content: space-between; height: calc(100% - 22mm);">
          <!-- User details -->
          <div style="flex: 1; padding-right: 3mm;">
            <div style="margin-bottom: 2.5mm;">
              <span style="font-size: 10px; font-weight: bold; color: #000;">Name:</span>
              <span style="font-size: 11px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm; font-weight: 600;">${user.name}</span>
            </div>
            <div style="margin-bottom: 2.5mm;">
              <span style="font-size: 10px; font-weight: bold; color: #000;">NIC:</span>
              <span style="font-size: 11px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm; font-weight: 600;">${user.nic}</span>
            </div>
            <div style="margin-bottom: 2.5mm;">
              <span style="font-size: 10px; font-weight: bold; color: #000;">Mobile:</span>
              <span style="font-size: 11px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm; font-weight: 600;">${user.mobile}</span>
            </div>
            <div style="margin-bottom: 2mm;">
              <span style="font-size: 10px; font-weight: bold; color: #000;">Address:</span>
              <span style="font-size: 10px; color: #000; margin-left: 2mm; display: block; margin-top: 0.5mm; line-height: 1.2; font-weight: 500;">${user.address || 'Kalmunai'}</span>
            </div>
          </div>

          <!-- QR Code section -->
          <div style="width: 20mm; height: 20mm; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background: white;">
            ${qrCodeValid 
              ? `<img src="${user.qr_code}" style="width: 18mm; height: 18mm; object-fit: contain;" alt="QR Code" />`
              : `<div style="font-size: 8px; color: #ef4444; text-align: center; font-weight: bold;">QR Code<br/>Missing</div>`
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 3mm; left: 4mm; right: 4mm; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #666;">
          <span style="font-weight: bold;">ID: ${user.public_id}</span>
          <span>Generated: ${new Date().toLocaleDateString()}</span>
        </div>
      </div>
    `;

    return cardContent;
  }

  static async printMultipleCards(users: PublicUser[], autoPrint: boolean, toast: any): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const marginX = 10;
    const marginY = 10;
    const spacingX = 5;
    const spacingY = 5;
    const cardsPerRow = 2;
    const cardsPerColumn = 4;
    const cardsPerPage = cardsPerRow * cardsPerColumn;

    let invalidQRCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      if (!IDCardValidator.validateQRCode(user.qr_code || '')) {
        invalidQRCount++;
      }

      if (i > 0 && i % cardsPerPage === 0) {
        pdf.addPage();
      }

      const cardIndex = i % cardsPerPage;
      const row = Math.floor(cardIndex / cardsPerRow);
      const col = cardIndex % cardsPerRow;

      const x = marginX + col * (CARD_WIDTH + spacingX);
      const y = marginY + row * (CARD_HEIGHT + spacingY);

      const cardContent = this.createCardContent(user);
      document.body.appendChild(cardContent);
      
      try {
        const canvas = await html2canvas(cardContent, {
          scale: 6,
          logging: false,
          width: CARD_WIDTH * 3.78,
          height: CARD_HEIGHT * 3.78,
          backgroundColor: 'white',
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', x, y, CARD_WIDTH, CARD_HEIGHT);
      } catch (error) {
        console.error('Error generating card for user:', user.public_id, error);
      } finally {
        document.body.removeChild(cardContent);
      }
    }

    await this.outputPDF(pdf, `DSK_ID_Cards_${Date.now()}.pdf`, autoPrint);

    if (invalidQRCount > 0) {
      toast({
        title: "Warning",
        description: `Generated ${users.length} ID card(s) but ${invalidQRCount} user(s) had invalid QR codes.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Generated ${users.length} ID card(s) successfully`,
      });
    }
  }

  static async printSingleCard(user: PublicUser, autoPrint: boolean, toast: any): Promise<void> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const cardContent = this.createCardContent(user);
    document.body.appendChild(cardContent);
    
    try {
      const canvas = await html2canvas(cardContent, {
        scale: 6,
        logging: false,
        width: CARD_WIDTH * 3.78,
        height: CARD_HEIGHT * 3.78,
        backgroundColor: 'white',
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const centerX = (210 - CARD_WIDTH) / 2;
      const centerY = (297 - CARD_HEIGHT) / 2;
      
      pdf.addImage(imgData, 'JPEG', centerX, centerY, CARD_WIDTH, CARD_HEIGHT);
      
      await this.outputPDF(pdf, `DSK_ID_Card_${user.public_id}.pdf`, autoPrint);

      toast({
        title: "Success",
        description: `ID card for ${user.name} generated successfully`,
      });
    } finally {
      document.body.removeChild(cardContent);
    }
  }

  private static async outputPDF(pdf: jsPDF, filename: string, autoPrint: boolean): Promise<void> {
    if (autoPrint) {
      try {
        const pdfOutput = pdf.output('blob');
        const url = URL.createObjectURL(pdfOutput);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
            URL.revokeObjectURL(url);
          };
        }
      } catch (printError) {
        console.warn('Auto-print failed, falling back to download:', printError);
        pdf.save(filename);
      }
    } else {
      pdf.save(filename);
    }
  }
}
