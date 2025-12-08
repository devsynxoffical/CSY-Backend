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
    TextField,
    Select,
    FormControl,
    InputLabel,
    Stack,
    Collapse,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    FileDownload as FileDownloadIcon,
    FilterList as FilterListIcon,
    Payment as PaymentIcon,
    Receipt as ReceiptIcon,
} from '@mui/icons-material';
import type { Transaction } from '../types';
import { PayoutModal, RefundModal } from '../components/modals/TransactionModals';
import { useLocation } from 'react-router-dom';
import { transactionsAPI } from '../services/api';

const mapTransaction = (data: any): Transaction => ({
    id: data.id,
    date: data.created_at,
    type: data.transaction_type,
    user: data.user?.full_name || data.business?.business_name || data.driver?.full_name || 'Unknown',
    amount: Number(data.amount),
    paymentMethod: data.payment_method,
    status: data.status,
    reference: data.reference_id || 'N/A'
});

export const TransactionsPage = () => {
    const location = useLocation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

    // Search & Pagination could be added, currently just filtering loaded list or fetching with params
    // For simplicity in this step, fetching all and filtering locally or fetching with params 
    // Since backend supports params, let's try to use them or just fetch all for now and filter. 
    // Backend supports filters: type, status, paymentMethod.

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (typeFilter !== 'all') params.type = typeFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (paymentMethodFilter !== 'all') params.paymentMethod = paymentMethodFilter;

            const response = await transactionsAPI.getAll(params);
            if (response.data.success) {
                const mapped = response.data.data.map(mapTransaction);
                setTransactions(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transactions.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.pathname.includes('/payouts')) {
            setTypeFilter('payout');
            setShowFilters(true);
        } else if (location.pathname.includes('/refunds')) {
            setTypeFilter('refund');
            setShowFilters(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter, statusFilter, paymentMethodFilter]);

    // Modal State
    const [openPayout, setOpenPayout] = useState(false);
    const [openRefund, setOpenRefund] = useState(false);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>(undefined);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, txnId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedTransactionId(txnId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTransactionId(undefined);
    };

    const handleOpenRefund = () => {
        setOpenRefund(true);
        handleMenuClose();
    };

    const getTypeColor = (type: string) => {
        if (type === 'payment') return 'primary';
        if (type === 'refund') return 'warning';
        if (type === 'payout') return 'success';
        return 'secondary';
    };

    const getStatusColor = (status: string) => {
        if (status === 'completed') return 'success';
        if (status === 'pending') return 'warning';
        if (status === 'failed') return 'error';
        return 'secondary';
    };

    const handleRefresh = () => {
        fetchTransactions();
    };

    return (
        <Box>
            {error && (
                <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        {location.pathname.includes('/payouts') ? 'Pending Payouts' : location.pathname.includes('/refunds') ? 'Refund Requests' : 'Payments & Transactions'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {location.pathname.includes('/payouts') ? 'Manage driver and business payouts' : location.pathname.includes('/refunds') ? 'Process and manage refund requests' : 'Manage all platform transactions'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<PaymentIcon />}
                        variant="contained"
                        color="success"
                        onClick={() => setOpenPayout(true)}
                    >
                        Process Payout
                    </Button>
                    <Button
                        startIcon={<ReceiptIcon />}
                        variant="contained"
                        color="warning"
                        onClick={() => setOpenRefund(true)}
                    >
                        Process Refund
                    </Button>
                    <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleRefresh}>
                        Refresh
                    </Button>
                    <Button startIcon={<FileDownloadIcon />} variant="outlined">
                        Export CSV
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ p: 2, mb: 2, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon /> Filters
                    </Typography>
                    <Button onClick={() => setShowFilters(!showFilters)}>
                        {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                </Box>

                <Collapse in={showFilters}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                        <TextField fullWidth label="Search" placeholder="Search by transaction ID..." />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="payment">Payment</MenuItem>
                                <MenuItem value="refund">Refund</MenuItem>
                                <MenuItem value="earnings">Earnings/Payouts</MenuItem>
                                <MenuItem value="wallet-topup">Wallet Top-up</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                                <MenuItem value="refunded">Refunded</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={paymentMethodFilter}
                                label="Payment Method"
                                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="cash">Cash</MenuItem>
                                <MenuItem value="card">Card</MenuItem>
                                <MenuItem value="wallet">Wallet</MenuItem>
                                <MenuItem value="chamcash">ChamCash</MenuItem>
                                <MenuItem value="ecash">eCash</MenuItem>
                            </Select>
                        </FormControl>
                        <Button variant="outlined" sx={{ minWidth: '120px' }} onClick={() => {
                            setTypeFilter('all');
                            setStatusFilter('all');
                            setPaymentMethodFilter('all');
                        }}>
                            Clear
                        </Button>
                    </Stack>
                </Collapse>
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && (
                <TableContainer component={Paper} sx={{ borderRadius: '12px' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                                <TableCell>Transaction ID</TableCell>
                                <TableCell>Date & Time</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>User/Business</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Payment Method</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Reference</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center">
                                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                            No transactions found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((txn) => (
                                    <TableRow key={txn.id} hover>
                                        <TableCell>{txn.id}</TableCell>
                                        <TableCell>{new Date(txn.date).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={txn.type}
                                                color={getTypeColor(txn.type) as any}
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>{txn.user}</TableCell>
                                        <TableCell>${txn.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Chip label={txn.paymentMethod} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={txn.status}
                                                color={getStatusColor(txn.status) as any}
                                                size="small"
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell>{txn.reference}</TableCell>
                                        <TableCell align="center">
                                            <IconButton onClick={(e) => handleMenuOpen(e, txn.id)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {transactions.length} transactions
                </Typography>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
                <MenuItem onClick={handleOpenRefund}>Process Refund</MenuItem>
                <MenuItem onClick={handleMenuClose}>Download Receipt</MenuItem>
            </Menu>

            {/* Modals */}
            <PayoutModal
                open={openPayout}
                onClose={() => setOpenPayout(false)}
            />
            <RefundModal
                open={openRefund}
                onClose={() => setOpenRefund(false)}
                transactionId={selectedTransactionId}
            />
        </Box>
    );
};
