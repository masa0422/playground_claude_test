import { NextPage } from 'next';
import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, Article } from '@mui/icons-material';
import Layout from '../components/Layout';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

const SearchPage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // TODO: Implement actual search API call
      // For now, this is a placeholder
      setTimeout(() => {
        setSearchResults([
          {
            id: '1',
            title: 'Sample Article',
            content: 'This is a sample article content...',
            categories: ['Technology', 'Development'],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Search error:', error);
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Search Articles
        </Typography>

        <Box sx={{ mb: 4 }}>
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
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {hasSearched && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length})
            </Typography>

            {searchResults.length === 0 && !loading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No articles found for "{searchQuery}"
                </Typography>
              </Paper>
            ) : (
              <List>
                {searchResults.map((result) => (
                  <ListItem key={result.id} divider>
                    <Paper
                      sx={{
                        width: '100%',
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Article sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="h3">
                          {result.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {result.content.substring(0, 200)}...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {result.categories.map((category) => (
                          <Chip
                            key={category}
                            label={category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(result.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default SearchPage;