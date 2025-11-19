import { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, XCircle, RefreshCw, AlertCircle, Clock, Star } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface MySubscriptionsPageProps {
  token: string;
  userId: number;
}

interface Subscription {
  id: number;
  planName: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  price: number;
  autoRenew: boolean;
}

export default function MySubscriptionsPage({ token, userId }: MySubscriptionsPageProps) {
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simulated subscription data
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Simulated data - replace with actual API call
      const mockSubscription: Subscription = {
        id: 1,
        planName: 'Abonnement Mensuel',
        status: 'active',
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        price: 100,
        autoRenew: true,
      };
      setSubscription(mockSubscription);
      setLoading(false);
    }, 1000);
  }, [token, userId]);

  const handleCancelSubscription = () => {
    if (!subscription) return;

    if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement? Vous pourrez toujours l\'utiliser jusqu\'à la fin de la période en cours.')) {
      setSubscription({
        ...subscription,
        autoRenew: false,
        status: 'cancelled',
      });
      setSuccess('Votre abonnement a été annulé. Vous pouvez continuer à l\'utiliser jusqu\'au ' + new Date(subscription.endDate).toLocaleDateString('fr-FR'));
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  const handleReactivateSubscription = () => {
    if (!subscription) return;

    setSubscription({
      ...subscription,
      autoRenew: true,
      status: 'active',
    });
    setSuccess('Votre abonnement a été réactivé!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleToggleAutoRenew = () => {
    if (!subscription) return;

    setSubscription({
      ...subscription,
      autoRenew: !subscription.autoRenew,
    });
    setSuccess(subscription.autoRenew
      ? 'Renouvellement automatique désactivé'
      : 'Renouvellement automatique activé'
    );
    setTimeout(() => setSuccess(''), 3000);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-green-100 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{t.mySubscriptions.statusActive}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700">
            <XCircle className="h-4 w-4" />
            <span>{t.mySubscriptions.statusCancelled}</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 text-red-700">
            <XCircle className="h-4 w-4" />
            <span>{t.mySubscriptions.statusExpired}</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-mustard-500 mx-auto"></div>
          <p className="mt-4 text-white">{t.mySubscriptions.loadingSubscription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 pt-20 pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-mustard-500 p-4 rounded-full mb-4">
            <CreditCard className="h-12 w-12 text-navy-900" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{t.mySubscriptions.title}</h1>
          <p className="text-navy-200">{t.mySubscriptions.subtitle}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {!subscription ? (
          /* No subscription */
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy-900 mb-2">{t.mySubscriptions.noSubscription}</h2>
            <p className="text-gray-600 mb-6">
              {t.mySubscriptions.noSubscriptionDesc}
            </p>
            <button className="px-6 py-3 bg-mustard-500 text-navy-900 font-bold rounded-lg hover:bg-mustard-600 transition-colors">
              {t.mySubscriptions.viewSubscriptions}
            </button>
          </div>
        ) : (
          /* Subscription card */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Subscription header */}
            <div className="bg-gradient-to-r from-mustard-500 to-mustard-600 p-6 text-navy-900">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{subscription.planName}</h2>
                {getStatusBadge(subscription.status)}
              </div>
              <div className="text-4xl font-bold">
                {subscription.price.toFixed(2)} DH
                <span className="text-lg font-normal">/mois</span>
              </div>
            </div>

            {/* Subscription details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-navy-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t.mySubscriptions.startDate}</p>
                    <p className="font-semibold text-navy-900">
                      {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-navy-600" />
                  <div>
                    <p className="text-sm text-gray-600">{t.mySubscriptions.endDate}</p>
                    <p className="font-semibold text-navy-900">
                      {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Days remaining */}
              {subscription.status !== 'expired' && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t.mySubscriptions.daysRemaining}</span>
                    <span className="font-bold text-navy-900">{getDaysRemaining(subscription.endDate)} {t.mySubscriptions.days}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-mustard-500 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, (getDaysRemaining(subscription.endDate) / 30) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Auto-renew toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div>
                  <p className="font-semibold text-navy-900">{t.mySubscriptions.autoRenew}</p>
                  <p className="text-sm text-gray-600">
                    {subscription.autoRenew
                      ? t.mySubscriptions.autoRenewEnabled
                      : t.mySubscriptions.autoRenewDisabled
                    }
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoRenew}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    subscription.autoRenew ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {subscription.status === 'active' ? (
                  <button
                    onClick={handleCancelSubscription}
                    className="flex-1 px-4 py-3 border-2 border-red-500 text-red-500 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {t.mySubscriptions.cancelSubscription}
                  </button>
                ) : subscription.status === 'cancelled' ? (
                  <button
                    onClick={handleReactivateSubscription}
                    className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {t.mySubscriptions.reactivateSubscription}
                  </button>
                ) : null}

                <button className="flex-1 px-4 py-3 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors">
                  {t.mySubscriptions.changePlan}
                </button>
              </div>
            </div>

            {/* Payment history */}
            <div className="border-t border-gray-200 p-6">
              <h3 className="font-bold text-navy-900 mb-4">{t.mySubscriptions.paymentHistory}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-navy-900">{t.mySubscriptions.monthlyPayment}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(subscription.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy-900">{subscription.price.toFixed(2)} DH</p>
                    <p className="text-xs text-green-600">{t.mySubscriptions.paid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
