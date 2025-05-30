
export class IDCardValidator {
  static validateQRCode(qrCode: string): boolean {
    if (!qrCode || qrCode.trim() === '') return false;
    
    // Check if it's a valid base64 image
    const base64Pattern = /^data:image\/(png|jpeg|jpg);base64,/;
    if (!base64Pattern.test(qrCode)) return false;
    
    // Check if the base64 string has content after the header
    const base64Data = qrCode.split(',')[1];
    if (!base64Data || base64Data.length < 100) return false;
    
    try {
      // Try to decode base64 to validate format
      atob(base64Data);
      return true;
    } catch (error) {
      console.error('Invalid base64 QR code:', error);
      return false;
    }
  }
}
