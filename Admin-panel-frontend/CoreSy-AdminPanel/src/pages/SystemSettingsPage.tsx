import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Stack,
    Divider,
    Snackbar,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { storage } from '../utils/storage';

export const SystemSettingsPage = () => {
    const defaultSettings = {
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        smsNotifications: true,
        apiRateLimit: '1000',
        sessionTimeout: '30',
        maxFileSize: '10',
    };
    const [settings, setSettings] = useState(() => storage.getSystemSettings(defaultSettings));
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const handleChange = (field: string, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleSave = () => {
        storage.setSystemSettings(settings);
        setSnackbar({ open: true, message: 'Settings saved successfully!' });
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                System Settings
            </Typography>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    General Settings
                </Typography>
                <Stack spacing={3}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                            />
                        }
                        label="Maintenance Mode"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.registrationEnabled}
                                onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
                            />
                        }
                        label="User Registration Enabled"
                    />
                </Stack>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Notification Settings
                </Typography>
                <Stack spacing={3}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                            />
                        }
                        label="Email Notifications"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.smsNotifications}
                                onChange={(e) => handleChange('smsNotifications', e.target.checked)}
                            />
                        }
                        label="SMS Notifications"
                    />
                </Stack>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    System Limits
                </Typography>
                <Stack spacing={3}>
                    <TextField
                        label="API Rate Limit (requests/hour)"
                        type="number"
                        value={settings.apiRateLimit}
                        onChange={(e) => handleChange('apiRateLimit', e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Session Timeout (minutes)"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="Max File Upload Size (MB)"
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => handleChange('maxFileSize', e.target.value)}
                        fullWidth
                    />
                </Stack>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={() => {
                    setSettings(defaultSettings);
                    storage.setSystemSettings(defaultSettings);
                    setSnackbar({ open: true, message: 'Settings reset to defaults!' });
                }}>
                    Reset
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                    Save Settings
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
            />
        </Box>
    );
};

