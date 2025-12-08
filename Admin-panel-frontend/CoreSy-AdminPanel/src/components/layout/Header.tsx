import {
    AppBar,
    Toolbar,
    IconButton,
    InputBase,
    Badge,
    Avatar,
    Menu,
    MenuItem,
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    ClickAwayListener,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Business as BusinessIcon,
    LocalShipping as DriverIcon,
    Receipt as TransactionIcon,
    NotificationsNone as NotificationIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import type { RootState } from '../../store';
import { storage } from '../../utils/storage';
import type { User, Business, Driver, Transaction } from '../../types';

interface HeaderProps {
    onMenuClick: () => void;
}

interface SearchResult {
    type: 'user' | 'business' | 'driver' | 'transaction';
    id: string;
    title: string;
    subtitle: string;
    route: string;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user);

    // Load notifications on mount
    useEffect(() => {
        const loadNotifications = () => {
            const notifs = storage.getNotifications([]);
            setNotifications(notifs);
            // Count unread notifications (assuming notifications have a read property)
            const unread = notifs.filter((n: any) => !n.read).length;
            setUnreadCount(unread);
        };
        loadNotifications();
        // Refresh notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Search functionality
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const results: SearchResult[] = [];

        // Search users
        const users = storage.getUsers<User[]>([]);
        users.forEach((user) => {
            if (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.phone.includes(query) ||
                user.governorate.toLowerCase().includes(query)
            ) {
                results.push({
                    type: 'user',
                    id: user.id,
                    title: user.name,
                    subtitle: `${user.email} • ${user.governorate}`,
                    route: `/users`,
                });
            }
        });

        // Search businesses
        const businesses = storage.getBusinesses<Business[]>([]);
        businesses.forEach((business) => {
            if (
                business.name.toLowerCase().includes(query) ||
                business.ownerEmail.toLowerCase().includes(query) ||
                business.type.toLowerCase().includes(query) ||
                business.city.toLowerCase().includes(query)
            ) {
                results.push({
                    type: 'business',
                    id: business.id,
                    title: business.name,
                    subtitle: `${business.type} • ${business.city}`,
                    route: `/businesses`,
                });
            }
        });

        // Search drivers
        const drivers = storage.getDrivers<Driver[]>([]);
        drivers.forEach((driver) => {
            if (
                driver.name.toLowerCase().includes(query) ||
                driver.email.toLowerCase().includes(query) ||
                driver.phone.includes(query) ||
                driver.vehicleType.toLowerCase().includes(query)
            ) {
                results.push({
                    type: 'driver',
                    id: driver.id,
                    title: driver.name,
                    subtitle: `${driver.vehicleType} • ${driver.email}`,
                    route: `/drivers`,
                });
            }
        });

        // Search transactions
        const transactions = storage.getTransactions<Transaction[]>([]);
        transactions.forEach((transaction) => {
            if (
                transaction.id.toLowerCase().includes(query) ||
                transaction.user.toLowerCase().includes(query) ||
                transaction.reference.toLowerCase().includes(query) ||
                transaction.type.toLowerCase().includes(query)
            ) {
                results.push({
                    type: 'transaction',
                    id: transaction.id,
                    title: `Transaction ${transaction.id}`,
                    subtitle: `${transaction.user} • ${transaction.type} • $${transaction.amount}`,
                    route: `/transactions`,
                });
            }
        });

        setSearchResults(results.slice(0, 10)); // Limit to 10 results
        setShowSearchResults(results.length > 0);
    }, [searchQuery]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchor(event.currentTarget);
        // Mark all notifications as read when opening
        const updatedNotifications = notifications.map((n: any) => ({ ...n, read: true }));
        setNotifications(updatedNotifications);
        storage.setNotifications(updatedNotifications);
        setUnreadCount(0);
    };

    const handleNotificationClose = () => {
        setNotificationAnchor(null);
    };

    const handleSearchResultClick = (result: SearchResult) => {
        navigate(result.route);
        setSearchQuery('');
        setShowSearchResults(false);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        handleMenuClose();
    };

    const getResultIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'user':
                return <PersonIcon />;
            case 'business':
                return <BusinessIcon />;
            case 'driver':
                return <DriverIcon />;
            case 'transaction':
                return <TransactionIcon />;
            default:
                return <SearchIcon />;
        }
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#FFFFFF',
                color: '#000000',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onMenuClick}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" sx={{ fontWeight: 700, mr: 4 }}>
                    AdminPanel
                </Typography>

                <ClickAwayListener onClickAway={() => setShowSearchResults(false)}>
                    <Box sx={{ 
                        position: 'relative', 
                        width: { xs: 'calc(100% - 120px)', sm: '300px', md: '400px' },
                        maxWidth: { xs: '200px', sm: '300px', md: '400px' },
                        mr: { xs: 1, sm: 2 }
                    }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#F5F5F5',
                                borderRadius: '8px',
                                px: 2,
                                py: 0.5,
                                width: '100%',
                            }}
                        >
                            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            <InputBase
                                placeholder="Search..."
                                fullWidth
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery && setShowSearchResults(true)}
                                sx={{
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    '& input::placeholder': {
                                        fontSize: { xs: '0.875rem', sm: '1rem' }
                                    }
                                }}
                            />
                        </Box>
                        {showSearchResults && searchResults.length > 0 && (
                            <Paper
                                sx={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    mt: 1,
                                    maxHeight: '400px',
                                    overflow: 'auto',
                                    zIndex: 1300,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                }}
                            >
                                <List dense>
                                    {searchResults.map((result) => (
                                        <ListItem
                                            key={`${result.type}-${result.id}`}
                                            button
                                            onClick={() => handleSearchResultClick(result)}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: '#F5F5F5',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                {getResultIcon(result.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={result.title}
                                                secondary={result.subtitle}
                                            />
                                            <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}
                        {showSearchResults && searchQuery && searchResults.length === 0 && (
                            <Paper
                                sx={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    mt: 1,
                                    p: 2,
                                    zIndex: 1300,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    No results found for "{searchQuery}"
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </ClickAwayListener>

                <Box sx={{ flexGrow: 1 }} />

                <IconButton
                    color="inherit"
                    sx={{ mr: 2 }}
                    onClick={handleNotificationOpen}
                >
                    <Badge badgeContent={unreadCount > 0 ? unreadCount : undefined} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>

                <Menu
                    anchorEl={notificationAnchor}
                    open={Boolean(notificationAnchor)}
                    onClose={handleNotificationClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    PaperProps={{
                        sx: {
                            width: 360,
                            maxHeight: 500,
                            mt: 1,
                        },
                    }}
                >
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Notifications
                        </Typography>
                    </Box>
                    <Divider />
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No notifications
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
                            {notifications.slice(0, 10).map((notification: any) => (
                                <MenuItem
                                    key={notification.id}
                                    onClick={() => {
                                        handleNotificationClose();
                                        navigate('/notifications/history');
                                    }}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        borderBottom: '1px solid #F5F5F5',
                                        '&:hover': {
                                            backgroundColor: '#F5F5F5',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <NotificationIcon color={notification.read ? 'disabled' : 'primary'} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                                                    {notification.title}
                                                </Typography>
                                                {!notification.read && (
                                                    <Chip
                                                        label="New"
                                                        size="small"
                                                        color="primary"
                                                        sx={{ height: 18, fontSize: '0.65rem' }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {notification.message}
                                            </Typography>
                                        }
                                    />
                                </MenuItem>
                            ))}
                        </List>
                    )}
                    {notifications.length > 10 && (
                        <>
                            <Divider />
                            <MenuItem
                                onClick={() => {
                                    handleNotificationClose();
                                    navigate('/notifications/history');
                                }}
                                sx={{ justifyContent: 'center', py: 1.5 }}
                            >
                                <Typography variant="body2" color="primary">
                                    View All Notifications
                                </Typography>
                            </MenuItem>
                        </>
                    )}
                </Menu>

                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: '#1976D2' }}>
                        {user?.name?.charAt(0) || <PersonIcon />}
                    </Avatar>
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem onClick={() => {
                        navigate('/profile');
                        handleMenuClose();
                    }}>
                        <PersonIcon sx={{ mr: 1 }} /> Profile
                    </MenuItem>
                    <MenuItem onClick={() => {
                        navigate('/system/settings');
                        handleMenuClose();
                    }}>Settings</MenuItem>
                    <MenuItem onClick={handleLogout}>
                        <LogoutIcon sx={{ mr: 1 }} /> Logout
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};
