# Generated migration for ChapterSchedule model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('bookclub_app', '0002_readingprogress'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChapterSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_completion_date', models.DateField()),
                ('completed', models.BooleanField(default=False)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='bookclub_app.chapter')),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='bookclub_app.readinggroup')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['chapter__chapter_number'],
                'unique_together': {('user', 'group', 'chapter')},
            },
        ),
    ]
