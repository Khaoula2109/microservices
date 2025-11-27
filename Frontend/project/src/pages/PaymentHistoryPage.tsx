import { useState, useEffect } from 'react';
import { CreditCard, Calendar, Download, Receipt, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface PaymentHistoryProps {
  token: string;
  userId: number;
}

interface Payment {
  id: string;
  type: 'TICKET' | 'SUBSCRIPTION';
  description: string;
  amount: number;
  currency: string;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  receiptUrl?: string;
}

export default function PaymentHistoryPage({ token, userId }: PaymentHistoryProps) {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TICKET' | 'SUBSCRIPTION'>('ALL');

  useEffect(() => {
    fetchPaymentHistory();
  }, [token, userId]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer historique tickets
      const ticketsResponse = await apiService.getTicketHistory(userId, token);
      const tickets: Payment[] = (ticketsResponse.data || []).map((ticket: any) => ({
        id: `TICKET-${ticket.id}`,
        type: 'TICKET' as const,
        description: `Ticket ${ticket.ticketType}`,
        amount: ticket.price || 50,
        currency: 'MAD',
        date: ticket.purchaseDate,
        status: 'COMPLETED' as const,
      }));

      // TODO: Récupérer historique abonnements quand l'API sera disponible
      // const subscriptionsResponse = await apiService.getSubscriptionHistory(userId, token);

      const allPayments = [...tickets].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPayments(allPayments);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = filter === 'ALL'
    ? payments
    : payments.filter(p => p.type === filter);

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-500 p-4 rounded-full mb-4">
            <CreditCard className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">Historique des Paiements</h1>
          <p className="text-gray-600">Consultez tous vos achats de tickets et abonnements</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Dépensé</p>
                <p className="text-2xl font-bold text-navy-900">{totalSpent} MAD</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Receipt className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-navy-900">{payments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ce Mois</p>
                <p className="text-2xl font-bold text-navy-900">
                  {payments.filter(p => {
                    const paymentDate = new Date(p.date);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() &&
                           paymentDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-700">Filtrer par :</span>
            <div className="flex space-x-2">
              {(['ALL', 'TICKET', 'SUBSCRIPTION'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'ALL' ? 'Tous' : f === 'TICKET' ? 'Tickets' : 'Abonnements'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun paiement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Montant</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Statut</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(payment.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          payment.type === 'TICKET'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {payment.type === 'TICKET' ? 'Ticket' : 'Abonnement'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{payment.description}</td>
                      <td className="px-6 py-4 text-sm font-bold text-right text-navy-900">
                        {payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span>{payment.status === 'COMPLETED' ? 'Payé' : payment.status}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Télécharger le reçu"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
