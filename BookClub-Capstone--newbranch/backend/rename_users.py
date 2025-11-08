#!/usr/bin/env python
"""Script to rename dummy users to simpler names"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bookclub.settings')
django.setup()

from django.contrib.auth.models import User

# Rename users
renames = [
    ('sarah_reader', 'sarah'),
    ('john_bookworm', 'john'),
    ('emily_fast', 'emily'),
    ('mike_slow', 'mike'),
    ('lisa_behind', 'lisa'),
    ('tom_completed', 'tom'),
]

print("Renaming users to simpler names...")
for old_name, new_name in renames:
    try:
        user = User.objects.get(username=old_name)
        user.username = new_name
        user.save()
        print(f"✓ Renamed '{old_name}' to '{new_name}'")
    except User.DoesNotExist:
        print(f"- User '{old_name}' not found, skipping")

print("\n✅ All users renamed successfully!")
