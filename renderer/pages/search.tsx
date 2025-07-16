import { NextPage } from 'next';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
  Container,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Article as ArticleIcon,
  Home as HomeIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { useSearchArticles } from '../hooks/useSearch';
import { useCategoriesList } from '../hooks/useCategories';
import { SearchQuery, ArticleListResponse } from '../types/api';

const SearchPage: NextPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<SearchQuery>({
    q: '',
    category_ids: [],
    tags: [],
    skip: 0,
    limit: 20,
  });

  // Hooks
  const { data: categories = [] } = useCategoriesList();
  const { data: searchResults, isLoading, error } = useSearchArticles(
    currentSearchParams,
    hasSearched && !!currentSearchParams.q
  );

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    const searchParams: SearchQuery = {
      q: searchQuery.trim(),
      category_ids: [],
      tags: [],
      skip: 0,
      limit: 20,
    };

    setCurrentSearchParams(searchParams);
    setHasSearched(true);
  }, [searchQuery]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setHasSearched(false);
    setCurrentSearchParams({
      q: '',
      category_ids: [],
      tags: [],
      skip: 0,
      limit: 20,
    });
  }, []);

  const handleArticleClick = useCallback((articleId: string) => {
    router.push(`/articles/${articleId}`);
  }, [router]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

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
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Search
          </Typography>
        </Breadcrumbs>

        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Search Articles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search through your knowledge base to find relevant articles.
          </Typography>
        </Box>

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search form */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              label="Search for articles..."
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              disabled={isLoading}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              startIcon={isLoading ? <CircularProgress size={16} /> : <SearchIcon />}
              sx={{ minWidth: 120, height: 56 }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            {hasSearched && (
              <Button
                variant="outlined"
                onClick={handleClear}
                startIcon={<ClearIcon />}
                sx={{ minWidth: 100, height: 56 }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Paper>

        {/* Search results */}
        {hasSearched && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Search Results for "{currentSearchParams.q}"
              {searchResults && ` (${searchResults.articles?.length || 0} found)`}
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : searchResults?.articles?.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No articles found
                </Typography>
                <Typography color="text.secondary">
                  Try adjusting your search terms or search for something else.
                </Typography>
              </Paper>
            ) : (
              <List>
                {searchResults?.articles?.map((article: ArticleListResponse) => (
                  <ListItem key={article.id} divider sx={{ px: 0 }}>
                    <Paper
                      sx={{
                        width: '100%',
                        p: 3,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleArticleClick(article.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="h3">
                          {article.title}
                        </Typography>
                      </Box>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {article.content.substring(0, 300)}
                        {article.content.length > 300 && '...'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {article.categories?.map((category) => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              backgroundColor: category.color ? `${category.color}20` : undefined,
                              borderColor: category.color || undefined,
                            }}
                          />
                        ))}
                        {article.tags?.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(article.updated_at).toLocaleDateString()} • 
                        Version: {article.version}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Container>
    </Layout>
  );
};

export default SearchPage;