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
    Rating,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Refresh as RefreshIcon,
    FileDownload as FileDownloadIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import type { Business } from '../types';
import { businessesAPI } from '../services/api';
import { BusinessDetailsModal } from '../components/modals/BusinessDetailsModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { useParams, useNavigate } from 'react-router-dom';

// Helper to capitalize first letter
const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

// Mapper
const mapBusiness = (data: any): Business => ({
    id: data.id,
    name: data.business_name || 'Unknown',
    ownerEmail: data.owner_email,
    type: capitalize(data.business_type) as any,
    appType: capitalize(data.app_type) as any,
    city: data.city || data.address || 'Unknown',
    rating: Number(data.rating_average) || 0,
    status: (data.is_active ? 'active' : 'inactive') as 'active' | 'inactive' | 'pending',
    createdDate: data.created_at,
});

export const BusinessesPage = () => {
    const { status } = useParams<{ status: string }>();
    const navigate = useNavigate();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [appTypeFilter, setAppTypeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [addBusinessOpen, setAddBusinessOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const [newBusiness, setNewBusiness] = useState({ name: '', ownerEmail: '', type: 'Restaurant', appType: 'Pass', city: '' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editBusinessOpen, setEditBusinessOpen] = useState(false);
    const [editBusinessData, setEditBusinessData] = useState<Business | null>(null);

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const response = await businessesAPI.getAll();
            if (response.data.success) {
                const mapped = response.data.data.map(mapBusiness);
                setBusinesses(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch businesses:', err);
            setError('Failed to load businesses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status) {
            setStatusFilter(status);
            setShowFilters(true);
        } else {
            setStatusFilter('all');
        }
        fetchBusinesses();
    }, [status]);


    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, businessId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedBusinessId(businessId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedBusinessId(null);
    };

    // For actions that need to keep ID briefly (like opening a modal), we set ID back or just don't clear it immediately?
    // Actually simpler to just close menu (setAnchorEl null) but keep ID, then clear ID when modal closes.
    // modifying specific handlers to do this.
    const closeMenuOnly = () => {
        setAnchorEl(null);
    };

    const handleToggleStatus = async () => {
        if (selectedBusinessId) {
            const business = businesses.find(b => b.id === selectedBusinessId);
            if (!business) return;

            const newStatus = business.status === 'active' ? false : true;

            try {
                await businessesAPI.updateStatus(selectedBusinessId, { is_active: newStatus });
                // Optimistic update
                const updatedBusinesses = businesses.map(b =>
                    b.id === selectedBusinessId
                        ? { ...b, status: (newStatus ? 'active' : 'inactive') as 'active' | 'inactive' | 'pending' }
                        : b
                );
                setBusinesses(updatedBusinesses);
                setSnackbar({ open: true, message: 'Business status updated successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to update status' });
            }
            closeMenuOnly();
        }
    };

    const handleApprove = async () => {
        if (selectedBusinessId) {
            try {
                await businessesAPI.updateStatus(selectedBusinessId, { is_active: true });
                const updatedBusinesses = businesses.map(b =>
                    b.id === selectedBusinessId
                        ? { ...b, status: 'active' as 'active' | 'inactive' | 'pending' }
                        : b
                );
                setBusinesses(updatedBusinesses);
                setSnackbar({ open: true, message: 'Business approved/activated!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to approve' });
            }
            closeMenuOnly();
        }
    };

    const handleDeleteBusiness = () => {
        if (selectedBusinessId) {
            setDeleteConfirmOpen(true);
            closeMenuOnly();
        }
    };

    const handleConfirmDelete = async () => {
        const businessIdToDelete = selectedBusinessId;
        if (businessIdToDelete) {
            try {
                await businessesAPI.delete(businessIdToDelete);
                const updatedBusinesses = businesses.filter(business => business.id !== businessIdToDelete);
                setBusinesses(updatedBusinesses);
                setSnackbar({ open: true, message: 'Business deleted successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to delete business' });
            }
        }
        setDeleteConfirmOpen(false);
        setSelectedBusinessId(null);
    };

    const handleViewDetails = () => {
        if (selectedBusinessId) {
            const business = businesses.find(b => b.id === selectedBusinessId);
            if (business) {
                setSelectedBusiness(business);
                setDetailsModalOpen(true);
            }
        }
        closeMenuOnly();
    };

    const handleEditBusiness = () => {
        if (selectedBusinessId) {
            const business = businesses.find(b => b.id === selectedBusinessId);
            if (business) {
                setEditBusinessData(business);
                setEditBusinessOpen(true);
            }
        }
        closeMenuOnly();
    };

    const handleViewAnalytics = () => {
        if (selectedBusinessId) {
            navigate(`/transactions?business=${selectedBusinessId}`);
        }
        closeMenuOnly();
    };

    const handleRefresh = () => {
        fetchBusinesses();
        setSnackbar({ open: true, message: 'Refreshing data...' });
    };

    const handleExportCSV = () => {
        // Simple CSV export logic from current data
        const headers = ['Name', 'Owner Email', 'Type', 'App Type', 'City', 'Rating', 'Status', 'Created Date'];
        const csvContent = [
            headers.join(','),
            ...filteredBusinesses.map(business => [
                `"${business.name}"`,
                business.ownerEmail,
                business.type,
                business.appType,
                business.city,
                business.rating,
                business.status,
                new Date(business.createdDate).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'businesses_export.csv';
        a.click();
        URL.revokeObjectURL(url);
        setSnackbar({ open: true, message: 'CSV exported successfully!' });
    };

    // handleExportExcel removed as unused

    const getStatusColor = (status: string) => {
        if (status === 'active') return 'success';
        if (status === 'pending') return 'warning';
        return 'error';
    };

    const getAppTypeColor = (appType: string) => {
        if (appType === 'Pass') return '#1976D2';
        if (appType === 'Care') return '#9C27B0';
        return '#FF9800';
    };

    const filteredBusinesses = businesses.filter((business) => {
        const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            business.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
        const matchesAppType = appTypeFilter === 'all' || business.appType === appTypeFilter;
        const matchesType = typeFilter === 'all' || business.type === typeFilter;

        return matchesSearch && matchesStatus && matchesAppType && matchesType;
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
                        Business Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage all platform businesses
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<RefreshIcon />} variant="outlined" onClick={handleRefresh}>
                        Refresh
                    </Button>
                    <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExportCSV}>
                        Export CSV
                    </Button>
                    {/* 
                      <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExportExcel}>
                          Export Excel
                      </Button>
                     */}
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => setAddBusinessOpen(true)}>
                        Add Business
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
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={typeFilter}
                                label="Type"
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="Restaurant">Restaurant</MenuItem>
                                <MenuItem value="Cafe">Cafe</MenuItem>
                                <MenuItem value="Healthcare">Healthcare</MenuItem>
                                <MenuItem value="Beauty">Beauty</MenuItem>
                                <MenuItem value="Grocery">Grocery</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>App Type</InputLabel>
                            <Select
                                value={appTypeFilter}
                                label="App Type"
                                onChange={(e) => setAppTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="Pass">Pass</MenuItem>
                                <MenuItem value="Care">Care</MenuItem>
                                <MenuItem value="Go">Go</MenuItem>
                            </Select>
                        </FormControl>
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
                                <MenuItem value="pending">Pending</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            sx={{ minWidth: '120px' }}
                            onClick={() => {
                                setSearchQuery('');
                                setTypeFilter('all');
                                setAppTypeFilter('all');
                                setStatusFilter('all');
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
                                <TableCell>Business</TableCell>
                                <TableCell>Owner Email</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>App Type</TableCell>
                                <TableCell>City</TableCell>
                                <TableCell>Rating</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredBusinesses.length > 0 ? filteredBusinesses.map((business) => (
                                <TableRow key={business.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: '#1976D2' }}>
                                                <BusinessIcon />
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {business.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{business.ownerEmail}</TableCell>
                                    <TableCell>
                                        <Chip label={business.type} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={business.appType}
                                            size="small"
                                            sx={{
                                                bgcolor: getAppTypeColor(business.appType),
                                                color: '#FFFFFF',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{business.city}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Rating value={business.rating} precision={0.1} size="small" readOnly />
                                            <Typography variant="body2" color="text.secondary">
                                                {business.rating.toFixed(1)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={business.status}
                                            color={getStatusColor(business.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(business.createdDate).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => handleMenuOpen(e, business.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No businesses found.
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
                    Showing {filteredBusinesses.length} of {businesses.length} businesses
                </Typography>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
                <MenuItem onClick={handleEditBusiness}>Edit Business</MenuItem>
                <MenuItem onClick={handleApprove}>Approve/Activate</MenuItem>
                <MenuItem onClick={handleToggleStatus}>Toggle Status</MenuItem>
                <MenuItem onClick={handleViewAnalytics}>View Analytics</MenuItem>
                <MenuItem onClick={handleDeleteBusiness} sx={{ color: 'error.main' }}>
                    Delete Business
                </MenuItem>
            </Menu>

            <BusinessDetailsModal
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedBusiness(null);
                }}
                business={selectedBusiness}
                onEdit={() => {
                    if (selectedBusiness) {
                        setEditBusinessData(selectedBusiness);
                        setEditBusinessOpen(true);
                        setDetailsModalOpen(false);
                        setSelectedBusiness(null);
                    }
                }}
            />

            {/* Add Business Dialog */}
            <Dialog open={addBusinessOpen} onClose={() => setAddBusinessOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Business</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Business Name"
                            fullWidth
                            required
                            value={newBusiness.name}
                            onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                        />
                        <TextField
                            label="Owner Email"
                            type="email"
                            fullWidth
                            required
                            value={newBusiness.ownerEmail}
                            onChange={(e) => setNewBusiness({ ...newBusiness, ownerEmail: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                label="Type"
                                value={newBusiness.type}
                                onChange={(e) => setNewBusiness({ ...newBusiness, type: e.target.value })}
                            >
                                <MenuItem value="Restaurant">Restaurant</MenuItem>
                                <MenuItem value="Cafe">Cafe</MenuItem>
                                <MenuItem value="Healthcare">Healthcare</MenuItem>
                                <MenuItem value="Beauty">Beauty</MenuItem>
                                <MenuItem value="Grocery">Grocery</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>App Type</InputLabel>
                            <Select
                                label="App Type"
                                value={newBusiness.appType}
                                onChange={(e) => setNewBusiness({ ...newBusiness, appType: e.target.value })}
                            >
                                <MenuItem value="Pass">Pass</MenuItem>
                                <MenuItem value="Care">Care</MenuItem>
                                <MenuItem value="Go">Go</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="City"
                            fullWidth
                            value={newBusiness.city}
                            onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setAddBusinessOpen(false);
                        setNewBusiness({ name: '', ownerEmail: '', type: 'Restaurant', appType: 'Pass', city: '' });
                    }}>Cancel</Button>
                    <Button variant="contained" onClick={() => {
                        setSnackbar({ open: true, message: 'Creation not locally supported in demo.' });
                        setAddBusinessOpen(false);
                    }}>
                        Add Business (Demo)
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Business Dialog */}
            <Dialog open={editBusinessOpen} onClose={() => {
                setEditBusinessOpen(false);
                setEditBusinessData(null);
            }} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Business</DialogTitle>
                <DialogContent>
                    {editBusinessData && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Business Name"
                                fullWidth
                                value={editBusinessData.name}
                                onChange={(e) => setEditBusinessData({ ...editBusinessData, name: e.target.value })}
                                required
                            />
                            {/* ... other fields similar to User edit ... */}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEditBusinessOpen(false);
                        setEditBusinessData(null);
                    }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSnackbar({ open: true, message: 'Edit not implemented in demo' });
                            setEditBusinessOpen(false);
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete Business"
                message={`Are you sure you want to delete this business? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedBusinessId(null);
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
