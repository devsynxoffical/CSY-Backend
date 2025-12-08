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
    Rating,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
    Business as BusinessIcon,
    Email as EmailIcon,
    LocationOn as LocationIcon,
} from '@mui/icons-material';
import type { Business } from '../../types';

interface BusinessDetailsModalProps {
    open: boolean;
    onClose: () => void;
    business: Business | null;
    onEdit?: () => void;
}

export const BusinessDetailsModal = ({ open, onClose, business, onEdit }: BusinessDetailsModalProps) => {
    if (!business) return null;

    const getAppTypeColor = (appType: string) => {
        if (appType === 'Pass') return '#1976D2';
        if (appType === 'Care') return '#9C27B0';
        return '#FF9800';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: getAppTypeColor(business.appType) }} />
                    <Box>
                        <Typography variant="h6">{business.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                                label={business.appType}
                                size="small"
                                sx={{ bgcolor: getAppTypeColor(business.appType), color: '#fff' }}
                            />
                            <Chip
                                label={business.status}
                                color={business.status === 'active' ? 'success' : 'warning'}
                                size="small"
                            />
                        </Box>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={business.rating} readOnly precision={0.1} />
                            <Typography variant="body2" color="text.secondary">
                                ({business.rating})
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Owner Email
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{business.ownerEmail}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Type
                            </Typography>
                            <Typography variant="body2">{business.type}</Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                City
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <LocationIcon fontSize="small" color="action" />
                                <Typography variant="body2">{business.city}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Created Date
                            </Typography>
                            <Typography variant="body2">
                                {new Date(business.createdDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976D2' }}>
                                {new Date(business.createdDate).toLocaleDateString()}
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
                    Edit Business
                </Button>
            </DialogActions>
        </Dialog>
    );
};
