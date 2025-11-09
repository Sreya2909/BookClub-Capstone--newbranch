import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Typography
} from '@mui/material';
import api from '../../api/axiosConfig';

const CreateGroupDialog = ({ bookId, onGroupCreated, open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    max_members: '',
    description: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate input
      if (!formData.name || !formData.max_members) {
        throw new Error('Please fill in all required fields');
      }

      const maxMembers = parseInt(formData.max_members);
      if (isNaN(maxMembers) || maxMembers < 2) {
        throw new Error('Maximum members must be at least 2');
      }

      // Make API call
      const response = await api.post('/groups/', {
        name: formData.name,
        max_members: maxMembers,
        description: formData.description,
        book: bookId
      });

      // Handle success
      onGroupCreated(response.data);
      onClose();

    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // Backend returned an error
        const errorMessage = err.response.data.detail || 
                           err.response.data.error ||
                           'Failed to create group';
        setError(errorMessage);
      } else if (err.request) {
        // Network error
        setError('Network error. Please check your connection.');
      } else {
        // Client-side validation error or other error
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Reading Group</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Group Name"
            type="text"
            fullWidth
            required
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            margin="dense"
            name="max_members"
            label="Maximum Members"
            type="number"
            fullWidth
            required
            value={formData.max_members}
            onChange={handleChange}
            disabled={loading}
            inputProps={{ min: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global error notification for network errors */}
      <Snackbar
        open={error && !error.includes('Please fill')}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateGroupDialog;