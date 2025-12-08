import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MainLayout } from '../components/layout/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { UsersPage } from '../pages/UsersPage';
import { BusinessesPage } from '../pages/BusinessesPage';
import { DriversPage } from '../pages/DriversPage';
import { TransactionsPage } from '../pages/TransactionsPage';
import { SystemHealthPage } from '../pages/SystemHealthPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { BookingsPage } from '../pages/BookingsPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { SubscriptionsPage } from '../pages/SubscriptionsPage';
import { LoginPage } from '../pages/LoginPage';
import { SystemSettingsPage } from '../pages/SystemSettingsPage';
import { ActivityLogsPage } from '../pages/ActivityLogsPage';
import { ProfilePage } from '../pages/ProfilePage';
import type { RootState } from '../store';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const user = useSelector((state: RootState) => state.auth.user);

    // Double-check: if not authenticated or user is missing, redirect to login
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                {/* User Management Routes */}
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:status" element={<UsersPage />} />
                {/* Business Management Routes */}
                <Route path="businesses" element={<BusinessesPage />} />
                <Route path="businesses/:status" element={<BusinessesPage />} />
                {/* Driver Management Routes */}
                <Route path="drivers" element={<DriversPage />} />
                <Route path="drivers/:status" element={<DriversPage />} />
                {/* Transactions Routes */}
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="transactions/payouts" element={<TransactionsPage />} />
                <Route path="transactions/refunds" element={<TransactionsPage />} />
                {/* Bookings Routes */}
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/reservations" element={<BookingsPage />} />
                <Route path="bookings/orders" element={<BookingsPage />} />
                {/* Notifications Routes */}
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="notifications/send" element={<NotificationsPage />} />
                <Route path="notifications/history" element={<NotificationsPage />} />
                {/* Analytics Routes */}
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="analytics/overview" element={<AnalyticsPage />} />
                <Route path="analytics/revenue" element={<AnalyticsPage />} />
                {/* Subscriptions Routes */}
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="subscriptions/plans" element={<SubscriptionsPage />} />
                {/* System Routes */}
                <Route path="system/health" element={<SystemHealthPage />} />
                <Route path="system/settings" element={<SystemSettingsPage />} />
                <Route path="system/activity-logs" element={<ActivityLogsPage />} />
                {/* Profile Routes */}
                <Route path="profile" element={<ProfilePage />} />
                <Route path="profile/password" element={<ProfilePage />} />
            </Route>
        </Routes>
    );
};
