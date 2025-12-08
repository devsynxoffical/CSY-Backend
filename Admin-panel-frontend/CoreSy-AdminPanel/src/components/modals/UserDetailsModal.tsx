import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Divider,
    Avatar,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { User } from '../../types';

interface UserDetailsModalProps {
    open: boolean;
    onClose: () => void;
    user: User | null;
    onEdit?: () => void;
}

export const UserDetailsModal = ({ open, onClose, user, onEdit }: UserDetailsModalProps) => {
    if (!user) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976D2', width: 56, height: 56 }}>
                        {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">{user.name}</Typography>
                        <Chip
                            label={user.status}
                            color={user.status === 'active' ? 'success' : 'error'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Email
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{user.email}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Phone
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{user.phone}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Governorate
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2">{user.governorate}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Verified Status
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {user.verified ? (
                                    <>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography variant="body2">Verified</Typography>
                                    </>
                                ) : (
                                    <>
                                        <CancelIcon color="error" fontSize="small" />
                                        <Typography variant="body2">Not Verified</Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                                ${user.walletBalance.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Wallet Balance
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976D2' }}>
                                {user.points}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Loyalty Points
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                                {new Date(user.joinedDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Member Since
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button variant="contained" onClick={() => {
                    if (onEdit) {
                        onEdit();
                    }
                    onClose();
                }}>
                    Edit User
                </Button>
            </DialogActions>
        </Dialog>
    );
};
