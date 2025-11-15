import { useState, useEffect } from 'react';
import { Ticket, Plus, Minus, ShoppingCart, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';



interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  validity: string;
}

interface TicketsPageProps {
  token: string | null;
  userId: number | null;
}

interface HistoryTicket {
  id: number;
  userId: number;
  ticketType: string;
  status: string;
  purchaseDate: string;
  validationDate: string | null;
  qrCodeData: string;
  price?: number;
}



export default function TicketsPage({ token, userId }: TicketsPageProps) {

  const [cart, setCart] = useState<{ [key: string]: number }>({});
  

  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const [history, setHistory] = useState<HistoryTicket[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  
  const [localUserId, setLocalUserId] = useState<number | null>(userId);


  useEffect(() => {
   
    if (userId !== null && userId !== localUserId) {
      
      setLocalUserId(userId);
    }
  }, [token, userId]);

 
  const tickets: TicketType[] = [
    {
      id: 'SIMPLE',
      name: 'Ticket Simple',
      description: 'Un trajet simple, valable 1h après validation',
      price: 8.0, // 8 DH au lieu de 1.9€
      validity: '1 heure',
    },
    {
      id: 'JOURNEE',
      name: 'Pass Journée',
      description: 'Voyages illimités pendant 24h',
      price: 30.0, // 30 DH au lieu de 7.5€
      validity: '24 heures',
    },
    {
      id: 'HEBDO',
      name: 'Pass Semaine',
      description: 'Voyages illimités pendant 7 jours',
      price: 100.0, // 100 DH au lieu de 22€
      validity: '7 jours',
    },
    {
      id: 'MENSUEL',
      name: 'Pass Mensuel',
      description: 'Voyages illimités pendant 30 jours',
      price: 350.0, // 350 DH
      validity: '30 jours',
    }
  ];



  const addToCart = (ticketId: string) => {
    
    
    setError('');
    
    setCart((prev) => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + 1,
    }));
  };

  const removeFromCart = (ticketId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[ticketId] > 1) {
        newCart[ticketId]--;
      } else {
        delete newCart[ticketId];
      }
      return newCart;
    });
  };

  const getTotal = () => {
    return tickets.reduce((total, ticket) => {
      return total + (cart[ticket.id] || 0) * ticket.price;
    }, 0);
  };

 
  const fetchHistory = async () => {
    if (!token) {
      setHistoryError("Vous n'êtes pas connecté.");
      return;
    }

    setHistoryLoading(true);
    setHistoryError('');
    
    try {
      const response = await apiService.getTicketHistory(token);
      if (response.error) {
       
        if (response.error.includes('Aucun ticket trouvé')) {
          setHistory([]);
          setHistoryError('');
        } else {
          throw new Error(response.error);
        }
      } else {
        const sortedHistory = (response.data || []).sort(
          (a: HistoryTicket, b: HistoryTicket) => 
            new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );
        setHistory(sortedHistory);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Aucun ticket trouvé')) {
        setHistory([]);
        setHistoryError('');
      } else {
        setHistoryError(err.message || "Impossible de charger l'historique.");
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  
  const handleValidateTicket = async (ticketId: number) => {
    if (!token) {
      setError('Vous devez être connecté pour valider un ticket.');
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.validateTicket(ticketId.toString(), token);
      
      if (result.error) {
        throw new Error(result.error);
      }

      await fetchHistory();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (err: any) {
      setError(err.message || "Erreur lors de la validation du ticket.");
    } finally {
      setLoading(false);
    }
  };

 
  const handleCheckout = async () => {
    
    
    setLoading(true);
    setError('');
    setShowSuccess(false);

    
    if (!token) {
      setError('Vous devez être connecté pour acheter des tickets.');
      setLoading(false);
      return;
    }

    
    const userIdToUse = localUserId;
    
    if (!userIdToUse) {
      console.error("❌ [handleCheckout] UserId manquant !");
      console.error("   -> userId (props):", userId);
      console.error("   -> localUserId (state):", localUserId);
      
      setError('ID utilisateur manquant. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

  

    try {
      
      const purchasePromises = [];
      
      for (const ticketId in cart) {
        const quantity = cart[ticketId];
        
        
        const validTypes = ['SIMPLE', 'JOURNEE', 'HEBDO', 'MENSUEL'];
        if (!validTypes.includes(ticketId)) {
          throw new Error(`Type de ticket non valide. Types autorisés: [SIMPLE, JOURNEE, HEBDO, MENSUEL]`);
        }
        
        
        for (let i = 0; i < quantity; i++) {
          const ticketData = {
            ticketType: ticketId,
            userId: userIdToUse 
          };
          
          
          purchasePromises.push(apiService.purchaseTicket(ticketData, token));
        }
      }

      
      const results = await Promise.all(purchasePromises);

      
      const failedPurchase = results.find(res => res.error);
      if (failedPurchase) {
        console.error("❌ [handleCheckout] Échec d'un achat:", failedPurchase.error);
        
        
        if (failedPurchase.error?.includes('Type de ticket non valide')) {
          throw new Error(failedPurchase.error);
        }
        
        throw new Error(failedPurchase.error || "Erreur lors de l'achat d'un ticket");
      }

      
      setShowSuccess(true);
      setCart({});
      
      
      setTimeout(() => {
        fetchHistory();
      }, 500);

    } catch (err: any) {
      console.error('❌ [handleCheckout] Erreur achat:', err);
      
      
      if (err.message.includes('Type de ticket non valide')) {
        setError(err.message);
      } else {
        setError(err.message || "Une erreur est survenue lors de l'achat.");
      }
    } finally {
      setLoading(false);
    }
  };


  const formatTicketType = (ticketType: string): string => {
    const typeMap: { [key: string]: string } = {
      'SIMPLE': 'Ticket Simple',
      'JOURNEE': 'Pass Journée',
      'HEBDO': 'Pass Semaine',
      'MENSUEL': 'Pass Mensuel'
    };
    return typeMap[ticketType] || ticketType;
  };



  useEffect(() => {
    if (token && localUserId) {
      
      fetchHistory();
    }
  }, [token, localUserId]);



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">
            Acheter des Tickets
          </h1>
          <p className="text-xl text-gray-600">
            Choisissez votre titre de transport
          </p>
          
          
          
        </div>

        
        {showSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 max-w-3xl mx-auto" role="alert">
            <p className="font-bold">Opération effectuée avec succès!</p>
            <p>Vos tickets ont été mis à jour.</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">Erreur</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-navy-900 to-navy-800 text-white p-6">
                    <Ticket className="h-12 w-12 mb-3 text-mustard-500" />
                    <h3 className="text-2xl font-bold mb-2">{ticket.name}</h3>
                    <p className="text-navy-200 text-sm">{ticket.description}</p>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2 mb-2">
                        <span className="text-4xl font-bold text-navy-900">
                          {ticket.price.toFixed(2)} DH
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Validité: {ticket.validity}
                      </p>
                    </div>

                    {cart[ticket.id] ? (
                      <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                        <button
                          onClick={() => removeFromCart(ticket.id)}
                          className="bg-white p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="h-5 w-5 text-navy-900" />
                        </button>
                        <span className="font-bold text-navy-900 text-lg">
                          {cart[ticket.id]}
                        </span>
                        <button
                          onClick={() => addToCart(ticket.id)}
                          className="bg-white p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-navy-900" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(ticket.id)}
                        className="w-full bg-mustard-500 text-navy-900 font-bold py-3 rounded-lg hover:bg-mustard-600 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Ajouter au Panier</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="flex items-center space-x-3 mb-6">
                <ShoppingCart className="h-6 w-6 text-mustard-500" />
                <h2 className="text-2xl font-bold text-navy-900">Panier</h2>
              </div>

              {Object.keys(cart).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Votre panier est vide
                </p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {tickets
                      .filter((ticket) => cart[ticket.id])
                      .map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex justify-between items-center border-b border-gray-200 pb-3"
                        >
                          <div>
                            <p className="font-semibold text-navy-900">
                              {ticket.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {cart[ticket.id]} × {ticket.price.toFixed(2)} DH
                            </p>
                          </div>
                          <p className="font-bold text-navy-900">
                            {(cart[ticket.id] * ticket.price).toFixed(2)} DH
                          </p>
                        </div>
                      ))}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-navy-900">Total</span>
                      <span className="text-3xl font-bold text-mustard-500">
                        {getTotal().toFixed(2)} DH
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || !localUserId}
                    className="w-full bg-mustard-500 text-navy-900 font-bold py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Achat en cours...' : `Payer ${getTotal().toFixed(2)} DH`}
                  </button>
                  
                  {!localUserId && (
                    <p className="text-red-500 text-sm mt-2 text-center">
                      ID utilisateur manquant - Veuillez vous reconnecter
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        
        <hr className="my-16 border-gray-300" />

        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-navy-900">
              Mon Historique d'Achats
            </h2>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="text-navy-900 p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
              title="Rafraîchir l'historique"
            >
              <RefreshCw className={`h-5 w-5 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg">
            {!token ? (
              <p className="text-gray-500 text-center p-8">
                Vous devez être connecté pour voir votre historique.
              </p>
            ) : historyLoading ? (
              <p className="text-gray-500 text-center p-8">
                Chargement de l'historique...
              </p>
            ) : historyError ? (
              <p className="text-red-600 text-center p-8">
                Erreur: {historyError}
              </p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-center p-8">
                Vous n'avez encore acheté aucun ticket.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {history.map((ticket) => (
                  <li key={ticket.id} className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div className="mb-2 sm:mb-0 flex-1">
                        <p className="font-semibold text-navy-900 text-lg">
                          {formatTicketType(ticket.ticketType)}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          Acheté le: {new Date(ticket.purchaseDate).toLocaleString('fr-FR')}
                        </p>
                        {ticket.validationDate && (
                          <p className="text-sm text-gray-600">
                            Validé le: {new Date(ticket.validationDate).toLocaleString('fr-FR')}
                          </p>
                        )}
                        {ticket.price && (
                          <p className="text-sm text-gray-600">
                            Prix: {ticket.price.toFixed(2)} DH
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                         QR: {ticket.qrCodeData.substring(0, 20)}...
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span 
                          className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                            ticket.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : ticket.status === 'USED'
                                ? 'bg-blue-100 text-blue-800'
                                : ticket.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {ticket.status === 'ACTIVE' ? 'Actif' : 
                           ticket.status === 'USED' ? 'Utilisé' : 
                           ticket.status === 'EXPIRED' ? 'Expiré' :
                           ticket.status === 'CANCELLED' ? 'Annulé' :
                           ticket.status}
                        </span>
                        {ticket.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleValidateTicket(ticket.id)}
                            className="text-xs bg-mustard-500 text-navy-900 px-2 py-1 rounded hover:bg-mustard-600 transition-colors"
                          >
                            Valider
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}