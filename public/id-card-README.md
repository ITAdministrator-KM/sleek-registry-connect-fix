# ID Card Generation and Printing

This document explains how to use the ID card generation and printing functionality in the DSK Services Portal.

## Features

- Generate professional black and white ID cards for public users
- Print ID cards in standard credit card size (85mm x 54mm)
- Download ID cards as PDF
- QR code generation for quick verification

## How to Generate an ID Card

1. Navigate to the Public Account Creation section in the Staff or Admin dashboard
2. Fill in the user details in the form
3. Click "Create Account"
4. The ID card will be automatically generated and displayed in a preview modal
5. Use the "Print" button to print the ID card
6. Use the "Download" button to save the ID card as a PDF

## ID Card Specifications

- **Size**: 85mm x 54mm (credit card size)
- **Format**: Black and white for easy printing
- **Content**:
  - User's name
  - NIC number
  - Date of birth
  - Mobile number
  - Address
  - Unique public ID
  - QR code for verification
  - Issue date
  - Official seals and signatures

## Customization

To customize the ID card design, you can modify the following files:

- `src/components/PublicUserIDCard.tsx` - Main ID card component
- `public/emblem.svg` - Official emblem/logo (left side)
- `public/logo.svg` - Organization logo (right side)

## Printing Tips

- Use high-quality card stock paper for printing
- Ensure your printer settings are set to "Actual Size" or 100% scale
- For best results, use a color printer with a minimum resolution of 300 DPI
- Test print on regular paper first to verify alignment

## Troubleshooting

### QR Code Not Scanning
- Ensure the QR code is not too small (minimum 20mm x 20mm)
- Check that the QR code has sufficient contrast
- Make sure the printed area is clean and undamaged

### Print Quality Issues
- Check printer ink/toner levels
- Clean printer heads
- Use the correct paper type setting in your printer preferences

## Security Notes

- ID cards contain sensitive personal information - handle with care
- Always verify the authenticity of ID cards using the QR code
- Report any suspicious or fraudulent ID cards to the system administrator immediately
