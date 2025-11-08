// src/pages/ChapterSchedulePage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Container,
  Alert,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  CssBaseline,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

export default function ChapterSchedulePage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [schedules, setSchedules] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch chapters for the group
        const chaptersRes = await api.get(`/groups/${groupId}/chapters/`);
        setGroupInfo({
          book_title: chaptersRes.data.book_title,
          start_date: chaptersRes.data.group_start_date,
          end_date: chaptersRes.data.group_end_date,
        });
        setChapters(chaptersRes.data.chapters);

        // Fetch existing schedules
        const schedulesRes = await api.get(`/groups/${groupId}/chapter-schedules/`);
        const schedulesMap = {};
        schedulesRes.data.forEach((schedule) => {
          schedulesMap[schedule.chapter] = {
            id: schedule.id,
            target_completion_date: schedule.target_completion_date,
            completed: schedule.completed,
            completed_at: schedule.completed_at,
          };
        });
        setSchedules(schedulesMap);
      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load chapter schedules. You may not be a member of this group.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchData();
  }, [groupId]);

  const handleDateChange = (chapterId, newDate) => {
    setSchedules((prev) => ({
      ...prev,
      [chapterId]: {
        ...prev[chapterId],
        target_completion_date: newDate,
      },
    }));
  };

  const handleToggleComplete = async (chapterId) => {
    const schedule = schedules[chapterId];
    if (!schedule || !schedule.id) return;

    try {
      const newCompleted = !schedule.completed;
      const res = await api.put(
        `/groups/${groupId}/chapter-schedules/${schedule.id}/`,
        { completed: newCompleted }
      );

      setSchedules((prev) => ({
        ...prev,
        [chapterId]: {
          ...prev[chapterId],
          completed: res.data.completed,
          completed_at: res.data.completed_at,
        },
      }));

      setSuccess(`Chapter ${newCompleted ? 'marked as complete' : 'reopened'}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update chapter status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveSchedules = async () => {
    // Prepare schedules data
    const schedulesData = chapters
      .filter((chapter) => schedules[chapter.id]?.target_completion_date)
      .map((chapter) => ({
        chapter: chapter.id,
        target_completion_date: schedules[chapter.id].target_completion_date,
      }));

    if (schedulesData.length === 0) {
      setError('Please set at least one chapter deadline');
      return;
    }

    try {
      const res = await api.post(`/groups/${groupId}/chapter-schedules/`, {
        schedules: schedulesData,
      });

      if (res.data.errors && res.data.errors.length > 0) {
        setError(res.data.errors.join(', '));
      } else {
        setSuccess(`Successfully saved ${res.data.created} chapter schedules!`);
        setEditMode(false);
        
        // Refresh schedules
        const schedulesRes = await api.get(`/groups/${groupId}/chapter-schedules/`);
        const schedulesMap = {};
        schedulesRes.data.forEach((schedule) => {
          schedulesMap[schedule.chapter] = {
            id: schedule.id,
            target_completion_date: schedule.target_completion_date,
            completed: schedule.completed,
            completed_at: schedule.completed_at,
          };
        });
        setSchedules(schedulesMap);
      }

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    } catch (err) {
      // Try to detect if the backend returned a validation about exceeding end date
      const respData = err.response?.data;

      const extractStrings = (input) => {
        if (!input) return [];
        if (typeof input === 'string') return [input];
        if (Array.isArray(input)) return input.flatMap(extractStrings);
        if (typeof input === 'object') return Object.values(input).flatMap(extractStrings);
        return [];
      };

      const messages = extractStrings(respData).join(' ');
      if (/exceed|exceeds|exceeding|end date|after end date|greater than end date/i.test(messages)) {
        setError('Chapter Schedule is exceeding the end date of the book');
      } else {
        setError(messages || respData?.error || 'Failed to save schedules');
      }
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (chapter) => {
    const schedule = schedules[chapter.id];
    if (!schedule || !schedule.target_completion_date) return 'default';
    if (schedule.completed) return 'success';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(schedule.target_completion_date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) return 'error'; // Overdue
    if (targetDate.getTime() === today.getTime()) return 'warning'; // Due today
    
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return 'warning'; // Due soon

    return 'info'; // On track
  };

  const getStatusText = (chapter) => {
    const schedule = schedules[chapter.id];
    if (!schedule || !schedule.target_completion_date) return 'No deadline set';
    if (schedule.completed) return `✅ Completed`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(schedule.target_completion_date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      const daysOverdue = Math.ceil((today - targetDate) / (1000 * 60 * 60 * 24));
      return `🔴 Overdue by ${daysOverdue} day(s)`;
    }
    if (targetDate.getTime() === today.getTime()) return '⚠️ Due today!';
    
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) return `⚠️ ${daysLeft} day(s) left`;

    return `📅 ${daysLeft} day(s) remaining`;
  };

  if (loading) return <Typography>Loading chapter schedules...</Typography>;

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
            <Box>
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                  color: 'white',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
                }}
              >
                My Chapter Schedule
              </Typography>
              {groupInfo && (
                <Typography 
                  variant="subtitle1" 
                  color="rgba(255,255,255,0.8)"
                  sx={{ 
                    fontWeight: 'normal',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {groupInfo.book_title}
                </Typography>
              )}
            </Box>
            <Box>
              <Button
                variant="outlined"
                onClick={() => navigate(`/groups/${groupId}`)}
                sx={{ 
                  mr: 2,
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                Back to Group
              </Button>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    }
                  }}
                >
                  Edit Schedule
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setEditMode(false)}
                    sx={{ 
                      mr: 1,
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveSchedules}
                    sx={{ 
                      backgroundColor: 'white',
                      color: 'black',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: '1px solid rgba(255,0,0,0.3)',
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: '1px solid rgba(0,255,0,0.3)',
              }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          {groupInfo && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                color: 'white', // White text
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 'bold'
                }}
              >
                <strong>Group Schedule:</strong> {groupInfo.start_date} to {groupInfo.end_date}
              </Typography>
              <Typography 
                variant="body2" 
                color="rgba(255,255,255,0.7)"
                sx={{ mt: 1 }}
              >
                Set your personal completion dates for each chapter within the group's schedule.
              </Typography>
            </Paper>
          )}

          <Paper 
            sx={{ 
              p: 2, 
              mb: 3,
              bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
              color: 'white', // White text
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
            }}
          >
            <List>
              {chapters.map((chapter, index) => {
                const schedule = schedules[chapter.id] || {};
                const statusColor = getStatusColor(chapter);
                const statusText = getStatusText(chapter);

                return (
                  <React.Fragment key={chapter.id}>
                    <ListItem
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        py: 2,
                        bgcolor: schedule.completed ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                        borderBottom: index < chapters.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, mb: { xs: 1, sm: 0 } }}>
                        <Checkbox
                          checked={schedule.completed || false}
                          onChange={() => handleToggleComplete(chapter.id)}
                          disabled={!schedule.id || editMode}
                          icon={<CheckCircleIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />}
                          checkedIcon={<CheckCircleIcon sx={{ color: '#4caf50' }} />}
                        />
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{
                                textDecoration: schedule.completed ? 'line-through' : 'none',
                                fontWeight: 'bold',
                                color: 'white',
                              }}
                            >
                              Chapter {chapter.chapter_number}: {chapter.title}
                            </Typography>
                          }
                          secondary={
                            <Chip
                              label={statusText}
                              color={statusColor}
                              size="small"
                              sx={{ 
                                mt: 0.5,
                                color: 'white',
                                '&.MuiChip-colorSuccess': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.3)',
                                },
                                '&.MuiChip-colorWarning': {
                                  backgroundColor: 'rgba(255, 152, 0, 0.3)',
                                },
                                '&.MuiChip-colorError': {
                                  backgroundColor: 'rgba(244, 67, 54, 0.3)',
                                },
                                '&.MuiChip-colorInfo': {
                                  backgroundColor: 'rgba(33, 150, 243, 0.3)',
                                },
                              }}
                            />
                          }
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TextField
                          type="date"
                          label="Target Completion Date"
                          value={schedule.target_completion_date || ''}
                          onChange={(e) => handleDateChange(chapter.id, e.target.value)}
                          disabled={!editMode}
                          InputLabelProps={{ 
                            shrink: true,
                            sx: {
                              color: 'rgba(255,255,255,0.7)',
                              '&.Mui-focused': {
                                color: 'white',
                              },
                            }
                          }}
                          inputProps={{
                            min: groupInfo?.start_date,
                            max: groupInfo?.end_date,
                            style: {
                              color: 'white',
                            }
                          }}
                          size="small"
                          sx={{ 
                            minWidth: 200,
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
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>

          {editMode && (
            <Alert 
              severity="info" 
              sx={{ 
                mt: 3,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: '1px solid rgba(33, 150, 243, 0.3)',
              }}
            >
              💡 Tip: Set realistic deadlines for each chapter. You can always adjust them later!
            </Alert>
          )}
        </Container>
        
      </Box>
    </>
  );
}