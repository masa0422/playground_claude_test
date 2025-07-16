import React, { useState, useCallback } from 'react';
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
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import {
  Home as HomeIcon,
  Category as CategoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  List as ListIcon,
  AccountTree as TreeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Article as ArticleIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import CategoryTree from '../../components/CategoryTree';
import CategorySelect from '../../components/CategorySelect';
import { useCategoriesList, useCategoryOperations } from '../../hooks/useCategories';
import { useCategoriesStore } from '../../store/categories';
import { CategoryResponse, CategoryCreate, CategoryUpdate } from '../../types/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CategoriesPage: NextPage = () => {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<CategoryResponse | null>(null);
  const [newCategoryColor, setNewCategoryColor] = useState('#1976d2');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editParent, setEditParent] = useState<CategoryResponse | null>(null);
  const [editColor, setEditColor] = useState('#1976d2');

  const { data: categories = [], isLoading, error } = useCategoriesList();
  const { createCategory, updateCategory, deleteCategory, isOperating } = useCategoryOperations();
  const { clearError } = useCategoriesStore();

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle category selection
  const handleCategorySelect = (category: CategoryResponse) => {
    setSelectedCategory(category);
  };

  // Handle create category
  const handleCreateClick = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryParent(null);
    setNewCategoryColor('#1976d2');
    setCreateDialogOpen(true);
  };

  const handleCreateSave = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const categoryData: CategoryCreate = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        parent_id: newCategoryParent?.id,
      };
      
      await createCategory(categoryData);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Handle edit category
  const handleEditClick = (category: CategoryResponse) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditParent(category.parent_id ? categories.find(c => c.id === category.parent_id) || null : null);
    setEditColor(category.color || '#1976d2');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingCategory || !editName.trim()) return;
    
    try {
      const updateData: CategoryUpdate = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        color: editColor,
        parent_id: editParent?.id,
      };
      
      await updateCategory(editingCategory.id, updateData);
      setEditDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Handle delete category
  const handleDeleteClick = (category: CategoryResponse) => {
    setEditingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editingCategory) return;
    
    try {
      await deleteCategory(editingCategory.id);
      setDeleteDialogOpen(false);
      setEditingCategory(null);
      if (selectedCategory?.id === editingCategory.id) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Get category statistics
  const getCategoryStats = () => {
    const totalCategories = categories.length;
    const rootCategories = categories.filter(c => !c.parent_id).length;
    const childCategories = totalCategories - rootCategories;
    const totalArticles = categories.reduce((sum, cat) => sum + (cat.articles?.length || 0), 0);
    
    return {
      totalCategories,
      rootCategories,
      childCategories,
      totalArticles,
    };
  };

  const stats = getCategoryStats();

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
            <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Categories
          </Typography>
        </Breadcrumbs>

        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Category Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your articles with categories and hierarchical structure.
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Categories
                </Typography>
                <Typography variant="h4">
                  {stats.totalCategories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Root Categories
                </Typography>
                <Typography variant="h4">
                  {stats.rootCategories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Child Categories
                </Typography>
                <Typography variant="h4">
                  {stats.childCategories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Articles
                </Typography>
                <Typography variant="h4">
                  {stats.totalArticles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error display */}
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main content */}
        <Paper elevation={1}>
          {/* Header with search and create button */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateClick}
                disabled={isOperating}
              >
                Create Category
              </Button>
            </Box>

            {/* Search */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="category view tabs">
              <Tab
                icon={<TreeIcon />}
                label="Tree View"
                id="category-tab-0"
                aria-controls="category-tabpanel-0"
              />
              <Tab
                icon={<ListIcon />}
                label="List View"
                id="category-tab-1"
                aria-controls="category-tabpanel-1"
              />
            </Tabs>
          </Box>

          {/* Tree View */}
          <TabPanel value={currentTab} index={0}>
            <CategoryTree
              onCategorySelect={handleCategorySelect}
              selectedCategoryId={selectedCategory?.id}
              showArticleCount={true}
              allowEdit={true}
              allowDelete={true}
              allowCreate={true}
            />
          </TabPanel>

          {/* List View */}
          <TabPanel value={currentTab} index={1}>
            <Grid container spacing={2}>
              {filteredCategories.map((category) => (
                <Grid item xs={12} sm={6} md={4} key={category.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                      },
                      border: selectedCategory?.id === category.id ? 2 : 0,
                      borderColor: 'primary.main',
                    }}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FolderIcon 
                          sx={{ 
                            color: category.color || 'primary.main',
                            mr: 1,
                          }} 
                        />
                        <Typography variant="h6" component="h3" noWrap>
                          {category.name}
                        </Typography>
                      </Box>
                      
                      {category.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 1 }}
                          noWrap
                        >
                          {category.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`${category.articles?.length || 0} articles`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          icon={<ArticleIcon />}
                        />
                        {category.parent_id && (
                          <Chip
                            label="Child"
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(category);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(category);
                        }}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {filteredCategories.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchQuery ? 'No categories found' : 'No categories yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery 
                    ? 'Try adjusting your search query'
                    : 'Create your first category to get started'
                  }
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>

        {/* Create Category Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
              <CategorySelect
                value={newCategoryParent ? [newCategoryParent] : []}
                onChange={(categories) => setNewCategoryParent(categories[0] || null)}
                label="Parent Category"
                multiple={false}
                placeholder="Select parent category (optional)"
                showCreateButton={false}
              />
              <TextField
                label="Color"
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateSave}
              variant="contained"
              disabled={!newCategoryName.trim() || isOperating}
            >
              {isOperating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Category Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
              <CategorySelect
                value={editParent ? [editParent] : []}
                onChange={(categories) => setEditParent(categories[0] || null)}
                label="Parent Category"
                multiple={false}
                placeholder="Select parent category (optional)"
                showCreateButton={false}
              />
              <TextField
                label="Color"
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleEditSave}
              variant="contained"
              disabled={!editName.trim() || isOperating}
            >
              {isOperating ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Category Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{editingCategory?.name}"? This action cannot be undone.
            </Typography>
            {editingCategory && categories.some(c => c.parent_id === editingCategory.id) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This category has subcategories. All subcategories will also be deleted.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleDeleteConfirm}
              color="error"
              variant="contained"
              disabled={isOperating}
            >
              {isOperating ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default CategoriesPage;