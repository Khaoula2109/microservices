import { useState, useEffect } from 'react';
import { Ticket, Plus, Minus, ShoppingCart, Check, AlertCircle, RefreshCw, Download, Send, X } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';



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
  const { t } = useLanguage();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  

  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const [history, setHistory] = useState<HistoryTicket[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Transfer modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTicketId, setTransferTicketId] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');


  const [localUserId, setLocalUserId] = useState<number | null>(userId);


  useEffect(() => {
   
    if (userId !== null && userId !== localUserId) {
      
      setLocalUserId(userId);
    }
  }, [token, userId]);


  const tickets: TicketType[] = [
    {
      id: 'SIMPLE',
      name: t.tickets.simple,
      description: t.tickets.simpleDesc,
      price: 8.0,
      validity: '1h',
    },
    {
      id: 'JOURNEE',
      name: t.tickets.daily,
      description: t.tickets.dailyDesc,
      price: 30.0,
      validity: '24h',
    },
    {
      id: 'HEBDO',
      name: t.tickets.weekly,
      description: t.tickets.weeklyDesc,
      price: 100.0,
      validity: '7d',
    },
    {
      id: 'MENSUEL',
      name: t.tickets.monthly,
      description: t.tickets.monthlyDesc,
      price: 350.0,
      validity: '30d',
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

  // Check if a ticket is still valid based on purchase date and type
  const isTicketValid = (ticket: HistoryTicket): boolean => {
    if (ticket.status !== 'ACTIVE') return false;

    const purchaseDate = new Date(ticket.purchaseDate);
    const now = new Date();
    const hoursElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60);

    switch (ticket.ticketType.toUpperCase()) {
      case 'SIMPLE':
        return hoursElapsed < 1;
      case 'JOURNEE':
        return hoursElapsed < 24;
      case 'HEBDO':
        return hoursElapsed < (24 * 7);
      case 'MENSUEL':
        return hoursElapsed < (24 * 30);
      default:
        return false;
    }
  };

  // Get ticket display status
  const getTicketStatus = (ticket: HistoryTicket): { status: string; label: string; color: string } => {
    if (ticket.status === 'USED') {
      return { status: 'USED', label: 'Utilisé', color: 'bg-blue-100 text-blue-800' };
    }
    if (ticket.status === 'CANCELLED') {
      return { status: 'CANCELLED', label: 'Annulé', color: 'bg-gray-100 text-gray-800' };
    }
    if (ticket.status === 'ACTIVE') {
      if (isTicketValid(ticket)) {
        return { status: 'VALID', label: 'Valide', color: 'bg-green-100 text-green-800' };
      } else {
        return { status: 'EXPIRED', label: 'Expiré', color: 'bg-red-100 text-red-800' };
      }
    }
    return { status: 'EXPIRED', label: 'Expiré', color: 'bg-red-100 text-red-800' };
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

  const handleExportPDF = (ticket: HistoryTicket) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour exporter le ticket');
      return;
    }

    const ticketInfo = tickets.find(t => t.id === ticket.ticketType);
    const price = ticketInfo?.price || 0;
    const validity = ticketInfo?.validity || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket KowihanTransit - ${ticket.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .ticket { max-width: 400px; margin: 0 auto; border: 2px solid #102a43; border-radius: 12px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #102a43, #243b53); color: white; padding: 20px; text-align: center; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .ticket-type { font-size: 20px; font-weight: bold; }
            .content { padding: 20px; }
            .qr-section { text-align: center; padding: 20px; border-bottom: 1px dashed #ccc; }
            .qr-code { font-family: monospace; font-size: 10px; word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 10px; }
            .info { padding: 15px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; }
            .info-value { font-weight: bold; color: #102a43; }
            .price { text-align: center; padding: 15px; background: #D4A017; color: #102a43; font-size: 24px; font-weight: bold; }
            .footer { text-align: center; padding: 15px; font-size: 12px; color: #666; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-active { background: #d1fae5; color: #065f46; }
            .status-used { background: #dbeafe; color: #1e40af; }
            @media print {
              body { padding: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="logo">KowihanTransit</div>
              <div class="ticket-type">${formatTicketType(ticket.ticketType)}</div>
            </div>
            <div class="content">
              <div class="qr-section">
                <p style="font-weight: bold; margin-bottom: 10px;">QR Code</p>
                <div class="qr-code">${ticket.qrCodeData}</div>
              </div>
              <div class="info">
                <div class="info-row">
                  <span class="info-label">ID Ticket</span>
                  <span class="info-value">#${ticket.id}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Validité</span>
                  <span class="info-value">${validity}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date d'achat</span>
                  <span class="info-value">${new Date(ticket.purchaseDate).toLocaleString('fr-FR')}</span>
                </div>
                ${ticket.validationDate ? `
                <div class="info-row">
                  <span class="info-label">Date de validation</span>
                  <span class="info-value">${new Date(ticket.validationDate).toLocaleString('fr-FR')}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Statut</span>
                  <span class="info-value">
                    <span class="status ${ticket.status === 'VALIDE' || ticket.status === 'ACTIVE' ? 'status-active' : 'status-used'}">
                      ${ticket.status === 'VALIDE' || ticket.status === 'ACTIVE' ? 'Actif' : ticket.status === 'USED' ? 'Utilisé' : ticket.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div class="price">${price.toFixed(2)} MAD</div>
            <div class="footer">
              <p>Merci d'avoir choisi KowihanTransit</p>
              <p style="margin-top: 5px;">Ce ticket est personnel et non transférable</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Transfer ticket functions
  const openTransferModal = (ticketId: number) => {
    setTransferTicketId(ticketId);
    setRecipientEmail('');
    setTransferError('');
    setTransferSuccess('');
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setTransferTicketId(null);
    setRecipientEmail('');
    setTransferError('');
  };

  const handleTransferTicket = async () => {
    if (!token || !transferTicketId) {
      setTransferError('Erreur: données manquantes');
      return;
    }

    if (!recipientEmail.trim()) {
      setTransferError('Veuillez entrer l\'email du destinataire');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setTransferError('Veuillez entrer une adresse email valide');
      return;
    }

    setTransferLoading(true);
    setTransferError('');

    try {
      const result = await apiService.transferTicket(transferTicketId, recipientEmail.trim(), token);

      if (result.error) {
        throw new Error(result.error);
      }

      setTransferSuccess(`Ticket transféré avec succès à ${recipientEmail}`);

      // Refresh history after transfer
      await fetchHistory();

      // Close modal after a short delay
      setTimeout(() => {
        closeTransferModal();
        setTransferSuccess('');
      }, 2000);

    } catch (err: any) {
      setTransferError(err.message || 'Erreur lors du transfert du ticket');
    } finally {
      setTransferLoading(false);
    }
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
            {t.tickets.title}
          </h1>
          <p className="text-xl text-gray-600">
            {t.tickets.subtitle}
          </p>
        </div>


        {showSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 max-w-3xl mx-auto" role="alert">
            <p className="font-bold">{t.tickets.purchaseSuccess}</p>
            <p>{t.tickets.ticketsUpdated}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8 flex items-start space-x-3 max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold">{t.common.error}</p>
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
                          {ticket.price.toFixed(2)} MAD
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {t.tickets.validity}: {ticket.validity}
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
                        <span>{t.tickets.addToCart}</span>
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
                <h2 className="text-2xl font-bold text-navy-900">{t.tickets.cart}</h2>
              </div>

              {Object.keys(cart).length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {t.tickets.emptyCart}
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
                              {cart[ticket.id]} × {ticket.price.toFixed(2)} MAD
                            </p>
                          </div>
                          <p className="font-bold text-navy-900">
                            {(cart[ticket.id] * ticket.price).toFixed(2)} MAD
                          </p>
                        </div>
                      ))}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-navy-900">{t.tickets.total}</span>
                      <span className="text-3xl font-bold text-mustard-500">
                        {getTotal().toFixed(2)} MAD
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={loading || !localUserId}
                    className="w-full bg-mustard-500 text-navy-900 font-bold py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.tickets.paying : `${t.tickets.pay} ${getTotal().toFixed(2)} MAD`}
                  </button>

                  {!localUserId && (
                    <p className="text-red-500 text-sm mt-2 text-center">
                      {t.tickets.missingUserId}
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
              {t.tickets.history}
            </h2>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="text-navy-900 p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
              title={t.tickets.refresh}
            >
              <RefreshCw className={`h-5 w-5 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg">
            {!token ? (
              <p className="text-gray-500 text-center p-8">
                {t.tickets.notLoggedIn}
              </p>
            ) : historyLoading ? (
              <p className="text-gray-500 text-center p-8">
                {t.tickets.loading}
              </p>
            ) : historyError ? (
              <p className="text-red-600 text-center p-8">
                {t.common.error}: {historyError}
              </p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-center p-8">
                {t.tickets.noTickets}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {history.map((ticket) => {
                  const ticketStatusInfo = getTicketStatus(ticket);
                  return (
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
                            Prix: {ticket.price.toFixed(2)} MAD
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                         QR: {ticket.qrCodeData.substring(0, 20)}...
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${ticketStatusInfo.color}`}
                        >
                          {ticketStatusInfo.label}
                        </span>
                        {ticket.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleValidateTicket(ticket.id)}
                            className="text-xs bg-mustard-500 text-navy-900 px-2 py-1 rounded hover:bg-mustard-600 transition-colors"
                          >
                            Valider
                          </button>
                        )}
                        {(ticket.status === 'ACTIVE' || ticket.status === 'VALIDE') && !ticket.validationDate && (
                          <button
                            onClick={() => openTransferModal(ticket.id)}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors flex items-center space-x-1"
                            title="Transférer le ticket"
                          >
                            <Send className="h-3 w-3" />
                            <span>Transférer</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleExportPDF(ticket)}
                          className="text-xs bg-navy-900 text-white px-2 py-1 rounded hover:bg-navy-700 transition-colors flex items-center space-x-1"
                          title="Exporter en PDF"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-navy-900">Transférer le ticket</h3>
              <button
                onClick={closeTransferModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {transferSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="text-green-700">{transferSuccess}</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    Entrez l'adresse email du destinataire pour lui transférer ce ticket.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email du destinataire
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="exemple@email.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={transferLoading}
                    />
                  </div>

                  {transferError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-red-600 text-sm">{transferError}</p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      <strong>Attention:</strong> Cette action est irréversible. Le ticket sera transféré au destinataire et ne sera plus disponible dans votre compte.
                    </p>
                  </div>
                </>
              )}
            </div>

            {!transferSuccess && (
              <div className="flex space-x-3 p-6 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={closeTransferModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={transferLoading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleTransferTicket}
                  disabled={transferLoading || !recipientEmail.trim()}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {transferLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Transfert...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Transférer</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}