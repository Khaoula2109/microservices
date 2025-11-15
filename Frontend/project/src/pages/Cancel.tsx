// Cancel.tsx
export default function Cancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold mb-4">Paiement Annulé</h1>
        <p className="text-lg mb-6 text-gray-600">
          Votre processus de souscription a été annulé. Aucun paiement n'a été effectué.
        </p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.href = '/subscriptions'}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}