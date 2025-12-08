import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    isAuthenticated: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
    token: string | null;
}

// Helper function to validate stored auth data
const getStoredAuth = () => {
    const token = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');
    
    // Only consider authenticated if both token and user exist
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            // Validate that user has required fields
            if (user && user.email && user.role) {
                return {
                    isAuthenticated: true,
                    user,
                    token,
                };
            }
        } catch (e) {
            // Invalid JSON, clear it
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
        }
    }
    
    return {
        isAuthenticated: false,
        user: null,
        token: null,
    };
};

const storedAuth = getStoredAuth();

const initialState: AuthState = {
    isAuthenticated: storedAuth.isAuthenticated,
    user: storedAuth.user,
    token: storedAuth.token,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            localStorage.setItem('admin_token', action.payload.token);
            localStorage.setItem('admin_user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
        },
    },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
