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
    Avatar,
    Menu,
    MenuItem,
    TextField,
    Select,
    FormControl,
    InputLabel,
    Stack,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Grid,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    FileDownload as FileDownloadIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    LocalShipping as DriverIcon,
    TwoWheeler as MotorcycleIcon,
    DirectionsCar as CarIcon,
    LocalShipping as VanIcon,
} from '@mui/icons-material';
import type { Driver } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { driversAPI } from '../services/api';
import { DriverDetailsModal } from '../components/modals/DriverDetailsModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';

const mapDriver = (data: any): Driver => ({
    id: data.id,
    name: data.full_name || 'Unknown',
    email: data.email,
    phone: data.phone,
    vehicleType: (data.vehicle_type || 'Motorcycle') as any, // Simple cast, default to Motorcycle
    status: data.is_active ? 'active' : 'inactive',
    availability: data.is_available ? 'active' : 'offline', // Simplified mapping, assuming 'active' means available for now based on schema
    rating: Number(data.rating_average) || 0,
    totalDeliveries: 0, // Not provided by list endpoint currently
    earnings: (Number(data.earnings_cash) || 0) + (Number(data.earnings_online) || 0),
});

export const DriversPage = () => {
    const { status } = useParams<{ status: string }>();
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [addDriverOpen, setAddDriverOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const [newDriver, setNewDriver] = useState({ name: '', email: '', phone: '', vehicleType: 'Motorcycle' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editDriverOpen, setEditDriverOpen] = useState(false);
    const [editDriverData, setEditDriverData] = useState<Driver | null>(null);
    const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
    const [earningsModalOpen, setEarningsModalOpen] = useState(false);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await driversAPI.getAll();
            if (response.data.success) {
                const mapped = response.data.data.map(mapDriver);
                setDrivers(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch drivers:', err);
            setError('Failed to load drivers.');
        } finally {
            setLoading(false);
        }
    };

    // Sync URL param with filter state
    useEffect(() => {
        if (status === 'available') {
            setAvailabilityFilter('available');
            setStatusFilter('all');
            setShowFilters(true);
        } else if (status === 'performance') {
            // For performance route, we'll show a different view
            setStatusFilter('all');
            setAvailabilityFilter('all');
            setShowFilters(true);
        } else if (status) {
            setStatusFilter(status);
            setShowFilters(true);
        } else {
            setStatusFilter('all');
            setAvailabilityFilter('all');
        }
        fetchDrivers();
    }, [status]);


    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, driverId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedDriverId(driverId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedDriverId(null);
    };

    const closeMenuOnly = () => {
        setAnchorEl(null);
    };

    const handleToggleStatus = async () => {
        if (selectedDriverId) {
            const driver = drivers.find(d => d.id === selectedDriverId);
            if (!driver) return;

            const newStatus = driver.status === 'active' ? false : true;

            try {
                await driversAPI.toggleStatus(selectedDriverId, { is_active: newStatus });
                const updatedDrivers = drivers.map(d =>
                    d.id === selectedDriverId
                        ? { ...d, status: (newStatus ? 'active' : 'inactive') as 'active' | 'inactive' }
                        : d
                );
                setDrivers(updatedDrivers);
                setSnackbar({ open: true, message: 'Driver status updated successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to update status' });
            }
            closeMenuOnly();
        }
    };

    const handleDeleteDriver = () => {
        if (selectedDriverId) {
            setDeleteConfirmOpen(true);
            closeMenuOnly();
        }
    };

    const handleConfirmDelete = async () => {
        const driverIdToDelete = selectedDriverId;
        if (driverIdToDelete) {
            try {
                await driversAPI.delete(driverIdToDelete);
                const updatedDrivers = drivers.filter(driver => driver.id !== driverIdToDelete);
                setDrivers(updatedDrivers);
                setSnackbar({ open: true, message: 'Driver deleted successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to delete driver' });
            }
        }
        setDeleteConfirmOpen(false);
        setSelectedDriverId(null);
    };

    const handleViewDetails = () => {
        if (selectedDriverId) {
            const driver = drivers.find(d => d.id === selectedDriverId);
            if (driver) {
                setSelectedDriver(driver);
                setDetailsModalOpen(true);
            }
        }
        closeMenuOnly();
    };

    const handleEditDriver = () => {
        if (selectedDriverId) {
            const driver = drivers.find(d => d.id === selectedDriverId);
            if (driver) {
                setEditDriverData(driver);
                setEditDriverOpen(true);
            }
        }
        closeMenuOnly();
    };

    const handlePerformanceReport = () => {
        if (selectedDriverId) {
            setPerformanceModalOpen(true);
            closeMenuOnly();
        } else {
            closeMenuOnly();
        }
    };

    const handleViewEarnings = () => {
        if (selectedDriverId) {
            setEarningsModalOpen(true);
            closeMenuOnly();
        } else {
            closeMenuOnly();
        }
    };

    const handleRefresh = () => {
        fetchDrivers();
        setSnackbar({ open: true, message: 'Refreshing data...' });
    };

    const handleExportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Vehicle Type', 'Status', 'Availability', 'Rating', 'Deliveries', 'Earnings'];
        const csvContent = [
            headers.join(','),
            ...filteredDrivers.map(driver => [
                `"${driver.name}"`,
                driver.email,
                driver.phone,
                driver.vehicleType,
                driver.status,
                driver.availability,
                driver.rating,
                driver.totalDeliveries,
                driver.earnings
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drivers_export.csv';
        a.click();
        URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: 'CSV exported successfully!' });
    };

    const getStatusColor = (status: string) => {
        return status === 'active' ? 'success' : 'error';
    };

    const getAvailabilityColor = (availability: string) => {
        if (availability === 'available' || availability === 'active') return 'success';
        if (availability === 'busy') return 'warning';
        return 'default';
    };

    const getVehicleIcon = (vehicleType: string) => {
        if (vehicleType === 'Motorcycle') return <MotorcycleIcon />;
        if (vehicleType === 'Car') return <CarIcon />;
        return <VanIcon />;
    };

    const filteredDrivers = drivers.filter((driver) => {
        const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
        const matchesAvailability = availabilityFilter === 'all' || driver.availability === availabilityFilter;
        const matchesVehicleType = vehicleTypeFilter === 'all' || driver.vehicleType === vehicleTypeFilter;

        return matchesSearch && matchesStatus && matchesAvailability && matchesVehicleType;
    });

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
                        {status === 'performance' ? 'Driver Performance Reports' : status === 'available' ? 'Available Drivers' : 'Driver Management'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {status === 'performance' ? 'View driver performance metrics and analytics' : status === 'available' ? 'View all available drivers' : 'Manage all platform drivers'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleRefresh}>
                        Refresh
                    </Button>
                    <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExportCSV}>
                        Export CSV
                    </Button>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddDriverOpen(true)}>
                        Add Driver
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
                        <TextField
                            fullWidth
                            label="Search"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Availability</InputLabel>
                            <Select
                                value={availabilityFilter}
                                label="Availability"
                                onChange={(e) => setAvailabilityFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="available">Available</MenuItem>
                                <MenuItem value="busy">Busy</MenuItem>
                                <MenuItem value="offline">Offline</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Vehicle Type</InputLabel>
                            <Select
                                value={vehicleTypeFilter}
                                label="Vehicle Type"
                                onChange={(e) => setVehicleTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                                <MenuItem value="Car">Car</MenuItem>
                                <MenuItem value="Van">Van</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            sx={{ minWidth: '120px' }}
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setAvailabilityFilter('all');
                                setVehicleTypeFilter('all');
                            }}
                        >
                            Clear Filters
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
                                <TableCell>Driver</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Vehicle Type</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Availability</TableCell>
                                <TableCell>Rating</TableCell>
                                <TableCell>Deliveries</TableCell>
                                <TableCell>Earnings</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDrivers.length > 0 ? filteredDrivers.map((driver) => (
                                <TableRow key={driver.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: '#FF9800' }}>
                                                <DriverIcon />
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {driver.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{driver.email}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{driver.phone}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getVehicleIcon(driver.vehicleType)}
                                            <Typography variant="body2">{driver.vehicleType}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={driver.status}
                                            color={getStatusColor(driver.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={driver.availability}
                                            color={getAvailabilityColor(driver.availability)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>⭐ {driver.rating.toFixed(1)}</TableCell>
                                    <TableCell>{driver.totalDeliveries.toLocaleString()}</TableCell>
                                    <TableCell>${driver.earnings.toLocaleString()}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => handleMenuOpen(e, driver.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No drivers found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredDrivers.length} of {drivers.length} drivers
                </Typography>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
                <MenuItem onClick={handleEditDriver}>Edit Driver</MenuItem>
                <MenuItem onClick={handlePerformanceReport}>Performance Report</MenuItem>
                <MenuItem onClick={handleViewEarnings}>View Earnings</MenuItem>
                <MenuItem onClick={handleToggleStatus}>Toggle Status</MenuItem>
                <MenuItem onClick={handleDeleteDriver} sx={{ color: 'error.main' }}>
                    Delete Driver
                </MenuItem>
            </Menu>

            <DriverDetailsModal
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedDriver(null);
                }}
                driver={selectedDriver}
                onEdit={() => {
                    if (selectedDriver) {
                        setEditDriverData(selectedDriver);
                        setEditDriverOpen(true);
                        setDetailsModalOpen(false);
                        setSelectedDriver(null);
                    }
                }}
            />

            {/* Add Driver Dialog */}
            <Dialog open={addDriverOpen} onClose={() => setAddDriverOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Driver Name"
                            fullWidth
                            required
                            value={newDriver.name}
                            onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            value={newDriver.email}
                            onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
                        />
                        <TextField
                            label="Phone"
                            fullWidth
                            required
                            value={newDriver.phone}
                            onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Vehicle Type</InputLabel>
                            <Select
                                label="Vehicle Type"
                                value={newDriver.vehicleType}
                                onChange={(e) => setNewDriver({ ...newDriver, vehicleType: e.target.value })}
                            >
                                <MenuItem value="Motorcycle">Motorcycle</MenuItem>
                                <MenuItem value="Car">Car</MenuItem>
                                <MenuItem value="Van">Van</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setAddDriverOpen(false);
                        setNewDriver({ name: '', email: '', phone: '', vehicleType: 'Motorcycle' });
                    }}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        setSnackbar({ open: true, message: 'Add Driver not implemented in demo' });
                        setAddDriverOpen(false);
                    }}>
                        Add Driver
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Driver Dialog */}
            <Dialog open={editDriverOpen} onClose={() => {
                setEditDriverOpen(false);
                setEditDriverData(null);
            }} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Driver</DialogTitle>
                <DialogContent>
                    {editDriverData && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Driver Name"
                                fullWidth
                                value={editDriverData.name}
                                onChange={(e) => setEditDriverData({ ...editDriverData, name: e.target.value })}
                                required
                            />
                            {/* ... Fields ... */}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditDriverOpen(false);
                        setEditDriverData(null);
                    }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSnackbar({ open: true, message: 'Edit Driver not implemented in demo' });
                            setEditDriverOpen(false);
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Performance Report Modal */}
            <Dialog open={performanceModalOpen} onClose={() => {
                setPerformanceModalOpen(false);
                setSelectedDriverId(null);
            }} maxWidth="md" fullWidth>
                <DialogTitle>Driver Performance Report</DialogTitle>
                <DialogContent>
                    {selectedDriverId && (() => {
                        const driver = drivers.find(d => d.id === selectedDriverId);
                        if (!driver) return null;
                        return (
                            <Stack spacing={3} sx={{ mt: 1 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>{driver.name}</Typography>
                                    <Grid container spacing={2}>
                                        {/* @ts-expect-error - MUI v7 Grid API change */}
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="body2" color="text.secondary">Total Deliveries</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 600 }}>{driver.totalDeliveries.toLocaleString()}</Typography>
                                            </Paper>
                                        </Grid>
                                        {/* @ts-expect-error - MUI v7 Grid API change */}
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 600 }}>⭐ {driver.rating.toFixed(1)}</Typography>
                                            </Paper>
                                        </Grid>
                                        {/* @ts-expect-error - MUI v7 Grid API change */}
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                                                <Typography variant="h4" sx={{ fontWeight: 600 }}>${driver.earnings.toLocaleString()}</Typography>
                                            </Paper>
                                        </Grid>
                                        {/* @ts-expect-error - MUI v7 Grid API change */}
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
                                                <Typography variant="body2" color="text.secondary">Status</Typography>
                                                <Chip
                                                    label={driver.status}
                                                    color={driver.status === 'active' ? 'success' : 'error'}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize', mt: 1 }}
                                                />
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Stack>
                        );
                    })()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setPerformanceModalOpen(false);
                        setSelectedDriverId(null);
                    }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* View Earnings Modal */}
            <Dialog open={earningsModalOpen} onClose={() => {
                setEarningsModalOpen(false);
                setSelectedDriverId(null);
            }} maxWidth="sm" fullWidth>
                <DialogTitle>Driver Earnings</DialogTitle>
                <DialogContent>
                    {selectedDriverId && (() => {
                        const driver = drivers.find(d => d.id === selectedDriverId);
                        if (!driver) return null;
                        return (
                            <Stack spacing={3} sx={{ mt: 1 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>{driver.name}</Typography>
                                    <Paper sx={{ p: 3, borderRadius: '12px', bgcolor: '#f5f5f5' }}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>Total Earnings</Typography>
                                        <Typography variant="h3" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                                            ${driver.earnings.toLocaleString()}
                                        </Typography>
                                    </Paper>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Total Deliveries</Typography>
                                    <Typography variant="h6">{driver.totalDeliveries.toLocaleString()} deliveries</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Average per Delivery</Typography>
                                    <Typography variant="h6">
                                        ${driver.totalDeliveries > 0 ? (driver.earnings / driver.totalDeliveries).toFixed(2) : '0.00'}
                                    </Typography>
                                </Box>
                            </Stack>
                        );
                    })()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEarningsModalOpen(false);
                        setSelectedDriverId(null);
                    }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete Driver"
                message={`Are you sure you want to delete this driver? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedDriverId(null);
                }}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};
