#!/usr/bin/env python
"""Script to add dummy members with varying progress to groups"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookclub.settings')
django.setup()

from django.contrib.auth.models import User
from bookclub_app.models import ReadingGroup, GroupMembership, ReadingProgress, Book

# Create dummy users
dummy_users = [
    {'username': 'sarah', 'password': 'pass123'},
    {'username': 'john', 'password': 'pass123'},
    {'username': 'emily', 'password': 'pass123'},
    {'username': 'mike', 'password': 'pass123'},
    {'username': 'lisa', 'password': 'pass123'},
    {'username': 'tom', 'password': 'pass123'},
]

print("Creating dummy users...")
users = []
for user_data in dummy_users:
    user, created = User.objects.get_or_create(
        username=user_data['username'],
        defaults={'password': user_data['password']}
    )
    if created:
        user.set_password(user_data['password'])
        user.save()
        print(f"✓ Created user: {user.username}")
    else:
        print(f"- User already exists: {user.username}")
    users.append(user)

# Add users to group 3 (To Kill a Mockingbird)
group = ReadingGroup.objects.get(id=3)
book = group.book

print(f"\nAdding members to group: {group.name}")
for user in users:
    membership, created = GroupMembership.objects.get_or_create(
        user=user,
        group=group
    )
    if created:
        print(f"✓ Added {user.username} to group")
    else:
        print(f"- {user.username} already in group")

# Create reading progress with different levels
progress_data = [
    {'user': 'sarah', 'page': 50, 'speed': 2},      # 50% - On track
    {'user': 'john', 'page': 75, 'speed': 2},       # 75% - Ahead
    {'user': 'emily', 'page': 100, 'speed': 1},     # 100% - Completed
    {'user': 'mike', 'page': 30, 'speed': 3},       # 30% - Behind
    {'user': 'lisa', 'page': 15, 'speed': 4},       # 15% - Way behind
    {'user': 'tom', 'page': 100, 'speed': 2},       # 100% - Completed
]

print(f"\nSetting reading progress (Total pages: {book.total_pages})...")
for data in progress_data:
    user = User.objects.get(username=data['user'])
    progress, created = ReadingProgress.objects.get_or_create(
        user=user,
        book=book,
        group=group,
        defaults={
            'current_page': data['page'],
            'reading_speed_minutes': data['speed']
        }
    )
    if not created:
        progress.current_page = data['page']
        progress.reading_speed_minutes = data['speed']
        progress.save()
    
    percent = (data['page'] / book.total_pages) * 100
    print(f"✓ {user.username}: {data['page']}/{book.total_pages} pages ({percent:.0f}%)")

print("\n✅ Dummy members added successfully!")
print(f"Group '{group.name}' now has {GroupMembership.objects.filter(group=group).count()} members")
