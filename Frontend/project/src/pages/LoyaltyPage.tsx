import { useState, useEffect } from 'react';
import { Star, Gift, Award, TrendingUp, Ticket, CreditCard, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';

interface LoyaltyPageProps {
  token: string;
  userId: number;
}

interface LoyaltyInfo {
  points: number;
  availableDiscount: number;
  tiers: {
    tier1: { points: number; discount: number };
    tier2: { points: number; discount: number };
    tier3: { points: number; discount: number };
  };
}

export default function LoyaltyPage({ token, userId }: LoyaltyPageProps) {
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState('');

  useEffect(() => {
    fetchLoyaltyInfo();
  }, [token]);

  const fetchLoyaltyInfo = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/me/loyalty', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch loyalty info');
      }

      const data = await response.json();
      setLoyaltyInfo(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des informations de fidélité');
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async (pointsToRedeem: number) => {
    setRedeeming(true);
    setError('');
    setRedeemSuccess('');

    try {
      const response = await fetch('/api/users/me/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ points: pointsToRedeem })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem points');
      }

      const data = await response.json();
      setRedeemSuccess(`Félicitations ! Vous avez obtenu ${data.discount}% de réduction !`);

      // Refresh loyalty info
      fetchLoyaltyInfo();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'échange de points');
    } finally {
      setRedeeming(false);
    }
  };

  const getProgressToNextTier = () => {
    if (!loyaltyInfo) return { nextTier: 0, progress: 0, tierName: '' };

    const points = loyaltyInfo.points;
    const tiers = loyaltyInfo.tiers;

    if (points < tiers.tier1.points) {
      return {
        nextTier: tiers.tier1.points,
        progress: (points / tiers.tier1.points) * 100,
        tierName: 'Bronze',
        discount: 5
      };
    } else if (points < tiers.tier2.points) {
      return {
        nextTier: tiers.tier2.points,
        progress: ((points - tiers.tier1.points) / (tiers.tier2.points - tiers.tier1.points)) * 100,
        tierName: 'Argent',
        discount: 10
      };
    } else if (points < tiers.tier3.points) {
      return {
        nextTier: tiers.tier3.points,
        progress: ((points - tiers.tier2.points) / (tiers.tier3.points - tiers.tier2.points)) * 100,
        tierName: 'Or',
        discount: 15
      };
    } else {
      return {
        nextTier: 0,
        progress: 100,
        tierName: 'Platine',
        discount: 15
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const progressInfo = getProgressToNextTier();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full mb-4">
            <Star className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">Programme Fidélité</h1>
          <p className="text-gray-600">Gagnez des points et obtenez des réductions exclusives</p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {redeemSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-green-600" />
            <p className="text-green-800 font-semibold">{redeemSuccess}</p>
          </div>
        )}

        {/* Points Card */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-purple-100 mb-1">Vos Points Fidélité</p>
              <h2 className="text-5xl font-bold">{loyaltyInfo?.points || 0}</h2>
            </div>
            <Award className="h-20 w-20 text-purple-200 opacity-50" />
          </div>

          {loyaltyInfo && loyaltyInfo.availableDiscount > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm mb-1">Réduction Disponible</p>
              <p className="text-3xl font-bold">{loyaltyInfo.availableDiscount}%</p>
            </div>
          )}
        </div>

        {/* Progress to Next Tier */}
        {progressInfo.nextTier > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-navy-900">
                Progression vers {progressInfo.tierName}
              </h3>
              <span className="text-sm text-gray-600">
                {loyaltyInfo?.points || 0} / {progressInfo.nextTier} points
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressInfo.progress, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Plus que {progressInfo.nextTier - (loyaltyInfo?.points || 0)} points pour {progressInfo.discount}% de réduction !
            </p>
          </div>
        )}

        {/* How to Earn Points */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-navy-900 mb-6 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span>Comment Gagner des Points</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-3">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-900">Achat de Ticket</h4>
                  <p className="text-blue-600 text-2xl font-bold">+10 points</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Gagnez 10 points pour chaque ticket acheté
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-3">
                <div className="bg-purple-500 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-900">Abonnement</h4>
                  <p className="text-purple-600 text-2xl font-bold">+50 points</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Gagnez 50 points pour chaque abonnement souscrit
              </p>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-navy-900 mb-6 flex items-center space-x-2">
            <Gift className="h-6 w-6 text-pink-600" />
            <span>Récompenses Disponibles</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className={`rounded-lg p-6 border-2 transition-all ${
              loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier1.points
                ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-400'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier1.points
                    ? 'bg-amber-500'
                    : 'bg-gray-300'
                }`}>
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-navy-900 text-lg">Bronze</h4>
                <p className="text-amber-600 text-3xl font-bold">5%</p>
                <p className="text-sm text-gray-600">de réduction</p>
              </div>
              <p className="text-center text-sm font-semibold mb-4">
                {loyaltyInfo?.tiers.tier1.points} points requis
              </p>
              {loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier1.points && (
                <button
                  onClick={() => redeemPoints(loyaltyInfo.tiers.tier1.points)}
                  disabled={redeeming}
                  className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {redeeming ? 'Échange...' : 'Échanger'}
                </button>
              )}
            </div>

            {/* Tier 2 */}
            <div className={`rounded-lg p-6 border-2 transition-all ${
              loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier2.points
                ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier2.points
                    ? 'bg-gray-500'
                    : 'bg-gray-300'
                }`}>
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-navy-900 text-lg">Argent</h4>
                <p className="text-gray-600 text-3xl font-bold">10%</p>
                <p className="text-sm text-gray-600">de réduction</p>
              </div>
              <p className="text-center text-sm font-semibold mb-4">
                {loyaltyInfo?.tiers.tier2.points} points requis
              </p>
              {loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier2.points && (
                <button
                  onClick={() => redeemPoints(loyaltyInfo.tiers.tier2.points)}
                  disabled={redeeming}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {redeeming ? 'Échange...' : 'Échanger'}
                </button>
              )}
            </div>

            {/* Tier 3 */}
            <div className={`rounded-lg p-6 border-2 transition-all ${
              loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier3.points
                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier3.points
                    ? 'bg-yellow-500'
                    : 'bg-gray-300'
                }`}>
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-navy-900 text-lg">Or</h4>
                <p className="text-yellow-600 text-3xl font-bold">15%</p>
                <p className="text-sm text-gray-600">de réduction</p>
              </div>
              <p className="text-center text-sm font-semibold mb-4">
                {loyaltyInfo?.tiers.tier3.points} points requis
              </p>
              {loyaltyInfo && loyaltyInfo.points >= loyaltyInfo.tiers.tier3.points && (
                <button
                  onClick={() => redeemPoints(loyaltyInfo.tiers.tier3.points)}
                  disabled={redeeming}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {redeeming ? 'Échange...' : 'Échanger'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
