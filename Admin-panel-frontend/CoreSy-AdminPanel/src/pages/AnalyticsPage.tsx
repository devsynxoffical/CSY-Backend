import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
} from '@mui/material';
import {
    TrendingUp,
    People,
    AttachMoney,
    ShoppingCart,
    Assessment as OverviewIcon,
    Receipt as RevenueIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const revenueByMonth = [
    { month: 'Jan', revenue: 45000, orders: 320 },
    { month: 'Feb', revenue: 52000, orders: 380 },
    { month: 'Mar', revenue: 48000, orders: 350 },
    { month: 'Apr', revenue: 61000, orders: 420 },
    { month: 'May', revenue: 55000, orders: 390 },
    { month: 'Jun', revenue: 67000, orders: 450 },
];

const userGrowth = [
    { month: 'Jan', users: 8000, businesses: 800, drivers: 350 },
    { month: 'Feb', users: 9200, businesses: 920, drivers: 410 },
    { month: 'Mar', users: 9800, businesses: 980, drivers: 440 },
    { month: 'Apr', users: 11000, businesses: 1100, drivers: 480 },
    { month: 'May', users: 11800, businesses: 1180, drivers: 510 },
    { month: 'Jun', users: 12543, businesses: 1234, drivers: 545 },
];

const appDistribution = [
    { name: 'Pass', value: 45, color: '#1976D2' },
    { name: 'Care', value: 30, color: '#9C27B0' },
    { name: 'Go', value: 25, color: '#FF9800' },
];

const StatCard = ({ title, value, change, icon, color }: any) => (
    <Card sx={{ borderRadius: '12px' }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                        {value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: change >= 0 ? '#4CAF50' : '#F44336' }}>
                        <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">
                            {change >= 0 ? '+' : ''}{change}% vs last period
                        </Typography>
                    </Box>
                </Box>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        backgroundColor: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

export const AnalyticsPage = () => {
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [period, setPeriod] = useState('6months');

    useEffect(() => {
        if (location.pathname.includes('/overview')) {
            setTabValue(0);
        } else if (location.pathname.includes('/revenue')) {
            setTabValue(1);
        }
    }, [location.pathname]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Analytics & Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Detailed platform analytics and insights
                    </Typography>
                </Box>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Time Period</InputLabel>
                    <Select value={period} label="Time Period" onChange={(e) => setPeriod(e.target.value)}>
                        <MenuItem value="7days">Last 7 Days</MenuItem>
                        <MenuItem value="30days">Last 30 Days</MenuItem>
                        <MenuItem value="6months">Last 6 Months</MenuItem>
                        <MenuItem value="1year">Last Year</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Paper sx={{ borderRadius: '12px', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<OverviewIcon />} iconPosition="start" label="Platform Overview" />
                    <Tab icon={<RevenueIcon />} iconPosition="start" label="Revenue Reports" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Revenue"
                                    value="$328,000"
                                    change={15.2}
                                    icon={<AttachMoney sx={{ fontSize: 32 }} />}
                                    color="#4CAF50"
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Orders"
                                    value="2,310"
                                    change={12.5}
                                    icon={<ShoppingCart sx={{ fontSize: 32 }} />}
                                    color="#1976D2"
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Active Users"
                                    value="12,543"
                                    change={8.3}
                                    icon={<People sx={{ fontSize: 32 }} />}
                                    color="#9C27B0"
                                />
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Avg Order Value"
                                    value="$142"
                                    change={5.1}
                                    icon={<TrendingUp sx={{ fontSize: 32 }} />}
                                    color="#FF9800"
                                />
                            </Grid>

                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Revenue & Orders Trend
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={revenueByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="revenue" fill="#1976D2" name="Revenue ($)" />
                                            <Bar yAxisId="right" dataKey="orders" fill="#4CAF50" name="Orders" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>

                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        App Distribution
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={appDistribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {appDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>

                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        User Growth by Category
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="users" stroke="#1976D2" strokeWidth={2} name="Users" />
                                            <Line type="monotone" dataKey="businesses" stroke="#9C27B0" strokeWidth={2} name="Businesses" />
                                            <Line type="monotone" dataKey="drivers" stroke="#FF9800" strokeWidth={2} name="Drivers" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 500 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Revenue Breakdown by Month
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart data={revenueByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="#1976D2" name="Revenue ($)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Revenue Trend
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={revenueByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} name="Revenue ($)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, borderRadius: '12px', height: 400 }}>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Orders vs Revenue
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={revenueByMonth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="revenue" fill="#1976D2" name="Revenue ($)" />
                                            <Bar yAxisId="right" dataKey="orders" fill="#4CAF50" name="Orders" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>
            </Paper>
        </Box>
    );
};
