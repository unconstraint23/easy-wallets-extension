import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import WalletPage from '../pages/WalletPage';
import TransferPage from '../pages/TransferPage';
import WelcomePage from '../pages/WelcomePage';
import AddTokenPage from '../pages/AddTokenPage';
import AccountDetailPage from '../pages/AccountDetailPage';
import { AuthProvider } from '../auth/AuthContext';
import PrivateRoute from './PrivateRoute';
import { WalletProvider } from '../commonprovider/commonProvider';

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
            <Route path="/transfer" element={<PrivateRoute><TransferPage /></PrivateRoute>} />
            <Route path="/add-token" element={<PrivateRoute><AddTokenPage /></PrivateRoute>} />
            <Route path="/account-detail" element={<PrivateRoute><AccountDetailPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/wallet" />} />
          </Routes>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
};

export default AppRouter;
