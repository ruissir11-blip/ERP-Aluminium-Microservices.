import React, { useState } from 'react';
import { Copy, Check, Download, Printer, AlertTriangle } from 'lucide-react';

interface BackupCodesProps {
  codes: string[];
  onRegenerate?: () => void;
  onClose?: () => void;
}

export const BackupCodes: React.FC<BackupCodesProps> = ({ codes, onRegenerate, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyCodes = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const content = `Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printCodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Backup Codes</title></head>
          <body>
            <h1>Backup Codes</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <pre>${codes.join('\n')}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Save Your Backup Codes</h3>
        <p className="text-gray-600 text-sm">
          Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, index) => (
            <code 
              key={index} 
              className="font-mono text-sm bg-white p-2 rounded text-center border border-gray-200"
            >
              {code}
            </code>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <button
          onClick={copyCodes}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy All'}
        </button>
        <button
          onClick={downloadCodes}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={printCodes}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="border-t pt-4 flex justify-between">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="text-blue-600 hover:underline text-sm"
          >
            Generate New Codes
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default BackupCodes;
