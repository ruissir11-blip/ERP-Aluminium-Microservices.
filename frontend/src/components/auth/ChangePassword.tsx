import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X, AlertCircle } from 'lucide-react';

interface ChangePasswordProps {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
  onCancel?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSubmit, onCancel }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength criteria
  const criteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isValid = Object.values(criteria).every(Boolean) && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    try {
      setLoading(true);
      setError('');
      await onSubmit(oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Mot de passe modifié</h3>
        <p className="text-gray-600 mb-4">
          Votre mot de passe a été modifié avec succès.
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fermer
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Old Password */}
      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
        <div className="relative">
          <input
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
            placeholder="Entrez votre mot de passe actuel"
            required
          />
          <button
            type="button"
            onClick={() => setShowOldPassword(!showOldPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
            placeholder="Entrez le nouveau mot de passe"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {Object.values(criteria).every(Boolean) ? (
                <div className="h-1 flex-1 bg-green-500 rounded" />
              ) : (
                <>
                  <div className={`h-1 flex-1 rounded ${criteria.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${criteria.uppercase && criteria.lowercase ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${criteria.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${criteria.special ? 'bg-green-500' : 'bg-gray-200'}`} />
                </>
              )}
            </div>
            <ul className="text-xs space-y-1">
              <li className={criteria.length ? 'text-green-600' : 'text-gray-500'}>
                {criteria.length ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                Au moins 8 caractères
              </li>
              <li className={criteria.uppercase && criteria.lowercase ? 'text-green-600' : 'text-gray-500'}>
                {(criteria.uppercase && criteria.lowercase) ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                Lettres majuscules et minuscules
              </li>
              <li className={criteria.number ? 'text-green-600' : 'text-gray-500'}>
                {criteria.number ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                Au moins un chiffre
              </li>
              <li className={criteria.special ? 'text-green-600' : 'text-gray-500'}>
                {criteria.special ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
                Au moins un caractère spécial
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
            placeholder="Confirmez le nouveau mot de passe"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          {loading ? 'Modification...' : 'Modifier le mot de passe'}
        </button>
      </div>
    </form>
  );
};

export default ChangePassword;
