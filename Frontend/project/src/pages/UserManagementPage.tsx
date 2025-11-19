import { useState, useEffect } from 'react';
import { Users, Shield, Scan, Truck, User, Trash2, Edit3, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface UserManagementProps {
  token: string;
}

interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
}

interface UserStats {
  total: number;
  passengers: number;
  admins: number;
  controllers: number;
  drivers: number;
}

const roleConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  CONTROLLER: { label: 'Contrôleur', icon: Scan, color: 'text-green-600', bgColor: 'bg-green-100' },
  DRIVER: { label: 'Chauffeur', icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  PASSENGER: { label: 'Passager', icon: User, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export default function UserManagementPage({ token }: UserManagementProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newRole, setNewRole] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [token, roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, statsResponse] = await Promise.all([
        apiService.getAllUsers(token, roleFilter || undefined),
        apiService.getUserStats(token),
      ]);

      if (usersResponse.data) {
        setUsers(usersResponse.data);
      }
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number) => {
    if (!newRole) return;

    try {
      const response = await apiService.updateUserRole(userId, newRole, token);
      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess('Rôle mis à jour avec succès');
      setEditingUser(null);
      setNewRole('');
      fetchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du rôle');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      const response = await apiService.deleteUser(userId, token);
      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess('Utilisateur supprimé avec succès');
      setDeleteConfirm(null);
      fetchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-500 p-4 rounded-full mb-4">
            <Users className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Gestion des Utilisateurs</h1>
          <p className="text-navy-200">Gérez les comptes et les rôles des utilisateurs</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-3 max-w-2xl mx-auto">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <p className="text-3xl font-bold text-navy-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <p className="text-3xl font-bold text-gray-600">{stats.passengers}</p>
              <p className="text-sm text-gray-600">Passagers</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.admins}</p>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <p className="text-3xl font-bold text-green-600">{stats.controllers}</p>
              <p className="text-sm text-gray-600">Contrôleurs</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-lg">
              <p className="text-3xl font-bold text-orange-600">{stats.drivers}</p>
              <p className="text-sm text-gray-600">Chauffeurs</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white"
              >
                <option value="">Tous les rôles</option>
                <option value="PASSENGER">Passagers</option>
                <option value="ADMIN">Admins</option>
                <option value="CONTROLLER">Contrôleurs</option>
                <option value="DRIVER">Chauffeurs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Nom</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Téléphone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Rôle</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const config = roleConfig[user.role] || roleConfig.PASSENGER;
                    const Icon = config.icon;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600">#{user.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-navy-900">
                            {user.firstName} {user.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.phoneNumber || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {editingUser === user.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value="">Choisir...</option>
                                <option value="PASSENGER">Passager</option>
                                <option value="ADMIN">Admin</option>
                                <option value="CONTROLLER">Contrôleur</option>
                                <option value="DRIVER">Chauffeur</option>
                              </select>
                              <button
                                onClick={() => handleRoleChange(user.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setNewRole('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${config.bgColor} ${config.color}`}>
                              <Icon className="h-4 w-4" />
                              <span>{config.label}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2">
                            {deleteConfirm === user.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingUser(user.id);
                                    setNewRole(user.role);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                  title="Modifier le rôle"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Total count */}
        <div className="text-center mt-4">
          <p className="text-navy-200">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
