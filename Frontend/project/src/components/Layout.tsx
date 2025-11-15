import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userId: number | null;
  token: string | null;
  userRole: string | null;
}

export default function Layout({ 
  children, 
  currentPage, 
  onNavigate, 
  token, 
  onLogout,
  userId,
  userRole
}: LayoutProps) {
  
  // DEBUG: Vérifier ce que reçoit le Layout
  console.log('🔍 [Layout] Debug reçu:', {
    userRole: userRole,
    userRoleType: typeof userRole,
    token: !!token,
    userId: userId
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={onNavigate} 
        token={token}
        onLogout={onLogout}
        userId={userId}
        userRole={userRole}
      />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}