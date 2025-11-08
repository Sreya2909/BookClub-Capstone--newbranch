// src/components/books/BookCard.jsx
import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';

export default function BookCard({ book, onSelect }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {book.cover_image && (
        <CardMedia
          component="img"
          height="300"
          image={book.cover_image}
          alt={book.title}
          sx={{ objectFit: 'contain', backgroundColor: '#f5f5f5' }}
        />
      )}
      {!book.cover_image && (
        <Box 
          sx={{ 
            height: 300, 
            bgcolor: '#e0e0e0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <Typography variant="h6" color="text.secondary">No Cover</Typography>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Typography variant="h6" component="div">
          {book.title}
        </Typography>
        <Typography color="text.secondary">
          by {book.author}
        </Typography>
      </CardContent>
      <Button
        size="small"
        variant="outlined"
        onClick={onSelect}
        sx={{ m: 2, mt: 1 }}
      >
        View Details
      </Button>
    </Card>
  );
}