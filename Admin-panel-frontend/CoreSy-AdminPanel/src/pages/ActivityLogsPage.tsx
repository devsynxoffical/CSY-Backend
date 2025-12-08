import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    Divider,
    TextField,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    History as HistoryIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Security as SecurityIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';

interface Log {
    id: string;
    action: string;
    user: string;
    role: string;
    description: string;
    timestamp: string;
    type: 'info' | 'warning' | 'error' | 'success';
}

const mockLogs: Log[] = [
    {
        id: '1',
        action: 'Login',
        user: 'Admin User',
        role: 'Super Admin',
        description: 'Successful login from IP 192.168.1.1',
        timestamp: 'Just now',
        type: 'success',
    },
    {
        id: '2',
        action: 'Update Settings',
        user: 'Admin User',
        role: 'Super Admin',
        description: 'Updated system configuration parameters',
        timestamp: '2 hours ago',
        type: 'info',
    },
    {
        id: '3',
        action: 'Failed Login',
        user: 'Unknown',
        role: 'Guest',
        description: 'Failed login attempt from IP 10.0.0.5',
        timestamp: '5 hours ago',
        type: 'warning',
    },
    {
        id: '4',
        action: 'Delete User',
        user: 'Support Admin',
        role: 'Admin',
        description: 'Deleted user account: John Doe (ID: 1023)',
        timestamp: '1 day ago',
        type: 'error',
    },
    {
        id: '5',
        action: 'Payment Processed',
        user: 'System',
        role: 'System',
        description: 'Processed monthly payout batch #402',
        timestamp: '1 day ago',
        type: 'success',
    },
];

export const ActivityLogsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const getIcon = (action: string) => {
        if (action.includes('Login')) return <SecurityIcon />;
        if (action.includes('Settings')) return <SettingsIcon />;
        if (action.includes('Payment')) return <PaymentIcon />;
        return <HistoryIcon />;
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'success': return 'success.main';
            case 'warning': return 'warning.main';
            case 'error': return 'error.main';
            default: return 'info.main';
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>System Activity Logs</Typography>
                <Typography variant="body2" color="text.secondary">
                    View and monitor all system activities and security events.
                </Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                        sx={{ bgcolor: 'background.default' }}
                    />
                    <IconButton>
                        <FilterListIcon />
                    </IconButton>
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <List sx={{ p: 0 }}>
                    {mockLogs.map((log, index) => (
                        <Box key={log.id}>
                            <ListItem sx={{ py: 2, px: 3, '&:hover': { bgcolor: 'action.hover' } }}>
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'background.default', color: getColor(log.type) }}>
                                        {getIcon(log.action)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="subtitle1" component="span" fontWeight={600}>
                                                {log.action}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {log.timestamp}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                                {log.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    icon={<PersonIcon sx={{ fontSize: '1rem !important' }} />}
                                                    label={`${log.user} (${log.role})`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 24 }}
                                                />
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                            {index < mockLogs.length - 1 && <Divider component="li" />}
                        </Box>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};
