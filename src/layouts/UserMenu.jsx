import { useState } from 'react';
import { Avatar, Box, Divider, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useAuth } from '@/hooks/useAuth';

// Displays the signed-in user and the role active in the selected institute.
export default function UserMenu() {
  const { user, currentRoleName, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const fullName = user?.name || 'User';
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const closeMenu = () => setAnchor(null);

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          minWidth: 0,
          p: 0.5,
          border: 0,
          borderRadius: 3,
          bgcolor: 'transparent',
          color: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: '#E8ECFF',
            color: '#2444A5',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, maxWidth: 190 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>
            {fullName}
          </Typography>
          <Typography noWrap color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.25 }}>
            {currentRoleName || 'No role'}
          </Typography>
        </Box>
        <ExpandMoreRoundedIcon
          sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}
        />
      </Box>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 700 }}>{fullName}</Typography>
          <Typography color="text.secondary" variant="body2">
            {currentRoleName || 'No role'}
          </Typography>
          {user?.email && (
            <Typography color="text.secondary" variant="caption">
              {user.email}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
            logout();
          }}
        >
          <ListItemIcon>
            <LogoutOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
