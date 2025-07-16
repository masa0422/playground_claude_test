import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Skeleton,
  Grid,
} from '@mui/material';
import {
  Home as HomeIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Label as LabelIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import Layout from '../../components/Layout';
import { useArticle, useArticleOperations } from '../../hooks/useArticles';
import { useArticlesStore } from '../../store/articles';

const ArticleDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  
  // Hooks
  const { data: article, isLoading, error: fetchError } = useArticle(id);
  const { deleteArticle, isDeleting } = useArticleOperations();
  const { error, clearError } = useArticlesStore();
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Handle edit navigation
  const handleEdit = useCallback(() => {
    router.push(`/articles/${id}/edit`);
  }, [router, id]);
  
  // Handle delete confirmation
  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);
  
  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteArticle(id);
      setDeleteDialogOpen(false);
      router.push('/articles');
    } catch (error) {
      console.error('Failed to delete article:', error);
      setDeleteDialogOpen(false);
    }
  }, [deleteArticle, id, router]);
  
  // Handle view history
  const handleViewHistory = useCallback(() => {
    router.push(`/articles/${id}/history`);
  }, [router, id]);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" width="100%" height={400} />
        </Container>
      </Layout>
    );
  }
  
  // Error state
  if (fetchError && !article) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {fetchError}
          </Alert>
          <Button
            variant="outlined"
            onClick={() => router.push('/articles')}
          >
            Back to Articles
          </Button>
        </Container>
      </Layout>
    );
  }
  
  // No article found
  if (!article) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Article not found
          </Alert>
          <Button
            variant="outlined"
            onClick={() => router.push('/articles')}
          >
            Back to Articles
          </Button>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </Link>
          <Link
            color="inherit"
            href="/articles"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/articles');
            }}
          >
            <ArticleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Articles
          </Link>
          <Typography color="text.primary" noWrap sx={{ maxWidth: 300 }}>
            {article.title}
          </Typography>
        </Breadcrumbs>
        
        {/* Global error display */}
        {error && (
          <Alert 
            severity="error" 
            onClose={clearError}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}
        
        {/* Article header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h1" gutterBottom>
                {article.title}
              </Typography>
              
              {/* Metadata */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(article.created_at)}
                  </Typography>
                </Box>
                {article.updated_at !== article.created_at && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Updated: {formatDate(article.updated_at)}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  Version: {article.version}
                </Typography>
              </Stack>
              
              {/* Categories */}
              {article.categories && article.categories.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <CategoryIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Categories:
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {article.categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        size="small"
                        variant="outlined"
                        style={{ backgroundColor: category.color || undefined }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <Box>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <LabelIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Tags:
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {article.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Grid>
            
            {/* Action buttons */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEdit}
                  fullWidth
                >
                  Edit Article
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={handleViewHistory}
                  fullWidth
                >
                  View History
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  fullWidth
                >
                  {isDeleting ? 'Deleting...' : 'Delete Article'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Article content */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <MDEditor.Markdown 
            source={article.content} 
            style={{ 
              backgroundColor: 'transparent',
              color: 'inherit'
            }}
          />
        </Paper>
        
        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Article</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete "{article.title}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default ArticleDetailPage;