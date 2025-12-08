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
    Button,
    Menu,
    MenuItem,
    TextField,
    Select,
    FormControl,
    InputLabel,
    Stack,
    Collapse,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

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

export const BookingsPage = () => {
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (location.pathname.includes('/reservations')) {
            setTabValue(0);
        } else if (location.pathname.includes('/orders')) {
            setTabValue(1);
        }
    }, [location.pathname]);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Bookings Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage reservations and orders
                    </Typography>
                </Box>
                <Button startIcon={<RefreshIcon />} variant="outlined">
                    Refresh
                </Button>
            </Box>

            <Paper sx={{ borderRadius: '12px' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Reservations (Pass)" />
                    <Tab label="Orders (Go)" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 2 }}>
                        <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
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
                                    <TextField fullWidth label="Search" placeholder="Search by ID or customer..." />
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            label="Status"
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="all">All</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="confirmed">Confirmed</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button variant="outlined" sx={{ minWidth: '120px' }}>
                                        Clear
                                    </Button>
                                </Stack>
                            </Collapse>
                        </Paper>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                                        <TableCell>Reservation ID</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Business</TableCell>
                                        <TableCell>Date & Time</TableCell>
                                        <TableCell>Guests</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                                No reservations found. Connect to API to load data.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 2 }}>
                        <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
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
                                    <TextField fullWidth label="Search" placeholder="Search by order ID..." />
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            label="Status"
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="all">All</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="preparing">Preparing</MenuItem>
                                            <MenuItem value="ready">Ready</MenuItem>
                                            <MenuItem value="delivered">Delivered</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button variant="outlined" sx={{ minWidth: '120px' }}>
                                        Clear
                                    </Button>
                                </Stack>
                            </Collapse>
                        </Paper>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                                        <TableCell>Order ID</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Store</TableCell>
                                        <TableCell>Driver</TableCell>
                                        <TableCell>Items</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                                No orders found. Connect to API to load data.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </TabPanel>
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
                <MenuItem onClick={handleMenuClose}>Update Status</MenuItem>
                <MenuItem onClick={handleMenuClose}>Contact Customer</MenuItem>
                <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
                    Cancel Booking
                </MenuItem>
            </Menu>
        </Box>
    );
};
