import { useState, useEffect } from 'react';
import { User, Mail, Phone, LogOut, AlertCircle, CheckCircle, Receipt, Star } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';


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

interface TicketStats {
  totalPurchased: number;
  activeTickets: number;
  usedTickets: number;
}

export default function AccountPage({ onNavigate, token, onLogout, userId }: AccountPageProps) {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketStats>({ totalPurchased: 0, activeTickets: 0, usedTickets: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchTicketStats();
    }
  }, [token]);

  const fetchTicketStats = async () => {
    if (!token) return;

    try {
      const response = await apiService.getTicketStats(token);
      if (response.data) {
        setTicketStats(response.data);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

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
          <p className="mt-4 text-gray-600">{t.account.loadingProfile}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            {t.account.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.account.subtitle}
          </p>
        </div>


        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">{t.common.error}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-green-800 font-semibold">{t.common.success}</p>
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
                  {t.account.personalInfo}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">{t.account.email}</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile?.email || t.common.loading}
                        </p>
                      </div>
                    </div>
                  </div>


                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">{t.account.fullName}</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : t.common.loading}
                        </p>
                      </div>
                    </div>
                  </div>


                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">{t.account.phone}</p>
                        <p className="font-semibold text-navy-900">
                          {userProfile?.phoneNumber || t.account.notProvided}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  {t.account.actions}
                </h3>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => onNavigate('tickets')}
                    className="flex-1 bg-mustard-500 text-navy-900 font-bold py-3 px-6 rounded-lg hover:bg-mustard-600 transition-all duration-200 text-center"
                  >
                    {t.account.viewMyTickets}
                  </button>
                  <button
                    onClick={() => onNavigate('payment-history')}
                    className="flex-1 bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-all duration-200 text-center flex items-center justify-center space-x-2"
                  >
                    <Receipt className="h-5 w-5" />
                    <span>Historique Paiements</span>
                  </button>
                  <button
                    onClick={() => onNavigate('loyalty')}
                    className="flex-1 bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 transition-all duration-200 text-center flex items-center justify-center space-x-2"
                  >
                    <Star className="h-5 w-5" />
                    <span>Programme Fidélité</span>
                  </button>
                </div>
              </div>


              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-navy-900 mb-4">
                  {t.account.statistics}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{ticketStats.totalPurchased}</p>
                    <p className="text-sm text-blue-600">{t.account.totalPurchased}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{ticketStats.activeTickets}</p>
                    <p className="text-sm text-green-600">{t.account.activeTickets}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{ticketStats.usedTickets}</p>
                    <p className="text-sm text-purple-600">{t.account.usedTickets}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 text-center border-2 border-purple-200">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{userProfile?.loyaltyPoints || 0}</p>
                    <p className="text-sm text-purple-600">Points Fidélité</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}