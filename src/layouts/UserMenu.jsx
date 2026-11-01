import { useState } from 'react';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/hooks/useAuth';

// Round button with the user's initials; opens name, role in this institute, and Log out.
export default function UserMenu() {
  const { user, currentRoleName, logout } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <IconButton
        aria-label="Account menu"
        aria-haspopup="true"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main' }}>
          {initials}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>{currentRoleName ?? 'No role'}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>{user.email}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={logout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
