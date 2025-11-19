import { useState } from 'react';
import { Shield, Mail, Lock, User, AlertCircle, ArrowLeft, Scan, Truck } from 'lucide-react';
import { apiService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminUserCreationProps {
  token: string;
  onNavigate: (page: string) => void;
}

const roles = [
  { value: 'ADMIN', label: 'Administrateur', icon: Shield, color: 'bg-blue-500', description: 'Accès complet au système' },
  { value: 'CONTROLLER', label: 'Contrôleur', icon: Scan, color: 'bg-green-500', description: 'Validation des tickets' },
  { value: 'DRIVER', label: 'Chauffeur', icon: Truck, color: 'bg-orange-500', description: 'Conduite des bus' },
];

export default function AdminUserCreation({ token, onNavigate }: AdminUserCreationProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedRole = roles.find(r => r.value === formData.role) || roles[0];

  // Get translated role label
  const getRoleLabel = (value: string) => {
    switch (value) {
      case 'ADMIN': return t.adminCreation.admin;
      case 'CONTROLLER': return t.adminCreation.controller;
      case 'DRIVER': return t.adminCreation.driver;
      default: return value;
    }
  };

  const getRoleDescription = (value: string) => {
    switch (value) {
      case 'ADMIN': return t.adminCreation.adminDesc;
      case 'CONTROLLER': return t.adminCreation.controllerDesc;
      case 'DRIVER': return t.adminCreation.driverDesc;
      default: return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError(t.adminCreation.passwordMismatch);
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError(t.adminCreation.passwordTooShort);
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.registerAdmin({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }, token);

      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(`${getRoleLabel(formData.role)} ${t.adminCreation.successMessage} ${formData.email}`);

      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: formData.role,
      });

    } catch (err: any) {
      setError(err.message || t.adminCreation.creationErrorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center ${selectedRole.color} p-4 rounded-full mb-4 transition-colors duration-300`}>
            <selectedRole.icon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-navy-900 mb-2">{t.adminCreation.pageTitle}</h1>
          <p className="text-gray-600">{t.adminCreation.pageSubtitle}</p>
        </div>

        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('account')}
            className="flex items-center space-x-2 text-mustard-500 hover:text-mustard-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-semibold">{t.adminCreation.backToAccount}</span>
          </button>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <selectedRole.icon className={`h-6 w-6 ${selectedRole.color === 'bg-blue-500' ? 'text-blue-500' : selectedRole.color === 'bg-green-500' ? 'text-green-500' : 'text-orange-500'}`} />
            <h2 className="text-2xl font-bold text-navy-900">{t.adminCreation.newUser} {getRoleLabel(formData.role)}</h2>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3 animate-pulse">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-semibold text-sm">{t.adminCreation.creationError}</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 font-semibold text-sm">{t.adminCreation.accountCreated}</p>
                <p className="text-green-600 text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sélecteur de rôle */}
            <div>
              <label className="block text-navy-900 font-semibold mb-3 text-sm">
                {t.adminCreation.accountType}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                        isSelected
                          ? `${role.color} text-white border-transparent shadow-lg transform scale-105`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{getRoleLabel(role.value)}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">{getRoleDescription(formData.role)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-navy-900 font-semibold mb-2 text-sm">
                  {t.adminCreation.firstName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t.adminCreation.firstName}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-navy-900 font-semibold mb-2 text-sm">
                  {t.adminCreation.lastName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={t.adminCreation.lastName}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                {t.adminCreation.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@kowihan.ma"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                {t.adminCreation.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{t.adminCreation.minChars}</p>
            </div>

            <div>
              <label className="block text-navy-900 font-semibold mb-2 text-sm">
                {t.adminCreation.confirmPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${selectedRole.color} text-white font-bold py-4 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t.adminCreation.creating}</span>
                </>
              ) : (
                <>
                  <selectedRole.icon className="h-5 w-5" />
                  <span>{t.adminCreation.createAccount} {getRoleLabel(formData.role)}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                {t.adminCreation.returnTo}{' '}
                <button
                  onClick={() => onNavigate('account')}
                  className="text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                  disabled={loading}
                >
                  {t.adminCreation.backToAccountPage}
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-500 hover:text-navy-900 transition-colors disabled:opacity-50 text-sm"
            disabled={loading}
          >
            ← {t.adminCreation.backToHomeSmall}
          </button>
        </div>
      </div>
    </div>
  );
}
