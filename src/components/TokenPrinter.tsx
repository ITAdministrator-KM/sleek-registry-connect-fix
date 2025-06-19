import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { Printer } from 'lucide-react';

interface TokenPrinterProps {
  tokenData: {
    tokenNumber: string;
    department: string;
    division?: string;
    timestamp: string;
    queuePosition?: number;
    estimatedWait?: string;
  };
  onPrint?: () => void;
}

const TokenPrinter: React.FC<TokenPrinterProps> = ({ tokenData, onPrint }) => {
  const tokenRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => tokenRef.current,
    onAfterPrint: onPrint,
    documentTitle: `Token_${tokenData.tokenNumber}`,
    pageStyle: `
      @page { 
        size: 80mm 120mm;
        margin: 5mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          margin: 0;
          padding: 0;
          font-family: 'Arial Black', Arial, sans-serif;
        }
        .token-print {
          width: 70mm !important;
          font-family: 'Arial Black', Arial, sans-serif !important;
          font-weight: 900 !important;
          color: black !important;
          background: white !important;
        }
      }
    `
  } as any);

  return (
    <div className="bg-white p-4">
      <Button onClick={handlePrint} className="mb-4 print:hidden">
        <Printer className="h-4 w-4 mr-2" />
        Print Token
      </Button>
      
      <div 
        ref={tokenRef}
        className="token-print bg-white border-2 border-dashed border-gray-400 p-4 text-center"
        style={{
          width: '70mm',
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontWeight: '900',
          color: 'black',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '2px solid black', paddingBottom: '3mm', marginBottom: '3mm' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
            DS KALMUNAI
          </div>
          <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '1mm' }}>
            TOKEN
          </div>
        </div>

        {/* Token Number */}
        <div style={{ margin: '5mm 0', padding: '3mm', border: '3px solid black', backgroundColor: '#f5f5f5' }}>
          <div style={{ fontSize: '32px', fontWeight: '900', lineHeight: '1' }}>
            {tokenData.tokenNumber}
          </div>
        </div>

        {/* Department */}
        <div style={{ margin: '3mm 0' }}>
          <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
            {tokenData.department}
          </div>
          {tokenData.division && (
            <div style={{ fontSize: '10px', fontWeight: '800', marginTop: '1mm' }}>
              {tokenData.division}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ margin: '3mm 0', fontSize: '10px', fontWeight: '900' }}>
          {new Date(tokenData.timestamp).toLocaleString()}
        </div>

        {/* Queue Info */}
        {tokenData.queuePosition && (
          <div style={{ margin: '3mm 0', fontSize: '9px', fontWeight: '800' }}>
            Queue Position: {tokenData.queuePosition}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid black', paddingTop: '2mm', marginTop: '4mm', fontSize: '8px', fontWeight: '800' }}>
          <div>Thank you for visiting</div>
          <div style={{ marginTop: '1mm' }}>Please wait for your number to be called</div>
        </div>
      </div>
    </div>
  );
};

export default TokenPrinter;