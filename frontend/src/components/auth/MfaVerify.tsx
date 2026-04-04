import React, { useState, useRef, useEffect } from 'react';
import { Shield, AlertCircle } from 'lucide-react';

interface MfaVerifyProps {
  onVerify: (code: string) => Promise<void>;
  onUseBackupCode: (code: string) => Promise<void>;
  onCancel: () => void;
  error?: string;
}

export const MfaVerify: React.FC<MfaVerifyProps> = ({
  onVerify,
  onUseBackupCode,
  onCancel,
  error
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string>('');
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    
    setLocalError('');
    setIsLoading(true);
    
    try {
      if (mode === 'totp') {
        await onVerify(code);
      } else {
        await onUseBackupCode(code);
      }
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Invalid code');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    setCode(digits);
  };

  const displayError = localError || error;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold">
          {mode === 'totp' ? 'Two-Factor Authentication' : 'Use Backup Code'}
        </h3>
        <p className="text-gray-600 text-sm">
          {mode === 'totp' 
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Enter one of your backup codes'}
        </p>
      </div>

      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={mode === 'totp' ? '000000' : 'XXXX-XXXX'}
            className="w-full text-center text-2xl font-mono border-2 border-gray-300 rounded px-4 py-3 focus:border-blue-500 focus:outline-none"
            maxLength={mode === 'totp' ? 6 : 9}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={code.length < (mode === 'totp' ? 6 : 8) || isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'totp' ? 'backup' : 'totp')}
          className="text-blue-600 hover:underline text-sm"
        >
          {mode === 'totp' 
            ? 'Use a backup code instead' 
            : 'Use authenticator app instead'}
        </button>
      </div>
    </div>
  );
};

export default MfaVerify;
