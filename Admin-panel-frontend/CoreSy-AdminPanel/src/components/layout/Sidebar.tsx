import { useState } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Box,
    Typography,
    Divider,
} from '@mui/material';
import {
    DashboardOutlined as DashboardIcon,
    PeopleAltOutlined as PeopleIcon,
    BusinessOutlined as BusinessIcon,
    LocalShippingOutlined as DriverIcon,
    PaymentOutlined as PaymentIcon,
    CalendarMonthOutlined as BookingIcon,
    NotificationsOutlined as NotificationIcon,
    AnalyticsOutlined as AnalyticsIcon,
    CardMembershipOutlined as SubscriptionIcon,
    SettingsOutlined as SettingsIcon,
    PersonOutline as PersonIcon,
    ExpandLess,
    ExpandMore,
    ChevronLeft,
    ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 280;


interface NavItem {
    title: string;
    icon: React.ReactNode;
    path?: string;
    children?: { title: string; path: string }[];
}

const navigationItems: NavItem[] = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    {
        title: 'User Management',
        icon: <PeopleIcon />,
        children: [
            { title: 'All Users', path: '/users' },
            { title: 'Active Users', path: '/users/active' },
            { title: 'Inactive Users', path: '/users/inactive' },
        ],
    },
    {
        title: 'Business Management',
        icon: <BusinessIcon />,
        children: [
            { title: 'All Businesses', path: '/businesses' },
            { title: 'Pending Approval', path: '/businesses/pending' },
            { title: 'Active Businesses', path: '/businesses/active' },
        ],
    },
    {
        title: 'Driver Management',
        icon: <DriverIcon />,
        children: [
            { title: 'All Drivers', path: '/drivers' },
            { title: 'Available Drivers', path: '/drivers/available' },
            { title: 'Performance Reports', path: '/drivers/performance' },
        ],
    },
    {
        title: 'Payments & Transactions',
        icon: <PaymentIcon />,
        children: [
            { title: 'All Transactions', path: '/transactions' },
            { title: 'Pending Payouts', path: '/transactions/payouts' },
            { title: 'Refund Requests', path: '/transactions/refunds' },
        ],
    },
    {
        title: 'Bookings',
        icon: <BookingIcon />,
        children: [
            { title: 'All Reservations', path: '/bookings/reservations' },
            { title: 'All Orders', path: '/bookings/orders' },
        ],
    },
    {
        title: 'Notifications',
        icon: <NotificationIcon />,
        children: [
            { title: 'Send Notification', path: '/notifications/send' },
            { title: 'Notification History', path: '/notifications/history' },
        ],
    },
    {
        title: 'Analytics & Reports',
        icon: <AnalyticsIcon />,
        children: [
            { title: 'Platform Overview', path: '/analytics/overview' },
            { title: 'Revenue Reports', path: '/analytics/revenue' },
        ],
    },
    {
        title: 'Subscriptions',
        icon: <SubscriptionIcon />,
        children: [
            { title: 'All Subscriptions', path: '/subscriptions' },
            { title: 'Subscription Plans', path: '/subscriptions/plans' },
        ],
    },
    {
        title: 'System',
        icon: <SettingsIcon />,
        children: [
            { title: 'Health Check', path: '/system/health' },
            { title: 'Activity Logs', path: '/system/activity-logs' },
            { title: 'Settings', path: '/system/settings' },
        ],
    },
    {
        title: 'Profile',
        icon: <PersonIcon />,
        children: [
            { title: 'My Profile', path: '/profile' },
            { title: 'Change Password', path: '/profile/password' },
        ],
    },
];

interface SidebarProps {
    open: boolean;
    onToggle: () => void;
    onClose?: () => void;
    isMobile?: boolean;
}

export const Sidebar = ({ open, onToggle, onClose, isMobile = false }: SidebarProps) => {
    const navigate = useNavigate();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const handleToggleExpand = (title: string) => {
        setExpandedItems((prev) =>
            prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
        );
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'persistent'}
            open={open}
            onClose={onClose}
            ModalProps={{
                keepMounted: true, // Better mobile performance
            }}
            sx={{
                width: open ? DRAWER_WIDTH : 0,
                flexShrink: 0,
                display: open ? 'block' : 'none', // Completely hide when closed to avoid layout shift issues or empty space if persistent behaves oddly
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH, // Always full width when open
                    boxSizing: 'border-box',
                    transition: 'transform 0.3s ease-in-out', // Smoother transition
                    overflowX: 'hidden',
                    backgroundColor: '#1E1E2D',
                    color: '#FFFFFF',
                    // Hide scrollbar for Chrome, Safari and Opera
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                        },
                    },
                    // Hide scrollbar for Firefox
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
                },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    p: 2,
                    minHeight: 64,
                }}
            >
                {open && (
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        AdminPanel
                    </Typography>
                )}
                <IconButton onClick={onToggle} sx={{ color: '#FFFFFF' }}>
                    {open ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            <List sx={{ pt: 2 }}>
                {navigationItems.map((item) => (
                    <div key={item.title}>
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => {
                                    if (item.path) {
                                        handleNavigate(item.path);
                                    } else if (item.children) {
                                        handleToggleExpand(item.title);
                                    }
                                }}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <>
                                        <ListItemText primary={item.title} />
                                        {item.children &&
                                            (expandedItems.includes(item.title) ? <ExpandLess /> : <ExpandMore />)}
                                    </>
                                )}
                            </ListItemButton>
                        </ListItem>
                        {item.children && open && (
                            <Collapse in={expandedItems.includes(item.title)} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {item.children.map((child) => (
                                        <ListItemButton
                                            key={child.path}
                                            sx={{ pl: 4, '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } }}
                                            onClick={() => handleNavigate(child.path)}
                                        >
                                            <ListItemText primary={child.title} sx={{ fontSize: '0.875rem' }} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </div>
                ))}
            </List>
        </Drawer>
    );
};
