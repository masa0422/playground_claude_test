import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon } from '@mui/icons-material';
import { useCategoriesList, useCategoryOperations } from '../hooks/useCategories';
import { CategoryResponse, CategoryCreate } from '../types/api';

interface CategorySelectProps {
  value: CategoryResponse[];
  onChange: (categories: CategoryResponse[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  label?: string;
  showCreateButton?: boolean;
  maxSelection?: number;
}

interface CategoryOption {
  id: string;
  name: string;
  displayName: string;
  color?: string;
  parent_id?: string;
  path: string[];
  level: number;
  category: CategoryResponse;
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value = [],
  onChange,
  multiple = true,
  placeholder = 'Select categories...',
  disabled = false,
  error,
  helperText,
  required = false,
  label = 'Categories',
  showCreateButton = true,
  maxSelection,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<CategoryResponse | null>(null);
  const [newCategoryColor, setNewCategoryColor] = useState('#1976d2');
  
  const { data: categories = [], isLoading, error: fetchError } = useCategoriesList();
  const { createCategory, isCreating } = useCategoryOperations();

  // Build category options with hierarchy display
  const categoryOptions = useMemo(() => {
    const buildOptions = (categories: CategoryResponse[]): CategoryOption[] => {
      const categoryMap = new Map<string, CategoryResponse>();
      const rootCategories: CategoryResponse[] = [];
      
      // Build category map
      categories.forEach(category => {
        categoryMap.set(category.id, category);
        if (!category.parent_id) {
          rootCategories.push(category);
        }
      });
      
      // Build hierarchy with display names
      const buildHierarchy = (
        categories: CategoryResponse[],
        level: number = 0,
        parentPath: string[] = []
      ): CategoryOption[] => {
        const options: CategoryOption[] = [];
        
        categories.forEach(category => {
          const currentPath = [...parentPath, category.name];
          const displayName = level > 0 
            ? `${'  '.repeat(level)}└ ${category.name}`
            : category.name;
          
          options.push({
            id: category.id,
            name: category.name,
            displayName,
            color: category.color,
            parent_id: category.parent_id,
            path: currentPath,
            level,
            category,
          });
          
          // Add children
          const children = categories.filter(c => c.parent_id === category.id);
          if (children.length > 0) {
            options.push(...buildHierarchy(children, level + 1, currentPath));
          }
        });
        
        return options;
      };
      
      return buildHierarchy(rootCategories);
    };
    
    return buildOptions(categories);
  }, [categories]);

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const categoryData: CategoryCreate = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        color: newCategoryColor,
        parent_id: newCategoryParent?.id,
      };
      
      const newCategory = await createCategory(categoryData);
      
      // Add to selection if multiple mode
      if (multiple) {
        onChange([...value, newCategory]);
      } else {
        onChange([newCategory]);
      }
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryParent(null);
      setNewCategoryColor('#1976d2');
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return categoryOptions;
    
    return categoryOptions.filter(option =>
      option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.path.some(p => p.toLowerCase().includes(inputValue.toLowerCase()))
    );
  }, [categoryOptions, inputValue]);

  // Convert CategoryResponse to CategoryOption
  const getOptionFromCategory = (category: CategoryResponse): CategoryOption | undefined => {
    return categoryOptions.find(option => option.id === category.id);
  };

  // Get selected options
  const selectedOptions = value.map(getOptionFromCategory).filter(Boolean) as CategoryOption[];

  return (
    <Box>
      <Autocomplete
        multiple={multiple}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        value={selectedOptions}
        onChange={(event, newValue) => {
          if (Array.isArray(newValue)) {
            const categories = newValue.map(option => option.category);
            
            // Check max selection limit
            if (maxSelection && categories.length > maxSelection) {
              return;
            }
            
            onChange(categories);
          } else if (newValue) {
            onChange([newValue.category]);
          } else {
            onChange([]);
          }
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        options={filteredOptions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={isLoading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={!!error}
            helperText={error || helperText}
            required={required}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
            }}
          >
            <FolderIcon 
              sx={{ 
                color: option.color || theme.palette.primary.main,
                fontSize: 20,
              }} 
            />
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                color: option.level > 0 ? theme.palette.text.secondary : theme.palette.text.primary,
                fontSize: option.level > 0 ? '0.875rem' : '1rem',
              }}
            >
              {option.displayName}
            </Typography>
            {option.path.length > 1 && (
              <Typography variant="caption" color="text.secondary">
                ({option.path.join(' > ')})
              </Typography>
            )}
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              key={option.id}
              label={option.name}
              {...getTagProps({ index })}
              color="primary"
              variant="outlined"
              size="small"
              icon={<FolderIcon sx={{ color: option.color }} />}
            />
          ))
        }
        noOptionsText={
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" color="text.secondary">
              No categories found
            </Typography>
            {showCreateButton && (
              <Button
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                size="small"
                sx={{ mt: 1 }}
              >
                Create "{inputValue}"
              </Button>
            )}
          </Box>
        }
      />

      {fetchError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {fetchError}
        </Alert>
      )}

      {maxSelection && value.length >= maxSelection && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Maximum {maxSelection} categories can be selected
        </Typography>
      )}

      {/* Create Category Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Category</DialogTitle>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCategory}
            variant="contained"
            disabled={!newCategoryName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategorySelect;