import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    Container,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Login as LoginIcon,
} from '@mui/icons-material';
import { login } from '../store/authSlice';
import type { RootState } from '../store';
import { authAPI } from '../services/api';

export const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate inputs are not empty
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // Real API Authentication
            const response = await authAPI.login({ email: email.trim(), password });

            if (response.data.success) {
                const { token, data } = response.data;
                const user = data.user;

                dispatch(login({
                    user: {
                        id: user.id.toString(),
                        name: user.name || 'Admin',
                        email: user.email,
                        role: user.role.toLowerCase(),
                    },
                    token
                }));
                navigate('/', { replace: true });
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            // Check for specific error message from backend
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Login failed. Please check your internet connection or server status.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                minWidth: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        borderRadius: '16px',
                        mx: 'auto',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                            CoreSY Admin
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to access the dashboard
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError(''); // Clear error when user types
                            }}
                            required
                            sx={{ mb: 2 }}
                            autoComplete="email"
                            error={!!error && !email.trim()}
                            helperText={error && !email.trim() ? 'Email is required' : ''}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(''); // Clear error when user types
                            }}
                            required
                            sx={{ mb: 3 }}
                            autoComplete="current-password"
                            error={!!error && email.trim() && !password.trim()}
                            helperText={error && email.trim() && !password.trim() ? 'Password is required' : ''}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={<LoginIcon />}
                            sx={{ mb: 2 }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>

                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Demo Credentials:
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                                Email: admin@coresy.com
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                                Password: admin123
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};
