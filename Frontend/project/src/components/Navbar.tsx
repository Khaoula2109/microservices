import { useState } from 'react';
import { Menu, X, Bus, LogIn, User, LogOut, Shield, Scan } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  token: string | null;
  onLogout: () => void;
  userId: number | null;
  userRole: string | null;
}

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  token, 
  onLogout,
  userId,
  userRole
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

 

  const navLinks = [
    { name: 'Accueil', page: 'home' },
    { name: 'Plannings Bus', page: 'schedules' },
    { name: 'Acheter Tickets', page: 'tickets' },
    { name: 'Carte Live', page: 'map' },
    { name: 'Abonnements', page: 'subscriptions' }, 
  ];
  
  const protectedPages = ['schedules', 'tickets', 'map', 'account', 'admin-creation','subscriptions'];
  
  const visibleLinks = navLinks.filter(link => 
    !protectedPages.includes(link.page) || token
  );

  const isUserAdmin = userRole === 'ADMIN' || userRole === 'admin' || userRole?.toUpperCase() === 'ADMIN';
  const isUserController = userRole === 'CONTROLLER' || userRole?.toUpperCase() === 'CONTROLLER';



  return (
    <nav className="fixed top-0 left-0 right-0 bg-navy-900 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <Bus className="h-8 w-8 text-mustard-500" />
            <span className="font-bold text-xl">KowihanTransit</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === link.page
                    ? 'bg-mustard-500 text-navy-900 font-semibold'
                    : 'hover:bg-navy-800 text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
            
            {token ? (
              <div className="flex items-center space-x-2 ml-4">

                {(isUserController || isUserAdmin) && (
                  <button
                    onClick={() => onNavigate('validate')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      currentPage === 'validate'
                        ? 'bg-green-600 text-white font-semibold border-2 border-green-300'
                        : 'bg-green-500 hover:bg-green-600 text-white border-2 border-green-400'
                    }`}
                    title="Valider les tickets"
                  >
                    <Scan className="h-5 w-5" />
                    <span>Valider</span>
                  </button>
                )}

                {isUserAdmin && (
                  <button
                    onClick={() => onNavigate('admin-creation')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      currentPage === 'admin-creation'
                        ? 'bg-blue-600 text-white font-semibold border-2 border-blue-300'
                        : 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400'
                    }`}
                    title="Créer un compte administrateur"
                  >
                    <Shield className="h-5 w-5" />
                    <span>Créer Admin</span>
                  </button>
                )}
                
                <button
                  onClick={() => onNavigate('account')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    currentPage === 'account'
                      ? 'bg-mustard-500 text-navy-900 font-semibold'
                      : 'bg-navy-700 hover:bg-navy-600 text-white'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Mon Compte</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="ml-4 px-6 py-2 bg-mustard-500 text-navy-900 font-semibold rounded-lg hover:bg-mustard-600 transition-all duration-200 flex items-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Connexion</span>
              </button>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-navy-800 border-t border-navy-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => {
                  onNavigate(link.page);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === link.page
                    ? 'bg-mustard-500 text-navy-900 font-semibold'
                    : 'hover:bg-navy-700 text-white'
                }`}
              >
                {link.name}
              </button>
            ))}
            
            {token ? (
              <>

                {(isUserController || isUserAdmin) && (
                  <button
                    onClick={() => {
                      onNavigate('validate');
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      currentPage === 'validate'
                        ? 'bg-green-600 text-white font-semibold border-2 border-green-300'
                        : 'bg-green-500 hover:bg-green-600 text-white border-2 border-green-400'
                    }`}
                  >
                    <Scan className="h-5 w-5" />
                    <span>Valider Tickets</span>
                  </button>
                )}

                {isUserAdmin && (
                  <button
                    onClick={() => {
                      onNavigate('admin-creation');
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      currentPage === 'admin-creation'
                        ? 'bg-blue-600 text-white font-semibold border-2 border-blue-300'
                        : 'bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-400'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Créer Admin</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    onNavigate('account');
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === 'account'
                      ? 'bg-mustard-500 text-navy-900 font-semibold'
                      : 'hover:bg-navy-700 text-white'
                  }`}
                >
                  Mon Compte
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onNavigate('login');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 bg-mustard-500 text-navy-900 font-semibold rounded-lg hover:bg-mustard-600 transition-all duration-200"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}