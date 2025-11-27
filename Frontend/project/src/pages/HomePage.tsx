import { Clock, Ticket, MapPin, User, TrendingUp, Shield, Scan, UserPlus, Users, Receipt } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  onNavigate: (page: string) => void;
  token?: string | null;
  userRole?: string | null;
}

export default function HomePage({ onNavigate, token, userRole }: HomePageProps) {
  const { t } = useLanguage();

  // Define all possible quick actions
  const allQuickActions = [
    {
      title: t.home.checkSchedules,
      description: t.home.checkSchedulesDesc,
      icon: Clock,
      page: 'schedules',
      color: 'bg-mustard-500',
      roles: ['PASSENGER', 'ADMIN', 'CONTROLLER', 'DRIVER'],
    },
    {
      title: t.home.buyTicketAction,
      description: t.home.buyTicketDesc,
      icon: Ticket,
      page: 'tickets',
      color: 'bg-navy-700',
      roles: ['PASSENGER'],
    },
    {
      title: t.home.trackBus,
      description: t.home.trackBusDesc,
      icon: MapPin,
      page: 'map',
      color: 'bg-mustard-600',
      roles: ['PASSENGER', 'ADMIN', 'CONTROLLER', 'DRIVER'],
    },
    {
      title: t.home.myAccount,
      description: t.home.myAccountDesc,
      icon: User,
      page: 'account',
      color: 'bg-navy-800',
      roles: ['PASSENGER'],
    },
    {
      title: 'Historique Paiements',
      description: 'Consultez tous vos achats de tickets et abonnements',
      icon: Receipt,
      page: 'payment-history',
      color: 'bg-blue-600',
      roles: ['PASSENGER'],
    },
    {
      title: t.home.validateTicket || 'Valider Ticket',
      description: t.home.validateTicketDesc || 'Scannez les QR codes pour valider les tickets',
      icon: Scan,
      page: 'validate',
      color: 'bg-green-600',
      roles: ['CONTROLLER'],
    },
    {
      title: t.home.createUser || 'Créer Utilisateur',
      description: t.home.createUserDesc || 'Créez des comptes administrateur, contrôleur ou chauffeur',
      icon: UserPlus,
      page: 'admin-creation',
      color: 'bg-blue-600',
      roles: ['ADMIN'],
    },
    {
      title: 'Gestion des Utilisateurs',
      description: 'Consultez et gérez tous les utilisateurs du système',
      icon: Users,
      page: 'user-management',
      color: 'bg-purple-600',
      roles: ['ADMIN'],
    },
  ];

  // Filter quick actions based on user role
  const quickActions = userRole
    ? allQuickActions.filter(action => action.roles.includes(userRole))
    : allQuickActions.filter(action => action.roles.includes('PASSENGER'));

  const features = [
    {
      icon: TrendingUp,
      title: t.home.reliableService,
      description: t.home.reliableServiceDesc,
    },
    {
      icon: Shield,
      title: t.home.secure,
      description: t.home.secureDesc,
    },
    {
      icon: MapPin,
      title: t.home.geolocation,
      description: t.home.geolocationDesc,
    },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t.home.title.split('KowihanTransit')[0]}
              <span className="text-mustard-500">KowihanTransit</span>
            </h1>
            <p className="text-xl md:text-2xl text-navy-200 mb-8 max-w-3xl mx-auto">
              {t.home.subtitle}
            </p>
            <button
              onClick={() => onNavigate('tickets')}
              className="bg-mustard-500 text-navy-900 font-bold px-8 py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 transform hover:scale-105 text-lg shadow-lg"
            >
              {t.home.buyTicket}
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
            {t.home.quickAccess}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-mustard-500 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-xs"
                >
                  <div className={`${action.color} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {userRole !== 'ADMIN' && userRole !== 'CONTROLLER' && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
              {t.home.whyChooseUs}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-white rounded-xl p-8 text-center shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="bg-mustard-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!token && (
        <section className="bg-navy-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t.home.readyToTravel}
            </h2>
            <p className="text-xl text-navy-200 mb-8 max-w-2xl mx-auto">
              {t.home.createAccountNow}
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="bg-mustard-500 text-navy-900 font-bold px-8 py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 transform hover:scale-105 text-lg shadow-lg"
            >
              {t.home.createAccount}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
