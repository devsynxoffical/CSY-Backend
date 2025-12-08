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
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    FileDownload as FileDownloadIcon,
    Add as AddIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';
import type { User } from '../types';
import { usersAPI } from '../services/api';
import { UserDetailsModal } from '../components/modals/UserDetailsModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Helper to map backend user data to frontend interface
const mapUser = (data: any): User => ({
    id: data.id,
    name: data.full_name || 'Unknown',
    email: data.email,
    phone: data.phone,
    governorate: data.governorate_code || 'Unknown',
    status: data.is_active ? 'active' : 'inactive',
    verified: data.is_verified,
    walletBalance: Number(data.wallet_balance),
    points: data.points,
    joinedDate: data.created_at,
});

export const UsersPage = () => {
    const { status } = useParams<{ status: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [verifiedFilter, setVerifiedFilter] = useState('all');

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [addUserOpen, setAddUserOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    // Note: Creating a user via admin might not be supported on backend yet, keeping placeholder or simple impl
    const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', governorate: '' });
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [editUserData, setEditUserData] = useState<User | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await usersAPI.getAll();
            if (response.data.success) {
                const mappedUsers = response.data.data.map(mapUser);
                setUsers(mappedUsers);
            }
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users from server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Handle status from URL pathname
        const pathStatus = location.pathname.split('/').pop();

        if (pathStatus === 'active') {
            setStatusFilter('active');
            setShowFilters(true);
        } else if (pathStatus === 'inactive') {
            setStatusFilter('inactive');
            setShowFilters(true);
        } else {
            setStatusFilter('all');
        }

        fetchUsers();
    }, [location.pathname, status]);

    const handleExportCSV = () => {
        usersAPI.export('csv').then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users.csv');
            document.body.appendChild(link);
            link.click();
        }).catch(() => {
            // Fallback client-side export if server logic missing
            const headers = ['Name', 'Email', 'Phone', 'Governorate', 'Status', 'Verified', 'Wallet Balance', 'Points', 'Joined Date'];
            const csvContent = [
                headers.join(','),
                ...filteredUsers.map(user => [
                    user.name,
                    user.email,
                    user.phone,
                    user.governorate,
                    user.status,
                    user.verified ? 'Yes' : 'No',
                    user.walletBalance,
                    user.points,
                    new Date(user.joinedDate).toLocaleDateString()
                ].join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users_export.csv';
            a.click();
        });
    };

    const handleExportExcel = () => {
        // Fallback or implement server call similarly
        setSnackbar({ open: true, message: 'Export logic placeholder' });
    };

    const handleAddUser = () => {
        // Since backend might not have simpler admin-create-user endpoint, we'll placeholder this.
        setSnackbar({ open: true, message: 'Create User not yet supported on backend.' });
        setAddUserOpen(false);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedUserId(userId);
    };

    const handleMenuClose = (clearSelection = true) => {
        setAnchorEl(null);
        if (clearSelection) {
            setSelectedUserId(null);
        }
    };

    const handleToggleStatus = async () => {
        if (selectedUserId) {
            const user = users.find(u => u.id === selectedUserId);
            if (!user) return;

            const newStatus = user.status === 'active' ? false : true; // is_active boolean

            try {
                await usersAPI.toggleStatus(selectedUserId, { is_active: newStatus });

                // Optimistic update
                const updatedUsers = users.map(u =>
                    u.id === selectedUserId
                        ? { ...u, status: newStatus ? 'active' : 'inactive' }
                        : u
                );
                setUsers(updatedUsers);
                setSnackbar({ open: true, message: 'User status updated successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to update status' });
            }
            handleMenuClose();
        }
    };

    const handleDeleteUser = () => {
        if (selectedUserId) {
            setDeleteConfirmOpen(true);
            handleMenuClose(false);
        }
    };

    const handleConfirmDelete = async () => {
        const userIdToDelete = selectedUserId;
        if (userIdToDelete) {
            try {
                await usersAPI.delete(userIdToDelete);
                const updatedUsers = users.filter(user => user.id !== userIdToDelete);
                setUsers(updatedUsers);
                setSnackbar({ open: true, message: 'User deleted successfully!' });
            } catch (err) {
                setSnackbar({ open: true, message: 'Failed to delete user' });
            }
        }
        setDeleteConfirmOpen(false);
        setSelectedUserId(null);
    };

    const getStatusColor = (status: string) => {
        return status === 'active' ? 'success' : 'error';
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        // Simplified verified logic without dedicated filter on backend
        const matchesVerified = verifiedFilter === 'all' ||
            (verifiedFilter === 'verified' && user.verified) ||
            (verifiedFilter === 'unverified' && !user.verified);

        return matchesSearch && matchesStatus && matchesVerified;
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
                        {statusFilter === 'active' ? 'Active Users' : statusFilter === 'inactive' ? 'Inactive Users' : 'User Management'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {statusFilter === 'active' ? 'View all active platform users' : statusFilter === 'inactive' ? 'View all inactive platform users' : 'Manage all platform users'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<RefreshIcon />}
                        variant="outlined"
                        onClick={() => {
                            fetchUsers();
                            setSnackbar({ open: true, message: 'Refreshing users...' });
                        }}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExportCSV}>
                        Export CSV
                    </Button>
                    {/* Add User Button - removed or updated behavior */}
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
                        {/* Verified filter */}
                        <FormControl fullWidth>
                            <InputLabel>Verified</InputLabel>
                            <Select
                                value={verifiedFilter}
                                label="Verified"
                                onChange={(e) => setVerifiedFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="verified">Verified</MenuItem>
                                <MenuItem value="unverified">Unverified</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="outlined"
                            sx={{ minWidth: '120px' }}
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setVerifiedFilter('all');
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
                                <TableCell>User</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Governorate</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Verified</TableCell>
                                <TableCell>Wallet</TableCell>
                                <TableCell>Points</TableCell>
                                <TableCell>Joined</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: '#1976D2' }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {user.name}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.email}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{user.phone}</TableCell>
                                    <TableCell>
                                        <Chip label={user.governorate} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.status}
                                            color={getStatusColor(user.status)}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {user.verified ? (
                                            <CheckCircleIcon color="success" />
                                        ) : (
                                            <CancelIcon color="error" />
                                        )}
                                    </TableCell>
                                    <TableCell>${user.walletBalance.toLocaleString()}</TableCell>
                                    <TableCell>{user.points}</TableCell>
                                    <TableCell>{new Date(user.joinedDate).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <IconButton onClick={(e) => handleMenuOpen(e, user.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No users found.
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
                    Showing {filteredUsers.length} of {users.length} users
                </Typography>
            </Box>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => {
                    handleToggleStatus();
                    handleMenuClose(true);
                }}>Toggle Status</MenuItem>
                <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
                    Delete User
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete User"
                message={`Are you sure you want to delete this user? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setSelectedUserId(null);
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
