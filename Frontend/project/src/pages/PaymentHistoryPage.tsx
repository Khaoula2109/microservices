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
      const ticketsResponse = await apiService.getTicketHistory(token);
      const tickets: Payment[] = (ticketsResponse.data || []).map((ticket: any) => ({
        id: `TICKET-${ticket.id}`,
        type: 'TICKET' as const,
        description: `Ticket ${ticket.ticketType}${ticket.discountApplied > 0 ? ` (-${ticket.discountApplied}% fidélité)` : ''}`,
        amount: ticket.finalPrice || ticket.price || ticket.originalPrice || 0,
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

  const handleDownloadReceipt = (payment: Payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour télécharger le reçu');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de paiement - ${payment.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
            .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #102a43, #243b53); color: white; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 30px; }
            .info-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; font-weight: 500; }
            .info-value { font-weight: bold; color: #102a43; }
            .amount { text-align: center; padding: 30px; background: #f8f9fa; margin: 20px 0; border-radius: 8px; }
            .amount-label { color: #666; font-size: 14px; margin-bottom: 10px; }
            .amount-value { font-size: 36px; font-weight: bold; color: #D4A017; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-completed { background: #d1fae5; color: #065f46; }
            @media print {
              body { padding: 0; background: white; }
              .receipt { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="logo">KowihanTransit</div>
              <div style="font-size: 18px;">Reçu de Paiement</div>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="info-label">Numéro de transaction</span>
                <span class="info-value">${payment.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span class="info-value">${new Date(payment.date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Type</span>
                <span class="info-value">${payment.type === 'TICKET' ? 'Ticket' : 'Abonnement'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Description</span>
                <span class="info-value">${payment.description}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Statut</span>
                <span class="info-value">
                  <span class="status status-completed">Payé</span>
                </span>
              </div>
              <div class="amount">
                <div class="amount-label">Montant payé</div>
                <div class="amount-value">${payment.amount.toFixed(2)} ${payment.currency}</div>
              </div>
            </div>
            <div class="footer">
              <p>Merci d'avoir choisi KowihanTransit</p>
              <p style="margin-top: 10px;">Ce reçu fait office de preuve de paiement</p>
              <p style="margin-top: 5px;">Pour toute question, contactez notre support</p>
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

  const handleExportAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour exporter l\'historique');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Historique des Paiements - KowihanTransit</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 32px; font-weight: bold; color: #102a43; margin-bottom: 10px; }
            .title { font-size: 24px; color: #666; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .summary-item { text-align: center; }
            .summary-label { color: #666; font-size: 14px; }
            .summary-value { font-size: 24px; font-weight: bold; color: #102a43; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #102a43; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; }
            tr:hover { background: #f8f9fa; }
            .amount { font-weight: bold; color: #D4A017; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KowihanTransit</div>
            <div class="title">Historique des Paiements</div>
            <div style="color: #999; margin-top: 10px; font-size: 12px;">
              Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Dépensé</div>
              <div class="summary-value">${totalSpent.toFixed(2)} MAD</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Transactions</div>
              <div class="summary-value">${payments.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th style="text-align: right;">Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPayments.map(payment => `
                <tr>
                  <td>${new Date(payment.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}</td>
                  <td>${payment.type === 'TICKET' ? 'Ticket' : 'Abonnement'}</td>
                  <td>${payment.description}</td>
                  <td style="text-align: right;" class="amount">${payment.amount.toFixed(2)} ${payment.currency}</td>
                  <td>Payé</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>KowihanTransit - Votre partenaire transport</p>
            <p style="margin-top: 5px;">Ce document est généré automatiquement</p>
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
                            onClick={() => handleDownloadReceipt(payment)}
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
          <button
            onClick={handleExportAll}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
