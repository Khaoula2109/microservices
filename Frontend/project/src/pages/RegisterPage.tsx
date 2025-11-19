import { useState } from 'react';
import { Mail, Lock, User, Phone, Bus, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
  onAuthSuccess: (token: string, userId: number, userRole: string) => void;
}

export default function RegisterPage({ onNavigate, onAuthSuccess }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');


    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    try {
      

      const registerResponse = await apiService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      

      if (registerResponse.error) {
        if (typeof registerResponse.error === 'object') {
          const errorObj = registerResponse.error as any;
          if (errorObj.password) {
            throw new Error(errorObj.password);
          } else if (errorObj.message) {
            throw new Error(errorObj.message);
          } else {
            throw new Error(JSON.stringify(errorObj));
          }
        } else {
          throw new Error(registerResponse.error.toString());
        }
      }

      if (!registerResponse.data?.token) {
        throw new Error('Token non reçu du serveur');
      }

      const token = registerResponse.data.token;
      

    
      const profileResponse = await apiService.getUserProfile(token);
      
      if (profileResponse.error) {
        throw new Error('Erreur lors de la récupération du profil: ' + profileResponse.error);
      }

      const userId = profileResponse.data?.id;
      const userRole = profileResponse.data?.role;
      
      if (!userId) {
        throw new Error('ID utilisateur non trouvé dans le profil');
      }

      if (!userRole) {
        throw new Error('Rôle utilisateur non trouvé dans le profil');
      }

     

      
      onAuthSuccess(token, userId, userRole);

    } catch (err: any) {
      console.error('❌ [Frontend] Erreur d\'inscription détaillée:', err);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Bus className="h-12 w-12 text-mustard-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">KowihanTransit</h1>
          <p className="text-gray-300">Rejoignez notre réseau de transport</p>
        </div>

        
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">Inscription</h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3 animate-pulse">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-semibold text-sm">Erreur d'inscription</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-navy-900 font-semibold mb-2 text-sm">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Prénom"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-navy-900 font-semibold mb-2 text-sm">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Nom"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                Téléphone (Optionnel)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+212 6 12 34 56 78"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-mustard-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-mustard-500 text-navy-900 font-bold py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-900 mr-2"></div>
                  Création en cours...
                </div>
              ) : (
                'Créer mon Compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-500 hover:text-blue-700 text-sm transition-colors"
              disabled={loading}
            >
              Déjà un compte ? Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}