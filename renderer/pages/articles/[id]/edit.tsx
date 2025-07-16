import React, { useCallback, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Alert,
  Skeleton,
  Paper,
} from '@mui/material';
import {
  Home as HomeIcon,
  Article as ArticleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { ArticleEditor } from '../../../components/ArticleEditor';
import { useArticle, useArticleOperations } from '../../../hooks/useArticles';
import { useArticlesStore } from '../../../store/articles';
import { ArticleUpdate } from '../../../types/api';

const EditArticlePage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  
  // Hooks
  const { data: article, isLoading: isLoadingArticle, error: fetchError } = useArticle(id);
  const { updateArticle, isUpdating } = useArticleOperations();
  const { error, clearError } = useArticlesStore();
  
  // Handle article update
  const handleSave = useCallback(async (data: ArticleUpdate) => {
    try {
      await updateArticle(id, data);
      
      // Redirect to the article's detail page
      router.push(`/articles/${id}`);
    } catch (error) {
      // Error is handled by the store and displayed in ArticleEditor
      console.error('Failed to update article:', error);
    }
  }, [updateArticle, id, router]);
  
  // Handle cancel - go back to article detail
  const handleCancel = useCallback(() => {
    router.push(`/articles/${id}`);
  }, [router, id]);
  
  // Handle draft save (for auto-save functionality)
  const handleDraftSave = useCallback(async (data: Partial<ArticleUpdate>) => {
    // In a real app, this would save to an auto-save API endpoint
    console.log('Draft saved for article:', id, data);
    
    // For now, just store in localStorage with article ID
    localStorage.setItem(`article-edit-draft-${id}`, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }));
  }, [id]);
  
  // Load draft on component mount
  useEffect(() => {
    if (!article) return;
    
    const draft = localStorage.getItem(`article-edit-draft-${id}`);
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        console.log('Edit draft found:', draftData);
        // Could restore draft data here if needed
        // For now, we'll just log it
      } catch (error) {
        console.error('Failed to parse edit draft:', error);
        localStorage.removeItem(`article-edit-draft-${id}`);
      }
    }
  }, [article, id]);
  
  // Clear draft after successful save
  useEffect(() => {
    return () => {
      // Cleanup function - could ask user if they want to save draft
    };
  }, []);
  
  // Show loading state
  if (isLoadingArticle) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="100%" height={20} sx={{ mb: 3 }} />
          <Paper elevation={1} sx={{ p: 3 }}>
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 3 }} />
            <Skeleton variant="rectangular" width="100%" height={400} />
          </Paper>
        </Container>
      </Layout>
    );
  }
  
  // Show error state
  if (fetchError && !article) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {fetchError}
          </Alert>
          <Typography variant="body1">
            Unable to load the article for editing.
          </Typography>
        </Container>
      </Layout>
    );
  }
  
  // Show not found state
  if (!article) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Article not found
          </Alert>
          <Typography variant="body1">
            The article you're trying to edit doesn't exist or may have been deleted.
          </Typography>
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
          <Link
            color="inherit"
            href={`/articles/${id}`}
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/articles/${id}`);
            }}
          >
            <Typography color="inherit" noWrap sx={{ maxWidth: 200 }}>
              {article.title}
            </Typography>
          </Link>
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <EditIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Edit
          </Typography>
        </Breadcrumbs>
        
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Article
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Make changes to "{article.title}" (Version {article.version})
          </Typography>
        </Box>
        
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
        
        {/* Article Editor */}
        <ArticleEditor
          mode="edit"
          initialTitle={article.title}
          initialContent={article.content}
          initialTags={article.tags}
          initialCategories={article.categories}
          isLoading={isUpdating}
          error={error}
          onSave={handleSave}
          onCancel={handleCancel}
          onDraftSave={handleDraftSave}
          showPreview={true}
          autoSave={true}
          autoSaveInterval={30000} // 30 seconds
          availableCategories={[]} // Will be populated when category hooks are implemented
        />
        
        {/* Help text */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Editing Tips:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>Your changes are automatically saved as you type</li>
              <li>Use Ctrl+S (Cmd+S on Mac) to save manually</li>
              <li>Click "Preview" to see how your content will look</li>
              <li>Version history is preserved - you can always revert changes</li>
              <li>Changes to categories and tags are applied immediately</li>
            </ul>
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
};

export default EditArticlePage;