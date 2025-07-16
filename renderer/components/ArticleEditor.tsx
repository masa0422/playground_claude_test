import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  Typography,
  Alert,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';
import CategorySelect from './CategorySelect';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);
import { ArticleCreate, ArticleUpdate, CategoryResponse } from '../types/api';

interface ArticleEditorProps {
  // Data
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialCategories?: CategoryResponse[];
  
  // Configuration
  mode: 'create' | 'edit';
  isLoading?: boolean;
  error?: string | null;
  
  // Available options
  availableCategories?: CategoryResponse[];
  
  // Callbacks
  onSave: (data: ArticleCreate | ArticleUpdate) => Promise<void>;
  onCancel?: () => void;
  onDraftSave?: (data: Partial<ArticleCreate | ArticleUpdate>) => void;
  
  // UI preferences
  showPreview?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialTags = [],
  initialCategories = [],
  mode,
  isLoading = false,
  error,
  availableCategories = [],
  onSave,
  onCancel,
  onDraftSave,
  showPreview = true,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
}) => {
  // Form state
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [selectedCategories, setSelectedCategories] = useState<CategoryResponse[]>(initialCategories);
  
  // UI state
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Validation state
  const [titleError, setTitleError] = useState<string>('');
  const [contentError, setContentError] = useState<string>('');
  
  // Track changes for dirty state
  useEffect(() => {
    const hasChanges = 
      title !== initialTitle ||
      content !== initialContent ||
      JSON.stringify(tags) !== JSON.stringify(initialTags) ||
      JSON.stringify(selectedCategories.map(c => c.id)) !== JSON.stringify(initialCategories.map(c => c.id));
    
    setIsDirty(hasChanges);
  }, [title, content, tags, selectedCategories, initialTitle, initialContent, initialTags, initialCategories]);
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onDraftSave || !isDirty) return;
    
    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await onDraftSave({
          title: title || undefined,
          content: content || undefined,
          tags: tags.length > 0 ? tags : undefined,
          category_ids: selectedCategories.map(c => c.id),
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, autoSaveInterval);
    
    return () => clearTimeout(timer);
  }, [title, content, tags, selectedCategories, isDirty, autoSave, onDraftSave, autoSaveInterval]);
  
  // Validation
  const validateForm = useCallback((): boolean => {
    let isValid = true;
    
    // Title validation
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else if (title.length > 200) {
      setTitleError('Title must be less than 200 characters');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    // Content validation
    if (!content.trim()) {
      setContentError('Content is required');
      isValid = false;
    } else if (content.length > 50000) {
      setContentError('Content must be less than 50,000 characters');
      isValid = false;
    } else {
      setContentError('');
    }
    
    return isValid;
  }, [title, content]);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    const articleData = {
      title: title.trim(),
      content: content.trim(),
      tags: tags.filter(tag => tag.trim()),
      category_ids: selectedCategories.map(c => c.id),
    };
    
    try {
      await onSave(articleData);
      setIsDirty(false);
      setLastSaved(new Date());
    } catch (error) {
      // Error is handled by parent component
    }
  }, [title, content, tags, selectedCategories, onSave, validateForm]);
  
  // Handle tag input
  const handleTagsChange = useCallback((event: any, newTags: string[]) => {
    // Filter out empty tags and duplicates
    const cleanTags = newTags
      .filter(tag => tag.trim())
      .filter((tag, index, arr) => arr.indexOf(tag) === index);
    setTags(cleanTags);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);
  
  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {mode === 'create' ? 'Create New Article' : 'Edit Article'}
          </Typography>
          
          {/* Auto-save status */}
          {autoSave && (
            <Typography variant="caption" color="text.secondary">
              {isAutoSaving && 'Auto-saving...'}
              {lastSaved && !isAutoSaving && `Last saved: ${lastSaved.toLocaleTimeString()}`}
              {!lastSaved && !isAutoSaving && isDirty && 'Unsaved changes'}
            </Typography>
          )}
        </Box>
        
        {/* Error display */}
        {error && (
          <Alert severity="error" onClose={() => {}}>
            {error}
          </Alert>
        )}
        
        {/* Title input */}
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!titleError}
          helperText={titleError || `${title.length}/200 characters`}
          required
          fullWidth
          variant="outlined"
        />
        
        {/* Categories selection */}
        <CategorySelect
          value={selectedCategories}
          onChange={setSelectedCategories}
          label="Categories"
          placeholder="Select categories for this article"
          helperText="Choose categories to help organize your article"
          multiple={true}
          showCreateButton={true}
          maxSelection={5}
        />
        
        {/* Tags input */}
        <Autocomplete
          multiple
          freeSolo
          options={[]} // Could be populated with existing tags from API
          value={tags}
          onChange={handleTagsChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags (press Enter)"
              helperText="Press Enter to add tags"
            />
          )}
        />
        
        {/* Editor mode toggle */}
        {showPreview && (
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant={viewMode === 'edit' ? 'contained' : 'outlined'}
              startIcon={<CodeIcon />}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant={viewMode === 'preview' ? 'contained' : 'outlined'}
              startIcon={<PreviewIcon />}
              onClick={() => setViewMode('preview')}
            >
              Preview
            </Button>
          </Box>
        )}
        
        {/* Content editor */}
        <Box>
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            preview={viewMode === 'preview' ? 'preview' : 'edit'}
            hideToolbar={viewMode === 'preview'}
            data-color-mode="light"
            height={400}
          />
          {contentError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {contentError}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {content.length}/50,000 characters
          </Typography>
        </Box>
        
        {/* Action buttons */}
        <Divider />
        <Box display="flex" gap={2} justifyContent="flex-end">
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isLoading || !isDirty}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};