
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
        margin: 3mm;
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
          width: 74mm !important;
          font-family: 'Arial Black', Arial, sans-serif !important;
          font-weight: 900 !important;
          color: black !important;
          background: white !important;
          border: 4px solid black !important;
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
        className="token-print bg-white border-4 border-black"
        style={{
          width: '74mm',
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontWeight: '900',
          color: 'black',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          padding: '4mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '3px solid black', paddingBottom: '4mm', marginBottom: '4mm', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>
            DS KALMUNAI
          </div>
          <div style={{ fontSize: '16px', fontWeight: '900', marginTop: '2mm', letterSpacing: '1px' }}>
            QUEUE TOKEN
          </div>
        </div>

        {/* Token Number */}
        <div style={{ margin: '6mm 0', padding: '5mm', border: '4px solid black', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: '900', lineHeight: '1', letterSpacing: '2px' }}>
            {tokenData.tokenNumber}
          </div>
        </div>

        {/* Department */}
        <div style={{ margin: '4mm 0', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {tokenData.department}
          </div>
          {tokenData.division && (
            <div style={{ fontSize: '12px', fontWeight: '900', marginTop: '2mm', letterSpacing: '0.5px' }}>
              {tokenData.division}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ margin: '4mm 0', fontSize: '12px', fontWeight: '900', textAlign: 'center' }}>
          {new Date(tokenData.timestamp).toLocaleString()}
        </div>

        {/* Queue Info */}
        {tokenData.queuePosition && (
          <div style={{ margin: '4mm 0', fontSize: '11px', fontWeight: '900', textAlign: 'center' }}>
            Queue Position: {tokenData.queuePosition}
          </div>
        )}

        {tokenData.estimatedWait && (
          <div style={{ margin: '4mm 0', fontSize: '11px', fontWeight: '900', textAlign: 'center' }}>
            Estimated Wait: {tokenData.estimatedWait}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '2px solid black', paddingTop: '3mm', marginTop: '5mm', fontSize: '10px', fontWeight: '900', textAlign: 'center' }}>
          <div style={{ marginBottom: '2mm' }}>Thank you for visiting</div>
          <div>Please wait for your number to be called</div>
        </div>
      </div>
    </div>
  );
};

export default TokenPrinter;
