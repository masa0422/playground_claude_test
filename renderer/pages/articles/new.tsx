import React, { useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Alert,
} from '@mui/material';
import { Home as HomeIcon, Article as ArticleIcon } from '@mui/icons-material';
import Layout from '../../components/Layout';
import { ArticleEditor } from '../../components/ArticleEditor';
import { useArticleOperations } from '../../hooks/useArticles';
import { useArticlesStore } from '../../store/articles';
import { useCategoriesList } from '../../hooks/useCategories';
import { ArticleCreate } from '../../types/api';

const NewArticlePage: NextPage = () => {
  const router = useRouter();
  const { createArticle, isCreating } = useArticleOperations();
  const { error, clearError } = useArticlesStore();
  const { data: categories = [] } = useCategoriesList();
  
  // Handle article creation
  const handleSave = useCallback(async (data: ArticleCreate) => {
    try {
      const newArticle = await createArticle(data);
      
      // Redirect to the new article's detail page
      router.push(`/articles/${newArticle.id}`);
    } catch (error) {
      // Error is handled by the store and displayed in ArticleEditor
      console.error('Failed to create article:', error);
    }
  }, [createArticle, router]);
  
  // Handle cancel - go back to articles list
  const handleCancel = useCallback(() => {
    router.push('/articles');
  }, [router]);
  
  // Handle draft save (for auto-save functionality)
  const handleDraftSave = useCallback(async (data: Partial<ArticleCreate>) => {
    // In a real app, this would save to localStorage or a draft API endpoint
    console.log('Draft saved:', data);
    
    // For now, just store in localStorage
    localStorage.setItem('article-draft', JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }));
  }, []);
  
  // Load draft on component mount
  React.useEffect(() => {
    const draft = localStorage.getItem('article-draft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        // Could restore draft data here if needed
        console.log('Draft found:', draftData);
      } catch (error) {
        console.error('Failed to parse draft:', error);
        localStorage.removeItem('article-draft');
      }
    }
  }, []);
  
  // Clear draft after successful save
  React.useEffect(() => {
    return () => {
      // This would run when navigating away
      // In a real app, you might want to ask user if they want to save draft
    };
  }, []);
  
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
          <Typography color="text.primary">New Article</Typography>
        </Breadcrumbs>
        
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Article
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Write and publish a new article to your knowledge base.
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
          mode="create"
          isLoading={isCreating}
          error={error}
          onSave={handleSave}
          onCancel={handleCancel}
          onDraftSave={handleDraftSave}
          showPreview={true}
          autoSave={true}
          autoSaveInterval={30000} // 30 seconds
          availableCategories={categories}
        />
        
        {/* Help text */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Tips for writing great articles:
          </Typography>
          <Typography variant="body2" component="div">
            <ul>
              <li>Use clear, descriptive titles that summarize the content</li>
              <li>Structure your content with headers (##, ###) for better organization</li>
              <li>Add relevant tags to make your articles easier to find</li>
              <li>Assign appropriate categories to group related content</li>
              <li>Use code blocks (```) for technical content and examples</li>
              <li>Your work is automatically saved as you type</li>
            </ul>
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
};

export default NewArticlePage;