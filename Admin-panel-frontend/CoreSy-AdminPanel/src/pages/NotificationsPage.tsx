import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tab,
    Snackbar,
    Chip,
} from '@mui/material';
import {
    Send as SendIcon,
    Refresh as RefreshIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
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

export const NotificationsPage = () => {
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);
    const [targetType, setTargetType] = useState('all');
    const [notificationType, setNotificationType] = useState('info');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [notificationHistory, setNotificationHistory] = useState<any[]>(() => storage.getNotifications([]));

    useEffect(() => {
        if (location.pathname.includes('/send')) {
            setTabValue(0);
        } else if (location.pathname.includes('/history')) {
            setTabValue(1);
        }
    }, [location.pathname]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSend = () => {
        if (!title || !message) {
            setSnackbar({ open: true, message: 'Please fill in title and message.' });
            return;
        }
        const notification = {
            id: `notif_${Date.now()}`,
            date: new Date().toISOString(),
            title,
            message,
            targetType,
            notificationType,
            recipients: 0, // In real app, this would be calculated
            status: 'sent',
            read: false, // Mark as unread
        };
        const updatedHistory = [notification, ...notificationHistory];
        setNotificationHistory(updatedHistory);
        storage.setNotifications(updatedHistory);
        setSnackbar({ open: true, message: 'Notification sent successfully!' });
        setTitle('');
        setMessage('');
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                Notifications
            </Typography>

            <Paper sx={{ borderRadius: '12px' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab icon={<SendIcon />} iconPosition="start" label="Send Notification" />
                    <Tab icon={<HistoryIcon />} iconPosition="start" label="Notification History" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Send Notification
                        </Typography>

                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>Target Audience</InputLabel>
                        <Select
                            value={targetType}
                            label="Target Audience"
                            onChange={(e) => setTargetType(e.target.value)}
                        >
                            <MenuItem value="all">All Users</MenuItem>
                            <MenuItem value="users">Users Only</MenuItem>
                            <MenuItem value="businesses">Businesses Only</MenuItem>
                            <MenuItem value="drivers">Drivers Only</MenuItem>
                            <MenuItem value="custom">Custom Selection</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Notification Type</InputLabel>
                        <Select
                            value={notificationType}
                            label="Notification Type"
                            onChange={(e) => setNotificationType(e.target.value)}
                        >
                            <MenuItem value="info">Information</MenuItem>
                            <MenuItem value="warning">Warning</MenuItem>
                            <MenuItem value="success">Success</MenuItem>
                            <MenuItem value="error">Error</MenuItem>
                            <MenuItem value="promotion">Promotion</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter notification title"
                    />

                    <TextField
                        fullWidth
                        label="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter notification message"
                        multiline
                        rows={4}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleSend}
                            disabled={!title || !message}
                        >
                            Send Notification
                        </Button>
                        <Button variant="outlined">
                            Save as Template
                        </Button>
                        </Box>
                    </Stack>
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Notification History</Typography>
                            <Button startIcon={<RefreshIcon />} variant="outlined" size="small">
                                Refresh
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                                        <TableCell>Date & Time</TableCell>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Target</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Recipients</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {notificationHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                                                    No notifications sent yet. Send your first notification above.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        notificationHistory.map((notif) => (
                                            <TableRow key={notif.id}>
                                                <TableCell>{new Date(notif.date).toLocaleString()}</TableCell>
                                                <TableCell>{notif.title}</TableCell>
                                                <TableCell>{notif.targetType}</TableCell>
                                                <TableCell>
                                                    <Chip label={notif.notificationType} size="small" />
                                                </TableCell>
                                                <TableCell>{notif.recipients}</TableCell>
                                                <TableCell>
                                                    <Chip label={notif.status} color="success" size="small" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
