import React, { useState, useMemo } from 'react';
import {
  TreeView,
  TreeItem,
} from '@mui/lab';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useCategoriesList, useCategoryOperations } from '../hooks/useCategories';
import { CategoryResponse, CategoryCreate, CategoryUpdate } from '../types/api';

interface CategoryTreeProps {
  onCategorySelect?: (category: CategoryResponse) => void;
  selectedCategoryId?: string;
  showArticleCount?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowCreate?: boolean;
  maxDepth?: number;
}

interface TreeNodeData {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parent_id?: string;
  children: TreeNodeData[];
  category: CategoryResponse;
  level: number;
  articleCount: number;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  onCategorySelect,
  selectedCategoryId,
  showArticleCount = true,
  allowEdit = true,
  allowDelete = true,
  allowCreate = true,
  maxDepth = 5,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [contextMenuCategory, setContextMenuCategory] = useState<CategoryResponse | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<HTMLElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [createParentCategory, setCreateParentCategory] = useState<CategoryResponse | null>(null);
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#1976d2');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#1976d2');

  const { data: categories = [], isLoading, error } = useCategoriesList();
  const { updateCategory, deleteCategory, createCategory, isOperating } = useCategoryOperations();

  // Build tree structure
  const treeData = useMemo(() => {
    const buildTree = (categories: CategoryResponse[]): TreeNodeData[] => {
      const categoryMap = new Map<string, CategoryResponse>();
      const rootCategories: CategoryResponse[] = [];
      
      // Build category map
      categories.forEach(category => {
        categoryMap.set(category.id, category);
        if (!category.parent_id) {
          rootCategories.push(category);
        }
      });
      
      // Build tree recursively
      const buildNode = (category: CategoryResponse, level: number = 0): TreeNodeData => {
        const children = categories.filter(c => c.parent_id === category.id);
        const articleCount = category.articles?.length || 0;
        
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          parent_id: category.parent_id,
          children: children.map(child => buildNode(child, level + 1)),
          category,
          level,
          articleCount,
        };
      };
      
      return rootCategories.map(category => buildNode(category));
    };
    
    return buildTree(categories);
  }, [categories]);

  // Handle node toggle
  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, category: CategoryResponse) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuCategory(category);
    setContextMenuAnchor(event.currentTarget as HTMLElement);
  };

  const handleContextMenuClose = () => {
    setContextMenuCategory(null);
    setContextMenuAnchor(null);
  };

  // Handle edit category
  const handleEditClick = () => {
    if (contextMenuCategory) {
      setEditingCategory(contextMenuCategory);
      setEditName(contextMenuCategory.name);
      setEditDescription(contextMenuCategory.description || '');
      setEditColor(contextMenuCategory.color || '#1976d2');
      setEditDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleEditSave = async () => {
    if (!editingCategory) return;
    
    try {
      const updateData: CategoryUpdate = {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        color: editColor,
      };
      
      await updateCategory(editingCategory.id, updateData);
      setEditDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  // Handle delete category
  const handleDeleteClick = () => {
    if (contextMenuCategory) {
      setEditingCategory(contextMenuCategory);
      setDeleteDialogOpen(true);
    }
    handleContextMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!editingCategory) return;
    
    try {
      await deleteCategory(editingCategory.id);
      setDeleteDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Handle create category
  const handleCreateClick = () => {
    setCreateParentCategory(contextMenuCategory);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryColor('#1976d2');
    setCreateDialogOpen(true);
    handleContextMenuClose();
  };

  const handleCreateSave = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const createData: CategoryCreate = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        parent_id: createParentCategory?.id,
      };
      
      await createCategory(createData);
      setCreateDialogOpen(false);
      setCreateParentCategory(null);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Render tree item
  const renderTreeItem = (node: TreeNodeData) => {
    const isSelected = selectedCategoryId === node.id;
    const canAddChild = node.level < maxDepth;
    
    return (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              py: 0.5,
              px: 1,
              backgroundColor: isSelected ? theme.palette.primary.main + '20' : 'transparent',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
            onContextMenu={(e) => handleContextMenu(e, node.category)}
            onClick={() => onCategorySelect?.(node.category)}
          >
            {node.children.length > 0 ? (
              <FolderOpenIcon 
                sx={{ 
                  color: node.color || theme.palette.primary.main,
                  mr: 1,
                  fontSize: 20,
                }} 
              />
            ) : (
              <FolderIcon 
                sx={{ 
                  color: node.color || theme.palette.primary.main,
                  mr: 1,
                  fontSize: 20,
                }} 
              />
            )}
            
            <Typography
              variant="body2"
              sx={{
                flexGrow: 1,
                fontWeight: isSelected ? 'bold' : 'normal',
                color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
              }}
            >
              {node.name}
            </Typography>
            
            {showArticleCount && (
              <Chip
                label={node.articleCount}
                size="small"
                color="default"
                variant="outlined"
                icon={<ArticleIcon sx={{ fontSize: 14 }} />}
                sx={{ ml: 1, minWidth: 60 }}
              />
            )}
            
            {(allowEdit || allowDelete || (allowCreate && canAddChild)) && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, node.category);
                }}
                sx={{ ml: 1 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        }
      >
        {node.children.map(child => renderTreeItem(child))}
      </TreeItem>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading categories...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {allowCreate && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => handleCreateClick()}
            variant="outlined"
            size="small"
          >
            Create Root Category
          </Button>
        </Box>
      )}

      <TreeView
        expanded={expanded}
        onNodeToggle={handleToggle}
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        sx={{ p: 2 }}
      >
        {treeData.map(node => renderTreeItem(node))}
      </TreeView>

      {treeData.length === 0 && (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography color="text.secondary">
            No categories found. Create your first category to get started.
          </Typography>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleContextMenuClose}
      >
        {allowEdit && (
          <MenuItem onClick={handleEditClick}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit
          </MenuItem>
        )}
        {allowCreate && contextMenuCategory && contextMenuCategory.parent_id !== undefined && (
          <MenuItem onClick={handleCreateClick}>
            <AddIcon sx={{ mr: 1 }} fontSize="small" />
            Add Child
          </MenuItem>
        )}
        {allowDelete && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
            <TextField
              label="Color"
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              fullWidth
            />
          </Box>
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

      {/* Delete Dialog */}
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Category
          {createParentCategory && (
            <Typography variant="body2" color="text.secondary">
              Under: {createParentCategory.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
            <TextField
              label="Color"
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              fullWidth
            />
          </Box>
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
    </Box>
  );
};

export default CategoryTree;