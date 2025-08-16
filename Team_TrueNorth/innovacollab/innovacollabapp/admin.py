from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, Enrollment, Payment, Room, UserProfile

# Register your models here.


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ["username", "email", "is_staff", "is_active", "mfa_enabled"]
    list_filter = ["is_staff", "is_active", "mfa_enabled"]
    fieldsets = UserAdmin.fieldsets + (
        ("MFA Settings", {"fields": ("mfa_secret", "mfa_enabled")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("MFA Settings", {"fields": ("mfa_secret", "mfa_enabled")}),
    )
    search_fields = ["username", "email"]
    ordering = ["email"]


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "instructor",
        "difficulty_level",
        "premium_price",
        "is_active",
        "created_date",
    ]
    list_filter = ["category", "difficulty_level", "is_active", "created_date"]
    search_fields = ["title", "description", "instructor__username"]
    readonly_fields = ["created_date", "updated_date"]
    list_editable = ["is_active", "premium_price"]
    ordering = ["-created_date"]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "description",
                    "category",
                    "instructor",
                    "difficulty_level",
                )
            },
        ),
        ("Capacity & Pricing", {"fields": ("capacity", "premium_price")}),
        (
            "Content Description",
            {"fields": ("free_content_description", "premium_content_description")},
        ),
        ("Media & Status", {"fields": ("room_image", "is_active")}),
        (
            "Timestamps",
            {"fields": ("created_date", "updated_date"), "classes": ("collapse",)},
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "phone_number", "age", "created_date"]
    list_filter = ["created_date"]
    search_fields = ["user__username", "user__email", "phone_number"]
    readonly_fields = ["created_date", "updated_date", "face_encoding"]

    fieldsets = (
        (
            "User Information",
            {"fields": ("user", "phone_number", "age", "date_of_birth")},
        ),
        ("Profile Details", {"fields": ("bio", "profile_picture")}),
        (
            "Face Authentication",
            {"fields": ("face_encoding",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("created_date", "updated_date"), "classes": ("collapse",)},
        ),
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["user", "room", "enrollment_type", "status", "enrolled_date"]
    list_filter = ["enrollment_type", "status", "enrolled_date"]
    search_fields = ["user__username", "room__title"]
    list_editable = ["status"]
    ordering = ["-enrolled_date"]

    fieldsets = (
        (
            "Enrollment Details",
            {"fields": ("user", "room", "enrollment_type", "status")},
        ),
        ("Dates", {"fields": ("enrolled_date", "completed_date")}),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "room",
        "amount",
        "payment_method",
        "payment_status",
        "payment_date",
    ]
    list_filter = ["payment_method", "payment_status", "payment_date"]
    search_fields = ["user__username", "room__title", "transaction_id"]
    readonly_fields = ["payment_date", "updated_date", "transaction_id"]
    list_editable = ["payment_status"]
    ordering = ["-payment_date"]

    fieldsets = (
        (
            "Payment Information",
            {"fields": ("user", "room", "enrollment", "amount", "payment_method")},
        ),
        ("Transaction Details", {"fields": ("transaction_id", "payment_status")}),
        (
            "eSewa Details",
            {"fields": ("esewa_ref_id", "esewa_response"), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("payment_date", "updated_date"), "classes": ("collapse",)},
        ),
    )


admin.site.register(CustomUser, CustomUserAdmin)
