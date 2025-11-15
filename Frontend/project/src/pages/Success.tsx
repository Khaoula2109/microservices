// Success.tsx
export default function Success() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-4">Paiement Réussi !</h1>
        <p className="text-lg mb-6 text-gray-600">
          Votre abonnement a été activé avec succès. Vous recevrez un email de confirmation.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}