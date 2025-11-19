import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SchedulesPage from './pages/SchedulesPage';
import TicketsPage from './pages/TicketsPage';
import MapPage from './pages/MapPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import apiService from './services/api';
import SubscriptionPage from './pages/SubscriptionPage';
import Success from './pages/Success';
import Cancel from './pages/Cancel';
import AdminUserCreation from './pages/AdminUserCreation';
import ValidateTicketPage from './pages/ValidateTicketPage';
import UserManagementPage from './pages/UserManagementPage';
import ControllerDashboardPage from './pages/ControllerDashboardPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { Shield, Scan, Users, BarChart3, CreditCard } from 'lucide-react';

const protectedPages = ['schedules', 'tickets', 'map', 'account','subscriptions'];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('authToken');

    return savedToken || null;
  });
  

  const [userId, setUserId] = useState<number | null>(() => {
    const savedUserId = localStorage.getItem('userId');
    
    
    if (!savedUserId || savedUserId === 'null' || savedUserId === 'undefined') {
      
      return null;
    }
    

    const parsed = parseInt(savedUserId, 10);
    
    if (isNaN(parsed) || parsed <= 0) {
      console.error('❌ [App Init] UserId invalide (NaN ou négatif):', savedUserId);
      localStorage.removeItem('userId');
      return null;
    }
    

    return parsed;
  });


  const [userRole, setUserRole] = useState<string | null>(() => {
    const savedRole = localStorage.getItem('userRole');
    
    return savedRole || null;
  });


  useEffect(() => {

    

    if (token) {
      localStorage.setItem('authToken', token);

    } else {
      localStorage.removeItem('authToken');

    }
    

    if (userId !== null && !isNaN(userId)) {
      const userIdStr = userId.toString();
      localStorage.setItem('userId', userIdStr);
      
    } else {
      localStorage.removeItem('userId');
      
    }


    if (userRole) {
      localStorage.setItem('userRole', userRole);
      
    } else {
      localStorage.removeItem('userRole');
      
    }
  }, [token, userId, userRole]);

  
  const handleNavigate = (page: string) => {
    
    
    if (protectedPages.includes(page) && !token) {
      
      setCurrentPage('login');
    } else {
      
      setCurrentPage(page);
    }
  };


const handleAuthSuccess = async (newToken: string, newUserId: number, newUserRole?: string) => {

  

  if (!newToken) {
    console.error('❌ [App Auth] Token manquant !');
    return;
  }
  
  if (!newUserId || isNaN(newUserId) || newUserId <= 0) {
    console.error('❌ [App Auth] UserId invalide !', newUserId);
    return;
  }
  
  try {
    let finalUserRole = newUserRole;
    

    if (!finalUserRole) {

      const profileResponse = await apiService.getUserProfile(newToken);
      if (profileResponse.data) {
        finalUserRole = profileResponse.data.role;

      } else {
        console.error('❌ [App Auth] Profil utilisateur non trouvé');
        return;
      }
    } else {

    }
    


    setToken(newToken);
    setUserId(newUserId);
    setUserRole(finalUserRole);

    
  } catch (error) {
    console.error('❌ [App Auth] Erreur récupération profil:', error);
    return;
  }
  

  

  setCurrentPage('home');
};


  const handleLogout = () => {

    setToken(null);
    setUserId(null);
    setUserRole(null);
    setCurrentPage('home');

  };


  useEffect(() => {

    

    if (token && currentPage === 'login') {

      setCurrentPage('home');
    }
    

    if (!token && protectedPages.includes(currentPage)) {

      setCurrentPage('login');
    }
  }, [token, currentPage]);

  const renderPage = () => {

    if (protectedPages.includes(currentPage) && !token) {

      return (
        <LoginPage 
          onNavigate={handleNavigate} 
          onAuthSuccess={handleAuthSuccess}
        />
      );
    }


    if (currentPage === 'tickets') {

    }

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} token={token} userRole={userRole} />;
        
      case 'schedules':
        return <SchedulesPage token={token} userRole={userRole} />;
        
      case 'tickets':

        return (
          <TicketsPage 
            token={token} 
            userId={userId}
          />
        );
        
      case 'map':
        return <MapPage token={token} />;
        
      case 'account':
        return (
          <AccountPage 
            onNavigate={handleNavigate} 
            token={token} 
            onLogout={handleLogout}
            userId={userId}
          />
        );
        
      case 'login':
        return (
          <LoginPage 
            onNavigate={handleNavigate} 
            onAuthSuccess={handleAuthSuccess}
          />
        );
        
      case 'register':
        return (
          <RegisterPage 
            onNavigate={handleNavigate} 
            onAuthSuccess={handleAuthSuccess}
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionPage 
            token={token!} 
            userId={userId!}
      
        
          />
        );
      case 'success':
        return <Success />;
      case 'cancel':
        return <Cancel />;
      case 'validate':
        if (userRole !== 'CONTROLLER' && userRole !== 'ADMIN') {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Scan className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
                <p className="text-gray-600">Seuls les contrôleurs peuvent valider les tickets.</p>
              </div>
            </div>
          );
        }
        return <ValidateTicketPage token={token!} />;
      case 'admin-creation':

      if (userRole !== 'ADMIN') {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
              <p className="text-gray-600">Vous n'avez pas les droits d'administrateur.</p>
            </div>
          </div>
        );
  }
  return <AdminUserCreation token={token!} onNavigate={handleNavigate} />;

      case 'user-management':
        if (userRole !== 'ADMIN') {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Users className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
                <p className="text-gray-600">Vous n'avez pas les droits d'administrateur.</p>
              </div>
            </div>
          );
        }
        return <UserManagementPage token={token!} />;

      case 'controller-dashboard':
        if (userRole !== 'CONTROLLER' && userRole !== 'ADMIN') {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
                <p className="text-gray-600">Seuls les contrôleurs peuvent accéder au dashboard.</p>
              </div>
            </div>
          );
        }
        return <ControllerDashboardPage token={token!} onNavigate={handleNavigate} />;

      case 'my-subscriptions':
        if (!token) {
          return (
            <LoginPage
              onNavigate={handleNavigate}
              onAuthSuccess={handleAuthSuccess}
            />
          );
        }
        return <MySubscriptionsPage token={token} userId={userId!} />;

      default:

        return <HomePage onNavigate={handleNavigate} token={token} userRole={userRole} />;
    }
  };


  if (currentPage === 'login' || currentPage === 'register') {
    return (
      <NotificationProvider userId={userId}>
        {renderPage()}
      </NotificationProvider>
    );
  }



  return (
    <NotificationProvider userId={userId}>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        token={token}
        onLogout={handleLogout}
        userId={userId}
        userRole={userRole}
      >
        {renderPage()}
      </Layout>
    </NotificationProvider>
  );
}

export default App;