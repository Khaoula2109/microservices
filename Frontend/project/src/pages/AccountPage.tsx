import { useState, useEffect } from 'react';
import { User, Mail, Phone, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';


interface AccountPageProps {
  onNavigate: (page: string) => void;
  token: string | null;
  onLogout: () => void;
  userId: number | null;
}

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
}

export default function AccountPage({ onNavigate, token, onLogout, userId }: AccountPageProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiService.getUserProfile(token);
      
      if (response.error) {
        throw new Error(response.error);
      }

  
      if (!response.data) {
        throw new Error('Aucune donnée de profil reçue');
      }

      setUserProfile(response.data); 
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Déconnexion depuis AccountPage');
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
       
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            Mon Compte
          </h1>
          <p className="text-xl text-gray-600">
            Gérez vos informations personnelles
          </p>
        </div>

        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Erreur</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold">Succès</p>
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          </div>
        )}

        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-mustard-500 rounded-full p-3">
                <User className="h-8 w-8 text-navy-900" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Utilisateur'}
                </h2>
                <p className="text-navy-200">
                  {userProfile?.email || 'Chargement...'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
           
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  Informations personnelles
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile?.email || 'Chargement...'}
                        </p>
                      </div>
                    </div>
                  </div>

                 
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Nom complet</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Chargement...'}
                        </p>
                      </div>
                    </div>
                  </div>

                 
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile?.phoneNumber || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  Actions
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => onNavigate('tickets')}
                    className="flex-1 bg-mustard-500 text-navy-900 font-bold py-3 px-6 rounded-lg hover:bg-mustard-600 transition-all duration-200 text-center"
                  >
                    Voir mes tickets
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>

              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  Statistiques
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-blue-600">Tickets achetés</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">0</p>
                    <p className="text-sm text-green-600">Tickets actifs</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-purple-600">Tickets utilisés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">
            À propos de votre compte
          </h3>
          
          <div className="space-y-3 text-gray-600">
            <p>
              • Votre ID utilisateur est unique et vous identifie dans notre système
            </p>
            <p>
              • Vous pouvez consulter votre historique de tickets à tout moment
            </p>
            <p>
              • Vos données personnelles sont sécurisées et confidentielles
            </p>
            <p>
              • Pour toute question, contactez notre service client
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}