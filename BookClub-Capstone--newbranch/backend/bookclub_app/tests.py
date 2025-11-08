# Create your tests here.
# bookclub_app/tests.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from .models import Book, ReadingGroup

class AuthTests(APITestCase):
    def test_register(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 201)

    def test_login(self):
        User.objects.create_user('testuser', password='testpass123')
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 200)

class BookTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('user', password='pass')
        self.client.login(username='user', password='pass')
        Book.objects.create(
            title="Test Book", author="Author", genre="Fiction",
            description="...", total_pages=100, total_chapters=10
        )

    def test_book_list(self):
        response = self.client.get('/api/books/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)