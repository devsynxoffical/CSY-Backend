import { useState } from 'react';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCloseSidebar = () => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Header onMenuClick={handleToggleSidebar} />
            <Sidebar open={sidebarOpen} onToggle={handleToggleSidebar} onClose={handleCloseSidebar} isMobile={isMobile} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2, md: 3 },
                    backgroundColor: '#F5F5F5',
                    minHeight: '100vh',
                    width: { xs: '100%', md: `calc(100% - ${sidebarOpen ? 280 : 64}px)` },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                }}
            >
                <Toolbar /> {/* Spacer for fixed header */}
                <Outlet />
            </Box>
        </Box>
    );
};
