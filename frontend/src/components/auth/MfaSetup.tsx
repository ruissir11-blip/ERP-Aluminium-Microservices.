import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { authApi } from '../../services/authApi';

interface MfaSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const MfaSetup: React.FC<MfaSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const setupMfa = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authApi.setupMfa();
      setSecret(data.secret);
      setQrCodeUrl(data.qrCodeUrl);
      setBackupCodes(data.backupCodes);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      setError('');
      await authApi.verifyMfa(verificationCode);
      setStep('backup');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    setupMfa();
  }, []);

  const renderQrStep = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <div className="p-4 bg-white rounded-lg shadow-md">
          {qrCodeUrl ? (
            <QRCodeSVG value={qrCodeUrl} size={200} level="M" />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
      <p className="text-gray-600 mb-4">
        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
      </p>
      {secret && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
          <code className="text-sm font-mono break-all">{secret}</code>
        </div>
      )}
      <button
        onClick={() => setStep('verify')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Setting up...' : 'Next'}
      </button>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <Shield className="w-16 h-16 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Verify Code</h3>
      <p className="text-gray-600 mb-4">
        Enter the 6-digit code from your authenticator app
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-40 text-center text-2xl font-mono letter-spacing-4 border-2 border-gray-300 rounded px-4 py-2 focus:border-blue-500 focus:outline-none"
          maxLength={6}
        />
      </div>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={verifyAndEnable}
          disabled={verificationCode.length !== 6 || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </button>
      </div>
    </div>
  );

  const renderBackupStep = () => (
    <div className="text-center">
      <div className="mb-4 flex justify-center">
        <Check className="w-16 h-16 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">MFA Enabled Successfully!</h3>
      <p className="text-gray-600 mb-4">
        Save these backup codes in a safe place. You can use them if you lose access to your authenticator.
      </p>
      
      <div className="mb-4 p-4 bg-gray-50 rounded text-left">
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <code key={index} className="font-mono text-sm bg-white p-1 rounded text-center">
              {code}
            </code>
          ))}
        </div>
      </div>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={copyBackupCodes}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Codes'}
        </button>
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      {step === 'qr' && renderQrStep()}
      {step === 'verify' && renderVerifyStep()}
      {step === 'backup' && renderBackupStep()}
    </div>
  );
};

export default MfaSetup;
