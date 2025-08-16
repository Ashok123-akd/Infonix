# InnovaCollab - AI-Powered E-Learning Platform

[![Django](https://img.shields.io/badge/Django-5.2.1-green.svg)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.2-purple.svg)](https://getbootstrap.com/)

## 🚀 Project Overview

InnovaCollab is a cutting-edge e-learning platform that combines traditional learning management with modern AI technologies. The platform features face recognition authentication, AI-powered chatbot assistance, and comprehensive study material management, providing an innovative and secure learning environment.

### ✨ Key Features

- **🤖 AI-Powered Chatbot**: Integrated Google Gemini AI assistant for instant help
- **📚 Study Materials Management**: Upload, organize, and share learning resources
- **🏫 Room-Based Learning**: Structured learning environments with enrollment system
- **💳 Payment Integration**: Free and premium enrollment options
- **📱 Engaging Design**: Modern, professional UI with smooth animations
- **🔒 Multi-Factor Authentication**: Enhanced security with traditional and biometric auth


## 🛠️ Technology Stack

### Backend
- **Django 5.2.1** - Web framework
- **SQLite** - Database
- **Django Allauth** - Authentication system
- **PyJWT** - JSON Web Token handling
- **Cryptography** - Security utilities

### AI & Machine Learning
- **Google Generative AI (Gemini 1.5)** - Chatbot intelligence
- **Pillow (PIL)** - Image processing

### Frontend
- **Bootstrap 5.3.2** - UI framework
- **Font Awesome 6.4.0** - Icons
- **Google Fonts** (Inter, Poppins) - Typography
- **Animate.css** - Animations
- **Custom CSS** - Modern styling with variables

### File Processing
- **PyPDF2** - PDF document handling
- **python-docx** - Word document processing
- **Pillow** - Image manipulation

### Development Tools
- **Python-dotenv** - Environment variables
- **Colorama** - Terminal colors
- **Virtual Environment** - Isolated Python environment

## 📋 Prerequisites

- Python 3.12+
- pip package manager
- Virtual environment (recommended)
- Modern web browser

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd InnovaCollab
```

### 2. Create Virtual Environment
```bash
python -m venv env
```

### 3. Activate Virtual Environment
```bash
# Windows
env\Scripts\activate

# Linux/Mac
source env/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Environment Configuration
Create a `.env` file in the project root:
```env
# Google AI Configuration
GOOGLE_API_KEY=your_google_gemini_api_key_here

# Django Settings
SECRET_KEY=your_secret_key_here
DEBUG=True

# Database Settings (SQLite is default)
DATABASE_URL=sqlite:///db.sqlite3
```

### 6. Database Setup
```bash
cd innovacollab
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic
```

### 7. Create Superuser
```bash
python manage.py createsuperuser
```

### 8. Run Development Server
```bash
python manage.py runserver
```

The application will be available at: `http://localhost:8000`

## 🏗️ Project Structure

```
InnovaCollab/
├── env/                          # Virtual environment
├── innovacollab/                 # Django project root
│   ├── innovacollab/            # Project settings
│   │   ├── __init__.py
│   │   ├── settings.py          # Main configuration
│   │   ├── urls.py              # URL routing
│   │   ├── wsgi.py              # WSGI configuration
│   │   └── asgi.py              # ASGI configuration
│   ├── innovacollabapp/         # Main application
│   │   ├── models.py            # Database models
│   │   ├── views.py             # View controllers
│   │   ├── urls.py              # App URL patterns
│   │   ├── admin.py             # Admin configuration
│   │   ├── face_utils.py        # Face recognition utilities
│   │   ├── adapter.py           # Authentication adapter
│   │   ├── migrations/          # Database migrations
│   │   ├── templates/           # HTML templates
│   │   └── static/              # CSS, JS, images
│   ├── media/                   # User uploaded files
│   │   ├── profile_pictures/
│   │   ├── room_images/
│   │   ├── study_materials/
│   │   └── chat_summaries/
│   ├── static/                  # Static files
│   ├── db.sqlite3               # SQLite database
│   ├── manage.py                # Django management
│   └── prompt_template.txt      # AI prompts
├── requirements.txt             # Python dependencies
└── README.md                    # Project documentation
```

## 🗃️ Database Models

### CustomUser
- **Purpose**: Extended user model with MFA capabilities
- **Fields**: username, email, first_name, last_name, date_joined, is_mfa_enabled, face_encoding

### Room
- **Purpose**: Learning room/course management
- **Fields**: title, description, instructor, category, capacity, enrollment_fee, is_active
- **Features**: Enrollment tracking, premium/free access levels

### Enrollment
- **Purpose**: User-room enrollment tracking
- **Fields**: user, room, enrollment_date, enrollment_type, status
- **Types**: free, premium

### UserProfile
- **Purpose**: Extended user information and preferences
- **Fields**: user, bio, location, birth_date, face_image, face_encoding

### StudyMaterial
- **Purpose**: Learning resource management
- **Fields**: title, description, file_upload, material_type, access_level
- **Types**: PDF, video, image, text, external links
- **Access**: Free or premium content

### ChatSession & ChatSummary
- **Purpose**: AI chatbot conversation management
- **Features**: Persistent chat history, conversation summaries

## 🔐 Authentication System

### Traditional Authentication
- Username/email and password login
- Django Allauth integration
- Session management

### Multi-Factor Authentication (MFA)
- Optional MFA enablement
- Enhanced security for sensitive accounts

## 🤖 AI Integration

### Google Gemini AI Chatbot
- **Model**: gemini-1.5-flash
- **Features**:
  - Contextual learning assistance
  - Natural language processing
  - Safety filtering enabled
  - Persistent conversation history
  - File content analysis (PDF, DOCX)

### Implementation Details
```python
# AI Configuration
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    safety_settings=[
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
    ]
)
```

## 📚 Study Materials System

### File Management
- **Upload Limit**: 50MB per file
- **Supported Formats**: PDF, DOC, DOCX, images, videos
- **Storage**: Organized by room and material type
- **Security**: Access control based on enrollment type

### Access Control
- **Free Materials**: Available to all enrolled users
- **Premium Materials**: Exclusive to premium subscribers
- **Edit Permissions**: Authors and instructors only

### Features
- Drag and drop file upload
- Automatic file type detection
- File size validation
- Download protection
- Content preview

## 🎨 UI/UX Design

### Design System
- **Framework**: Bootstrap 5.3.2 with custom CSS
- **Typography**: Google Fonts (Inter, Poppins)
- **Color Scheme**: Modern gradient-based palette
- **Icons**: Font Awesome 6.4.0
- **Animations**: Animate.css with custom keyframes

### Key Design Elements
```css
/* CSS Variables for Consistency */
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🔄 Workflow Architecture

### User Registration Flow
1. **Account Creation**: Basic information entry
2. **Face Registration**: Optional biometric setup
3. **Profile Completion**: Additional user details
4. **Email Verification**: Account activation

### Learning Flow
1. **Browse Rooms**: Discover available courses
2. **Enrollment**: Choose free or premium access
3. **Payment Processing**: For premium features
4. **Content Access**: Study materials and resources
5. **AI Assistance**: Chatbot support throughout

### Content Management Flow
1. **Material Upload**: Instructors add resources
2. **Access Control**: Set free/premium levels
3. **File Processing**: Automatic type detection
4. **Student Access**: Based on enrollment type

## 🚀 Deployment

### Production Setup
1. **Environment Variables**: Configure production settings
2. **Database**: Consider PostgreSQL for production
3. **Static Files**: Use CDN for better performance
4. **Security**: Enable HTTPS, security headers
5. **Monitoring**: Implement logging and monitoring

### Environment Variables for Production
```env
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECURE_SSL_REDIRECT=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
```

**Built with ❤️ using Django, AI, and modern web technologies**
