import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Close as CloseIcon,
  Security as SecurityIcon,
  Mic as MicIcon,
  Code as CodeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthOpen = (signUp = false) => {
    setIsSignUp(signUp);
    setAuthOpen(true);
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting:', { email, password, name });
    navigate('/conversations');
  };

  const features = [
    {
      title: 'Your AI voice assistant',
      description: 'Interact with a fully customizable AI assistant using your voice or text',
      icon: <MicIcon fontSize="large" sx={{ fontSize: 40 }} />
    },
    {
      title: 'Complete customization',
      description: 'Create your own assistant with custom voices, personalities, and knowledge',
      icon: <SettingsIcon fontSize="large" sx={{ fontSize: 40 }} />
    },
    {
      title: 'Open source',
      description: 'An open source alternative to proprietary assistants, giving you full control',
      icon: <CodeIcon fontSize="large" sx={{ fontSize: 40 }} />
    },
    {
      title: 'Secure & private',
      description: 'Your data stays with you. Host it yourself and maintain complete privacy',
      icon: <SecurityIcon fontSize="large" sx={{ fontSize: 40 }} />
    }
  ];

  return (
    <Box sx={{ 
      bgcolor: 'background.default', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box 
        component="header" 
        sx={{ 
          py: 2, 
          px: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          MirAI
          <Box 
            component="span" 
            sx={{ 
              ml: 1, 
              bgcolor: 'primary.main', 
              color: 'white', 
              px: 1, 
              py: 0.5, 
              borderRadius: 1,
              fontSize: '0.9rem',
              verticalAlign: 'super'
            }}
          >
            BETA
          </Box>
        </Typography>
        <Box>
          <Button 
            color="inherit" 
            onClick={() => handleAuthOpen(false)}
            sx={{ mr: 1 }}
          >
            Sign In
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => handleAuthOpen(true)}
          >
            Sign Up
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e0c35 0%, #3a1668 100%)',
          py: { xs: 8, md: 15 },
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(128,0,255,0.2) 0%, rgba(255,0,255,0) 70%)',
            zIndex: 0,
            display: { xs: 'none', md: 'block' }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '5%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0) 70%)',
            zIndex: 0,
            display: { xs: 'none', md: 'block' }
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ pr: { md: 5 } }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  Your personal AI assistant, your rules
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: 1.5
                  }}
                >
                  Create, customize, and interact with your own AI voice assistant. Open source, private, and fully under your control.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => handleAuthOpen(true)}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem'
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    size="large"
                    onClick={() => navigate('/conversations')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      borderColor: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Try Demo
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ 
        py: { xs: 8, md: 12 }, 
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          background: 'linear-gradient(90deg, #90caf9, #ce93d8)'
        }
      }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ 
              mb: { xs: 6, md: 8 }, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #90caf9, #ce93d8)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              pb: 1
            }}
          >
            Why Choose MirAI?
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={6} key={index} sx={{ maxWidth: 550, minWidth: { md: 400 } }}>
                <Card 
                  elevation={3}
                  sx={{ 
                    height: '100%',
                    borderRadius: 4,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '4px',
                      bgcolor: 'primary.main',
                      opacity: 0.8
                    },
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: (theme) => `0 12px 20px -10px ${theme.palette.primary.main}40`
                    },
                    mx: 'auto',
                    maxWidth: '100%'
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                        color: 'primary.main',
                        background: (theme) => `${theme.palette.background.default}40`,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        mx: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      gutterBottom 
                      fontWeight="bold"
                      sx={{ mb: 2 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #90caf9, #ce93d8)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            The Open Source Advantage
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: { xs: 6, md: 8 }, maxWidth: '800px', mx: 'auto' }}
          >
            See how MirAI compares to proprietary alternatives
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Paper 
              elevation={4} 
              sx={{ 
                borderRadius: 4, 
                overflow: 'hidden',
                boxShadow: (theme) => `0 8px 40px -12px ${theme.palette.primary.main}30`,
                width: '100%',
                maxWidth: 900,
              }}
            >
              <Box sx={{ overflow: 'auto', width: '100%' }}>
                <Box component="table" sx={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  '& th, & td': { 
                    p: 3,
                    textAlign: 'left',
                    '&:not(:first-of-type)': {
                      textAlign: 'center' 
                    }
                  }
                }}>
                  <Box component="thead" sx={{ 
                    borderBottom: 2, 
                    borderColor: 'divider'
                  }}>
                    <Box component="tr">
                      <Box component="th" sx={{ width: '40%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Features</Typography>
                      </Box>
                      <Box component="th" sx={{ width: '30%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          MirAI
                        </Typography>
                      </Box>
                      <Box component="th" sx={{ width: '30%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Proprietary Assistants
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {[
                      { name: 'Data Privacy', mirai: 'Full control', others: 'Limited' },
                      { name: 'Self-hosting', mirai: '✓ Yes', others: '✗ No' },
                      { name: 'Custom Voices', mirai: '✓ Unlimited', others: 'Limited selection' },
                      { name: 'Source Code Access', mirai: '✓ Complete', others: '✗ None' },
                      { name: 'Free to Use', mirai: '✓ Forever', others: 'Subscription based' },
                    ].map((row, i) => (
                      <Box 
                        component="tr" 
                        key={i} 
                        sx={{ 
                          borderBottom: i < 4 ? 1 : 0, 
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'rgba(144, 202, 249, 0.08)'
                          }
                        }}
                      >
                        <Box component="td">
                          <Typography variant="body1" fontWeight="medium">{row.name}</Typography>
                        </Box>
                        <Box component="td">
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: row.mirai.includes('✓') ? 'success.main' : 'text.primary',
                              fontWeight: 'bold'
                            }}
                          >
                            {row.mirai}
                          </Typography>
                        </Box>
                        <Box component="td">
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: row.others.includes('✗') ? 'error.main' : 'text.secondary'
                            }}
                          >
                            {row.others}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Box 
        sx={{ 
          py: 10, 
          bgcolor: 'primary.dark',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to get started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
            Join today and take control of your AI assistant experience
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => handleAuthOpen(true)}
            sx={{
              px: 6,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1.2rem',
              boxShadow: 8
            }}
          >
            Sign Up For Free
          </Button>
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.7 }}>
            No credit card required • Cancel anytime
          </Typography>
        </Container>
      </Box>

      <Box 
        component="footer"
        sx={{ 
          py: 6, 
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>MirAI</Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            The open source AI assistant platform that puts you in control.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} MirAI. All rights reserved.
          </Typography>
        </Container>
      </Box>

      <Dialog 
        open={authOpen} 
        onClose={handleAuthClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {isSignUp ? 'Create an Account' : 'Sign In'}
            <IconButton edge="end" onClick={handleAuthClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {isSignUp && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button 
                onClick={() => setIsSignUp(!isSignUp)} 
                sx={{ ml: 1 }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      <style jsx="true">{`
        @keyframes pulse {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
          100% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </Box>
  );
};

export default LandingPage; 