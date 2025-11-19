import { useState, useEffect } from 'react';
import { Scan, TrendingUp, Calendar, Clock, CheckCircle, XCircle, BarChart3, History, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface ControllerDashboardProps {
  token: string;
  onNavigate: (page: string) => void;
}

interface ValidationStats {
  validationsToday: number;
  validationsThisWeek: number;
  validationsThisMonth: number;
  totalValidations: number;
  validTickets: number;
  invalidTickets: number;
}

interface ValidationHistoryItem {
  id: number;
  userId: number;
  ticketType: string;
  status: string;
  purchaseDate: string;
  validationDate: string;
}

export default function ControllerDashboardPage({ token, onNavigate }: ControllerDashboardProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [history, setHistory] = useState<ValidationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsResponse, historyResponse] = await Promise.all([
        apiService.getValidationStats(token),
        apiService.getValidationHistory(token),
      ]);

      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
      if (historyResponse.data) {
        setHistory(historyResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTicketTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      SIMPLE: 'Simple',
      JOURNEE: 'Journée',
      HEBDO: 'Hebdomadaire',
      MENSUEL: 'Mensuel',
    };
    return types[type] || type;
  };

  const getTicketTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SIMPLE: 'bg-gray-100 text-gray-700',
      JOURNEE: 'bg-blue-100 text-blue-700',
      HEBDO: 'bg-purple-100 text-purple-700',
      MENSUEL: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-white">{t.controllerDashboardExt.loadingDashboard}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <div className="inline-flex items-center justify-center bg-green-500 p-4 rounded-full mb-4">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{t.controllerDashboard.title}</h1>
            <p className="text-navy-200">{t.controllerDashboard.subtitle}</p>
          </div>
          <div className="flex space-x-3 justify-center md:justify-end">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>{t.controllerDashboard.refresh}</span>
            </button>
            <button
              onClick={() => onNavigate('validate')}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Scan className="h-5 w-5" />
              <span>{t.controllerDashboard.scan}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-green-100 p-2 rounded-full mb-2">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.validationsToday}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.validationsToday}</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-blue-100 p-2 rounded-full mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats.validationsThisWeek}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.validationsWeek}</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-purple-100 p-2 rounded-full mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">{stats.validationsThisMonth}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.validationsMonth}</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-navy-100 p-2 rounded-full mb-2">
                <BarChart3 className="h-5 w-5 text-navy-600" />
              </div>
              <p className="text-3xl font-bold text-navy-900">{stats.totalValidations}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.totalValidations}</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-green-100 p-2 rounded-full mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.validTickets}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.validTickets}</p>
            </div>

            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <div className="inline-flex items-center justify-center bg-red-100 p-2 rounded-full mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.invalidTickets}</p>
              <p className="text-sm text-gray-600">{t.controllerDashboard.invalidTickets}</p>
            </div>
          </div>
        )}

        {/* Validation History */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-navy-900 text-white px-6 py-4 flex items-center space-x-3">
            <History className="h-6 w-6" />
            <h2 className="text-xl font-bold">{t.controllerDashboard.validationHistory}</h2>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-center">
              <Scan className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t.controllerDashboard.noValidations}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.controllerDashboardExt.tableId}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.controllerDashboardExt.tableType}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.controllerDashboardExt.tablePurchase}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.controllerDashboardExt.tableValidation}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.controllerDashboardExt.tableStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.slice(0, 50).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">#{item.id}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTicketTypeColor(item.ticketType)}`}>
                          {getTicketTypeLabel(item.ticketType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(item.validationDate)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center space-x-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">{t.controllerDashboardExt.validated}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {history.length > 50 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                {t.controllerDashboardExt.displayingLast} {history.length} {t.controllerDashboardExt.atTotal}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
