import {
    Box,
    Typography,
    Paper,
    Grid,
    LinearProgress,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';

export const SystemHealthPage = () => {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                System Health
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: '#4CAF50' }} />
                    <Box>
                        <Typography variant="h5">Overall Status: Healthy</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Last checked: 2 minutes ago
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                            <Typography variant="h6">Database</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Status: Healthy
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Connections: 45/100
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Response Time: 12ms
                        </Typography>
                        <LinearProgress variant="determinate" value={45} sx={{ mt: 2 }} />
                    </Paper>
                </Grid>

                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                            <Typography variant="h6">Redis Cache</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Status: Healthy
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Memory Used: 234MB / 512MB
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Hit Rate: 94.5%
                        </Typography>
                        <LinearProgress variant="determinate" value={46} sx={{ mt: 2 }} color="success" />
                    </Paper>
                </Grid>

                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                            <Typography variant="h6">API Server</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Status: Healthy
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Uptime: 15 days, 4 hours
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Requests/min: 1,234
                        </Typography>
                    </Paper>
                </Grid>

                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <ErrorIcon sx={{ color: '#FF9800' }} />
                            <Typography variant="h6">External Services</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Status: Degraded
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Payment Gateway: Slow response
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            SMS Service: Operational
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
