import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Collapse,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DateRange as DateRangeIcon,
  Category as CategoryIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import CategorySelect from './CategorySelect';
import { CategoryResponse, SearchQuery } from '../types/api';
import { useCategoriesList } from '../hooks/useCategories';

interface AdvancedSearchProps {
  onSearch: (query: SearchQuery) => void;
  onClear: () => void;
  isLoading?: boolean;
  initialQuery?: SearchQuery;
  showAdvanced?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onClear,
  isLoading = false,
  initialQuery,
  showAdvanced = false,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery?.q || '');
  const [selectedCategories, setSelectedCategories] = useState<CategoryResponse[]>([]);
  const [tags, setTags] = useState<string[]>(initialQuery?.tags || []);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [includeContent, setIncludeContent] = useState(true);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  
  // Hooks
  const { data: categories = [] } = useCategoriesList();
  
  // Initialize with initial query if provided
  React.useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery.q || '');
      setTags(initialQuery.tags || []);
      
      // Set selected categories
      if (initialQuery.category_ids && initialQuery.category_ids.length > 0) {
        const matchedCategories = categories.filter(cat => 
          initialQuery.category_ids?.includes(cat.id)
        );
        setSelectedCategories(matchedCategories);
      }
    }
  }, [initialQuery, categories]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() && selectedCategories.length === 0 && tags.length === 0) {
      return;
    }

    const query: SearchQuery = {
      q: searchQuery.trim(),
      category_ids: selectedCategories.map(cat => cat.id),
      tags: tags.filter(tag => tag.trim()),
      skip: 0,
      limit: 20,
    };

    onSearch(query);
  }, [searchQuery, selectedCategories, tags, onSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSelectedCategories([]);
    setTags([]);
    setDateFrom('');
    setDateTo('');
    setSortBy('relevance');
    setSortOrder('desc');
    setIncludeContent(true);
    setIncludeTitle(true);
    setIncludeTags(true);
    onClear();
  }, [onClear]);

  // Handle keyboard events
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle tag changes
  const handleTagsChange = useCallback((event: any, newTags: string[]) => {
    const cleanTags = newTags
      .filter(tag => tag.trim())
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
    setTags(cleanTags);
  }, []);

  // Check if search has filters applied
  const hasFilters = selectedCategories.length > 0 || tags.length > 0 || dateFrom || dateTo;
  
  // Check if search is ready
  const isSearchReady = searchQuery.trim() || selectedCategories.length > 0 || tags.length > 0;

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} />
            Advanced Search
          </Typography>
          <Button
            variant="text"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            endIcon={isAdvancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {isAdvancedOpen ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>

          {/* Basic search */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              label="Search articles..."
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
              helperText={
                hasFilters ? `Search with ${selectedCategories.length + tags.length} filters applied` : 
                'Enter keywords or use filters below'
              }
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={isLoading || !isSearchReady}
              startIcon={isLoading ? undefined : <SearchIcon />}
              sx={{ minWidth: 120, height: 56 }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              startIcon={<ClearIcon />}
              sx={{ minWidth: 100, height: 56 }}
              disabled={isLoading}
            >
              Clear
            </Button>
          </Box>

          {/* Advanced filters */}
          <Collapse in={isAdvancedOpen}>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterIcon sx={{ mr: 1 }} />
                Filters
              </Typography>

              <Grid container spacing={3}>
                {/* Categories */}
                <Grid item xs={12} md={6}>
                  <CategorySelect
                    value={selectedCategories}
                    onChange={setSelectedCategories}
                    label="Categories"
                    placeholder="Filter by categories"
                    helperText="Select categories to filter results"
                    multiple={true}
                    showCreateButton={false}
                    maxSelection={10}
                  />
                </Grid>

                {/* Tags */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]} // Could be populated with existing tags from API
                    value={tags}
                    onChange={handleTagsChange}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip 
                          variant="outlined" 
                          label={option} 
                          size="small" 
                          icon={<TagIcon />}
                          {...getTagProps({ index })} 
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Add tags to filter"
                        helperText="Press Enter to add tags"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <TagIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Date range */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Filter articles from this date"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DateRangeIcon />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Filter articles until this date"
                  />
                </Grid>

                {/* Sort options */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date' | 'title')}
                    >
                      <MenuItem value="relevance">Relevance</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                      <MenuItem value="title">Title</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sort Order</InputLabel>
                    <Select
                      value={sortOrder}
                      label="Sort Order"
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Search scope */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Search Scope
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeTitle}
                        onChange={(e) => setIncludeTitle(e.target.checked)}
                      />
                    }
                    label="Include Title"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeContent}
                        onChange={(e) => setIncludeContent(e.target.checked)}
                      />
                    }
                    label="Include Content"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeTags}
                        onChange={(e) => setIncludeTags(e.target.checked)}
                      />
                    }
                    label="Include Tags"
                  />
                </Box>
              </Box>

              {/* Active filters summary */}
              {hasFilters && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Filters
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedCategories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        size="small"
                        color="primary"
                        variant="filled"
                        onDelete={() => setSelectedCategories(prev => 
                          prev.filter(c => c.id !== category.id)
                        )}
                        sx={{ 
                          backgroundColor: category.color ? `${category.color}40` : undefined,
                        }}
                      />
                    ))}
                    {tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        color="secondary"
                        variant="filled"
                        onDelete={() => setTags(prev => prev.filter(t => t !== tag))}
                      />
                    ))}
                    {dateFrom && (
                      <Chip
                        label={`From: ${new Date(dateFrom).toLocaleDateString()}`}
                        size="small"
                        color="info"
                        variant="filled"
                        onDelete={() => setDateFrom('')}
                      />
                    )}
                    {dateTo && (
                      <Chip
                        label={`To: ${new Date(dateTo).toLocaleDateString()}`}
                        size="small"
                        color="info"
                        variant="filled"
                        onDelete={() => setDateTo('')}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Stack>
          </Collapse>
        </Stack>
      </Paper>
    );
};

export default AdvancedSearch;