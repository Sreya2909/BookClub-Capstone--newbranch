// src/pages/BookDetailPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Paper,
  Alert,
  CssBaseline,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';
import Footer from '../pages/Footer'; // Fixed import path

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [groupNameError, setGroupNameError] = useState('');
  const [existingGroupNames, setExistingGroupNames] = useState(new Set());
  const [success, setSuccess] = useState('');

  // Helper to sanitize date input so year is limited to 4 digits and overall
  // length does not exceed YYYY-MM-DD (10 chars). This prevents users from
  // entering a 6-digit year when typing manually.
  const sanitizeDateValue = (val) => {
    if (!val) return '';
    // If value already contains dashes, truncate each segment
    if (val.includes('-')) {
      const parts = val.split('-');
      const y = (parts[0] || '').slice(0, 4);
      const m = (parts[1] || '').slice(0, 2);
      const d = (parts[2] || '').slice(0, 2);
      let out = y;
      if (parts.length > 1) out += '-' + m;
      if (parts.length > 2) out += '-' + d;
      return out;
    }

    // If the user types digits without dashes (some browsers), try to format
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 6) return digits.slice(0, 4) + '-' + digits.slice(4);
    // 8 or more digits -> YYYY-MM-DD
    const year = digits.slice(0, 4);
    const month = digits.slice(4, 6);
    const day = digits.slice(6, 8);
    return `${year}-${month}${day ? '-' + day : ''}`;
  };

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}/`);
        setBook(res.data);
        // Fetch global group names once for client-side duplicate check
        try {
          const groupsRes = await api.get('/groups/');
          const names = new Set((groupsRes.data || []).map(g => g.name.toLowerCase()));
          setExistingGroupNames(names);
        } catch (groupsErr) {
          // If this fails, we fall back to server-side validation on submit
          console.warn('Could not fetch existing groups for name check', groupsErr);
        }
      } catch (err) {
        console.error('Failed to load book', err);
        navigate('/books');
      }
    };
    fetchBook();
  }, [id, navigate]);

  const handleJoinGroup = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join/`);
      setSuccess('Successfully joined the group!');
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || !startDate || !endDate) {
      setError('Please fill all group fields');
      return;
    }

    // Client-side duplicate name check (case-insensitive)
    if (existingGroupNames.has(groupName.trim().toLowerCase())) {
      setGroupNameError('Group name already taken');
      return;
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    try {
      await api.post('/groups/', {
        name: groupName,
        book: parseInt(id, 10),
        start_date: startDate,
        end_date: endDate,
      });
      setSuccess('Group created successfully!');
      setTimeout(() => navigate('/home'), 1500);
    } catch (err) {
      // If backend returns a specific message about name uniqueness, show it inline
      const serverMsg = err.response?.data?.error || err.response?.data?.name || '';
      if (serverMsg && /name|unique|taken|already/i.test(serverMsg)) {
        setGroupNameError('Group name already taken');
      } else {
        setError(serverMsg || 'Failed to create group');
      }
    }
  };

  if (!book) return <Typography>Loading book details...</Typography>;

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          backgroundImage: 'url(/homepage.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <NavBar />
        <Box sx={{ p: 3, flex: 1 }}>
          <Button 
            onClick={() => navigate('/books')} 
            sx={{ 
              mb: 2,
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.1)',
              }
            }}
          >
            ← Back to Books
          </Button>

          {/* Book Details */}
          <Card 
            sx={{ 
              mb: 4,
              bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
              color: 'white', // White text
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent>
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {book.title}
              </Typography>
              <Typography 
                variant="h6" 
                color="rgba(255,255,255,0.8)" 
                sx={{ mb: 2 }}
              >
                by {book.author}
              </Typography>
              <Typography 
                variant="body1" 
                paragraph
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  mb: 2
                }}
              >
                {book.description}
              </Typography>
              <Typography 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}
              >
                <strong>Genre:</strong> {book.genre} |{' '}
                <strong>Chapters:</strong> {book.total_chapters} |{' '}
                <strong>Pages:</strong> {book.total_pages}
              </Typography>
            </CardContent>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Available Groups */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 4,
              bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
              color: 'white', // White text
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Available Groups ({book.available_groups.length})
            </Typography>
            {book.available_groups.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>No groups available for this book (all full or none created).</Typography>
            ) : (
              <List>
                {book.available_groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <ListItem
                      secondaryAction={
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={group.is_full}
                          sx={{
                            backgroundColor: 'white',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                            '&:disabled': {
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              color: 'rgba(255,255,255,0.5)',
                            }
                          }}
                        >
                          {group.is_full ? 'Full' : 'Join'}
                        </Button>
                      }
                      sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        pb: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemText
                        primary={group.name}
                        secondary={`Members: ${group.member_count}/10 • ${group.start_date} to ${group.end_date}`}
                        primaryTypographyProps={{ 
                          sx: { 
                            color: 'white',
                            fontWeight: 'bold'
                          } 
                        }}
                        secondaryTypographyProps={{ 
                          sx: { 
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.875rem'
                          } 
                        }}
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>

          {/* Create Your Own Group */}
          <Paper 
            sx={{ 
              p: 2,
              bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
              color: 'white', // White text
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Create Your Own Group
            </Typography>
            <TextField
              fullWidth
              label="Group Name"
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setGroupNameError(''); setError(''); }}
              error={Boolean(groupNameError)}
              helperText={groupNameError}
              margin="dense"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  color: 'white',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(255,255,255,0.5)',
                },
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
              }}
              InputLabelProps={{
                sx: {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              InputLabelProps={{ 
                shrink: true,
                sx: {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                }
              }}
              value={startDate}
              onChange={(e) => setStartDate(sanitizeDateValue(e.target.value))}
              margin="dense"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  color: 'white',
                  WebkitTextFillColor: 'white', // Force text color
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                    opacity: 1,
                  },
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
              }}
                inputProps={{ maxLength: 10 }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              InputLabelProps={{ 
                shrink: true,
                sx: {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: 'white',
                  },
                }
              }}
                value={endDate}
                onChange={(e) => setEndDate(sanitizeDateValue(e.target.value))}
              margin="dense"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  color: 'white',
                  WebkitTextFillColor: 'white', // Force text color
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                    opacity: 1,
                  },
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'white',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                  },
                },
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 1,
              }}
                inputProps={{ maxLength: 10 }}
            />
            <Button
              variant="contained"
              onClick={handleCreateGroup}
              sx={{ 
                mt: 2,
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 'bold',
                px: 3,
                py: 1,
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
            >
              Create Group
            </Button>
          </Paper>
        </Box>
        <Footer/>
        {/* Footer */}
       
      </Box>
    </>
  );
}