import { useState } from 'react';
import { Mail, Lock, Bus, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onAuthSuccess: (token: string, userId: number, userRole: string) => void;
}

export default function LoginPage({ onNavigate, onAuthSuccess }: LoginPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

 
  const fetchUserProfile = async (token: string): Promise<{ id: number; role: string }> => {
    try {
      
      const response = await apiService.getUserProfile(token);
      
      if (response.error) {
        throw new Error(response.error || 'Erreur lors de la récupération du profil');
      }

      if (!response.data?.id) {
        throw new Error('ID utilisateur non trouvé dans la réponse');
      }

      if (!response.data?.role) {
        throw new Error('Rôle utilisateur non trouvé dans la réponse');
      }

      
      
      return {
        id: response.data.id,
        role: response.data.role
      };

    } catch (err: any) {
      
      throw new Error('Impossible de récupérer le profil utilisateur: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      
      
      const response = await apiService.login({ email, password });
      

      if (response.error) {
        
        setError(response.message || response.error);
        return;
      }

      const token = response.data?.token;
      if (!token) {
        
        setError('Réponse de connexion invalide (token manquant).');
        return;
      }

     
    
      const userProfile = await fetchUserProfile(token);
      onAuthSuccess(token, userProfile.id, userProfile.role);
      
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);

    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-mustard-500 p-4 rounded-full mb-4">
            <Bus className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">KowihanTransit</h1>
          <p className="text-gray-600">{t.login.subtitle}</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">{t.login.title}</h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">{t.login.errorTitle}</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-navy-900 font-semibold mb-2">
                {t.login.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.login.emailPlaceholder}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2">
                {t.login.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 border-2 border-gray-300 rounded focus:ring-mustard-500"
                  disabled={loading}
                />
                <span className="text-gray-600">{t.login.rememberMe}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mustard-500 text-navy-900 font-bold py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t.login.noAccount}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-mustard-500 hover:text-mustard-600 font-semibold"
                disabled={loading}
              >
                {t.login.register}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-500 hover:text-navy-900 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            ← {t.login.backToHome}
          </button>
        </div>
      </div>
    </div>
  );
}