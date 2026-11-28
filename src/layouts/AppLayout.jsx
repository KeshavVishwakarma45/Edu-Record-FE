import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

import { useAuth } from '@/hooks/useAuth';
import { appRoutes, canOpen } from '@/routes/routes';

import InstituteSwitcher from './InstituteSwitcher';
import GlobalStudentSearch from './GlobalStudentSearch';
import UserMenu from './UserMenu';

const DRAWER_WIDTH = 238;

// Main top header height
const HEADER_HEIGHT = 64;

// Sidebar brand height remains unchanged
const BRAND_HEIGHT = 52;

const MOBILE_HEADER_HEIGHT = 100;

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [drawerOpen, setDrawerOpen] = useState(false);

  const auth = useAuth();
  const { pathname } = useLocation();

  const visible = appRoutes.filter((route) => route.menu && canOpen(route, auth));

  const mainItems = visible.filter((route) => !route.menu.admin);

  const adminItems = visible.filter((route) => route.menu.admin);

  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  const renderItem = ({ path, menu }) => {
    const Icon = menu.icon;

    return (
      <ListItemButton
        key={path}
        component={RouterLink}
        to={path}
        selected={isActive(path)}
        onClick={() => setDrawerOpen(false)}
        sx={{
          mx: 1.25,
          mb: 0.5,
          minHeight: 42,
          borderRadius: 2,

          '& .MuiListItemIcon-root': {
            minWidth: 30,
            color: 'text.primary',
          },

          '& .MuiListItemText-primary': {
            fontSize: 14,
            fontWeight: 550,
          },

          '&.Mui-selected': {
            bgcolor: '#EEF1FF',
            color: '#2449B8',

            '&:hover': {
              bgcolor: '#E5EAFE',
            },

            '& .MuiListItemIcon-root': {
              color: '#2449B8',
            },

            '& .MuiListItemText-primary': {
              fontWeight: 700,
            },
          },

          '&:hover': {
            bgcolor: '#F5F6FA',
          },
        }}
      >
        <ListItemIcon>{Icon && <Icon fontSize="small" />}</ListItemIcon>

        <ListItemText
          primary={menu.label}
          slotProps={{
            primary: {
              noWrap: true,
            },
          }}
        />

        {menu.comingSoon && (
          <Chip
            label="Soon"
            size="small"
            variant="outlined"
            sx={{
              ml: 0.5,
              height: 19,
              fontSize: 10,
              flexShrink: 0,
            }}
          />
        )}
      </ListItemButton>
    );
  };

  const sidebar = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          height: BRAND_HEIGHT,
          minHeight: BRAND_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#2449B8',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: 17,
            borderRadius: 1.5,
          }}
        >
          E
        </Avatar>

        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 800,
            color: '#111827',
            letterSpacing: -0.4,
          }}
        >
          EduRecords
        </Typography>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1.5,
          '&::-webkit-scrollbar': {
            width: 5,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#D5D9E2',
            borderRadius: 5,
          },
        }}
      >
        <List component="nav" aria-label="Main navigation" disablePadding>
          {mainItems.map(renderItem)}

          {adminItems.length > 0 && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  color: '#626B7A',
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: '36px',
                  letterSpacing: 0.5,
                  mt: 1.5,
                  px: 2,
                }}
              >
                ADMINISTRATION
              </ListSubheader>

              {adminItems.map(renderItem)}
            </>
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFFAF4',
      }}
    >
      {/* Header */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          left: {
            xs: 0,
            md: `${DRAWER_WIDTH}px`,
          },
          width: {
            xs: '100%',
            md: `calc(100% - ${DRAWER_WIDTH}px)`,
          },
          zIndex: theme.zIndex.appBar,
          bgcolor: '#FFFFFF',
          color: '#111827',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar
          sx={{
            height: HEADER_HEIGHT,
            minHeight: `${HEADER_HEIGHT}px !important`,
            px: {
              xs: 1,
              sm: 1.5,
              md: 3,
            },
            gap: {
              xs: 0.5,
              md: 2,
            },

            // Three-column layout matching Dashboard header
            ...(isLargeScreen && {
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
              columnGap: 2,
              alignItems: 'center',
            }),
          }}
        >
          {!isDesktop && (
            <IconButton
              edge="start"
              aria-label="Open navigation menu"
              onClick={() => setDrawerOpen(true)}
              sx={{
                flexShrink: 0,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Institute selector */}
          <Box
            sx={{
              flex: {
                xs: 1,
                md: '0 1 38%',
              },
              width: isLargeScreen ? '100%' : undefined,
              minWidth: 0,
              maxWidth: isLargeScreen ? 'none' : { md: 570 },
            }}
          >
            <InstituteSwitcher />
          </Box>

          {/* Global student search */}
          <Box
            sx={{
              flex: 1,
              width: isLargeScreen ? '100%' : undefined,
              minWidth: 0,
              display: {
                xs: 'none',
                sm: 'block',
              },
            }}
          >
            <GlobalStudentSearch />
          </Box>

          {/* User menu */}
          <Box
            sx={{
              flexShrink: 0,
              ml: {
                xs: 'auto',
                sm: 0,
              },
              justifySelf: isLargeScreen ? 'end' : undefined,
            }}
          >
            <UserMenu />
          </Box>
        </Toolbar>

        {/* Mobile search */}
        {!isDesktop && (
          <Box
            sx={{
              display: {
                xs: 'block',
                sm: 'none',
              },
              px: 2,
              pb: 1.25,
            }}
          >
            <GlobalStudentSearch />
          </Box>
        )}
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        aria-label="Primary navigation"
        sx={{
          width: {
            md: DRAWER_WIDTH,
          },
          flexShrink: {
            md: 0,
          },
        }}
      >
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: '#FFFFFF',
              borderRight: 1,
              borderColor: 'divider',
              overflowX: 'hidden',

              ...(isDesktop
                ? {
                    position: 'fixed',
                    top: 0,
                    height: '100vh',
                  }
                : {
                    top: 0,
                    height: '100%',
                  }),
            },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${DRAWER_WIDTH}px`,
          },
          pt: {
            xs: `${MOBILE_HEADER_HEIGHT}px`,
            sm: `${HEADER_HEIGHT}px`,
          },
          minHeight: '100vh',
          minWidth: 0,
          bgcolor: '#FFFAF4',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1600,
            mx: 'auto',
            p: {
              xs: 2,
              sm: 2.5,
              lg: 3.5,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
