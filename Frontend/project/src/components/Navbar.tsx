import { useState } from 'react';
import { Menu, X, Bus, LogIn, User, LogOut, UserPlus, Scan, BarChart3, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../i18n/translations';
import NotificationBell from './NotificationBell';

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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  const isUserAdmin = userRole === 'ADMIN' || userRole === 'admin' || userRole?.toUpperCase() === 'ADMIN';
  const isUserController = userRole === 'CONTROLLER' || userRole?.toUpperCase() === 'CONTROLLER';

  // Define nav links based on user role
  const getNavLinks = () => {
    if (isUserController || isUserAdmin) {
      // CONTROLLER and ADMIN: Accueil, Plannings Bus, Carte Live
      return [
        { name: t.nav.home, page: 'home' },
        { name: t.nav.schedules, page: 'schedules' },
        { name: t.nav.map, page: 'map' },
      ];
    }
    // PASSENGER: Accueil, Plannings Bus, Acheter Tickets, Carte Live, Abonnements
    return [
      { name: t.nav.home, page: 'home' },
      { name: t.nav.schedules, page: 'schedules' },
      { name: t.nav.tickets, page: 'tickets' },
      { name: t.nav.map, page: 'map' },
      { name: t.nav.subscriptions, page: 'subscriptions' },
    ];
  };

  const navLinks = getNavLinks();

  const protectedPages = ['schedules', 'tickets', 'map', 'account', 'admin-creation','subscriptions'];

  const visibleLinks = navLinks.filter(link =>
    !protectedPages.includes(link.page) || token
  );



  return (
    <nav className="fixed top-0 left-0 right-0 bg-navy-900 text-white shadow-lg z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3 cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
            <Bus className="h-8 w-8 text-mustard-500" />
            <span className="font-bold text-xl">KowihanTransit</span>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center flex-1 justify-center space-x-2 lg:space-x-4">
            {visibleLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                  currentPage === link.page
                    ? 'bg-mustard-500 text-navy-900 font-semibold'
                    : 'hover:bg-navy-800 text-white'
                }`}
              >
                {link.name}
              </button>
            ))}

            {token && (
              <>
                {(isUserController || isUserAdmin) && (
                  <button
                    onClick={() => onNavigate('validate')}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 lg:space-x-2 whitespace-nowrap ${
                      currentPage === 'validate'
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-800 text-white'
                    }`}
                    title="Valider les tickets"
                  >
                    <Scan className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>Valider</span>
                  </button>
                )}

                {(isUserController || isUserAdmin) && (
                  <button
                    onClick={() => onNavigate('controller-dashboard')}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 lg:space-x-2 whitespace-nowrap ${
                      currentPage === 'controller-dashboard'
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-800 text-white'
                    }`}
                    title="Dashboard Contrôleur"
                  >
                    <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>Stats</span>
                  </button>
                )}

                {isUserAdmin && (
                  <button
                    onClick={() => onNavigate('admin-creation')}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 lg:space-x-2 whitespace-nowrap ${
                      currentPage === 'admin-creation'
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-800 text-white'
                    }`}
                    title="Créer un nouvel utilisateur"
                  >
                    <UserPlus className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span>Créer Utilisateur</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right side actions */}
          {token ? (
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => onNavigate('account')}
                className={`px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1 lg:space-x-2 whitespace-nowrap ${
                  currentPage === 'account'
                    ? 'bg-mustard-500 text-navy-900 font-semibold'
                    : 'bg-navy-700 hover:bg-navy-600 text-white'
                }`}
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden lg:inline">{t.nav.myAccount}</span>
              </button>
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-1"
                  title="Changer la langue"
                >
                  <Globe className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="text-xs">{language.toUpperCase()}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                          language === lang.code ? 'bg-gray-100 font-semibold' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-gray-700">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200"
                title={isDark ? t.nav.lightMode : t.nav.darkMode}
              >
                {isDark ? <Sun className="h-4 w-4 lg:h-5 lg:w-5" /> : <Moon className="h-4 w-4 lg:h-5 lg:w-5" />}
              </button>
              <button
                onClick={onLogout}
                className="px-3 lg:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-1 lg:space-x-2"
                title={t.nav.logout}
              >
                <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2 flex-shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-1"
                >
                  <Globe className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="text-xs">{language.toUpperCase()}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-1 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                          language === lang.code ? 'bg-gray-100 font-semibold' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-gray-700">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200"
                title={isDark ? t.nav.lightMode : t.nav.darkMode}
              >
                {isDark ? <Sun className="h-4 w-4 lg:h-5 lg:w-5" /> : <Moon className="h-4 w-4 lg:h-5 lg:w-5" />}
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 lg:px-6 py-2 bg-mustard-500 text-navy-900 font-semibold rounded-lg hover:bg-mustard-600 transition-all duration-200 flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>{t.nav.login}</span>
              </button>
            </div>
          )}

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
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-700 text-white'
                    }`}
                  >
                    <Scan className="h-5 w-5" />
                    <span>Valider</span>
                  </button>
                )}

                {(isUserController || isUserAdmin) && (
                  <button
                    onClick={() => {
                      onNavigate('controller-dashboard');
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                      currentPage === 'controller-dashboard'
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-700 text-white'
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Stats</span>
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
                        ? 'bg-mustard-500 text-navy-900 font-semibold'
                        : 'hover:bg-navy-700 text-white'
                    }`}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Créer Utilisateur</span>
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
                  onClick={toggleTheme}
                  className="block w-full text-left px-3 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
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
              <>
                <button
                  onClick={toggleTheme}
                  className="block w-full text-left px-3 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 bg-mustard-500 text-navy-900 font-semibold rounded-lg hover:bg-mustard-600 transition-all duration-200"
                >
                  Connexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}