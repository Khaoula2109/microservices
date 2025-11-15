import { Clock, Ticket, MapPin, User, TrendingUp, Shield } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const quickActions = [
    {
      title: 'Consulter les Horaires',
      description: 'Trouvez les horaires de tous nos trajets en temps réel',
      icon: Clock,
      page: 'schedules',
      color: 'bg-mustard-500',
    },
    {
      title: 'Acheter un Ticket',
      description: 'Achetez vos tickets en ligne rapidement et facilement',
      icon: Ticket,
      page: 'tickets',
      color: 'bg-navy-700',
    },
    {
      title: 'Suivre mon Bus',
      description: 'Localisez votre bus en temps réel sur la carte',
      icon: MapPin,
      page: 'map',
      color: 'bg-mustard-600',
    },
    {
      title: 'Mon Compte',
      description: 'Gérez votre profil et vos abonnements',
      icon: User,
      page: 'account',
      color: 'bg-navy-800',
    },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Service Fiable',
      description: 'Des bus ponctuels et un service de qualité',
    },
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Paiements sécurisés et données protégées',
    },
    {
      icon: MapPin,
      title: 'Géolocalisation',
      description: 'Suivez vos bus en temps réel',
    },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bienvenue sur{' '}
              <span className="text-mustard-500">TransportCity</span>
            </h1>
            <p className="text-xl md:text-2xl text-navy-200 mb-8 max-w-3xl mx-auto">
              Votre solution de transport urbain moderne, rapide et écologique
            </p>
            <button
              onClick={() => onNavigate('tickets')}
              className="bg-mustard-500 text-navy-900 font-bold px-8 py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 transform hover:scale-105 text-lg shadow-lg"
            >
              Acheter un Ticket
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
            Accès Rapide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.page}
                  onClick={() => onNavigate(action.page)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:border-mustard-500"
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

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-navy-900 text-center mb-12">
            Pourquoi Nous Choisir?
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

      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Voyager?
          </h2>
          <p className="text-xl text-navy-200 mb-8 max-w-2xl mx-auto">
            Créez un compte dès maintenant et profitez de tous nos services
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="bg-mustard-500 text-navy-900 font-bold px-8 py-4 rounded-lg hover:bg-mustard-600 transition-all duration-200 transform hover:scale-105 text-lg shadow-lg"
          >
            Créer un Compte
          </button>
        </div>
      </section>
    </div>
  );
}
