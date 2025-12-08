import { Grid, Paper, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    People as PeopleIcon,
    Business as BusinessIcon,
    AttachMoney as MoneyIcon,
    LocalShipping as CarIcon,
    TrendingUp,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend: string;
    color: string;
}

const StatCard = ({ title, value, icon, trend, color, onClick }: StatCardProps & { onClick?: () => void }) => (
    <Paper
        onClick={onClick}
        sx={{
            p: { xs: 1.5, sm: 2, md: 2 },
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: { xs: '12px', md: '16px' },
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: onClick ? 'pointer' : 'default',
            '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-4px)' },
                boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.08)', sm: '0 4px 16px rgba(0,0,0,0.12)' },
            },
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' }, mb: 0.5 }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                        lineHeight: 1.2
                    }}
                >
                    {value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', color: '#4CAF50', flexWrap: 'wrap' }}>
                    <TrendingUp sx={{ fontSize: { xs: 12, sm: 14, md: 14 }, mr: 0.5 }} />
                    <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, lineHeight: 1.2 }}
                    >
                        {trend}
                    </Typography>
                </Box>
            </Box>
            <Box
                sx={{
                    width: { xs: 40, sm: 44, md: 48 },
                    height: { xs: 40, sm: 44, md: 48 },
                    borderRadius: { xs: '10px', md: '12px' },
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                    ml: { xs: 1, sm: 1.5 },
                }}
            >
                {icon}
            </Box>
        </Box>
    </Paper>
);

// ... imports ...
import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';

// ... StatCard definition ...

export const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        users: 0,
        businesses: 0,
        drivers: 0,
        revenue: 0
    });
    const [revenueData, setRevenueData] = useState([]);
    const [userGrowthData, setUserGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, revenueRes, growthRes] = await Promise.all([
                    analyticsAPI.getDashboardStats(),
                    analyticsAPI.getRevenueReport(),
                    analyticsAPI.getUserGrowth()
                ]);

                if (statsRes.data.success) {
                    setStats(prev => ({ ...prev, ...statsRes.data.data }));
                }
                if (revenueRes.data.success) {
                    setRevenueData(revenueRes.data.data);
                }
                if (growthRes.data.success) {
                    setUserGrowthData(growthRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Placeholder until we implement real activity logs endpoint
    const recentActivities = [
        { id: 1, type: 'System', description: 'Dashboard initialized', time: 'Just now', status: 'Info' },
    ];

    return (
        <Box sx={{ px: { xs: 0.5, sm: 1, md: 0 } }}>
            <Typography
                variant="h4"
                sx={{
                    mb: { xs: 2, sm: 3, md: 4 },
                    fontWeight: 600,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                }}
            >
                Platform Overview
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value={stats.users.toLocaleString()}
                        icon={<PeopleIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                        trend="Live Data"
                        color="#1976D2"
                        onClick={() => navigate('/users')}
                    />
                </Grid>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Businesses"
                        value={stats.businesses.toLocaleString()}
                        icon={<BusinessIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                        trend="Live Data"
                        color="#9C27B0"
                        onClick={() => navigate('/businesses')}
                    />
                </Grid>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Revenue"
                        value={`$${stats.revenue.toLocaleString()}`}
                        icon={<MoneyIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                        trend="Live Data"
                        color="#4CAF50"
                        onClick={() => navigate('/transactions')}
                    />
                </Grid>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Drivers"
                        value={stats.drivers.toLocaleString()}
                        icon={<CarIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />}
                        trend="Live Data"
                        color="#FF9800"
                        onClick={() => navigate('/drivers')}
                    />
                </Grid>
            </Grid>

            {/* Charts Section - Side by Side Square Boxes */}
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 2, sm: 3, md: 4 }, width: '100%' }}>
                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{
                        p: { xs: 2, sm: 2.5, md: 3 },
                        borderRadius: { xs: '12px', md: '16px' },
                        height: { xs: 400, sm: 450, md: 500 },
                        width: '100%',
                        bgcolor: '#ffffff'
                    }}>
                        <Typography
                            variant="h6"
                            sx={{
                                mb: { xs: 2, sm: 2.5, md: 3 },
                                fontWeight: 600,
                                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                            }}
                        >
                            Revenue Trend
                        </Typography>
                        <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400 }, minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData.length ? revenueData : []} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#666"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#1976D2"
                                        strokeWidth={4}
                                        dot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#1976D2' }}
                                        activeDot={{ r: 8, strokeWidth: 2, fill: '#fff', stroke: '#1976D2' }}
                                        name="Revenue ($)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="fees"
                                        stroke="#4CAF50"
                                        strokeWidth={4}
                                        dot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: '#4CAF50' }}
                                        activeDot={{ r: 8, strokeWidth: 2, fill: '#fff', stroke: '#4CAF50' }}
                                        name="Fees ($)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* @ts-expect-error - MUI v7 Grid API change */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{
                        p: { xs: 2, sm: 2.5, md: 3 },
                        borderRadius: { xs: '12px', md: '16px' },
                        height: { xs: 400, sm: 450, md: 500 },
                        width: '100%',
                        bgcolor: '#ffffff'
                    }}>
                        <Typography
                            variant="h6"
                            sx={{
                                mb: { xs: 2, sm: 2.5, md: 3 },
                                fontWeight: 600,
                                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                            }}
                        >
                            User Growth
                        </Typography>
                        <Box sx={{ width: '100%', height: { xs: 300, sm: 350, md: 400 }, minHeight: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={userGrowthData.length ? userGrowthData : []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1976D2" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#1976D2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#666"
                                        interval={0}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#1976D2"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                        name="Users"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Activities */}
            <Paper sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                borderRadius: { xs: '12px', md: '16px' }
            }}>
                <Typography
                    variant="h6"
                    sx={{
                        mb: { xs: 2, sm: 2.5, md: 3 },
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' }
                    }}
                >
                    Recent Activities
                </Typography>
                <Box>
                    {recentActivities.length > 0 ? recentActivities.map((activity) => (
                        <Box
                            key={activity.id}
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                py: { xs: 1.5, sm: 2 },
                                borderBottom: '1px solid #f0f0f0',
                                gap: { xs: 1, sm: 0 },
                                '&:last-child': { borderBottom: 'none' },
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        fontWeight: 500,
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        mb: { xs: 0.5, sm: 0 }
                                    }}
                                >
                                    {activity.type}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                >
                                    {activity.description}
                                </Typography>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 1, sm: 2 },
                                flexShrink: 0,
                                width: { xs: '100%', sm: 'auto' },
                                justifyContent: { xs: 'space-between', sm: 'flex-end' }
                            }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                    {activity.time}
                                </Typography>
                                <Box
                                    sx={{
                                        px: { xs: 1.5, sm: 2 },
                                        py: 0.5,
                                        borderRadius: '12px',
                                        bgcolor: '#E8F5E9',
                                        color: '#4CAF50',
                                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                        fontWeight: 500,
                                    }}
                                >
                                    {activity.status}
                                </Box>
                            </Box>
                        </Box>
                    )) : (
                        <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                            No recent activities
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};
