import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookclub.settings')
django.setup()

from bookclub_app.models import Book

def update_book_covers():
    # Map book titles to their cover image URLs
    book_covers = {
        'Atomic Habits': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
        'It Ends with Us': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1470427186i/27362503.jpg',
        'The Silent Patient': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1582759969i/40097951.jpg',
        'The Alchemist': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1483412266i/865.jpg',
        'Half Girlfriend': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421669529i/22609885.jpg',
        'The Book Thief': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1522157426i/19063.jpg'
    }

    for title, cover_url in book_covers.items():
        try:
            book = Book.objects.get(title=title)
            book.cover_image = cover_url
            book.save()
            print(f"✓ Updated cover for '{title}'")
        except Book.DoesNotExist:
            print(f"✗ Book '{title}' not found")

    print("\n✅ All book covers updated!")

if __name__ == '__main__':
    update_book_covers()
