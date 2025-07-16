import { NextPage } from 'next';
import { Box, Typography, Button, Grid, Paper } from '@mui/material';
import { Add, Search, Category, History, ViewList } from '@mui/icons-material';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

const HomePage: NextPage = () => {
  const router = useRouter();

  const handleCreateArticle = () => {
    router.push('/articles/new');
  };

  const handleViewArticles = () => {
    router.push('/articles');
  };

  const handleSearchArticles = () => {
    router.push('/search');
  };

  const handleManageCategories = () => {
    router.push('/categories');
  };

  const handleViewHistory = () => {
    router.push('/history');
  };

  return (
    <Layout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Wiki Desktop App
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
          Your personal knowledge management system
        </Typography>

        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={handleCreateArticle}
            >
              <Add sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Create New Article
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Start writing your knowledge article
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={handleViewArticles}
            >
              <ViewList sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                View All Articles
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Browse your knowledge base
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={handleSearchArticles}
            >
              <Search sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Search Articles
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Find information quickly
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={handleManageCategories}
            >
              <Category sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                Manage Categories
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Organize your content
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={handleViewHistory}
            >
              <History sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" component="h3" gutterBottom>
                View History
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Track your changes
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default HomePage;