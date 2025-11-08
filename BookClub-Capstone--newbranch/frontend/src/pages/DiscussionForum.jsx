// src/pages/DiscussionForum.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  CssBaseline,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';

export default function DiscussionForum() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // Track which post is being replied to
  const [replyContent, setReplyContent] = useState(''); // Reply text
  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/discussion/`);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load discussion', err);
      alert('You must be a group member to view this forum');
      navigate('/home'); // Go back to dashboard
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchPosts();
  }, [groupId]);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try {
      const payload = {
        content: newPost.trim(),
      };
      const res = await api.post(`/groups/${groupId}/discussion/`, payload);
      setPosts([res.data, ...posts]); // optimistic update
      setNewPost('');
    } catch (err) {
      console.error('Post error:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.content?.[0] || 'Failed to post';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleReply = async (postId) => {
    if (!replyContent.trim()) return;
    try {
      const payload = {
        content: replyContent.trim(),
      };
      const res = await api.post(`/posts/${postId}/comments/`, payload);
      // Update the post with the new comment
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...(post.comments || []), res.data] }
          : post
      ));
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Reply error:', err.response?.data);
      const errorMsg = err.response?.data?.error || err.response?.data?.content?.[0] || 'Failed to reply';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleToggleReaction = async (postId, emoji) => {
    try {
      const res = await api.post(`/posts/${postId}/reactions/`, { emoji });
      // Update the post's reactions in state
      setPosts(posts.map(p => p.id === postId ? { ...p, reactions: res.data.reactions } : p));
    } catch (err) {
      console.error('Reaction error:', err.response?.data || err);
      alert(err.response?.data?.error || 'Failed to toggle reaction');
    }
  };

  if (loading) return <Typography>Loading discussion...</Typography>;

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
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              color: 'white',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Group Discussion
          </Typography>

          {/* New Post Form */}
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
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share your thoughts on the book..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              sx={{
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
                mb: 2,
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
            <Button
              variant="contained"
              sx={{ 
                backgroundColor: 'white',
                color: 'black',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                }
              }}
              onClick={handleCreatePost}
            >
              Post
            </Button>
          </Paper>

          {/* Posts List */}
          <List>
            {posts.map((post) => (
              <React.Fragment key={post.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    mb: 2,
                    bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                    color: 'white', // White text
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                  }}
                >
                  <ListItem alignItems="flex-start" sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {post.author_name[0].toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography 
                          variant="subtitle1"
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        >
                          {post.author_name}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="rgba(255,255,255,0.7)" 
                            sx={{ ml: 1 }}
                          >
                            {new Date(post.created_at).toLocaleDateString()}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <Typography 
                          component="span" 
                          variant="body2" 
                          sx={{ 
                            display: 'block', 
                            mt: 1,
                            color: 'rgba(255,255,255,0.9)',
                          }}
                        >
                          {post.content}
                        </Typography>
                      }
                    />
                  </ListItem>

                  {/* Comments/Replies */}
                  {post.comments && post.comments.length > 0 && (
                    <Box 
                      sx={{ 
                        ml: 7, 
                        mt: 2, 
                        borderLeft: '2px solid rgba(255,255,255,0.3)', 
                        pl: 2 
                      }}
                    >
                      {post.comments.map((comment) => (
                        <Box key={comment.id} sx={{ mb: 2 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: 'white',
                            }}
                          >
                            {comment.author_name}
                            <Typography 
                              component="span" 
                              variant="caption" 
                              color="rgba(255,255,255,0.7)" 
                              sx={{ ml: 1 }}
                            >
                              {new Date(comment.created_at).toLocaleDateString()}
                            </Typography>
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="rgba(255,255,255,0.8)"
                          >
                            {comment.content}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Reply Button and Form */}
                  <Box sx={{ ml: 7, mt: 2 }}>
                    {/* Reactions row */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      {EMOJIS.map((emoji) => {
                        const count = (post.reactions || []).filter(r => r.emoji === emoji).length;
                        const userReacted = (post.reactions || []).some(r => r.emoji === emoji && r.user === user?.id);
                        return (
                          <Button
                            key={emoji}
                            size="small"
                            variant={userReacted ? 'contained' : 'outlined'}
                            onClick={() => handleToggleReaction(post.id, emoji)}
                            sx={{
                              borderColor: 'rgba(255,255,255,0.3)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.1)',
                              },
                              '&.MuiButton-contained': {
                                backgroundColor: 'rgba(255,255,255,0.2)',
                              }
                            }}
                          >
                            {emoji} {count > 0 ? count : ''}
                          </Button>
                        );
                      })}
                    </Box>
                    {replyingTo === post.id ? (
                      <Box>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          placeholder="Write your reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          sx={{ 
                            mb: 1,
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
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleReply(post.id)}
                          sx={{ 
                            mr: 1,
                            backgroundColor: 'white',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            }
                          }}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          sx={{
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
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        onClick={() => setReplyingTo(post.id)}
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                          }
                        }}
                      >
                        Reply
                      </Button>
                    )}
                  </Box>
                </Paper>
              </React.Fragment>
            ))}
          </List>
        </Box>
       
      </Box>
    </>
  );
}