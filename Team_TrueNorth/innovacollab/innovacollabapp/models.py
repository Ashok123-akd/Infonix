from django.contrib.auth.models import AbstractUser
from django.db import models
from django.urls import reverse


# Create your models here.
class CustomUser(AbstractUser):
    mfa_secret = models.CharField(max_length=16, blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.email


class Room(models.Model):
    CATEGORY_CHOICES = [
        ("technology", "Technology"),
        ("science", "Science"),
        ("mathematics", "Mathematics"),
        ("programming", "Programming"),
        ("design", "Design"),
        ("business", "Business"),
        ("language", "Language"),
        ("other", "Other"),
    ]

    DIFFICULTY_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, default="other"
    )
    instructor = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="created_rooms"
    )
    difficulty_level = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default="beginner"
    )
    capacity = models.PositiveIntegerField(default=50)
    premium_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    room_image = models.ImageField(upload_to="room_images/", blank=False, null=True)
    # admin_image = models.ImageField(upload_to="admin_images/", blank=False, null=True)
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    # Room content and features
    free_content_description = models.TextField(
        blank=True, help_text="Description of what's available in free tier"
    )
    premium_content_description = models.TextField(
        blank=True, help_text="Description of premium features"
    )

    class Meta:
        ordering = ["-created_date"]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("room_detail", kwargs={"pk": self.pk})

    def get_total_enrollments(self):
        return self.enrollments.count()

    def get_free_enrollments(self):
        return self.enrollments.filter(enrollment_type="free").count()

    def get_premium_enrollments(self):
        return self.enrollments.filter(enrollment_type="premium").count()


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="profile"
    )
    phone_number = models.CharField(max_length=15, blank=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    # profile_picture = models.ImageField(
    #     upload_to="profile_pictures/", blank=True, null=True
    # )
    face_encoding = models.TextField(
        blank=True, null=True, help_text="Encoded face data for authentication"
    )
    bio = models.TextField(max_length=500, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Enrollment(models.Model):
    ENROLLMENT_TYPES = [
        ("free", "Free"),
        ("premium", "Premium"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="enrollments"
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="enrollments")
    enrollment_type = models.CharField(max_length=10, choices=ENROLLMENT_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    enrolled_date = models.DateTimeField(auto_now_add=True)
    completed_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ["user", "room"]  # Prevent duplicate enrollments
        ordering = ["-enrolled_date"]

    def __str__(self):
        return f"{self.user.username} - {self.room.title} ({self.enrollment_type})"


class Payment(models.Model):
    PAYMENT_METHODS = [
        ("esewa", "eSewa"),
        ("khalti", "Khalti"),
        ("bank_transfer", "Bank Transfer"),
    ]

    PAYMENT_STATUS = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="payments"
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="payments")
    enrollment = models.OneToOneField(
        Enrollment, on_delete=models.CASCADE, related_name="payment"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHODS, default="esewa"
    )
    transaction_id = models.CharField(max_length=100, unique=True)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default="pending"
    )
    payment_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    # eSewa specific fields
    esewa_ref_id = models.CharField(max_length=100, blank=True, null=True)
    esewa_response = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Payment: {self.user.username} - {self.room.title} - {self.amount}"


class ChatSession(models.Model):
    """Model to track chatbot sessions for premium users"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_sessions")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="chat_sessions")
    session_id = models.CharField(max_length=100, unique=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ["-updated_date"]
        unique_together = [['user', 'room']]  # Ensure one session per user-room combination
    
    def __str__(self):
        return f"Chat Session: {self.user.username} - {self.room.title}"


class ChatSummary(models.Model):
    """Model to store chat summaries with file links"""
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="summaries")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_summaries")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="chat_summaries")
    title = models.CharField(max_length=200)
    summary_content = models.TextField()
    file_path = models.CharField(max_length=500, help_text="Path to the saved summary file")
    file_url = models.URLField(blank=True, help_text="URL to access the summary file")
    created_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_date"]
    
    def __str__(self):
        return f"Summary: {self.title} - {self.user.username}"


class StudyMaterial(models.Model):
    """Model for study materials that can be uploaded to rooms"""
    
    MATERIAL_TYPE_CHOICES = [
        ('pdf', 'PDF Document'),
        ('video', 'Video'),
        ('image', 'Image'),
        ('text', 'Text Document'),
        ('link', 'External Link'),
        ('other', 'Other'),
    ]
    
    ACCESS_LEVEL_CHOICES = [
        ('free', 'Free Access'),
        ('premium', 'Premium Only'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="study_materials")
    author = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="authored_materials")
    material_type = models.CharField(max_length=20, choices=MATERIAL_TYPE_CHOICES, default='other')
    access_level = models.CharField(max_length=20, choices=ACCESS_LEVEL_CHOICES, default='free')
    
    # File fields
    file_upload = models.FileField(upload_to="study_materials/", blank=True, null=True)
    external_link = models.URLField(blank=True, null=True, help_text="For external resources")
    
    # Content
    content = models.TextField(blank=True, help_text="Text content for text-based materials")
    
    # Metadata
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="File size in bytes")
    page_count = models.PositiveIntegerField(null=True, blank=True, help_text="Number of pages for documents")
    duration = models.CharField(max_length=50, blank=True, help_text="Duration for videos/audio")
    
    # Status and timestamps
    is_active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_date"]
        indexes = [
            models.Index(fields=['room', 'access_level']),
            models.Index(fields=['author']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.room.title}"
    
    def get_file_extension(self):
        """Get the file extension from uploaded file"""
        if self.file_upload:
            return self.file_upload.name.split('.')[-1].lower()
        return None
    
    def get_icon_class(self):
        """Return appropriate Bootstrap icon class based on material type"""
        icon_map = {
            'pdf': 'bi-file-earmark-pdf',
            'video': 'bi-camera-video',
            'image': 'bi-image',
            'text': 'bi-file-earmark-text',
            'link': 'bi-link-45deg',
            'other': 'bi-file-earmark',
        }
        return icon_map.get(self.material_type, 'bi-file-earmark')
    
    def can_edit(self, user):
        """Check if user can edit this material"""
        return user == self.author or user == self.room.instructor
    
    def can_view(self, user, user_enrollment_type=None):
        """Check if user can view this material based on access level"""
        if not user.is_authenticated:
            return self.access_level == 'free'
        
        # Room instructor and material author can always view
        if user == self.room.instructor or user == self.author:
            return True
            
        # For premium content, check enrollment
        if self.access_level == 'premium':
            return user_enrollment_type == 'premium'
            
        return True  # Free content accessible to all authenticated users
