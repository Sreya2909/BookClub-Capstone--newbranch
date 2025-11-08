// src/pages/ReadingPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CssBaseline,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';
import Footer from '../pages/Footer';

export default function ReadingPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSpeedSelection, setShowSpeedSelection] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPageReached, setMaxPageReached] = useState(1); // Track furthest page reached
  const [totalPages, setTotalPages] = useState(100); // Will be updated from book data
  const [canGoNext, setCanGoNext] = useState(true);
  const [lastPageTime, setLastPageTime] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false); // Prevent double-click navigation
  const [timeLeft, setTimeLeft] = useState(0); // Timer countdown

  // Dummy PDF content - pages as text
  const dummyPages = Array.from({ length: 100 }, (_, i) => ({
    pageNumber: i + 1,
    content: `
      Page ${i + 1}
      
      This is a sample page from the book. In a real implementation, this would display 
      actual PDF content using a library like react-pdf or pdf.js.
      
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
      exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
      fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
      culpa qui officia deserunt mollit anim id est laborum.
      
      Chapter ${Math.floor(i / 10) + 1} - Section ${(i % 10) + 1}
      
      The content continues with more interesting narrative that would capture the 
      reader's attention. Each page contains valuable information that contributes to 
      the overall story and understanding of the book's themes.
    `
  }));

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get(`/groups/${groupId}/progress/`);
        setProgress(res.data);
        const savedPage = res.data.current_page || 1;
        setCurrentPage(savedPage);
        setMaxPageReached(savedPage); // Set max page reached to saved progress
        
        // Check if speed is already set on the server. If set, use it and skip selection.
        // IMPORTANT: Do NOT restore the active timer from the server timestamp.
        // Timer should only count while the user stays on the page in this session.
        if (res.data.reading_speed_minutes && res.data.reading_speed_minutes > 0) {
          const serverSpeed = res.data.reading_speed_minutes;
          setSelectedSpeed(serverSpeed);
          setShowSpeedSelection(false);

          // If the user landed on their furthest-read page, start a fresh per-page timer
          // from NOW. This ensures that if they left and returned, the timer restarts.
          if (savedPage === res.data.current_page) {
            // Start local timer only while the component is mounted
            const now = Date.now();
            setLastPageTime(now);
            setCanGoNext(false);
            setTimeLeft(Math.ceil((serverSpeed * 60)));
          }
        } else {
          // Speed not set yet (0 or null), show selection dialog
          setShowSpeedSelection(true);
        }

        // Get total pages from book data
        if (res.data.book_details?.total_pages) {
          setTotalPages(res.data.book_details.total_pages);
        }
      } catch (err) {
        console.error('Failed to load reading progress', err);
        // If no progress exists, show speed selection
        setShowSpeedSelection(true);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchProgress();
  }, [groupId]);

  // Timer for page navigation restriction
  useEffect(() => {
    let timer = null;
    
    if (lastPageTime) {
      const requiredWaitMs = selectedSpeed * 60 * 1000;
      const elapsed = Date.now() - lastPageTime;
      
      if (elapsed < requiredWaitMs) {
        setCanGoNext(false);
        const remainingMs = requiredWaitMs - elapsed;
        setTimeLeft(Math.ceil(remainingMs / 1000));
        
        timer = setInterval(() => {
          const newElapsed = Date.now() - lastPageTime;
          const newRemainingMs = requiredWaitMs - newElapsed;
          
          if (newRemainingMs <= 0) {
            setCanGoNext(true);
            setTimeLeft(0);
            clearInterval(timer);
          } else {
            setTimeLeft(Math.ceil(newRemainingMs / 1000));
          }
        }, 1000);
      } else {
        setCanGoNext(true);
        setTimeLeft(0);
      }
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lastPageTime, selectedSpeed]);

  const handleSpeedSubmit = async () => {
    try {
      const res = await api.post(`/groups/${groupId}/progress/`, {
        reading_speed_minutes: selectedSpeed,
      });
      setProgress(res.data);
      setShowSpeedSelection(false);
      setLastPageTime(Date.now());
    } catch (err) {
      console.error('Failed to save reading speed', err);
      alert('Failed to save reading speed. Please try again.');
    }
  };

  const handleNextPage = async () => {
    // Prevent double-click navigation
    if (isNavigating) {
      console.log('Navigation already in progress, ignoring click');
      return;
    }
    
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      
      // Check if this is a new page (beyond max reached)
      const isNewPage = newPage > maxPageReached;
      
      if (isNewPage && !canGoNext) {
        alert(`Please wait ${selectedSpeed} minute(s) before turning to a new page.`);
        return;
      }

      // Immediately disable ALL navigation for any page change (new or old)
      setIsNavigating(true);

      setCurrentPage(newPage);
      
      // Only set timer and update progress if it's a new page
      if (isNewPage) {
        setMaxPageReached(newPage);
        const newPageTime = Date.now();
        setLastPageTime(newPageTime);
        setCanGoNext(false);

        // Update progress on server only when reaching new pages
        // last_read_at will be automatically updated by Django (auto_now=True)
        try {
          await api.put(`/groups/${groupId}/progress/`, {
            current_page: newPage,
          });
          console.log('Progress saved, new page:', newPage, 'at time:', new Date(newPageTime).toISOString());
        } catch (err) {
          console.error('Failed to update progress', err);
        } finally {
          // Re-enable navigation after operation completes
          setTimeout(() => setIsNavigating(false), 500);
        }
      } else {
        // For already-read pages: if the user returns to the furthest-read page
        // after navigating away, restart the per-page timer so it only counts
        // while the user is present on that page.
        if (newPage === maxPageReached) {
          const restartTime = Date.now();
          setLastPageTime(restartTime);
          setCanGoNext(false);
          // set countdown in seconds
          setTimeLeft(selectedSpeed * 60);
          console.log('Returned to max page, timer restarted for', selectedSpeed, 'minutes');
        }
        setTimeout(() => setIsNavigating(false), 300);
      }
    }
  };

  const handlePrevPage = () => {
    // Prevent navigation while a new page is being processed
    if (isNavigating) {
      console.log('Navigation already in progress, ignoring click');
      return;
    }
    
    if (currentPage > 1) {
      setIsNavigating(true);
      setCurrentPage(currentPage - 1);
      // When navigating away from the furthest-read page, clear the per-page
      // timer so returning to it restarts the wait period.
      setLastPageTime(null);
      if (currentPage - 1 < maxPageReached) {
        setCanGoNext(true);
      }
      // Brief delay to prevent double-clicks
      setTimeout(() => setIsNavigating(false), 300);
    }
  };

  const handleCloseBook = async () => {
    try {
      // Save the maximum page reached (not current page if user went back)
      await api.put(`/groups/${groupId}/progress/`, {
        current_page: maxPageReached,
      });
      navigate(`/groups/${groupId}`);
    } catch (err) {
      console.error('Failed to save progress', err);
      alert('Failed to save progress. Please try again.');
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

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
        <Container maxWidth="md" sx={{ mt: 2, mb: 4, flex: 1 }}>
          {/* Speed Selection Dialog */}
          <Dialog
            open={showSpeedSelection}
            onClose={() => {}}
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Choose Your Reading Speed</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select your preferred reading pace. This setting will be permanent for this book.
                You can take longer than the selected time, but not less.
              </Typography>
              <RadioGroup
                value={selectedSpeed}
                onChange={(e) => setSelectedSpeed(parseInt(e.target.value))}
              >
                <FormControlLabel value={1} control={<Radio />} label="1 page per 1 minute (Fast)" />
                <FormControlLabel value={2} control={<Radio />} label="1 page per 2 minutes (Normal)" />
                <FormControlLabel value={3} control={<Radio />} label="1 page per 3 minutes (Relaxed)" />
                <FormControlLabel value={4} control={<Radio />} label="1 page per 4 minutes (Slow)" />
                <FormControlLabel value={5} control={<Radio />} label="1 page per 5 minutes (Very Slow)" />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSpeedSubmit} variant="contained">
                Start Reading
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reading Interface */}
          {!showSpeedSelection && (
            <Box>
              {/* Header Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCloseBook}
                  sx={{ color: 'white', borderColor: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                >
                  Close Book
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Page {currentPage} of {totalPages}
                  </Typography>
                  <Typography variant="caption" color="rgba(255,255,255,0.8)">
                    Progress: Page {maxPageReached} • Speed: {selectedSpeed} min/page
                  </Typography>
                </Box>
                <Box sx={{ width: '120px' }} /> {/* Spacer for alignment */}
              </Box>

              {/* Timer Display */}
              {timeLeft > 0 && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}
                  >
                    ⏰ Wait: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </Typography>
                </Box>
              )}

              {/* Page Display */}
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  minHeight: '600px',
                  maxHeight: '600px',
                  overflow: 'auto',
                  bgcolor: '#fffef7',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.1rem',
                    lineHeight: 1.8,
                  }}
                >
                  {dummyPages[currentPage - 1]?.content}
                </Typography>
              </Paper>

              {/* Navigation Controls */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<ArrowBackIcon />}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isNavigating}
                  sx={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  Previous
                </Button>

                {!canGoNext && currentPage >= maxPageReached && (
                  <Alert severity="info" sx={{ mx: 2 }}>
                    Wait {selectedSpeed} minute(s) before next page
                  </Alert>
                )}
                
                {currentPage < maxPageReached && (
                  <Alert severity="success" sx={{ mx: 2 }}>
                    Already read - no timer required
                  </Alert>
                )}

                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || (currentPage >= maxPageReached && !canGoNext) || isNavigating}
                  sx={{ 
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  Next
                </Button>
              </Box>

              {/* Progress Info */}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((maxPageReached / totalPages) * 100)}% Complete
                </Typography>
                {currentPage !== maxPageReached && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    (Viewing page {currentPage})
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Container>
        <Footer />
      </Box>
    </>
  );
}