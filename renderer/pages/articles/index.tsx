import React, { useState, useCallback, useMemo } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  Fab,
} from '@mui/material';
import {
  Home as HomeIcon,
  Article as ArticleIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import Layout from '../../components/Layout';
import { useArticlesList } from '../../hooks/useArticles';
import { useArticlesStore } from '../../store/articles';
import { useCategoriesList } from '../../hooks/useCategories';
import CategorySelect from '../../components/CategorySelect';
import { ArticleListResponse, CategoryResponse } from '../../types/api';

type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'title_asc' | 'title_desc';

const ArticlesListPage: NextPage = () => {
  const router = useRouter();
  const { category: categoryParam } = router.query;
  
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [selectedCategories, setSelectedCategories] = useState<CategoryResponse[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Calculate pagination params
  const skip = (page - 1) * itemsPerPage;
  const paginationParams = { skip, limit: itemsPerPage };
  
  // Hooks
  const { data: articles = [], isLoading, error: fetchError } = useArticlesList(paginationParams);
  const { data: categories = [] } = useCategoriesList();
  const { error, clearError } = useArticlesStore();
  
  // Handle category parameter from URL
  React.useEffect(() => {
    if (categoryParam && categories.length > 0) {
      const category = categories.find(cat => cat.id === categoryParam);
      if (category && !selectedCategories.find(c => c.id === category.id)) {
        setSelectedCategories([category]);
      }
    }
  }, [categoryParam, categories, selectedCategories]);
  
  // Filter and sort articles locally (in a real app, this would be done server-side)
  const filteredAndSortedArticles = useMemo(() => {
    let result = [...articles];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(article =>
        article.title.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        article.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    // Filter by selected categories
    if (selectedCategories.length > 0) {
      const selectedCategoryIds = selectedCategories.map(cat => cat.id);
      result = result.filter(article =>
        article.categories?.some(category => 
          selectedCategoryIds.includes(category.id)
        )
      );
    }
    
    // Sort articles
    result.sort((a, b) => {
      switch (sortBy) {
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'updated_desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated_asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    
    return result;
  }, [articles, searchTerm, sortBy, selectedCategories]);
  
  // Calculate pagination for filtered results
  const totalItems = filteredAndSortedArticles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArticles = filteredAndSortedArticles.slice(startIndex, endIndex);
  
  // Handle navigation
  const handleCreateNew = useCallback(() => {
    router.push('/articles/new');
  }, [router]);
  
  const handleViewArticle = useCallback((id: string) => {
    router.push(`/articles/${id}`);
  }, [router]);
  
  const handleEditArticle = useCallback((id: string) => {
    router.push(`/articles/${id}/edit`);
  }, [router]);
  
  // Handle search
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  }, []);
  
  // Handle sort change
  const handleSortChange = useCallback((event: any) => {
    setSortBy(event.target.value as SortOption);
    setPage(1); // Reset to first page when sorting
  }, []);
  
  // Handle category filter change
  const handleCategoryChange = useCallback((categories: CategoryResponse[]) => {
    setSelectedCategories(categories);
    setPage(1); // Reset to first page when filtering
  }, []);
  
  // Handle category click from article card
  const handleCategoryClick = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category && !selectedCategories.find(c => c.id === category.id)) {
      setSelectedCategories(prev => [...prev, category]);
      setPage(1);
    }
  }, [categories, selectedCategories]);
  
  // Handle page change
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  // Format article excerpt
  const getArticleExcerpt = (content: string, maxLength = 150) => {
    const plainText = content.replace(/[#*`_~]/g, '').replace(/\n/g, ' ');
    return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
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
          <Typography 
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <ArticleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Articles
          </Typography>
        </Breadcrumbs>
        
        {/* Page header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Articles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {totalItems} {totalItems === 1 ? 'article' : 'articles'} in your knowledge base
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            size="large"
          >
            New Article
          </Button>
        </Box>
        
        {/* Global error display */}
        {(error || fetchError) && (
          <Alert 
            severity="error" 
            onClose={clearError}
            sx={{ mb: 3 }}
          >
            {error || fetchError}
          </Alert>
        )}
        
        {/* Filters and search */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search articles..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <CategorySelect
                value={selectedCategories}
                onChange={handleCategoryChange}
                label="Filter by Categories"
                placeholder="Select categories to filter"
                multiple={true}
                showCreateButton={false}
                maxSelection={5}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={handleSortChange}
                  startAdornment={<SortIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="updated_desc">Recently Updated</MenuItem>
                  <MenuItem value="updated_asc">Oldest Updated</MenuItem>
                  <MenuItem value="created_desc">Recently Created</MenuItem>
                  <MenuItem value="created_asc">Oldest Created</MenuItem>
                  <MenuItem value="title_asc">Title A-Z</MenuItem>
                  <MenuItem value="title_desc">Title Z-A</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="right">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </Typography>
            </Grid>
          </Grid>
          
          {/* Active filters */}
          {selectedCategories.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Active Category Filters:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedCategories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    size="small"
                    color="primary"
                    variant="filled"
                    onDelete={() => 
                      setSelectedCategories(prev => 
                        prev.filter(c => c.id !== category.id)
                      )
                    }
                    sx={{ 
                      backgroundColor: category.color ? `${category.color}40` : undefined,
                      mb: 1,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
        
        {/* Articles grid */}
        {isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="80%" height={32} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : paginatedArticles.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
            <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No articles found' : 'No articles yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? `No articles match your search for "${searchTerm}"`
                : 'Start building your knowledge base by creating your first article'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
              >
                Create First Article
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {paginatedArticles.map((article) => (
              <Grid item xs={12} md={6} lg={4} key={article.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {article.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {getArticleExcerpt(article.content)}
                    </Typography>
                    
                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                        {article.tags.length > 3 && (
                          <Chip
                            label={`+${article.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    )}
                    
                    {/* Categories */}
                    {article.categories && article.categories.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap">
                        {article.categories.slice(0, 2).map((category) => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            size="small"
                            variant="filled"
                            clickable
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryClick(category.id);
                            }}
                            style={{ backgroundColor: category.color || undefined }}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: category.color ? 
                                  `${category.color}80` : 
                                  'action.hover',
                              },
                            }}
                          />
                        ))}
                        {article.categories.length > 2 && (
                          <Chip
                            label={`+${article.categories.length - 2}`}
                            size="small"
                            variant="filled"
                          />
                        )}
                      </Stack>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Updated {formatDate(article.updated_at)} • Version {article.version}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewArticle(article.id)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditArticle(article.id)}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
        
        {/* Floating action button for mobile */}
        <Fab
          color="primary"
          aria-label="add article"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: { xs: 'flex', md: 'none' },
          }}
          onClick={handleCreateNew}
        >
          <AddIcon />
        </Fab>
      </Container>
    </Layout>
  );
};

export default ArticlesListPage;