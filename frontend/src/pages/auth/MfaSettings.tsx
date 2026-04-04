import React, { useState } from 'react';
import { Shield, ShieldOff, Key, AlertTriangle, Check, Copy } from 'lucide-react';
import { authApi } from '../../services/authApi';
import MfaSetup from '../../components/auth/MfaSetup';
import BackupCodes from '../../components/auth/BackupCodes';

interface MfaSettingsProps {
  currentMfaEnabled: boolean;
  onMfaChange: (enabled: boolean) => void;
}

export const MfaSettings: React.FC<MfaSettingsProps> = ({ currentMfaEnabled, onMfaChange }) => {
  const [mfaEnabled, setMfaEnabled] = useState(currentMfaEnabled);
  const [showSetup, setShowSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const handleMfaComplete = () => {
    setMfaEnabled(true);
    setShowSetup(false);
    onMfaChange(true);
    setSuccess('MFA has been enabled successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDisableMfa = async () => {
    try {
      setLoading(true);
      setError('');
      await authApi.disableMfa(disablePassword);
      setMfaEnabled(false);
      setShowDisableConfirm(false);
      setDisablePassword('');
      onMfaChange(false);
      setSuccess('MFA has been disabled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authApi.regenerateBackupCodes();
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate backup codes');
    } finally {
      setLoading(false);
    }
  };

  if (showBackupCodes) {
    return (
      <div className="p-6">
        <button
          onClick={() => setShowBackupCodes(false)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back to Settings
        </button>
        <BackupCodes
          codes={backupCodes}
          onRegenerate={handleRegenerateBackupCodes}
          onClose={() => setShowBackupCodes(false)}
        />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="p-6">
        <button
          onClick={() => setShowSetup(false)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Cancel
        </button>
        <MfaSetup
          onComplete={handleMfaComplete}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres d'authentification à deux facteurs</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* MFA Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${mfaEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {mfaEnabled ? (
                <Shield className="w-6 h-6 text-green-600" />
              ) : (
                <ShieldOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Authentification à deux facteurs</h3>
              <p className="text-gray-600">
                {mfaEnabled ? 'Activée - Votre compte est protégé' : 'Désactivée - Activez pour plus de sécurité'}
              </p>
            </div>
          </div>
          {mfaEnabled ? (
            <button
              onClick={() => setShowDisableConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
            >
              Désactiver
            </button>
          ) : (
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Activer
            </button>
          )}
        </div>
      </div>

      {/* Backup Codes Section */}
      {mfaEnabled && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Codes de sauvegarde</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Les codes de sauvegarde vous permettent d'accéder à votre compte si vous perdez votre appareil d'authentification.
          </p>
          <button
            onClick={handleRegenerateBackupCodes}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Génération...' : 'Générer de nouveaux codes'}
          </button>
        </div>
      )}

      {/* Disable MFA Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="font-semibold text-lg">Désactiver l'authentification à deux facteurs ?</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Votre compte sera moins sécurisé. Êtes-vous sûr de vouloir désactiver MFA ?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Confirmez votre mot de passe</label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Votre mot de passe"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setDisablePassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDisableMfa}
                disabled={!disablePassword || loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Désactivation...' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MfaSettings;
