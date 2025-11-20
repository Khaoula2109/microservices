// SubscriptionPage.tsx - Version finale avec vos URLs
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  priceId: string;
  durationInDays: number;
  features: string[];
}

interface SubscriptionPageProps {
  token: string;
  userId: number;
}

export default function SubscriptionPage({ token, userId }: SubscriptionPageProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    
    const staticPlans: SubscriptionPlan[] = [
      {
        id: 1,
        name: 'Abonnement Mensuel',
        price: 100.00,
        priceId: 'price_1SIrWERxfAGItUbxdErqrsBI',
        durationInDays: 30,
        features: [
          'Accès illimité à tous les bus',
          'Support prioritaire',
          'Application mobile incluse'
        ]
      },
      {
        id: 2,
        name: 'Abonnement Annuel',
        price: 1000.00,
        priceId: 'price_1SIrWjRxfAGItUbxVFplja1P', 
        durationInDays: 365,
        features: [
          'Tous les avantages mensuel',
          'Économisez 2 mois',
          'Support premium 24/7',
          'Carte transport gratuite'
        ]
      }
    ];
    setPlans(staticPlans);
  }, []);

  const handleSubscribe = async (priceId: string) => {
  setLoading(priceId);
  try {
    
    const userEmail = "admin@transportcity.com"; // À remplacer par l'email réel
    
    const response = await apiService.createSubscriptionCheckout(
      priceId, 
      token, 
      userId, 
      userEmail  // ← AJOUT
    );
    
    if (response.data?.url) {
      window.location.href = response.data.url;
    } else {
      alert(response.error || 'Erreur lors de la création de la session de paiement');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors du processus de souscription');
  } finally {
    setLoading(null);
  }
};

  const getDurationText = (days: number) => {
    if (days === 30) return '/ mois';
    if (days === 365) return '/ an';
    return ` / ${days} jours`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-navy-900 mb-4">
            {t.subscriptions.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subscriptions.subtitle}
          </p>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`border rounded-2xl p-8 bg-white shadow-lg hover:shadow-xl transition-shadow ${
            plan.durationInDays === 365 ? 'ring-2 ring-blue-500 ring-opacity-50 relative' : ''
          }`}>
            {plan.durationInDays === 365 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Économique
                </span>
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">{plan.price} MAD</span>
              <span className="text-gray-600 text-lg">{getDurationText(plan.durationInDays)}</span>
            </div>

            {plan.durationInDays === 365 && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-700 font-semibold text-sm">
                  🎉 Économisez 200 MAD sur l'année !
                </p>
              </div>
            )}

            <ul className="mb-8 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.priceId)}
              disabled={loading === plan.priceId}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                plan.durationInDays === 365 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading === plan.priceId ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>
                  Chargement...
                </div>
              ) : (
                `Souscrire ${plan.name.toLowerCase()}`
              )}
            </button>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}