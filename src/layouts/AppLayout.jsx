import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '@/hooks/useAuth';
import { appRoutes } from '@/routes/routes';
import InstituteSwitcher from './InstituteSwitcher';
import UserMenu from './UserMenu';

const DRAWER_WIDTH = 256;

// The frame around every logged-in page: sidebar menu, top bar, and the page in the middle.
// On phones (below md) the sidebar becomes a drawer opened by the menu button.
export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currentRole } = useAuth();
  const { pathname } = useLocation();

  // Only the pages this role may open appear in the menu
  const menuItems = appRoutes.filter((route) => route.menu && route.roles.includes(currentRole));
  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  const sidebar = (
    <>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ color: 'primary.main' }}>
          EduRecords
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav" aria-label="Main menu">
        {menuItems.map(({ path, menu }) => {
          const Icon = menu.icon;
          return (
            <ListItemButton
              key={path}
              component={RouterLink}
              to={path}
              selected={isActive(path)}
              onClick={() => setDrawerOpen(false)}
              sx={{ mx: 1, borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={menu.label} slotProps={{ primary: { noWrap: true } }} />
              {menu.comingSoon && (
                <Chip
                  label="Coming soon"
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, height: 20, fontSize: '0.6875rem', flexShrink: 0 }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton edge="start" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ display: { xs: 'none', sm: 'block', md: 'none' }, color: 'primary.main' }}
          >
            EduRecords
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <InstituteSwitcher />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {sidebar}
        </Drawer>
      </Box>

      {/* minWidth: 0 lets wide tables scroll inside their own box instead of the whole page */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3 } }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
