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
    DirectionsCar as CarIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    LocalShipping as TruckIcon,
    TwoWheeler as BikeIcon,
} from '@mui/icons-material';
import type { Driver } from '../../types';

interface DriverDetailsModalProps {
    open: boolean;
    onClose: () => void;
    driver: Driver | null;
    onEdit?: () => void;
}

export const DriverDetailsModal = ({ open, onClose, driver, onEdit }: DriverDetailsModalProps) => {
    if (!driver) return null;

    const getVehicleIcon = (type: string) => {
        if (type === 'Car') return <CarIcon />;
        if (type === 'Bike') return <BikeIcon />;
        return <TruckIcon />;
    };

    const getAvailabilityColor = (availability: string) => {
        if (availability === 'available') return 'success';
        if (availability === 'busy') return 'warning';
        return 'default';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976D2', width: 56, height: 56 }}>
                        {driver.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">{driver.name}</Typography>
                        <Chip
                            label={driver.availability}
                            color={getAvailabilityColor(driver.availability)}
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
                                <Typography variant="body2">{driver.email}</Typography>
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
                                <Typography variant="body2">{driver.phone}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Vehicle Type
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {getVehicleIcon(driver.vehicleType)}
                                <Typography variant="body2">{driver.vehicleType}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Status
                            </Typography>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{driver.status}</Typography>
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
                                {driver.totalDeliveries}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total Deliveries
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976D2' }}>
                                ${driver.earnings.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Total Earnings
                            </Typography>
                        </Box>
                    </Grid>

                    {/* @ts-expect-error - MUI v7 Grid API change */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                                {driver.rating}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Rating
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
                    Edit Driver
                </Button>
            </DialogActions>
        </Dialog>
    );
};
