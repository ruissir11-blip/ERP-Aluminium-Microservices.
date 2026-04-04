import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../stores/authStore';
import { LoginCredentials } from '../../services/authApi';
import { Lock, Mail, AlertCircle, Loader2, Building2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showMfa, setShowMfa] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      if ((err as Error).message === 'MFA_REQUIRED') {
        // Store temp token from login response (set in authStore)
        const storedTempToken = sessionStorage.getItem('mfaTempToken');
        setTempToken(storedTempToken || '');
        setShowMfa(true);
      }
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !mfaToken) {
      setMfaError('Please enter your verification code');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      // Call MFA verification endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/mfa/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tempToken, token: mfaToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Verification failed');
      }
      // Store tokens and redirect
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      sessionStorage.removeItem('mfaTempToken');
      navigate('/dashboard');
    } catch (err) {
      setMfaError((err as Error).message || 'Invalid verification code');
    } finally {
      setMfaLoading(false);
    }
  };

  if (showMfa) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f3b61] flex-col justify-between p-12">
          <div className="flex items-center space-x-3">
            <Building2 className="h-10 w-10 text-white" />
            <span className="text-2xl font-bold text-white">AluTech</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Two-Factor Authentication</h1>
            <p className="text-blue-200 text-lg">Vérification de sécurité en deux étapes</p>
          </div>
          <div className="text-blue-300 text-sm">
            © 2026 AluTech ERP. Tous droits réservés.
          </div>
        </div>

        {/* Right Side - MFA Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#0d9488]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-[#0d9488]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vérification</h2>
                <p className="text-gray-500 mt-2">Entrez le code à 6 chiffres de votre application d'authentification</p>
              </div>
              
              <form onSubmit={handleMfaSubmit}>
                {mfaError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">{mfaError}</span>
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <label htmlFor="mfa-token" className="block text-sm font-medium text-gray-700 mb-2">
                    Code de vérification
                  </label>
                  <input
                    id="mfa-token"
                    name="mfa-token"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={mfaLoading || mfaToken.length !== 6}
                  className="w-full bg-[#1f3b61] hover:bg-[#2d4a75] text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mfaLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Vérification...</span>
                    </>
                  ) : (
                    <>
                      <span>Vérifier</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowMfa(false)}
                  className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Retour à la connexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1f3b61] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#0d9488] rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <Building2 className="h-10 w-10 text-white" />
            <span className="text-2xl font-bold text-white">AluTech</span>
          </div>
        </div>
        
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white mb-6">
            ERP Aluminium
          </h1>
          <p className="text-blue-200 text-xl mb-8">
            Gérez vos profils aluminium, commandes et stock
            avec une solution todo-en-un moderne et performante.
          </p>
          <div className="flex space-x-4">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white text-sm">
              ✓ Gestion des profils
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white text-sm">
              ✓ Suivi des commandes
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white text-sm">
              ✓ Contrôle stock
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-blue-300 text-sm">
          © 2026 AluTech ERP. Tous droits réservés.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <Building2 className="h-8 w-8 text-[#1f3b61]" />
            <span className="text-xl font-bold text-[#1f3b61]">AluTech</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
              <p className="text-gray-500 mt-2">Accédez à votre compte ERP</p>
            </div>

            {error && error !== 'MFA_REQUIRED' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    placeholder="vous@entreprise.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-[#0d9488] focus:ring-[#0d9488] border-gray-300 rounded"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600">
                    Se souvenir de moi
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-[#0d9488] hover:text-[#0a7c70]"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1f3b61] hover:bg-[#2d4a75] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Besoin d'aide ?Contactez votre administrateur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
