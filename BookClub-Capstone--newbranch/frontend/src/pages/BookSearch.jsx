// src/pages/BookSearch.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  CssBaseline,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import NavBar from '../components/layout/NavBar';
import Footer from '../pages/Footer';

export default function BookSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [books, setBooks] = useState([]);
  const [genres] = useState(['Fiction', 'Non-Fiction', 'Sci-Fi', 'Mystery', 'Biography']);

  const handleSearch = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (genre) params.genre = genre;
      const res = await api.get('/books/', { params });
      setBooks(res.data);
    } catch (err) {
      console.error('Search failed', err);
      setBooks([]);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

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
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              mb: 3
            }}
          >
            Search Books
          </Typography>
          
          <Box
            sx={{
              bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
              p: 3,
              borderRadius: 2,
              mb: 4,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Search by title or author"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Genre</InputLabel>
                  <Select 
                    value={genre} 
                    label="Genre" 
                    onChange={(e) => setGenre(e.target.value)}
                    sx={{
                      '& .MuiSelect-select': {
                        color: 'white',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'white',
                      },
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'rgba(128, 128, 128, 0.9)',
                          color: 'white',
                        },
                      },
                    }}
                  >
                    <MenuItem value="" sx={{ color: 'white' }}>All Genres</MenuItem>
                    {genres.map((g) => (
                      <MenuItem key={g} value={g} sx={{ color: 'white' }}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button 
                  variant="contained" 
                  onClick={handleSearch} 
                  sx={{ 
                    height: '100%',
                    backgroundColor: 'white',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    }
                  }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    bgcolor: 'rgba(128, 128, 128, 0.3)', // Grey transparent
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography 
                      color="rgba(255,255,255,0.8)" // Light gray text
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)'
                      }}
                    >
                      by {book.author}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ 
                        mt: 2,
                        borderColor: 'white',
                        color: 'white',
                        fontWeight: 'bold',
                        '&:hover': {
                          backgroundColor: 'white',
                          color: 'black',
                        }
                      }}
                      fullWidth
                      onClick={() => navigate(`/books/${book.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
      </Box>
    </>
  );
}