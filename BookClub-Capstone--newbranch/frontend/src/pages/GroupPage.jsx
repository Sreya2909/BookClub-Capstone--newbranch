// src/pages/GroupPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Avatar,
  ListItemAvatar,
  Divider,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';

export default function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [chapterSchedules, setChapterSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [extendError, setExtendError] = useState('');
  const [updatingEndDate, setUpdatingEndDate] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/`);
        setGroup(res.data);
        
        // Fetch progress statistics (separate try-catch so group details still load)
        try {
          const statsRes = await api.get(`/groups/${groupId}/progress-stats/`);
          setProgressStats(statsRes.data);
        } catch (statsErr) {
          console.error('Failed to load progress stats', statsErr);
          // Don't fail the whole page if stats fail
          setProgressStats(null);
        }

        // Fetch chapter schedules
        try {
          const schedulesRes = await api.get(`/groups/${groupId}/chapter-schedules/`);
          setChapterSchedules(schedulesRes.data);
        } catch (schedulesErr) {
          console.error('Failed to load chapter schedules', schedulesErr);
          setChapterSchedules([]);
        }
      } catch (err) {
        console.error('Failed to load group details', err);
        alert('Failed to load group details. You may not be a member.');
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchGroupDetails();
  }, [groupId, navigate]);

  const handleStartReading = () => {
    navigate(`/groups/${groupId}/read`);
  };

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm(
      'Are you sure you want to leave this group? Your reading progress will be deleted.'
    );
    
    if (!confirmLeave) return;
    
    try {
      await api.post(`/groups/${groupId}/leave/`);
      alert('You have left the group successfully.');
      navigate('/home'); // Return to home page
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to leave group';
      alert(`Error: ${errorMsg}`);
    }
  };

  // Handlers for extending group end date (only creator)
  const handleCloseExtendDialog = () => {
    setExtendDialogOpen(false);
    setExtendError('');
  };

  const handleExtendSubmit = async () => {
    if (!newEndDate) {
      setExtendError('Please select a new end date');
      return;
    }

    // Ensure the new end date is after the current end date
    const currentEnd = group?.end_date ? new Date(group.end_date) : null;
    const proposed = new Date(newEndDate);
    if (currentEnd && proposed <= currentEnd) {
      setExtendError('New end date must be later than current end date');
      return;
    }

    setUpdatingEndDate(true);
    try {
      // Use PUT as requested by frontend flow (backend now accepts PUT for this endpoint)
      await api.put(`/groups/${groupId}/`, { end_date: newEndDate });
      // Refresh group details
      const res = await api.get(`/groups/${groupId}/`);
      setGroup(res.data);
      setSuccess('Group end date extended');
      setTimeout(() => setSuccess(''), 3000);
      setExtendDialogOpen(false);
    } catch (err) {
      // Prefer explicit detail messages from DRF (e.g., { detail: '...' })
      const resp = err.response?.data;
      const msg = resp?.detail || resp?.error || resp || 'Failed to update end date';
      setExtendError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setUpdatingEndDate(false);
    }
  };

  const getScheduleStatus = (schedule) => {
    if (schedule.completed) {
      return { label: 'Completed', color: 'success' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(schedule.target_completion_date);
    targetDate.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { label: `${Math.abs(daysRemaining)} day(s) overdue`, color: 'error' };
    } else if (daysRemaining === 0) {
      return { label: 'Due today', color: 'warning' };
    } else if (daysRemaining <= 3) {
      return { label: `${daysRemaining} day(s) remaining`, color: 'warning' };
    } else {
      return { label: `${daysRemaining} day(s) remaining`, color: 'info' };
    }
  };

  if (loading) return <Typography>Loading group details...</Typography>;
  if (!group) return <Typography>Group not found</Typography>;

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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h4"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              }}
            >
              {group.name}
            </Typography>
            {/* Only show Exit Group button if user is not the creator */}
            {user?.id !== group.creator && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleLeaveGroup}
                sx={{ 
                  minWidth: '120px',
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'rgba(255,0,0,0.1)',
                    borderColor: 'red',
                  }
                }}
              >
                Exit Group
              </Button>
            )}

            {/* Show Extend Deadline only for the group creator */}
            {user?.id === group.creator && (
              <Button
                variant="contained"
                onClick={() => { setNewEndDate(group.end_date || ''); setExtendDialogOpen(true); setExtendError(''); }}
                sx={{
                  ml: 2,
                  backgroundColor: '#1976d2',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: '#1565c0' },
                }}
              >
                Extend Deadline
              </Button>
            )}
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2, bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Book Details Card */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                  color: 'white', // White text
                  backdropFilter: 'blur(10px)',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <CardMedia
                  component="img"
                  height="400"
                  image={group.book_details?.cover_image || `https://picsum.photos/seed/${group.book}/300/400`}
                  alt={group.book_details?.title || 'Book cover'}
                  sx={{ 
                    objectFit: 'contain',
                    borderRadius: 1,
                    mb: 2,
                  }}
                />
                <CardContent sx={{ p: 0 }}>
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {group.book_details?.title}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    color="rgba(255,255,255,0.8)" 
                    gutterBottom
                  >
                    by {group.book_details?.author}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="rgba(255,255,255,0.9)" 
                    paragraph
                    sx={{ mb: 2 }}
                  >
                    {group.book_details?.description}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      mb: 1
                    }}
                  >
                    <strong>Genre:</strong> {group.book_details?.genre}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      mb: 1
                    }}
                  >
                    <strong>Pages:</strong> {group.book_details?.total_pages}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      mb: 3
                    }}
                  >
                    <strong>Chapters:</strong> {group.book_details?.total_chapters}
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{ 
                      mt: 2,
                      backgroundColor: 'white',
                      color: 'black',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                    onClick={handleStartReading}
                  >
                    Start Reading
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    sx={{ 
                      mt: 2,
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                    onClick={() => navigate(`/groups/${groupId}/schedule`)}
                  >
                    📅 My Chapter Schedule
                  </Button>

                  {/* Chapter Schedule Preview */}
                  {chapterSchedules.length > 0 && (
                    <Paper 
                      sx={{ 
                        mt: 3, 
                        p: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.1)', // Lighter transparent
                        borderRadius: 1,
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold" 
                        gutterBottom
                        sx={{ 
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        📋 My Upcoming Chapters
                      </Typography>
                      <List dense>
                        {chapterSchedules
                          .filter(schedule => !schedule.completed)
                          .sort((a, b) => new Date(a.target_completion_date) - new Date(b.target_completion_date))
                          .slice(0, 5)
                          .map((schedule) => {
                            const status = getScheduleStatus(schedule);
                            return (
                              <ListItem 
                                key={schedule.id} 
                                sx={{ 
                                  px: 0,
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  pb: 1,
                                  mb: 1,
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography 
                                      variant="body2" 
                                      fontWeight="medium"
                                      sx={{ 
                                        color: 'rgba(255,255,255,0.9)',
                                      }}
                                    >
                                      Chapter {schedule.chapter_number}: {schedule.chapter_title}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography 
                                      variant="caption" 
                                      color="rgba(255,255,255,0.7)"
                                    >
                                      Target: {new Date(schedule.target_completion_date).toLocaleDateString()}
                                    </Typography>
                                  }
                                />
                                <Chip 
                                  label={status.label} 
                                  color={status.color} 
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </ListItem>
                            );
                          })}
                      </List>
                      {chapterSchedules.filter(s => s.completed).length > 0 && (
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ display: 'block', mt: 1, color: '#4caf50' }}
                        >
                          ✅ {chapterSchedules.filter(s => s.completed).length} chapter(s) completed
                        </Typography>
                      )}
                      {chapterSchedules.filter(s => !s.completed).length > 5 && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)' }}
                        >
                          +{chapterSchedules.filter(s => !s.completed).length - 5} more chapters scheduled
                        </Typography>
                      )}
                    </Paper>
                  )}
                </CardContent>
              </Paper>
            </Grid>

            {/* Group Members List and Progress */}
            <Grid item xs={12} md={6}>
              {/* Group Progress Statistics */}
              {progressStats && (
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 3, 
                    bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                    color: 'white', // White text
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
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
                    📊 Group Progress Overview
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="rgba(255,255,255,0.8)" 
                    gutterBottom
                  >
                    Expected Progress: {progressStats.expected_progress}%
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#4caf50', 
                          color: 'white', 
                          textAlign: 'center', 
                          minHeight: 80,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4">{progressStats.completed.count}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>✅ Completed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#2196f3', 
                          color: 'white', 
                          textAlign: 'center', 
                          minHeight: 80,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4">{progressStats.on_track.count}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>👍 On Track</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#ff9800', 
                          color: 'white', 
                          textAlign: 'center', 
                          minHeight: 80,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4">{progressStats.behind.count}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>⚠️ Behind</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#757575', 
                          color: 'white', 
                          textAlign: 'center', 
                          minHeight: 80,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4">{progressStats.not_started.count}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, whiteSpace: 'nowrap' }}>⏸️ Not Started</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              <Paper 
                sx={{ 
                  p: 3,
                  bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                  color: 'white', // White text
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  maxHeight: '400px', // Make it scrollable
                  overflowY: 'auto',
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
                  Group Members ({group.members?.length || 0})
                </Typography>
                <List>
                  {group.members?.map((member) => {
                    // Find member's progress status
                    let statusColor = 'default';
                    let statusText = 'Not Started';
                    
                    
                    if (progressStats) {
                      const completed = progressStats.completed.members.find(m => m.username === member.username);
                      const onTrack = progressStats.on_track.members.find(m => m.username === member.username);
                      const behind = progressStats.behind.members.find(m => m.username === member.username);
                      const notStarted = progressStats.not_started.members.find(m => m.username === member.username);
                      
                      if (completed) {
                        statusColor = '#4caf50';
                        statusText = '✅ Completed';
                      } else if (onTrack) {
                        statusColor = '#2196f3';
                        statusText = `👍 ${onTrack.progress_percent}%`;
                      } else if (behind) {
                        statusColor = '#ff9800';
                        statusText = `⚠️ ${behind.progress_percent}%`;
                      } else if (notStarted) {
                        statusColor = '#757575';
                        statusText = '⏸️ Not Started';
                      }
                    }
                    
                    return (
                      <React.Fragment key={member.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: statusColor }}>
                              {member.username[0].toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography 
                                  sx={{ 
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {member.username}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: statusColor, 
                                    fontWeight: 'bold' 
                                  }}
                                >
                                  {statusText}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography 
                                sx={{ 
                                  color: 'rgba(255,255,255,0.7)',
                                  fontSize: '0.75rem'
                                }}
                              >
                                Joined: {new Date(member.joined_at).toLocaleDateString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider 
                          variant="inset" 
                          component="li" 
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.1)',
                            mb: 1,
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </List>
              </Paper>

              {/* Group Info */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mt: 3,
                  bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                  color: 'white', // White text
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
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
                  Reading Schedule
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    mb: 1
                  }}
                >
                  <strong>Start Date:</strong> {group.start_date}
                </Typography>
                <Typography 
                  variant="body1" 
                  paragraph
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    mb: 1
                  }}
                >
                  <strong>End Date:</strong> {group.end_date}
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)'
                  }}
                >
                  <strong>Created by:</strong> {group.creator_name}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          {/* Dialog for extending end date - only for creator */}
          <Dialog open={extendDialogOpen} onClose={handleCloseExtendDialog}>
            <DialogTitle>Extend Group Deadline</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Current end date: {group.end_date}
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={newEndDate}
                onChange={(e) => { setNewEndDate(e.target.value); setExtendError(''); }}
                inputProps={{ min: group?.end_date }}
              />
              {extendError && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setExtendError('')}>{extendError}</Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseExtendDialog}>Cancel</Button>
              <Button onClick={handleExtendSubmit} variant="contained" disabled={updatingEndDate}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

        </Container>
        
      </Box>
    </>
  );
}