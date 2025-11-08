// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Grid,
  Container,
  Button,
  CssBaseline,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';
import FloatingImages from './FloatingImages';
import Footer from './Footer';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [readingProgress, setReadingProgress] = useState({}); // Track reading progress for each group
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh trigger

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const groupRes = await api.get('/groups/');
        setGroups(groupRes.data);

        // Fetch reading progress for each group
        const progressPromises = groupRes.data.map(async (group) => {
          try {
            const progressRes = await api.get(`/groups/${group.id}/progress/`);
            return {
              groupId: group.id,
              currentPage: progressRes.data.current_page || 1,
              totalPages: progressRes.data.book_details?.total_pages || 100,
            };
          } catch (err) {
            console.error(`Failed to load progress for group ${group.id}`, err);
            return {
              groupId: group.id,
              currentPage: 1,
              totalPages: 100,
            };
          }
        });

        const progressData = await Promise.all(progressPromises);
        const progressMap = {};
        progressData.forEach((p) => {
          progressMap[p.groupId] = {
            currentPage: p.currentPage,
            totalPages: p.totalPages,
            percentage: Math.round((p.currentPage / p.totalPages) * 100),
          };
        });
        setReadingProgress(progressMap);

        // Generate smart reminders based on actual reading progress vs schedule
        const newReminders = groupRes.data
          .map((group) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(group.start_date);
            startDate.setHours(0, 0, 0, 0);
            const deadline = new Date(group.deadline || group.end_date);
            deadline.setHours(0, 0, 0, 0);
            
            const totalDays = Math.max(1, (deadline - startDate) / (1000 * 60 * 60 * 24));
            const elapsedDays = (today - startDate) / (1000 * 60 * 60 * 24);
            const daysRemaining = (deadline - today) / (1000 * 60 * 60 * 24);
            
            const progress = progressMap[group.id];
            const currentProgress = progress ? progress.percentage : 0;
            
            // Calculate expected progress
            let scheduleProgress = 0;
            if (elapsedDays < 0) {
              scheduleProgress = 0; // Not started yet
            } else if (elapsedDays > totalDays) {
              scheduleProgress = 100; // Past deadline
            } else {
              scheduleProgress = (elapsedDays / totalDays) * 100;
            }
            
            // Generate different types of reminders
            const reminders = [];
            
            // 1. Deadline approaching (within 3 days)
            if (daysRemaining > 0 && daysRemaining <= 3 && currentProgress < 100) {
              reminders.push({
                groupId: group.id,
                type: 'urgent',
                message: `🚨 Urgent: Deadline for "${group.name}" is in ${Math.ceil(daysRemaining)} day(s)! You're at ${currentProgress}% on "${group.book_title}". Time to finish up!`,
              });
            }
            
            // 2. Past deadline
            else if (daysRemaining < 0 && currentProgress < 100) {
              reminders.push({
                groupId: group.id,
                type: 'overdue',
                message: `📕 "${group.name}" deadline has passed! You're at ${currentProgress}% of "${group.book_title}". Catch up when you can!`,
              });
            }
            
            // 3. Behind schedule (more than 15% behind)
            else if (elapsedDays > 0 && scheduleProgress > currentProgress + 15) {
              const pagesNeeded = progress ? Math.ceil((progress.totalPages * scheduleProgress / 100) - progress.currentPage) : 0;
              reminders.push({
                groupId: group.id,
                type: 'behind',
                message: `⚠️ You're falling behind in "${group.name}"! You're at ${currentProgress}% but should be at ${Math.round(scheduleProgress)}%. Try to read ${pagesNeeded} more pages to catch up on "${group.book_title}".`,
              });
            }
            
            // 4. Slightly behind schedule (5-15% behind) with deadline reminder
            else if (elapsedDays > 0 && scheduleProgress > currentProgress + 5 && daysRemaining <= 7) {
              reminders.push({
                groupId: group.id,
                type: 'warning',
                message: `💡 "${group.name}": You're at ${currentProgress}% of "${group.book_title}" with ${Math.ceil(daysRemaining)} days left. A little push will keep you on track!`,
              });
            }
            
            // 5. On track and doing well
            else if (elapsedDays > 0 && currentProgress >= scheduleProgress && currentProgress > 0 && currentProgress < 100 && daysRemaining > 3) {
              reminders.push({
                groupId: group.id,
                type: 'success',
                message: `✨ Great job! You're ${currentProgress}% through "${group.book_title}" in "${group.name}" and right on schedule. Keep it up!`,
              });
            }
            
            return reminders;
          })
          .flat()
          .filter(Boolean);

        setReminders(newReminders);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, refreshKey]);

  // Listen for navigation state changes (e.g., after creating a group)
  useEffect(() => {
    if (location.state?.refresh) {
      // Trigger refresh by incrementing refreshKey
      setRefreshKey(prev => prev + 1);
      // Clear the state to prevent repeated refreshes on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  if (loading) return <Typography>Loading your dashboard...</Typography>;

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
        <Container maxWidth="lg" sx={{ mt: 4, flex: 1 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              mb: 3
            }}
          >
            Welcome, {user?.username}!
          </Typography>

          {/* Smart Reminders */}
          {reminders.length > 0 && (
            <Paper 
              sx={{ 
                p: 3, 
                mb: 4, 
                bgcolor: 'rgba(255, 255, 240, 0.9)', // Cream white transparent
                color: 'black', // Black text
                maxHeight: '200px', // Make it scrollable
                overflowY: 'auto',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                🔔 Smart Reminders
              </Typography>
              <Box>
                {reminders.map((r, i) => {
                  // Map reminder types to Material-UI Alert severity
                  const severityMap = {
                    urgent: 'error',
                    overdue: 'error',
                    behind: 'warning',
                    warning: 'info',
                    success: 'success',
                  };
                  const severity = severityMap[r.type] || 'info';
                  
                  return (
                    <Alert 
                      key={i} 
                      severity={severity} 
                      sx={{ 
                        mb: 1.5,
                        color: 'black',
                        '& .MuiAlert-message': {
                          color: 'black',
                        },
                        '& .MuiAlert-action': {
                          color: 'black',
                        },
                      }}
                      action={
                        <Button 
                          color="inherit" 
                          size="small"
                          onClick={() => navigate(`/groups/${r.groupId}`)}
                        >
                          View
                        </Button>
                      }
                    >
                      {r.message}
                    </Alert>
                  );
                })}
              </Box>
            </Paper>
          )}

          <Grid container spacing={4}>
            {/* Left: Groups */}
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                  color: 'white', // White text
                  maxHeight: '400px', // Make it scrollable
                  overflowY: 'auto',
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
                  Your Reading Groups
                </Typography>
                {groups.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>No groups yet. Join or create one!</Typography>
                ) : (
                  <List>
                    {groups.map((group) => {
                      // Calculate days remaining
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const endDate = new Date(group.end_date);
                      endDate.setHours(0, 0, 0, 0);
                      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                      
                      let deadlineText = '';
                      if (daysRemaining < 0) {
                        deadlineText = `Overdue by ${Math.abs(daysRemaining)} day(s)`;
                      } else if (daysRemaining === 0) {
                        deadlineText = 'Due today!';
                      } else if (daysRemaining <= 3) {
                        deadlineText = `${daysRemaining} day(s) left`;
                      } else {
                        deadlineText = `Ends ${group.end_date}`;
                      }
                      
                      return (
                        <React.Fragment key={group.id}>
                          <ListItem 
                            sx={{ 
                              flexDirection: 'column', 
                              alignItems: 'flex-start',
                              borderBottom: '1px solid rgba(255,255,255,0.1)',
                              pb: 2,
                              mb: 2,
                            }}
                          >
                            <ListItemText
                              primary={group.name}
                              secondary={
                                <>
                                  {group.book_title}
                                  <br />
                                  👥 {group.member_count || 1} member{(group.member_count || 1) !== 1 ? 's' : ''} • 
                                  {daysRemaining < 0 ? ' 🔴 ' : daysRemaining <= 3 ? ' ⚠️ ' : ' 📅 '}
                                  {deadlineText}
                                </>
                              }
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
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ 
                                mt: 1,
                                borderColor: 'white',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'white',
                                  color: 'black',
                                }
                              }}
                              onClick={() => navigate(`/groups/${group.id}`)}
                            >
                              View Group
                            </Button>
                          </ListItem>
                        </React.Fragment>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Right: Progress + Search Button at BOTTOM */}
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: 3,
                  bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                  color: 'white', // White text
                  maxHeight: '400px', // Make it scrollable
                  overflowY: 'auto',
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
                  Reading Progress
                </Typography>
                {groups.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>Start a group to track your progress!</Typography>
                ) : (
                  groups.map((group) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset to midnight for accurate day comparison
                    
                    const startDate = new Date(group.start_date);
                    startDate.setHours(0, 0, 0, 0);
                    
                    const endDate = new Date(group.end_date);
                    endDate.setHours(0, 0, 0, 0);
                    
                    const totalDays = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
                    const elapsedDays = (today - startDate) / (1000 * 60 * 60 * 24);
                    
                    let scheduleProgress;
                    let scheduleText;
                    
                    if (elapsedDays < 0) {
                      // Group hasn't started yet
                      scheduleProgress = 0;
                      scheduleText = "Not started";
                    } else if (elapsedDays > totalDays) {
                      // Past deadline
                      scheduleProgress = 100;
                      scheduleText = "Overdue";
                    } else {
                      // In progress
                      scheduleProgress = Math.round((elapsedDays / totalDays) * 100);
                      scheduleText = `${scheduleProgress}%`;
                    }
                    
                    // Get actual reading progress
                    const progress = readingProgress[group.id] || { currentPage: 1, totalPages: 100, percentage: 0 };
                    
                    return (
                      <Box key={group.id} sx={{ mb: 3 }}>
                        <Typography 
                          variant="subtitle1" 
                          component={Link} 
                          to={`/groups/${group.id}/discussion`}
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            }
                          }}
                        >
                          {group.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            color: 'rgba(255,255,255,0.8)',
                            mb: 1
                          }}
                        >
                          {progress.percentage}% of book completed (Page {progress.currentPage} of {progress.totalPages})
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress.percentage}
                          sx={{ 
                            mt: 1, 
                            mb: 1,
                            height: 8,
                            borderRadius: 4,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: progress.percentage >= scheduleProgress ? '#4caf50' : '#ff9800',
                            },
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.75rem'
                          }}
                        >
                          Schedule: {scheduleText} • Target: Finish by {group.end_date}
                        </Typography>
                      </Box>
                    );
                  })
                )}

                {/* ✅ BUTTON MOVED TO BOTTOM */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/books')}
                    sx={{
                      backgroundColor: 'white',
                      color: 'black',
                      fontWeight: 'bold',
                      px: 3,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      }
                    }}
                  >
                    Search Books
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Footer */}
        <Box
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            py: 2,
            px: 3,
            textAlign: 'center',
            mt: 'auto',
          }}
        >
          <FloatingImages />
          <Footer/>
        </Box>
      </Box>
    </>
  );
}