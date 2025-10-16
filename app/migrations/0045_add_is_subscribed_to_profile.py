# Generated manually
from django.db import migrations, models

def set_existing_users_subscribed(apps, schema_editor):
    Profile = apps.get_model('app', 'Profile')
    for profile in Profile.objects.all():
        profile.is_subscribed = True
        profile.save()

class Migration(migrations.Migration):
    dependencies = [
        ('app', '0044_task_console_link'),  # Updated to point to the latest migration
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='is_subscribed',
            field=models.BooleanField(default=False, help_text='Whether this user has an active subscription', verbose_name='Is Subscribed'),
        ),
        migrations.RunPython(set_existing_users_subscribed),
    ]