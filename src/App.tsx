import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import LoginPage from './app/(auth)/login/page';
import DashboardLayout from './app/(dashboard)/layout';
import SettingsPage from './app/(dashboard)/settings/page';
import MenuPage from './app/(dashboard)/menu/page';
import PublicRestaurantMenu from './app/[restaurantSlug]/page';

// Wrapper for Next.js-style params in Vite/React Router
const PublicMenuWrapper = () => {
  const params = useParams<{ restaurantSlug: string }>();
  return <PublicRestaurantMenu params={params as { restaurantSlug: string }} />;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-red-200 max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h1>
            <div className="bg-red-50 p-4 rounded-lg mb-6 overflow-auto max-h-40">
              <code className="text-sm text-red-800 break-words font-mono">
                {this.state.error?.message || "Неизвестная ошибка"}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        {/* Redirect from root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard Routes (Protected in theory, but we'll add auth checks later if needed) */}
        <Route element={<DashboardLayout><Outlet /></DashboardLayout>}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/menu" element={<MenuPage />} />
        </Route>

        {/* Dynamic Route for Public Menu (Must be after specific routes) */}
        <Route path="/:restaurantSlug" element={<PublicMenuWrapper />} />

        {/* Fallback to login for any other unknown path */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
