from django.db import models
from django.contrib.auth.models import User

class ConversationSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Session {self.id} for {self.user.username}"

class Message(models.Model):
    SESSION_SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SESSION_SENDER_CHOICES)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} at {self.timestamp}: {self.text[:30]}"