import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookclub.settings')
django.setup()

from bookclub_app.models import Book, Chapter

def add_books():
    books_data = [
        {
            'title': 'Atomic Habits',
            'author': 'James Clear',
            'genre': 'Self-Help',
            'description': 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny Changes, Remarkable Results - the international bestseller with over 15 million copies sold.',
            'total_pages': 320,
            'total_chapters': 20,
            'chapters': [
                'The Surprising Power of Atomic Habits',
                'How Your Habits Shape Your Identity',
                'How to Build Better Habits in 4 Simple Steps',
                'The Man Who Didn\'t Look Right',
                'The Best Way to Start a New Habit',
                'Motivation Is Overrated; Environment Often Matters More',
                'The Secret to Self-Control',
                'How to Make a Habit Irresistible',
                'The Role of Family and Friends in Shaping Your Habits',
                'How to Find and Fix the Causes of Your Bad Habits',
                'Walk Slowly, but Never Backward',
                'The Law of Least Effort',
                'How to Stop Procrastinating by Using the Two-Minute Rule',
                'How to Make Good Habits Inevitable and Bad Habits Impossible',
                'The Cardinal Rule of Behavior Change',
                'How to Stick with Good Habits Every Day',
                'How an Accountability Partner Can Change Everything',
                'The Truth About Talent',
                'The Goldilocks Rule',
                'The Downside of Creating Good Habits'
            ]
        },
        {
            'title': 'It Ends with Us',
            'author': 'Colleen Hoover',
            'genre': 'Romance',
            'description': 'A deeply moving story about love, courage, and the choices we make. Lily hasn\'t always had it easy, but that\'s never stopped her from working hard for the life she wants.',
            'total_pages': 384,
            'total_chapters': 36,
            'chapters': [f'Chapter {i}' for i in range(1, 37)]
        },
        {
            'title': 'The Silent Patient',
            'author': 'Alex Michaelides',
            'genre': 'Thriller',
            'description': 'The #1 New York Times and Sunday Times bestseller. A woman\'s act of violence against her husband - and the therapist obsessed with uncovering her motive. Over a million copies sold.',
            'total_pages': 336,
            'total_chapters': 31,
            'chapters': [f'Chapter {i}' for i in range(1, 32)]
        },
        {
            'title': 'The Alchemist',
            'author': 'Paulo Coelho',
            'genre': 'Fiction',
            'description': 'International bestselling phenomenon - a beautiful story about finding your destiny. Paulo Coelho\'s masterpiece tells the mystical story of Santiago, an Andalusian shepherd boy.',
            'total_pages': 208,
            'total_chapters': 12,
            'chapters': [
                'Part One - Chapter 1',
                'Part One - Chapter 2',
                'Part One - Chapter 3',
                'Part Two - Chapter 1',
                'Part Two - Chapter 2',
                'Part Two - Chapter 3',
                'Part Two - Chapter 4',
                'Part Two - Chapter 5',
                'Part Two - Chapter 6',
                'Part Two - Chapter 7',
                'Part Two - Chapter 8',
                'Epilogue'
            ]
        },
        {
            'title': 'Half Girlfriend',
            'author': 'Chetan Bhagat',
            'genre': 'Romance',
            'description': 'Once upon a time, there was a Bihari boy called Madhav. He fell in love with a girl from Delhi called Riya. Madhav didn\'t speak English well. Riya did. This is their story.',
            'total_pages': 280,
            'total_chapters': 39,
            'chapters': [f'Chapter {i}' for i in range(1, 40)]
        },
        {
            'title': 'The Book Thief',
            'author': 'Markus Zusak',
            'genre': 'Historical Fiction',
            'description': 'The #1 International Bestseller and major film. It is 1939. Nazi Germany. Liesel Meminger is a foster girl living outside of Munich, who scratches out a meager existence by stealing.',
            'total_pages': 584,
            'total_chapters': 10,
            'chapters': [
                'Prologue - Death and Chocolate',
                'Part One - The Grave Digger\'s Handbook',
                'Part Two - The Shoulder Shrug',
                'Part Three - Mein Kampf',
                'Part Four - The Standover Man',
                'Part Five - The Whistler',
                'Part Six - The Dream Carrier',
                'Part Seven - The Complete Duden Dictionary and Thesaurus',
                'Part Eight - The Word Shaker',
                'Part Nine - The Last Human Stranger',
                'Epilogue - The Last Color'
            ]
        }
    ]

    for book_data in books_data:
        # Check if book already exists
        existing_book = Book.objects.filter(title=book_data['title']).first()
        if existing_book:
            print(f"Book '{book_data['title']}' already exists. Skipping...")
            continue

        # Create the book
        chapters_list = book_data.pop('chapters')
        book = Book.objects.create(**book_data)
        
        # Create chapters
        for idx, chapter_title in enumerate(chapters_list, 1):
            Chapter.objects.create(
                book=book,
                chapter_number=idx,
                title=chapter_title
            )
        
        print(f"✓ Added '{book.title}' by {book.author} with {len(chapters_list)} chapters")

    print("\n✅ All books added successfully!")

if __name__ == '__main__':
    add_books()
