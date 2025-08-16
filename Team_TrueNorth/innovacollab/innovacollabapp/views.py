import random

from django.conf import settings
from django.contrib import messages

# Create your views here.
from django.contrib.auth import authenticate, get_user_model, logout
from django.contrib.auth import login as auth_login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.paginator import EmptyPage, PageNotAnInteger, Paginator
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.template.context_processors import csrf
from urllib3 import request

from .models import Enrollment, Payment, Room, UserProfile, ChatSession, ChatSummary, StudyMaterial

from django.http import JsonResponse, HttpResponseBadRequest
import json
from django.views.decorators.csrf import csrf_exempt
import google.generativeai as genai
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
import PyPDF2
from docx import Document
import tempfile


User = get_user_model()


def index(request):
    # Get all active rooms for the homepage
    featured_rooms = Room.objects.filter(is_active=True)[:6]  # Show 6 featured rooms

    # Get user's enrollments if authenticated
    user_enrollments = []
    if request.user.is_authenticated:
        user_enrollments = Enrollment.objects.filter(user=request.user, status="active")

    context = {
        "featured_rooms": featured_rooms,
        "user_enrollments": user_enrollments,
    }
    return render(request, "index.html", context)


def signin(request):
    return render(request, "login/login.html")


def signup(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        try:
            validate_password(password)
        except ValidationError as e:
            for error in e.messages:
                messages.error(request, error, extra_tags="signup")
            return redirect("signin")

        if User.objects.filter(username=username).exists():
            messages.error(
                request,
                "Username already taken. Please choose another.",
                extra_tags="signup",
            )
            return redirect("signin")

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already registered.", extra_tags="signup")
            return redirect("signin")

        user = User.objects.create_user(
            username=username, email=email, password=password
        )
        user.save()

        messages.success(request, "Account created. Please log in.", extra_tags="login")
        return redirect("signin")

    return redirect("signin")


def login_view(request):
    if request.method == "POST":
        identifier = request.POST.get("username") or request.POST.get("email", "")
        password = request.POST.get("password", "")

        if not identifier or not password:
            messages.error(request, "Please provide both username/email and password")
            context = {}
            context.update(csrf(request))
            return render(request, "login/login.html", context)

        user = None
        try:
            # Try to find user by email first
            user_obj = User.objects.get(email=identifier)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            # If not found by email, try by username
            user = authenticate(request, username=identifier, password=password)

        if user is not None:
            auth_login(request, user)
            # messages.success(request, 'Login successful!')
            return redirect("index")
        else:
            messages.error(request, "Invalid username/email or password")
            context = {}
            context.update(csrf(request))
            return render(request, "login/login.html", context)

    return render(request, "login/login.html")


otp_store = {}


def forgot_password(request):
    if request.method == "POST":
        email = request.POST.get("email")
        try:
            user = User.objects.get(email=email)
            otp = random.randint(100000, 999999)
            otp_store[email] = otp

            # Send OTP
            send_mail(
                "Your Password Reset OTP",
                f"Your OTP is {otp}",
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            request.session["reset_email"] = email
            messages.success(request, "OTP sent to your email.")
            return redirect("verify_otp")
        except User.DoesNotExist:
            messages.error(request, "Email is not registered.")
            return redirect("forgot_password")
    return render(request, "login/forgot_password.html")


def verify_otp(request):
    if request.method == "POST":
        email = request.session.get("reset_email")
        entered_otp = request.POST.get("otp")

        if email and otp_store.get(email) == int(entered_otp):
            messages.success(request, "OTP verified. Please reset your password.")
            return redirect("reset_password")
        else:
            messages.error(request, "Invalid OTP.")
            return redirect("verify_otp")
    return render(request, "login/verify_otp.html")


def reset_password(request):
    if request.method == "POST":
        email = request.session.get("reset_email")
        new_password = request.POST.get("password")

        # Validate new password
        try:
            validate_password(new_password)
        except ValidationError as e:
            for error in e.messages:
                messages.error(request, error)
            return redirect("reset_password")

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            otp_store.pop(email, None)
            request.session.pop("reset_email", None)
            messages.success(request, "Password reset successful.")
            return redirect("signin")
        except User.DoesNotExist:
            messages.error(request, "Something went wrong.")
            return redirect("forgot_password")
    return render(request, "login/reset_password.html")


def logout_view(request):
    logout(request)
    return redirect("signin")


# Room Views
def room_list(request):
    """Display all available rooms with filtering and search"""
    rooms = Room.objects.filter(is_active=True)

    # Search functionality
    search_query = request.GET.get("search")
    if search_query:
        rooms = rooms.filter(
            Q(title__icontains=search_query)
            | Q(description__icontains=search_query)
            | Q(instructor__username__icontains=search_query)
        )

    # Category filter
    category = request.GET.get("category")
    if category:
        rooms = rooms.filter(category=category)

    # Difficulty filter
    difficulty = request.GET.get("difficulty")
    if difficulty:
        rooms = rooms.filter(difficulty_level=difficulty)

    # Pagination
    paginator = Paginator(rooms, 12)  # Show 12 rooms per page
    page = request.GET.get("page")

    try:
        rooms = paginator.page(page)
    except PageNotAnInteger:
        rooms = paginator.page(1)
    except EmptyPage:
        rooms = paginator.page(paginator.num_pages)

    # Get categories for filter dropdown
    categories = Room.CATEGORY_CHOICES
    difficulties = Room.DIFFICULTY_CHOICES

    context = {
        "rooms": rooms,
        "categories": categories,
        "difficulties": difficulties,
        "search_query": search_query,
        "selected_category": category,
        "selected_difficulty": difficulty,
    }

    return render(request, "rooms/room_list.html", context)


@login_required(login_url="/login/")
def room_detail(request, pk):
    """Display detailed information about a specific room"""
    room = get_object_or_404(Room, pk=pk, is_active=True)

    # Check if user is already enrolled
    user_enrollment = None
    if request.user.is_authenticated:
        try:
            user_enrollment = Enrollment.objects.get(user=request.user, room=room)
        except Enrollment.DoesNotExist:
            pass

    context = {
        "room": room,
        "user_enrollment": user_enrollment,
        "is_enrolled": user_enrollment is not None,
    }

    return render(request, "rooms/room_detail.html", context)


@login_required(login_url="/login/")
def create_room(request):
    """Allow instructors to create new rooms"""
    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        category = request.POST.get("category")
        difficulty_level = request.POST.get("difficulty_level")
        capacity = request.POST.get("capacity", 50)
        premium_price = request.POST.get("premium_price", 0.00)
        free_content_description = request.POST.get("free_content_description")
        premium_content_description = request.POST.get("premium_content_description")
        room_image = request.FILES.get("room_image")

        # Basic validation
        if not all([title, description, category, difficulty_level]):
            messages.error(request, "Please fill in all required fields.")
            return render(
                request,
                "rooms/create_room.html",
                {
                    "categories": Room.CATEGORY_CHOICES,
                    "difficulties": Room.DIFFICULTY_CHOICES,
                },
            )

        try:
            room = Room.objects.create(
                title=title,
                description=description,
                category=category,
                instructor=request.user,
                difficulty_level=difficulty_level,
                capacity=int(capacity),
                premium_price=float(premium_price),
                free_content_description=free_content_description,
                premium_content_description=premium_content_description,
                room_image=room_image,
            )

            messages.success(request, f'Room "{title}" created successfully!')
            return redirect("room_detail", pk=room.pk)

        except (ValueError, TypeError) as e:
            messages.error(request, "Please check your input values.")
            return render(
                request,
                "rooms/create_room.html",
                {
                    "categories": Room.CATEGORY_CHOICES,
                    "difficulties": Room.DIFFICULTY_CHOICES,
                },
            )

    context = {
        "categories": Room.CATEGORY_CHOICES,
        "difficulties": Room.DIFFICULTY_CHOICES,
    }

    return render(request, "rooms/create_room.html", context)


@login_required(login_url="/login/")
def my_rooms(request):
    """Display rooms created by the current user with enhanced features"""
    rooms = Room.objects.filter(instructor=request.user).order_by("-created_date")
    
    # Add pagination
    paginator = Paginator(rooms, 12)  # Show 12 rooms per page
    page = request.GET.get("page")
    try:
        rooms_page = paginator.page(page)
    except PageNotAnInteger:
        rooms_page = paginator.page(1)
    except EmptyPage:
        rooms_page = paginator.page(paginator.num_pages)
    
    # Calculate statistics
    total_rooms = rooms.count()
    active_rooms = rooms.filter(is_active=True).count()
    premium_rooms = rooms.filter(premium_price__gt=0).count()
    
    # Calculate total enrollments across all rooms
    total_enrollments = 0
    for room in rooms:
        total_enrollments += room.get_total_enrollments()

    context = {
        "rooms": rooms_page,
        "total_rooms": total_rooms,
        "active_rooms": active_rooms,
        "premium_rooms": premium_rooms,
        "total_enrollments": total_enrollments,
    }

    return render(request, "rooms/my_rooms.html", context)


@login_required(login_url="/login/")
def my_enrollments(request):
    """Display user's enrollments"""
    enrollments = Enrollment.objects.filter(user=request.user).order_by(
        "-enrolled_date"
    )

    context = {
        "enrollments": enrollments,
    }

    return render(request, "rooms/my_enrollments.html", context)


@login_required(login_url="/login/")
def enroll_free(request, room_id):
    """Handle free enrollment for a room"""
    room = get_object_or_404(Room, id=room_id, is_active=True)

    # Check if user is already enrolled
    existing_enrollment = Enrollment.objects.filter(
        user=request.user, room=room
    ).first()
    if existing_enrollment:
        messages.info(request, f'You are already enrolled in "{room.title}"')
        return redirect("room_detail", pk=room.id)

    # Create free enrollment
    enrollment = Enrollment.objects.create(
        user=request.user, room=room, enrollment_type="free", status="active"
    )

    messages.success(request, f'Successfully enrolled in "{room.title}" (Free Plan)!')
    return redirect("room_detail", pk=room.id)


@login_required(login_url="/login/")
def enroll_premium_form(request, room_id):
    """Display premium enrollment form"""
    room = get_object_or_404(Room, id=room_id, is_active=True)

    # Check if user is already enrolled
    existing_enrollment = Enrollment.objects.filter(
        user=request.user, room=room
    ).first()
    if existing_enrollment:
        messages.info(request, f'You are already enrolled in "{room.title}"')
        return redirect("room_detail", pk=room.id)

    if request.method == "POST":
        # Get form data
        full_name = request.POST.get("full_name")
        email = request.POST.get("email")
        phone_number = request.POST.get("phone_number")
        age = request.POST.get("age")
        date_of_birth = request.POST.get("date_of_birth")
        bio = request.POST.get("bio")
        profile_picture = request.FILES.get("profile_picture")

        # Basic validation
        if not all([full_name, email, phone_number, age]):
            messages.error(request, "Please fill in all required fields.")
            return render(request, "rooms/premium_enrollment_form.html", {"room": room})

        try:
            # Create or update user profile
            user_profile, created = UserProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    "phone_number": phone_number,
                    "age": int(age),
                    "date_of_birth": date_of_birth if date_of_birth else None,
                    "bio": bio,
                    "profile_picture": profile_picture,
                },
            )

            # If profile already exists, update it
            if not created:
                user_profile.phone_number = phone_number
                user_profile.age = int(age)
                if date_of_birth:
                    user_profile.date_of_birth = date_of_birth
                user_profile.bio = bio
                if profile_picture:
                    user_profile.profile_picture = profile_picture
                user_profile.save()

            # Update user's full name if provided
            if full_name and full_name != request.user.get_full_name():
                name_parts = full_name.split(" ", 1)
                request.user.first_name = name_parts[0]
                request.user.last_name = name_parts[1] if len(name_parts) > 1 else ""
                request.user.save()

            # Update email if different
            if email != request.user.email:
                request.user.email = email
                request.user.save()

            # Create premium enrollment (active immediately, payment will be verified in callback)
            enrollment = Enrollment.objects.create(
                user=request.user,
                room=room,
                enrollment_type="premium",
                status="active",  # Set active immediately for premium users
            )

            messages.success(
                request, "Profile information saved successfully! Ready for payment."
            )
            # Redirect to payment page (we'll create this next)
            return redirect(
                "payment_page", room_id=room.id, enrollment_id=enrollment.id
            )

        except (ValueError, TypeError) as e:
            messages.error(request, "Please check your input values.")
            return render(request, "rooms/premium_enrollment_form.html", {"room": room})

    # GET request - show the form
    # Pre-fill form with existing user data if available
    user_profile = getattr(request.user, "profile", None)

    context = {
        "room": room,
        "user_profile": user_profile,
        "user": request.user,
    }

    return render(request, "rooms/premium_enrollment_form.html", context)


# payment code
import base64
import hashlib
import hmac
import uuid

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render


def generate_signature(fields: dict, signed_field_names: str, secret_key: str) -> str:
    """
    Generate eSewa HMAC SHA256 signature in base64 format.
    Fields must match the signed_field_names order.
    """
    message = ",".join(
        f"{name}={fields[name]}" for name in signed_field_names.split(",")
    )
    hmac_sha256 = hmac.new(
        secret_key.encode("utf-8"), message.encode("utf-8"), hashlib.sha256
    )
    return base64.b64encode(hmac_sha256.digest()).decode("utf-8")


def payment_form(request):
    config = settings.ESEWA_CONFIG

    amount = request.session.get("checkout_total", 100.00)
    tax_amount = (13 / 100) * amount
    product_service_charge = 0.00
    product_delivery_charge = 0.00
    total_amount = (
        amount + tax_amount + product_service_charge + product_delivery_charge
    )

    transaction_uuid = str(uuid.uuid4())

    signed_field_names = "total_amount,transaction_uuid,product_code"
    signature_fields = {
        "total_amount": str(total_amount),
        "transaction_uuid": transaction_uuid,
        "product_code": config["PRODUCT_CODE"],
    }
    signature = generate_signature(
        signature_fields, signed_field_names, config["SECRET_KEY"]
    )

    context = {
        "test_url": config["TEST_URL"],
        "amount": amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": config["PRODUCT_CODE"],
        "product_service_charge": product_service_charge,
        "product_delivery_charge": product_delivery_charge,
        "success_url": config["SUCCESS_URL"],
        "failure_url": config["FAILURE_URL"],
        "signed_field_names": signed_field_names,
        "signature": signature,
    }
    return render(request, "payment.html", context)


@login_required(login_url="/login/")
def payment_page(request, room_id, enrollment_id):
    """Integrate with eSewa payment gateway"""
    room = get_object_or_404(Room, id=room_id, is_active=True)
    enrollment = get_object_or_404(
        Enrollment, id=enrollment_id, user=request.user, room=room
    )

    if request.method == "POST":
        # For development - simulate successful payment
        # In production, this will be handled by eSewa callback
        enrollment.status = "active"
        enrollment.save()

        # Create payment record
        Payment.objects.create(
            user=request.user,
            room=room,
            enrollment=enrollment,
            amount=room.premium_price,
            payment_method="esewa",
            transaction_id=f"DEMO_{enrollment.id}_{room.id}",
            payment_status="completed",
        )

        messages.success(
            request,
            f'Payment successful! You are now enrolled in "{room.title}" (Premium Plan)!',
        )
        return redirect("room_detail", pk=room.id)

    # Prepare eSewa payment data
    config = settings.ESEWA_CONFIG

    amount = float(room.premium_price)
    tax_amount = round((13 / 100) * amount, 2)  # 13% tax
    product_service_charge = 0.00
    product_delivery_charge = 0.00
    total_amount = round(
        amount + tax_amount + product_service_charge + product_delivery_charge, 2
    )

    transaction_uuid = str(uuid.uuid4())

    # Store transaction details in session for callback
    request.session["payment_data"] = {
        "room_id": room_id,
        "enrollment_id": enrollment_id,
        "transaction_uuid": transaction_uuid,
        "amount": amount,
        "total_amount": total_amount,
        "user_id": request.user.id,  # Store user ID for callback authentication
    }

    signed_field_names = "total_amount,transaction_uuid,product_code"
    signature_fields = {
        "total_amount": str(total_amount),
        "transaction_uuid": transaction_uuid,
        "product_code": config["PRODUCT_CODE"],
    }
    signature = generate_signature(
        signature_fields, signed_field_names, config["SECRET_KEY"]
    )

    context = {
        "room": room,
        "enrollment": enrollment,
        "test_url": config["TEST_URL"],
        "amount": amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": config["PRODUCT_CODE"],
        "product_service_charge": product_service_charge,
        "product_delivery_charge": product_delivery_charge,
        "success_url": config["SUCCESS_URL"],
        "failure_url": config["FAILURE_URL"],
        "signed_field_names": signed_field_names,
        "signature": signature,
        "debug": settings.DEBUG,
    }

    return render(request, "rooms/payment_page.html", context)


@login_required(login_url="/login/")
def room_view(request, room_id):
    """Display room content based on user's enrollment type"""
    room = get_object_or_404(Room, id=room_id, is_active=True)

    # Check if user is enrolled in this room
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active"
        )
        is_enrolled = True
        enrollment_type = enrollment.enrollment_type
    except Enrollment.DoesNotExist:
        is_enrolled = False
        enrollment_type = None
        messages.warning(request, "You need to enroll in this room first.")
        return redirect("room_detail", pk=room_id)

    # Define features available for each enrollment type
    free_features = [
        {
            "name": "Study Materials (View Only)",
            "available": True,
            "icon": "bi-book",
            "description": "Access to read course materials online",
        },
    ]

    premium_features = [
        {
            "name": "Study Materials (Download)",
            "available": True,
            "icon": "bi-download",
            "description": "Download materials for offline access",
        },
        {
            "name": "AI Chatbot Assistant",
            "available": True,
            "icon": "bi-robot",
            "description": "Get instant help with AI-powered assistant",
            "url": "chatbot",
        },
        {
            "name": "Text-to-Speech",
            "available": True,
            "icon": "bi-volume-up",
            "description": "Listen to course materials with voice synthesis",
        },
    ]

    # Adjust feature availability based on enrollment type
    if enrollment_type == "free":
        for feature in premium_features:
            feature["available"] = False

    # Get study materials for this room
    study_materials = StudyMaterial.objects.filter(
        room=room,
        is_active=True
    ).select_related('author')
    
    # Filter materials based on user access level and add edit permissions
    accessible_materials = []
    for material in study_materials:
        if material.can_view(request.user, enrollment_type):
            # Add can_edit attribute for template use
            material.can_edit = material.can_edit(request.user)
            accessible_materials.append(material)

    context = {
        "room": room,
        "enrollment": enrollment,
        "is_enrolled": is_enrolled,
        "enrollment_type": enrollment_type,
        "free_features": free_features,
        "premium_features": premium_features,
        "is_premium": enrollment_type == "premium",
        "is_free": enrollment_type == "free",
        "study_materials": accessible_materials,
        "can_create_material": True,  # All enrolled users can create materials
        "is_room_instructor": request.user == room.instructor,
    }

    return render(request, "rooms/room_view_new.html", context)


@login_required(login_url="/login/")
def chatbot_view(request, room_id):
    """
    Main chatbot view for premium users with proper access control
    """
    room = get_object_or_404(Room, id=room_id, is_active=True)

    # Check if user has premium enrollment
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active", enrollment_type="premium"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "Premium access required for AI Chatbot feature.")
        return redirect("room_detail", pk=room_id)

    # Get or create chat session for this user and room
    # Handle case where multiple sessions exist (cleanup duplicates)
    try:
        chat_session, created = ChatSession.objects.get_or_create(
            user=request.user,
            room=room,
            defaults={
                'session_id': str(uuid.uuid4()),
                'is_active': True
            }
        )
    except ChatSession.MultipleObjectsReturned:
        # Clean up duplicate sessions - keep the most recent one
        duplicate_sessions = ChatSession.objects.filter(
            user=request.user,
            room=room
        ).order_by('-updated_date')
        
        # Keep the most recent session
        chat_session = duplicate_sessions.first()
        
        # Delete the older duplicate sessions
        if duplicate_sessions.count() > 1:
            older_sessions = duplicate_sessions[1:]  # Skip the first (most recent)
            for session in older_sessions:
                session.delete()
        
        created = False
    
    # Get user's previous summaries for this room
    previous_summaries = ChatSummary.objects.filter(
        user=request.user,
        room=room
    )[:10]  # Show last 10 summaries
    
    context = {
        'room': room,
        'chat_session': chat_session,
        'previous_summaries': previous_summaries,
    }
    return render(request, 'chat.html', context)


# eSewa Payment Callback Views
def payment_success(request):
    """Handle successful eSewa payment callback"""
    # Get eSewa response parameters
    oid = request.GET.get("oid")  # Our transaction_uuid
    amt = request.GET.get("amt")  # Amount paid
    refId = request.GET.get("refId")  # eSewa reference ID

    # Also handle data parameter (URL encoded response)
    data = request.GET.get("data")
    if data:
        # Decode the base64 data if present
        import base64
        import json

        try:
            decoded_data = base64.b64decode(data).decode("utf-8")
            payment_response = json.loads(decoded_data)
            oid = payment_response.get("transaction_uuid")
            amt = payment_response.get("total_amount")
            refId = payment_response.get("transaction_code")
        except Exception as e:
            print(f"Error decoding payment data: {e}")

    # Get payment data from session
    payment_data = request.session.get("payment_data")
    if not payment_data:
        messages.error(request, "Payment session expired. Please try again.")
        return redirect("room_list")

    # Get the user who made the payment
    try:
        user = User.objects.get(id=payment_data["user_id"])
    except User.DoesNotExist:
        messages.error(request, "User not found. Please contact support.")
        return redirect("room_list")

    # Verify the payment
    if payment_data["transaction_uuid"] == oid and float(
        payment_data["total_amount"]
    ) == float(amt):
        try:
            # Get enrollment (already active)
            enrollment = Enrollment.objects.get(
                id=payment_data["enrollment_id"], user=user
            )
            # No need to activate - already active from creation

            # Create payment record
            Payment.objects.create(
                user=user,
                room_id=payment_data["room_id"],
                enrollment=enrollment,
                amount=payment_data["amount"],
                payment_method="esewa",
                transaction_id=oid,
                esewa_ref_id=refId,
                payment_status="completed",
            )

            # Clear session data
            del request.session["payment_data"]

            # Log the user back in if needed
            if not request.user.is_authenticated:
                from django.contrib.auth import login

                login(request, user)

            messages.success(
                request,
                f"Payment successful! You now have premium access to {enrollment.room.title}. "
                "Enjoy your premium features!",
            )
            # Redirect to the specific room detail page
            return redirect("room_detail", pk=payment_data["room_id"])

        except Enrollment.DoesNotExist:
            messages.error(request, "Enrollment not found. Please contact support.")
            return redirect("room_list")
    else:
        messages.error(request, "Payment verification failed. Please try again.")
        return redirect("room_list")


def payment_failure(request):
    """Handle failed eSewa payment callback"""
    # Get payment data from session to get room_id for redirect
    payment_data = request.session.get("payment_data")
    room_id = None
    if payment_data:
        room_id = payment_data.get("room_id")
        del request.session["payment_data"]

    messages.error(request, "Payment failed or was cancelled. Please try again.")

    # Redirect to specific room if available, otherwise to room list
    if room_id:
        return redirect("room_detail", pk=room_id)
    else:
        return redirect("room_list")

# Load environment variables
load_dotenv()

# Initialize Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini model configuration
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    safety_settings=safety_settings,
)

# Enhanced session store with database integration
chat_sessions = {}

def chatbot(request):
    """
    Renders the chatbot page.
    """
    return render(request, 'chat.html')

@csrf_exempt
def chat_api(request):
    """
    Enhanced chat API with session persistence and premium features
    """
    if request.method != 'POST':
        return HttpResponseBadRequest('Invalid request method')

    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        message = data.get('message')
        is_summary = data.get('is_summary', False)
        room_id = data.get('room_id')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if not session_id:
        return JsonResponse({'error': 'Missing session_id'}, status=400)

    # Get or create database session
    chat_session = None
    if room_id and request.user.is_authenticated:
        room = get_object_or_404(Room, id=room_id)
        
        # Use get_or_create to handle the unique constraint properly
        chat_session, created = ChatSession.objects.get_or_create(
            user=request.user,
            room=room,
            defaults={
                'session_id': session_id,
                'is_active': True
            }
        )
        
        # If session already existed but with different session_id, update it
        if not created and chat_session.session_id != session_id:
            chat_session.session_id = session_id
            chat_session.is_active = True
            chat_session.save()

    # Initialize in-memory session if not exists
    if session_id not in chat_sessions:
        chat_sessions[session_id] = {
            "chat_history": [],
            "gemini_chat_session": model.start_chat(history=[]),
            "db_session": chat_session
        }

    try:
        # Try to read prompt template from file, fallback to default
        try:
            with open('prompt_template.txt', 'r', encoding="utf-8") as file:
                prompt_template = file.read().strip()
        except FileNotFoundError:
            prompt_template = """You are StudentHelper, an AI assistant designed to help students with their academic questions and learning needs. 
            You provide clear, accurate, and helpful responses to educational queries. 
            Always be encouraging and supportive while maintaining accuracy."""

        if is_summary:
            # Handle summary request
            if not chat_sessions[session_id]["chat_history"]:
                return JsonResponse({'summary': "No content to summarize. Please ask some questions first."})

            # Create comprehensive summary
            history_text = "\n".join([f"{sender}: {msg}" for sender, msg in chat_sessions[session_id]["chat_history"]])
            summary_prompt = (
                f"{prompt_template}\n\n"
                "The following is the conversation history for this session:\n"
                f"{history_text}\n\n"
                "Please provide a comprehensive summary of the key points and topics discussed in this session. "
                "Format it as clear sections with bullet points suitable for students to review and study from. "
                "Include main concepts, important explanations, and any actionable advice given."
            )

            try:
                response = chat_sessions[session_id]["gemini_chat_session"].send_message(summary_prompt)
                summary_content = response.text
                
                return JsonResponse({
                    'summary': summary_content,
                    'session_id': session_id,
                    'can_save': bool(chat_session)  # Only allow save if database session exists
                })
            except Exception as e:
                return JsonResponse({'error': f'Error generating summary: {str(e)}'}, status=500)
        else:
            # Handle regular message
            if not message:
                return JsonResponse({'error': 'Missing message'}, status=400)

            prompt = prompt_template + "\n\nUser: " + message

            try:
                response = chat_sessions[session_id]["gemini_chat_session"].send_message(prompt)
                response_text = response.text
                
                # Store in session history
                chat_sessions[session_id]["chat_history"].append(("User", message))
                chat_sessions[session_id]["chat_history"].append(("StudentHelper", response_text))
                
                return JsonResponse({'response': response_text})
            except Exception as e:
                return JsonResponse({'error': f'Error: {str(e)}'}, status=500)
                
    except Exception as e:
        return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)


@csrf_exempt
@login_required(login_url="/login/")
def save_chat_summary(request):
    """
    Save chat summary to file and database
    """
    if request.method != 'POST':
        return HttpResponseBadRequest('Invalid request method')

    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        summary_content = data.get('summary_content')
        title = data.get('title', f'Chat Summary - {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    if not session_id or not summary_content:
        return JsonResponse({'error': 'Missing required fields'}, status=400)

    try:
        # Get the chat session
        chat_session = ChatSession.objects.get(
            session_id=session_id,
            user=request.user
        )
        
        # Create filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"summary_{request.user.id}_{chat_session.room.id}_{timestamp}.txt"
        file_path = os.path.join(settings.MEDIA_ROOT, 'chat_summaries', filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Write summary to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"Chat Summary - {title}\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Room: {chat_session.room.title}\n")
            f.write(f"User: {request.user.username}\n")
            f.write("="*50 + "\n\n")
            f.write(summary_content)
        
        # Create file URL
        file_url = f"{settings.MEDIA_URL}chat_summaries/{filename}"
        
        # Save to database
        summary_obj = ChatSummary.objects.create(
            chat_session=chat_session,
            user=request.user,
            room=chat_session.room,
            title=title,
            summary_content=summary_content,
            file_path=file_path,
            file_url=file_url
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Summary saved successfully!',
            'summary_id': summary_obj.id,
            'file_url': file_url,
            'download_url': request.build_absolute_uri(file_url)
        })
        
    except ChatSession.DoesNotExist:
        return JsonResponse({'error': 'Chat session not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Error saving summary: {str(e)}'}, status=500)


@csrf_exempt
@login_required(login_url="/login/")
def read_file_aloud(request):
    """
    Process uploaded file and extract text for text-to-speech
    """
    if request.method != 'POST':
        return HttpResponseBadRequest('Invalid request method')

    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file uploaded'}, status=400)

    uploaded_file = request.FILES['file']
    
    # Validate file size (10MB limit)
    if uploaded_file.size > 10 * 1024 * 1024:
        return JsonResponse({'error': 'File too large. Maximum size is 10MB.'}, status=400)

    try:
        # Extract text based on file type
        text_content = ""
        file_extension = uploaded_file.name.lower().split('.')[-1]

        if file_extension == 'txt':
            # Handle text files
            try:
                text_content = uploaded_file.read().decode('utf-8')
            except UnicodeDecodeError:
                try:
                    uploaded_file.seek(0)
                    text_content = uploaded_file.read().decode('latin-1')
                except Exception:
                    return JsonResponse({'error': 'Unable to read text file encoding'}, status=400)

        elif file_extension == 'pdf':
            # Handle PDF files
            try:
                import PyPDF2
                uploaded_file.seek(0)
                pdf_reader = PyPDF2.PdfReader(uploaded_file)
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n"
            except ImportError:
                return JsonResponse({'error': 'PDF processing not available. Please install PyPDF2.'}, status=400)
            except Exception as e:
                return JsonResponse({'error': f'Error processing PDF: {str(e)}'}, status=400)

        elif file_extension in ['doc', 'docx']:
            # Handle Word documents
            try:
                from docx import Document
                uploaded_file.seek(0)
                
                # Save uploaded file to temporary location
                with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_file_path = temp_file.name

                # Read the document
                doc = Document(temp_file_path)
                text_content = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                
                # Clean up temporary file
                os.unlink(temp_file_path)
                
            except ImportError:
                return JsonResponse({'error': 'Word document processing not available. Please install python-docx.'}, status=400)
            except Exception as e:
                return JsonResponse({'error': f'Error processing Word document: {str(e)}'}, status=400)

        else:
            return JsonResponse({'error': 'Unsupported file type. Please upload .txt, .pdf, .doc, or .docx files.'}, status=400)

        # Clean and validate extracted text
        if not text_content or not text_content.strip():
            return JsonResponse({'error': 'No readable text found in the file'}, status=400)

        # Clean up text for better speech synthesis
        text_content = text_content.strip()
        
        # Remove excessive whitespace and normalize
        import re
        text_content = re.sub(r'\n\s*\n', '\n\n', text_content)  # Normalize paragraph breaks
        text_content = re.sub(r'\s+', ' ', text_content)  # Normalize spaces
        
        # Limit text length for performance (100,000 characters max)
        if len(text_content) > 100000:
            text_content = text_content[:100000] + "... (content truncated for performance)"

        return JsonResponse({
            'success': True,
            'text': text_content,
            'filename': uploaded_file.name,
            'file_size': uploaded_file.size,
            'character_count': len(text_content),
            'message': f'Successfully processed "{uploaded_file.name}" - {len(text_content)} characters ready for reading'
        })

    except Exception as e:
        return JsonResponse({'error': f'Unexpected error processing file: {str(e)}'}, status=500)


# ============= STUDY MATERIALS CRUD VIEWS =============

@login_required(login_url="/login/")
def create_study_material(request, room_id):
    """Create new study material for a room"""
    room = get_object_or_404(Room, id=room_id)
    
    # Check if user is enrolled in the room
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You must be enrolled in this room to create study materials.")
        return redirect("room_detail", pk=room_id)
    
    if request.method == 'POST':
        try:
            title = request.POST.get('title', '').strip()
            description = request.POST.get('description', '').strip()
            material_type = request.POST.get('material_type', 'other')
            access_level = request.POST.get('access_level', 'free')
            content = request.POST.get('content', '').strip()
            external_link = request.POST.get('external_link', '').strip()
            
            if not title:
                messages.error(request, "Title is required.")
                return redirect('room_view', room_id=room_id)
            
            # Create study material
            study_material = StudyMaterial.objects.create(
                title=title,
                description=description,
                room=room,
                author=request.user,
                material_type=material_type,
                access_level=access_level,
                content=content,
                external_link=external_link if external_link else None
            )
            
            # Handle file upload
            if 'file_upload' in request.FILES:
                uploaded_file = request.FILES['file_upload']
                
                # Validate file size (50MB limit)
                if uploaded_file.size > 50 * 1024 * 1024:
                    messages.error(request, "File too large. Maximum size is 50MB.")
                    study_material.delete()
                    return redirect('room_view', room_id=room_id)
                
                study_material.file_upload = uploaded_file
                study_material.file_size = uploaded_file.size
                
                # Auto-detect material type based on file extension
                file_ext = uploaded_file.name.split('.')[-1].lower()
                if file_ext in ['pdf']:
                    study_material.material_type = 'pdf'
                elif file_ext in ['mp4', 'avi', 'mov', 'wmv']:
                    study_material.material_type = 'video'
                elif file_ext in ['jpg', 'jpeg', 'png', 'gif']:
                    study_material.material_type = 'image'
                elif file_ext in ['txt', 'doc', 'docx']:
                    study_material.material_type = 'text'
                
                study_material.save()
            
            messages.success(request, f"Study material '{title}' created successfully!")
            return redirect('room_view', room_id=room_id)
            
        except Exception as e:
            messages.error(request, f"Error creating study material: {str(e)}")
            return redirect('room_view', room_id=room_id)
    
    return redirect('room_view', room_id=room_id)


@login_required(login_url="/login/")
def edit_study_material(request, room_id, material_id):
    """Edit existing study material"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check edit permissions
    if not material.can_edit(request.user):
        messages.error(request, "You don't have permission to edit this study material.")
        return redirect('room_view', room_id=room_id)
    
    if request.method == 'POST':
        try:
            material.title = request.POST.get('title', material.title).strip()
            material.description = request.POST.get('description', material.description).strip()
            material.material_type = request.POST.get('material_type', material.material_type)
            material.access_level = request.POST.get('access_level', material.access_level)
            material.content = request.POST.get('content', material.content).strip()
            
            external_link = request.POST.get('external_link', '').strip()
            material.external_link = external_link if external_link else None
            
            # Handle new file upload
            if 'file_upload' in request.FILES:
                uploaded_file = request.FILES['file_upload']
                
                # Validate file size (50MB limit)
                if uploaded_file.size > 50 * 1024 * 1024:
                    messages.error(request, "File too large. Maximum size is 50MB.")
                    return redirect('room_view', room_id=room_id)
                
                # Delete old file if exists
                if material.file_upload:
                    material.file_upload.delete()
                
                material.file_upload = uploaded_file
                material.file_size = uploaded_file.size
                
                # Auto-detect material type based on file extension
                file_ext = uploaded_file.name.split('.')[-1].lower()
                if file_ext in ['pdf']:
                    material.material_type = 'pdf'
                elif file_ext in ['mp4', 'avi', 'mov', 'wmv']:
                    material.material_type = 'video'
                elif file_ext in ['jpg', 'jpeg', 'png', 'gif']:
                    material.material_type = 'image'
                elif file_ext in ['txt', 'doc', 'docx']:
                    material.material_type = 'text'
            
            material.save()
            messages.success(request, f"Study material '{material.title}' updated successfully!")
            
        except Exception as e:
            messages.error(request, f"Error updating study material: {str(e)}")
    
    return redirect('room_view', room_id=room_id)


@login_required(login_url="/login/")
def delete_study_material(request, room_id, material_id):
    """Delete study material"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check edit permissions
    if not material.can_edit(request.user):
        messages.error(request, "You don't have permission to delete this study material.")
        return redirect('room_view', room_id=room_id)
    
    if request.method == 'POST':
        try:
            title = material.title
            
            # Delete file if exists
            if material.file_upload:
                material.file_upload.delete()
            
            material.delete()
            messages.success(request, f"Study material '{title}' deleted successfully!")
            
        except Exception as e:
            messages.error(request, f"Error deleting study material: {str(e)}")
    
    return redirect('room_view', room_id=room_id)


@login_required(login_url="/login/")
def get_study_material_data(request, room_id, material_id):
    """Get study material data for editing (AJAX endpoint)"""
    if request.method != 'GET':
        return JsonResponse({'success': False, 'error': 'Only GET requests allowed'})
    
    try:
        room = get_object_or_404(Room, id=room_id)
        material = get_object_or_404(StudyMaterial, id=material_id, room=room)
        
        # Check edit permissions
        if not material.can_edit(request.user):
            return JsonResponse({'success': False, 'error': 'You don\'t have permission to edit this material'})
        
        # Return material data as JSON
        material_data = {
            'title': material.title,
            'description': material.description,
            'material_type': material.material_type,
            'access_level': material.access_level,
            'external_link': material.external_link or '',
            'content': material.content or '',
            'has_file': bool(material.file_upload),
            'file_name': material.file_upload.name if material.file_upload else '',
        }
        
        return JsonResponse({'success': True, 'material': material_data})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required(login_url="/login/")
def download_study_material(request, room_id, material_id):
    """Download study material file (premium feature for some materials)"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check user enrollment and access
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You must be enrolled in this room to access materials.")
        return redirect("room_detail", pk=room_id)
    
    # Check if user can view this material
    if not material.can_view(request.user, enrollment.enrollment_type):
        messages.error(request, "This material requires premium access.")
        return redirect('room_view', room_id=room_id)
    
    # Check if file exists
    if not material.file_upload:
        messages.error(request, "No file available for download.")
        return redirect('room_view', room_id=room_id)
    
    # Serve file download
    try:
        from django.http import FileResponse
        response = FileResponse(
            material.file_upload.open('rb'),
            as_attachment=True,
            filename=material.file_upload.name.split('/')[-1]
        )
        return response
    except Exception as e:
        messages.error(request, f"Error downloading file: {str(e)}")
        return redirect('room_view', room_id=room_id)


@login_required(login_url="/login/")
def view_study_material(request, room_id, material_id):
    """View study material content with proper access control"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check user enrollment and access
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active"
        )
    except Enrollment.DoesNotExist:
        messages.error(request, "You must be enrolled in this room to access materials.")
        return redirect("room_detail", pk=room_id)
    
    # Check if user can view this material
    if not material.can_view(request.user, enrollment.enrollment_type):
        messages.error(request, "This material requires premium access.")
        return redirect('room_view', room_id=room_id)
    
    # Prepare context for different material types
    context = {
        'room': room,
        'material': material,
        'enrollment': enrollment,
        'can_edit': material.can_edit(request.user),
        'is_premium': enrollment.enrollment_type == 'premium',
    }
    
    return render(request, "rooms/study_material_view.html", context)


@login_required(login_url="/login/")
def serve_study_material(request, room_id, material_id):
    """Serve study material file with appropriate content type and security"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check user enrollment and access
    try:
        enrollment = Enrollment.objects.get(
            user=request.user, room=room, status="active"
        )
    except Enrollment.DoesNotExist:
        return HttpResponseBadRequest("Access denied - not enrolled")
    
    # Check if user can view this material
    if not material.can_view(request.user, enrollment.enrollment_type):
        return HttpResponseBadRequest("Premium access required")
    
    # Check if file exists
    if not material.file_upload:
        return HttpResponseBadRequest("No file available")
    
    try:
        from django.http import HttpResponse
        import mimetypes
        import os
        
        # Get the file path
        file_path = material.file_upload.path
        
        if not os.path.exists(file_path):
            return HttpResponseBadRequest("File not found on server")
        
        # Determine content type
        content_type, encoding = mimetypes.guess_type(file_path)
        if content_type is None:
            # Default content type based on file extension
            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.pdf':
                content_type = 'application/pdf'
            elif ext in ['.jpg', '.jpeg']:
                content_type = 'image/jpeg'
            elif ext == '.png':
                content_type = 'image/png'
            elif ext == '.gif':
                content_type = 'image/gif'
            elif ext in ['.mp4']:
                content_type = 'video/mp4'
            else:
                content_type = 'application/octet-stream'
        
        # Read and serve file
        with open(file_path, 'rb') as f:
            file_content = f.read()
            
        response = HttpResponse(file_content, content_type=content_type)
            
        # Set headers for inline display (not download)
        filename = os.path.basename(file_path)
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        
        # Add headers to prevent caching issues and CORS problems
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['Content-Security-Policy'] = "frame-ancestors 'self'"
        
        return response
        
    except FileNotFoundError:
        return HttpResponseBadRequest("File not found")
    except PermissionError:
        return HttpResponseBadRequest("Permission denied accessing file")
    except Exception as e:
        return HttpResponseBadRequest(f"Error serving file: {str(e)}")


@login_required(login_url="/login/")
def get_study_material_data(request, room_id, material_id):
    """AJAX endpoint to get study material data for editing"""
    room = get_object_or_404(Room, id=room_id)
    material = get_object_or_404(StudyMaterial, id=material_id, room=room)
    
    # Check edit permissions
    if not material.can_edit(request.user):
        return JsonResponse({'error': 'Permission denied'}, status=403)
    
    # Return material data as JSON
    data = {
        'id': material.id,
        'title': material.title,
        'description': material.description,
        'material_type': material.material_type,
        'access_level': material.access_level,
        'content': material.content or '',
        'external_link': material.external_link or '',
        'has_file': bool(material.file_upload),
        'file_name': material.file_upload.name.split('/')[-1] if material.file_upload else '',
        'file_size': material.file_size,
        'created_date': material.created_date.isoformat(),
    }
    
    return JsonResponse({'success': True, 'material': data})