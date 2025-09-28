import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import WalletPage from '../pages/WalletPage';
import TransferPage from '../pages/TransferPage';
import WelcomePage from '../pages/WelcomePage';
import AddTokenPage from '../pages/AddTokenPage';
import AccountDetailPage from '../pages/AccountDetailPage';
import ConfirmConnectionPage from '../pages/ConfirmConnectionPage';
import ConfirmSignaturePage from '../pages/ConfirmSignaturePage';
import ConfirmTransactionPage from '../pages/ConfirmTransactionPage';
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
            <Route path="/confirm-connection" element={<ConfirmConnectionPage />} />
            <Route path="/confirm-signature" element={<ConfirmSignaturePage />} />
            <Route path="/confirm-transaction" element={<ConfirmTransactionPage />} />
            <Route path="*" element={<Navigate to="/welcome" />} />
          </Routes>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
};

export default AppRouter;
