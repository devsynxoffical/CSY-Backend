import axios from 'axios';

const API_BASE_URL = 'https://csy-backend-production.up.railway.app';

// Create axios instance with default config
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - redirect to login
            localStorage.removeItem('admin_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials: any) => api.post('/api/admin/login', credentials),
    getMe: () => api.get('/api/admin/me'),
    updatePassword: (data: any) => api.patch('/api/admin/update-password', data),
};

// Users API
export const usersAPI = {
    getAll: (params?: any) => api.get('/api/admin/users', { params }),
    getById: (id: string) => api.get(`/api/admin/users/${id}`),
    update: (id: string, data: any) => api.patch(`/api/admin/users/${id}`, data),
    toggleStatus: (id: string, data: any) => api.patch(`/api/admin/users/${id}/status`, data),
    delete: (id: string) => api.delete(`/api/admin/users/${id}`),
    export: (format: 'csv' | 'excel') => api.get(`/api/admin/users/export?format=${format}`, { responseType: 'blob' }),
};

// Businesses API
export const businessesAPI = {
    getAll: (params?: any) => api.get('/api/admin/businesses', { params }),
    getById: (id: string) => api.get(`/api/admin/businesses/${id}`),
    update: (id: string, data: any) => api.patch(`/api/admin/businesses/${id}`, data),
    toggleStatus: (id: string, data: any) => api.patch(`/api/admin/businesses/${id}/status`, data), // Combined approve/reject logic often in status update
    delete: (id: string) => api.delete(`/api/admin/businesses/${id}`),
};

// Drivers API
export const driversAPI = {
    getAll: (params?: any) => api.get('/api/admin/drivers', { params }),
    getById: (id: string) => api.get(`/api/admin/drivers/${id}`),
    update: (id: string, data: any) => api.patch(`/api/admin/drivers/${id}`, data),
    toggleStatus: (id: string, data: any) => api.patch(`/api/admin/drivers/${id}/status`, data),
    getPerformance: (id: string) => api.get(`/api/admin/drivers/${id}/performance`),
    delete: (id: string) => api.delete(`/api/admin/drivers/${id}`),
};

// Transactions API
export const transactionsAPI = {
    getAll: (params?: any) => api.get('/api/admin/transactions', { params }),
    getById: (id: string) => api.get(`/api/admin/transactions/${id}`),
    processRefund: (id: string, data: any) => api.post(`/api/admin/transactions/${id}/refund`, data),
    processPayout: (data: any) => api.post('/api/admin/payouts', data),
};

// Bookings API
export const bookingsAPI = {
    getReservations: (params?: any) => api.get('/api/admin/reservations', { params }),
    getOrders: (params?: any) => api.get('/api/admin/orders', { params }),
    updateReservation: (id: string, data: any) => api.patch(`/api/admin/reservations/${id}`, data),
    updateOrder: (id: string, data: any) => api.patch(`/api/admin/orders/${id}`, data),
};

// Notifications API
export const notificationsAPI = {
    send: (data: any) => api.post('/api/admin/notifications/send', data),
    getHistory: (params?: any) => api.get('/api/admin/notifications', { params }),
    getTemplates: () => api.get('/api/admin/notifications/templates'),
};

// Analytics API
export const analyticsAPI = {
    getDashboardStats: () => api.get('/api/admin/dashboard/stats'),
    getRevenueReport: (params?: any) => api.get('/api/admin/dashboard/revenue-chart', { params }),
    getUserGrowth: (params?: any) => api.get('/api/admin/dashboard/user-growth', { params }),
};

// System API
export const systemAPI = {
    getHealth: () => api.get('/api/admin/system/health'),
    getLogs: (params?: any) => api.get('/api/admin/system/logs', { params }),
};

// Subscriptions API
export const subscriptionsAPI = {
    getAll: (params?: any) => api.get('/api/admin/subscriptions', { params }),
    getPlans: () => api.get('/api/admin/subscriptions/plans'),
    updateSubscription: (id: string, data: any) => api.patch(`/api/admin/subscriptions/${id}`, data),
    cancelSubscription: (id: string) => api.delete(`/api/admin/subscriptions/${id}`),
};
