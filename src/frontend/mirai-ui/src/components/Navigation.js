import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Divider,
  useMediaQuery,
  Fab,
  Collapse
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  BarChart as ChartIcon,
  Message as MessageIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  BugReport as TestIcon
} from '@mui/icons-material';

const drawerWidth = 260;

// Styled components
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
  backgroundColor: '#1e1e1e',
  color: theme.palette.primary.contrastText
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: 0,
  marginBottom: theme.spacing(0.5),
}));

const Navigation = ({ activeTab, onChangeTab, apiTestActive, onToggleApiTest }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (tab) => {
    onChangeTab(tab);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleToggleSettings = () => {
    setExpandedSettings(!expandedSettings);
  };

  const drawer = (
    <Box sx={{ 
      width: '100%', 
      bgcolor: '#1a1a1a',
      color: 'text.primary',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <DrawerHeader>
        <Typography variant="h6" fontWeight="bold">
          MirAI Admin
        </Typography>
      </DrawerHeader>
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
      <List sx={{ flexGrow: 1, p: 2 }}>
        <StyledListItem>
          <ListItemButton 
            onClick={() => handleTabChange('ChatNow')}
            selected={activeTab === 'ChatNow'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <MessageIcon color={activeTab === 'ChatNow' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Chat Now" 
              primaryTypographyProps={{ 
                color: activeTab === 'ChatNow' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>
        
        <StyledListItem>
          <ListItemButton 
            onClick={() => handleTabChange('Conversations')}
            selected={activeTab === 'Conversations'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <ChatIcon color={activeTab === 'Conversations' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Conversations" 
              primaryTypographyProps={{ 
                color: activeTab === 'Conversations' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>

        <StyledListItem>
          <ListItemButton 
            onClick={() => handleTabChange('Statistics')}
            selected={activeTab === 'Statistics'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <ChartIcon color={activeTab === 'Statistics' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Statistics" 
              primaryTypographyProps={{ 
                color: activeTab === 'Statistics' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>

        <ListItem sx={{ mt: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', letterSpacing: 1 }}>
            Configuration
          </Typography>
        </ListItem>
        
        <StyledListItem>
          <ListItemButton 
            onClick={() => handleTabChange('AgentConfiguration')}
            selected={activeTab === 'AgentConfiguration'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <PersonIcon color={activeTab === 'AgentConfiguration' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Agents" 
              primaryTypographyProps={{ 
                color: activeTab === 'AgentConfiguration' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>

        <StyledListItem>
          <ListItemButton 
            onClick={() => handleTabChange('APIModuleConfig')}
            selected={activeTab === 'APIModuleConfig'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <CodeIcon color={activeTab === 'APIModuleConfig' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="API Configuration" 
              primaryTypographyProps={{ 
                color: activeTab === 'APIModuleConfig' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <StyledListItem>
          <ListItemButton
            onClick={() => handleTabChange('Settings')}
            selected={activeTab === 'Settings'}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <SettingsIcon color={activeTab === 'Settings' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary="Settings" 
              primaryTypographyProps={{ 
                color: activeTab === 'Settings' ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>

        <StyledListItem>
          <ListItemButton
            onClick={() => onToggleApiTest()}
            selected={apiTestActive}
            sx={{
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(144, 202, 249, 0.16)',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.24)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <TestIcon color={apiTestActive ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText 
              primary={apiTestActive ? "Hide API Test" : "Show API Test"} 
              primaryTypographyProps={{ 
                color: apiTestActive ? 'primary.main' : 'text.primary' 
              }} 
            />
          </ListItemButton>
        </StyledListItem>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: 3
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile view */}
      {isMobile && (
        <>
          {/* Mobile header */}
          <AppBar 
            position="fixed" 
            sx={{ 
              bgcolor: '#1a1a1a',
              boxShadow: 1,
              display: { xs: 'block', md: 'none' }
            }}
          >
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                MirAI
              </Typography>
            </Toolbar>
          </AppBar>
          
          {/* Fab button for mobile menu */}
          <Fab
            color="primary"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1300,
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <MenuIcon />
          </Fab>
          
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                width: '85%',
                maxWidth: 320, 
                boxSizing: 'border-box',
                height: '100%'
              },
            }}
          >
            {drawer}
          </Drawer>
        </>
      )}
    </>
  );
};

export default Navigation; 