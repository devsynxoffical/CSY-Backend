import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Menu,
    MenuItem,
    Card,
    CardContent,
    Grid,
    Tabs,
    Tab,
    TextField,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    Add as AddIcon,
    CardMembership as SubscriptionIcon,
    List as ListIcon,
    Settings as PlansIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { storage } from '../utils/storage';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { subscriptionsAPI } from '../services/api';

interface Subscription {
    id: string;
    businessName: string;
    plan: string;
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    amount: number;
    autoRenew: boolean;
}

const mockSubscriptions: Subscription[] = [
    {
        id: '1',
        businessName: 'The Grand Restaurant',
        plan: 'Premium',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        amount: 99,
        autoRenew: true,
    },
    {
        id: '2',
        businessName: 'City Cafe',
        plan: 'Basic',
        status: 'active',
        startDate: '2024-02-15',
        endDate: '2025-02-15',
        amount: 49,
        autoRenew: true,
    },
    {
        id: '3',
        businessName: 'Health Plus Clinic',
        plan: 'Enterprise',
        status: 'active',
        startDate: '2024-01-20',
        endDate: '2025-01-20',
        amount: 199,
        autoRenew: false,
    },
];

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

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    duration: string;
    features: string[];
    active: boolean;
}

const mockPlans: SubscriptionPlan[] = [
    {
        id: '1',
        name: 'Basic',
        price: 49,
        duration: 'monthly',
        features: ['Up to 100 orders/month', 'Basic analytics', 'Email support'],
        active: true,
    },
    {
        id: '2',
        name: 'Premium',
        price: 99,
        duration: 'monthly',
        features: ['Unlimited orders', 'Advanced analytics', 'Priority support', 'Custom branding'],
        active: true,
    },
    {
        id: '3',
        name: 'Enterprise',
        price: 199,
        duration: 'monthly',
        features: ['Unlimited everything', 'Dedicated support', 'API access', 'Custom integrations'],
        active: true,
    },
];

export const SubscriptionsPage = () => {
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscriptions = async () => {
            try {
                const response = await subscriptionsAPI.getAll();
                if (response.data.success) {
                    setSubscriptions(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch subscriptions:', error);
                setSubscriptions(storage.getSubscriptions(mockSubscriptions));
            } finally {
                setLoading(false);
            }
        };
        fetchSubscriptions();
    }, []);

    // const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => storage.getSubscriptions(mockSubscriptions));
    const [plans, setPlans] = useState<SubscriptionPlan[]>(() => storage.getSubscriptionPlans(mockPlans));
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
    const [addPlanOpen, setAddPlanOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [editPlanOpen, setEditPlanOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [editPlanData, setEditPlanData] = useState<SubscriptionPlan | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        if (location.pathname.includes('/plans')) {
            setTabValue(1);
        } else {
            setTabValue(0);
        }
    }, [location.pathname]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subscriptionId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedSubscriptionId(subscriptionId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedSubscriptionId(null);
    };

    const selectedSubscription = subscriptions.find(s => s.id === selectedSubscriptionId);

    const handleViewDetails = () => {
        setDetailsModalOpen(true);
        handleMenuClose();
    };

    const handleEditSubscription = () => {
        setEditModalOpen(true);
        handleMenuClose();
    };

    const handleToggleAutoRenew = () => {
        if (selectedSubscriptionId) {
            const updatedSubscriptions = subscriptions.map(sub =>
                sub.id === selectedSubscriptionId
                    ? { ...sub, autoRenew: !sub.autoRenew }
                    : sub
            );
            setSubscriptions(updatedSubscriptions);
            storage.setSubscriptions(updatedSubscriptions);
            setSnackbar({ open: true, message: `Auto-renew ${selectedSubscription?.autoRenew ? 'disabled' : 'enabled'} successfully!` });
        }
        handleMenuClose();
    };

    const handleUpgradePlan = () => {
        setUpgradeModalOpen(true);
        handleMenuClose();
    };

    const handleCancelSubscription = () => {
        if (selectedSubscriptionId) {
            setCancelConfirmOpen(true);
            handleMenuClose();
        }
    };

    const handleConfirmCancel = () => {
        if (selectedSubscriptionId) {
            const updatedSubscriptions = subscriptions.map(sub =>
                sub.id === selectedSubscriptionId
                    ? { ...sub, status: 'cancelled' as const }
                    : sub
            );
            setSubscriptions(updatedSubscriptions);
            storage.setSubscriptions(updatedSubscriptions);
            setSnackbar({ open: true, message: 'Subscription cancelled successfully!' });
        }
        setCancelConfirmOpen(false);
        setSelectedSubscriptionId(null);
    };

    const handleUpgradeConfirm = (newPlan: string) => {
        if (selectedSubscriptionId) {
            const updatedSubscriptions = subscriptions.map(sub =>
                sub.id === selectedSubscriptionId
                    ? { ...sub, plan: newPlan }
                    : sub
            );
            setSubscriptions(updatedSubscriptions);
            storage.setSubscriptions(updatedSubscriptions);
            setSnackbar({ open: true, message: `Subscription upgraded to ${newPlan} plan!` });
            setUpgradeModalOpen(false);
        }
    };

    const handleEditPlan = (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (plan) {
            setEditPlanData(plan);
            setSelectedPlanId(planId);
            setEditPlanOpen(true);
        }
    };

    const handleTogglePlanStatus = (planId: string) => {
        const updatedPlans = plans.map(plan =>
            plan.id === planId
                ? { ...plan, active: !plan.active }
                : plan
        );
        setPlans(updatedPlans);
        storage.setSubscriptionPlans(updatedPlans);
        const plan = plans.find(p => p.id === planId);
        setSnackbar({ open: true, message: `Plan ${plan?.active ? 'deactivated' : 'activated'} successfully!` });
    };

    const getStatusColor = (status: string) => {
        if (status === 'active') return 'success';
        if (status === 'cancelled') return 'warning';
        return 'error';
    };

    const getPlanColor = (plan: string) => {
        if (plan === 'Enterprise') return '#9C27B0';
        if (plan === 'Premium') return '#1976D2';
        return '#4CAF50';
    };

    const totalRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + s.amount, 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Subscriptions Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage business subscription plans
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<RefreshIcon />} variant="outlined">
                        Refresh
                    </Button>
                    {tabValue === 0 && (
                        <Button startIcon={<AddIcon />} variant="contained">
                            Add Subscription
                        </Button>
                    )}
                    {tabValue === 1 && (
                        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddPlanOpen(true)}>
                            Add Plan
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper sx={{ borderRadius: '12px' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<ListIcon />} iconPosition="start" label="All Subscriptions" />
                    <Tab icon={<PlansIcon />} iconPosition="start" label="Subscription Plans" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>

                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '12px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Active Subscriptions
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                            {subscriptions.filter(s => s.status === 'active').length}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '12px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Monthly Revenue
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                            ${totalRevenue}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '12px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Expiring Soon
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                            2
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* @ts-expect-error - MUI v7 Grid API change */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ borderRadius: '12px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Auto-Renew Enabled
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                            {subscriptions.filter(s => s.autoRenew).length}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                                        <TableCell>Business</TableCell>
                                        <TableCell>Plan</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Start Date</TableCell>
                                        <TableCell>End Date</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Auto-Renew</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {subscriptions.map((subscription) => (
                                        <TableRow key={subscription.id} hover>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <SubscriptionIcon sx={{ color: getPlanColor(subscription.plan) }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {subscription.businessName}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={subscription.plan}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getPlanColor(subscription.plan),
                                                        color: '#FFFFFF',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={subscription.status}
                                                    color={getStatusColor(subscription.status)}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            </TableCell>
                                            <TableCell>{new Date(subscription.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(subscription.endDate).toLocaleDateString()}</TableCell>
                                            <TableCell>${subscription.amount}/month</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={subscription.autoRenew ? 'Yes' : 'No'}
                                                    color={subscription.autoRenew ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton onClick={(e) => handleMenuOpen(e, subscription.id)}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            {plans.map((plan) => (
                                // @ts-expect-error - MUI v7 Grid API change
                                <Grid item xs={12} md={4} key={plan.id}>
                                    <Card sx={{ borderRadius: '12px', height: '100%', position: 'relative' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                    {plan.name}
                                                </Typography>
                                                <Chip
                                                    label={plan.active ? 'Active' : 'Inactive'}
                                                    color={plan.active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="h4" sx={{ mb: 2 }}>
                                                ${plan.price}
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    /{plan.duration}
                                                </Typography>
                                            </Typography>
                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                {plan.features.map((feature, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">• {feature}</Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    size="small"
                                                    onClick={() => handleEditPlan(plan.id)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    size="small"
                                                    color={plan.active ? 'error' : 'success'}
                                                    onClick={() => handleTogglePlanStatus(plan.id)}
                                                >
                                                    {plan.active ? 'Deactivate' : 'Activate'}
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </TabPanel>
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
                <MenuItem onClick={handleEditSubscription}>Edit Subscription</MenuItem>
                <MenuItem onClick={handleToggleAutoRenew}>
                    {selectedSubscription?.autoRenew ? 'Disable' : 'Enable'} Auto-Renew
                </MenuItem>
                <MenuItem onClick={handleUpgradePlan}>Upgrade Plan</MenuItem>
                <MenuItem onClick={handleCancelSubscription} sx={{ color: 'error.main' }}>
                    Cancel Subscription
                </MenuItem>
            </Menu>

            {/* Add Plan Dialog */}
            <Dialog open={addPlanOpen} onClose={() => setAddPlanOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Subscription Plan</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label="Plan Name" fullWidth required />
                        <TextField label="Price" type="number" fullWidth required />
                        <TextField label="Duration" fullWidth required placeholder="monthly/yearly" />
                        <TextField label="Features (one per line)" multiline rows={4} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddPlanOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            // In a real app, you'd get values from form fields
                            const newPlan: SubscriptionPlan = {
                                id: `plan_${Date.now()}`,
                                name: 'New Plan',
                                price: 0,
                                duration: 'monthly',
                                features: [],
                                active: true,
                            };
                            const updatedPlans = [...plans, newPlan];
                            setPlans(updatedPlans);
                            storage.setSubscriptionPlans(updatedPlans);
                            setAddPlanOpen(false);
                            setSnackbar({ open: true, message: 'Plan added successfully!' });
                        }}
                    >
                        Add Plan
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogContent>
                    {selectedSubscription && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Business Name</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedSubscription.businessName}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Plan</Typography>
                                <Chip
                                    label={selectedSubscription.plan}
                                    size="small"
                                    sx={{
                                        bgcolor: getPlanColor(selectedSubscription.plan),
                                        color: '#FFFFFF',
                                    }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={selectedSubscription.status}
                                    color={getStatusColor(selectedSubscription.status)}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Amount</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>${selectedSubscription.amount}/month</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Start Date</Typography>
                                <Typography variant="body1">{new Date(selectedSubscription.startDate).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">End Date</Typography>
                                <Typography variant="body1">{new Date(selectedSubscription.endDate).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Auto-Renew</Typography>
                                <Chip
                                    label={selectedSubscription.autoRenew ? 'Yes' : 'No'}
                                    color={selectedSubscription.autoRenew ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Subscription Modal */}
            <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Subscription</DialogTitle>
                <DialogContent>
                    {selectedSubscription && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Business Name"
                                fullWidth
                                value={selectedSubscription.businessName}
                                disabled
                            />
                            <FormControl fullWidth>
                                <InputLabel>Plan</InputLabel>
                                <Select
                                    label="Plan"
                                    value={selectedSubscription.plan}
                                    onChange={(e) => {
                                        const updatedSubscriptions = subscriptions.map(sub =>
                                            sub.id === selectedSubscriptionId
                                                ? { ...sub, plan: e.target.value }
                                                : sub
                                        );
                                        setSubscriptions(updatedSubscriptions);
                                    }}
                                >
                                    <MenuItem value="Basic">Basic</MenuItem>
                                    <MenuItem value="Premium">Premium</MenuItem>
                                    <MenuItem value="Enterprise">Enterprise</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={selectedSubscription.status}
                                    onChange={(e) => {
                                        const updatedSubscriptions = subscriptions.map(sub =>
                                            sub.id === selectedSubscriptionId
                                                ? { ...sub, status: e.target.value as any }
                                                : sub
                                        );
                                        setSubscriptions(updatedSubscriptions);
                                    }}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="expired">Expired</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Amount (per month)"
                                type="number"
                                fullWidth
                                value={selectedSubscription.amount}
                                onChange={(e) => {
                                    const updatedSubscriptions = subscriptions.map(sub =>
                                        sub.id === selectedSubscriptionId
                                            ? { ...sub, amount: parseFloat(e.target.value) || 0 }
                                            : sub
                                    );
                                    setSubscriptions(updatedSubscriptions);
                                }}
                            />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            storage.setSubscriptions(subscriptions);
                            setEditModalOpen(false);
                            setSnackbar({ open: true, message: 'Subscription updated successfully!' });
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upgrade Plan Modal */}
            <Dialog open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upgrade Subscription Plan</DialogTitle>
                <DialogContent>
                    {selectedSubscription && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Current Plan: <strong>{selectedSubscription.plan}</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Select a new plan to upgrade:
                            </Typography>
                            {plans
                                .filter(plan => plan.name !== selectedSubscription.plan)
                                .map((plan) => (
                                    <Card
                                        key={plan.id}
                                        sx={{
                                            p: 2,
                                            cursor: 'pointer',
                                            border: '2px solid transparent',
                                            '&:hover': { border: '2px solid #1976D2' },
                                        }}
                                        onClick={() => handleUpgradeConfirm(plan.name)}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="h6">{plan.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ${plan.price}/{plan.duration}
                                                </Typography>
                                            </Box>
                                            <Button variant="outlined" size="small">
                                                Select
                                            </Button>
                                        </Box>
                                    </Card>
                                ))}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUpgradeModalOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Subscription Confirmation Dialog */}
            <ConfirmDialog
                open={cancelConfirmOpen}
                title="Cancel Subscription"
                message={`Are you sure you want to cancel the subscription for ${selectedSubscription?.businessName}? This action cannot be undone.`}
                confirmText="Cancel Subscription"
                cancelText="Keep Subscription"
                confirmColor="error"
                onConfirm={handleConfirmCancel}
                onCancel={() => {
                    setCancelConfirmOpen(false);
                    setSelectedSubscriptionId(null);
                }}
            />

            {/* Edit Plan Dialog */}
            <Dialog open={editPlanOpen} onClose={() => {
                setEditPlanOpen(false);
                setEditPlanData(null);
                setSelectedPlanId(null);
            }} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Subscription Plan</DialogTitle>
                <DialogContent>
                    {editPlanData && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Plan Name"
                                fullWidth
                                value={editPlanData.name}
                                onChange={(e) => setEditPlanData({ ...editPlanData, name: e.target.value })}
                                required
                            />
                            <TextField
                                label="Price"
                                type="number"
                                fullWidth
                                value={editPlanData.price}
                                onChange={(e) => setEditPlanData({ ...editPlanData, price: parseFloat(e.target.value) || 0 })}
                                required
                            />
                            <FormControl fullWidth>
                                <InputLabel>Duration</InputLabel>
                                <Select
                                    value={editPlanData.duration}
                                    label="Duration"
                                    onChange={(e) => setEditPlanData({ ...editPlanData, duration: e.target.value })}
                                >
                                    <MenuItem value="monthly">Monthly</MenuItem>
                                    <MenuItem value="yearly">Yearly</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Features (one per line)"
                                multiline
                                rows={4}
                                fullWidth
                                value={editPlanData.features.join('\n')}
                                onChange={(e) => setEditPlanData({
                                    ...editPlanData,
                                    features: e.target.value.split('\n').filter(f => f.trim())
                                })}
                                placeholder="Up to 100 orders/month&#10;Basic analytics&#10;Email support"
                            />
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={editPlanData.active ? 'active' : 'inactive'}
                                    label="Status"
                                    onChange={(e) => setEditPlanData({
                                        ...editPlanData,
                                        active: e.target.value === 'active'
                                    })}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditPlanOpen(false);
                        setEditPlanData(null);
                        setSelectedPlanId(null);
                    }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (editPlanData && selectedPlanId) {
                                const updatedPlans = plans.map(plan =>
                                    plan.id === selectedPlanId ? editPlanData : plan
                                );
                                setPlans(updatedPlans);
                                storage.setSubscriptionPlans(updatedPlans);
                                setEditPlanOpen(false);
                                setEditPlanData(null);
                                setSelectedPlanId(null);
                                setSnackbar({ open: true, message: 'Plan updated successfully!' });
                            }
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};
