from django.contrib import admin
from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("signin/", views.signin, name="signin"),
    path("signup/", views.signup, name="signup"),
    path("logout/", views.logout_view, name="logout"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("reset-password/", views.reset_password, name="reset_password"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
    # Room URLs
    path("rooms/", views.room_list, name="room_list"),
    path("rooms/<int:pk>/", views.room_detail, name="room_detail"),
    path("rooms/create/", views.create_room, name="create_room"),
    path("my-rooms/", views.my_rooms, name="my_rooms"),
    path("my-enrollments/", views.my_enrollments, name="my_enrollments"),
    # Enrollment URLs
    path("enroll/free/<int:room_id>/", views.enroll_free, name="enroll_free"),
    path(
        "enroll/premium/<int:room_id>/",
        views.enroll_premium_form,
        name="enroll_premium_form",
    ),
    path(
        "payment/<int:room_id>/<int:enrollment_id>/",
        views.payment_page,
        name="payment_page",
    ),
    # Room content view
    path("room-view/<int:room_id>/", views.room_view, name="room_view"),
    # Study Materials CRUD URLs
    path("room/<int:room_id>/material/create/", views.create_study_material, name="create_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/view/", views.view_study_material, name="view_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/edit/", views.edit_study_material, name="edit_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/delete/", views.delete_study_material, name="delete_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/download/", views.download_study_material, name="download_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/serve/", views.serve_study_material, name="serve_study_material"),
    path("room/<int:room_id>/material/<int:material_id>/data/", views.get_study_material_data, name="get_study_material_data"),
    # Chatbot URLs - Updated with proper implementation
    path("chatbot/<int:room_id>/", views.chatbot_view, name="chatbot"),
    path("chat/", views.chat_api, name="chat_api"),
    path("chat/summary/save/", views.save_chat_summary, name="save_chat_summary"),
    path("chat/read-file/", views.read_file_aloud, name="read_file_aloud"),
    # Payment Callback URLs
    path("payment/success/", views.payment_success, name="payment_success"),
    path("payment/failure/", views.payment_failure, name="payment_failure"),
]
