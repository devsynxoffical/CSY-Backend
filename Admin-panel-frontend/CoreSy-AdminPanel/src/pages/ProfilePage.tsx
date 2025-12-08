import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Avatar,
    Stack,
    Divider,
    Tabs,
    Tab,
    Snackbar,
} from '@mui/material';
import { Save as SaveIcon, Lock as LockIcon, Person as PersonIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { storage } from '../utils/storage';

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

export const ProfilePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [profile, setProfile] = useState(() => 
        storage.getProfile({
            name: 'Admin User',
            email: 'admin@coresy.com',
            phone: '+964 XXX XXX XXXX',
            role: 'Administrator',
        })
    );
    const [password, setPassword] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    useEffect(() => {
        if (location.pathname === '/profile/password') {
            setTabValue(1);
        } else {
            setTabValue(0);
        }
    }, [location.pathname]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        if (newValue === 0) {
            navigate('/profile');
        } else {
            navigate('/profile/password');
        }
    };

    const handleProfileSave = () => {
        storage.setProfile(profile);
        setSnackbar({ open: true, message: 'Profile updated successfully!' });
    };

    const handlePasswordSave = () => {
        if (password.new !== password.confirm) {
            setSnackbar({ open: true, message: 'New passwords do not match!' });
            return;
        }
        if (password.new.length < 8) {
            setSnackbar({ open: true, message: 'Password must be at least 8 characters!' });
            return;
        }
        // Store password change timestamp (in real app, this would be sent to API)
        storage.setProfile({ ...profile, passwordChangedAt: new Date().toISOString() });
        setSnackbar({ open: true, message: 'Password changed successfully!' });
        setPassword({ current: '', new: '', confirm: '' });
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                My Profile
            </Typography>

            <Paper sx={{ borderRadius: '12px' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Profile Information" />
                    <Tab icon={<LockIcon />} iconPosition="start" label="Change Password" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                            <Avatar sx={{ width: 100, height: 100, bgcolor: '#1976D2', fontSize: '2.5rem' }}>
                                {profile.name.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5" sx={{ mb: 1 }}>
                                    {profile.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {profile.email}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {profile.role}
                                </Typography>
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        <Stack spacing={3}>
                            <TextField
                                label="Full Name"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Phone"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Role"
                                value={profile.role}
                                disabled
                                fullWidth
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleProfileSave}>
                                    Save Changes
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            <TextField
                                label="Current Password"
                                type="password"
                                value={password.current}
                                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                value={password.new}
                                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                fullWidth
                            />
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                value={password.confirm}
                                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                                fullWidth
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={handlePasswordSave}>
                                    Change Password
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </TabPanel>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};

