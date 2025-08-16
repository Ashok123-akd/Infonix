from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notebazar.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db = SQLAlchemy(app)

# Create upload directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    coins = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    notes = db.relationship('Note', backref='uploader', lazy=True)
    purchases = db.relationship('Purchase', backref='user', lazy=True)
    questions = db.relationship('ForumQuestion', backref='user', lazy=True)
    answers = db.relationship('ForumAnswer', backref='user', lazy=True)
    comments = db.relationship('Comment', backref='user', lazy=True)


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Integer, default=0)  # 0 for free notes
    uploader_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    downloads = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    purchases = db.relationship('Purchase', backref='note', lazy=True)


class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    note_id = db.Column(db.Integer, db.ForeignKey('note.id'), nullable=False)
    purchased_at = db.Column(db.DateTime, default=datetime.utcnow)


class ForumQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    answers = db.relationship('ForumAnswer', backref='question', lazy=True, cascade='all, delete-orphan')


class ForumAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('forum_question.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    target_type = db.Column(db.String(50), nullable=False)  # 'answer' or 'question'
    target_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Helper functions
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Routes
@app.route('/')
def index():
    recent_notes = Note.query.order_by(Note.created_at.desc()).limit(6).all()
    recent_questions = ForumQuestion.query.order_by(ForumQuestion.created_at.desc()).limit(4).all()
    return render_template('index.html', recent_notes=recent_notes, recent_questions=recent_questions)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Username already exists'})
        
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Email already registered'})
        
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            coins=10  # Welcome bonus
        )
        
        db.session.add(user)
        db.session.commit()
        
        session['user_id'] = user.id
        session['username'] = user.username
        
        return jsonify({'success': True, 'message': 'Account created successfully!'})
    
    return render_template('auth.html', mode='register')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({'success': True, 'message': 'Login successful!'})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    
    return render_template('auth.html', mode='login')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    uploaded_notes = Note.query.filter_by(uploader_id=user.id).all()
    purchased_notes = db.session.query(Note).join(Purchase).filter(Purchase.user_id == user.id).all()
    
    # Calculate earnings
    total_earnings = sum(note.downloads * note.price for note in uploaded_notes if note.price > 0)
    
    return render_template('dashboard.html', 
                         user=user, 
                         uploaded_notes=uploaded_notes, 
                         purchased_notes=purchased_notes,
                         total_earnings=total_earnings)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Jinja filter to support {{ text|nl2br|safe }}
@app.template_filter('nl2br')
def nl2br(s: str):
    if not s:
        return ''
    return s.replace('\n', '<br>')
@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_note():
    if request.method == 'POST':
        title = request.form.get('title')
        subject = request.form.get('subject')
        description = request.form.get('description')
        price = int(request.form.get('price', 0))
        
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            # Generate unique filename
            filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            note = Note(
                title=title,
                subject=subject,
                description=description,
                filename=filename,
                price=price,
                uploader_id=session['user_id']
            )
            
            db.session.add(note)
            db.session.commit()
            
            flash('Note uploaded successfully!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files.', 'error')
    
    return render_template('upload.html')

@app.route('/notes')
def notes():
    page = request.args.get('page', 1, type=int)
    subject_filter = request.args.get('subject', '')
    
    query = Note.query
    if subject_filter:
        query = query.filter(Note.subject.ilike(f'%{subject_filter}%'))
    
    notes = query.order_by(Note.created_at.desc()).paginate(
        page=page, per_page=12, error_out=False
    )
    
    subjects = db.session.query(Note.subject.distinct()).all()
    subjects = [s[0] for s in subjects]
    
    return render_template('notes.html', notes=notes, subjects=subjects, selected_subject=subject_filter)

@app.route('/note/<int:note_id>')
def view_note(note_id):
    note = Note.query.get_or_404(note_id)
    
    # Increment view count
    note.views += 1
    db.session.commit()
    
    # Check if user has purchased this note (if it's paid)
    can_download = True
    if note.price > 0 and 'user_id' in session:
        purchase = Purchase.query.filter_by(user_id=session['user_id'], note_id=note_id).first()
        can_download = purchase is not None or note.uploader_id == session.get('user_id')
    elif note.price > 0:
        can_download = False
    
    return render_template('note_detail.html', note=note, can_download=can_download)

@app.route('/download/<int:note_id>')
@login_required
def download_note(note_id):
    note = Note.query.get_or_404(note_id)
    
    # Check if note is free or user has purchased it
    if note.price == 0 or note.uploader_id == session['user_id']:
        # Free note or own note
        can_download = True
    else:
        # Check if user has purchased
        purchase = Purchase.query.filter_by(user_id=session['user_id'], note_id=note_id).first()
        can_download = purchase is not None
    
    if not can_download:
        flash('You need to purchase this note first.', 'error')
        return redirect(url_for('view_note', note_id=note_id))
    
    # Increment download count
    note.downloads += 1
    db.session.commit()
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], note.filename)
    return send_file(filepath, as_attachment=True, download_name=f"{note.title}.{note.filename.split('.')[-1]}")

@app.route('/purchase/<int:note_id>', methods=['POST'])
@login_required
def purchase_note(note_id):
    note = Note.query.get_or_404(note_id)
    user = User.query.get(session['user_id'])
    
    if note.price == 0:
        return jsonify({'success': False, 'message': 'This note is free!'})
    
    if user.coins < note.price:
        return jsonify({'success': False, 'message': 'Insufficient coins. Please buy more coins.'})
    
    # Check if already purchased
    existing_purchase = Purchase.query.filter_by(user_id=user.id, note_id=note_id).first()
    if existing_purchase:
        return jsonify({'success': False, 'message': 'You have already purchased this note.'})
    
    # Process purchase
    user.coins -= note.price
    purchase = Purchase(user_id=user.id, note_id=note_id)
    
    # Give coins to uploader
    uploader = User.query.get(note.uploader_id)
    uploader.coins += note.price
    
    db.session.add(purchase)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Note purchased successfully!'})

@app.route('/buy-coins', methods=['GET', 'POST'])
@login_required
def buy_coins():
    if request.method == 'POST':
        # Simulate payment processing
        # In production, integrate with actual payment gateway
        user = User.query.get(session['user_id'])
        user.coins += 100  # Rs. 100 = 100 coins
        db.session.commit()
        
        flash('Coins purchased successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('buy_coins.html')

@app.route('/forum')
def forum():
    page = request.args.get('page', 1, type=int)
    category_filter = request.args.get('category', '')
    
    query = ForumQuestion.query
    if category_filter:
        query = query.filter(ForumQuestion.category == category_filter)
    
    questions = query.order_by(ForumQuestion.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    categories = ['Programming', 'Mathematics', 'Science', 'Engineering', 'Literature', 'General']
    
    return render_template('forum.html', questions=questions, categories=categories, selected_category=category_filter)

@app.route('/forum/ask', methods=['GET', 'POST'])
@login_required
def ask_question():
    if request.method == 'POST':
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        category = data.get('category')
        
        question = ForumQuestion(
            title=title,
            content=content,
            category=category,
            user_id=session['user_id']
        )
        
        db.session.add(question)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Question posted successfully!'})
    
    categories = ['Programming', 'Mathematics', 'Science', 'Engineering', 'Literature', 'General']
    return render_template('ask_question.html', categories=categories)

@app.route('/forum/question/<int:question_id>')
def view_question(question_id):
    question = ForumQuestion.query.get_or_404(question_id)
    answers = ForumAnswer.query.filter_by(question_id=question_id).order_by(ForumAnswer.rating.desc()).all()
    
    # Get comments for each answer
    answer_comments = {}
    for answer in answers:
        comments = Comment.query.filter_by(target_type='answer', target_id=answer.id).all()
        answer_comments[answer.id] = comments
    
    return render_template('question_detail.html', question=question, answers=answers, answer_comments=answer_comments)

@app.route('/forum/answer/<int:question_id>', methods=['POST'])
@login_required
def post_answer(question_id):
    data = request.get_json()
    content = data.get('content')
    
    answer = ForumAnswer(
        question_id=question_id,
        user_id=session['user_id'],
        content=content
    )
    
    db.session.add(answer)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Answer posted successfully!'})

@app.route('/forum/rate/<int:answer_id>', methods=['POST'])
@login_required
def rate_answer(answer_id):
    data = request.get_json()
    rating_type = data.get('type')  # 'up' or 'down'
    
    answer = ForumAnswer.query.get_or_404(answer_id)
    
    if rating_type == 'up':
        answer.rating += 1
        # Reward answerer with coins
        answerer = User.query.get(answer.user_id)
        answerer.coins += 1
    elif rating_type == 'down':
        answer.rating -= 1
    
    db.session.commit()
    
    return jsonify({'success': True, 'new_rating': answer.rating})

@app.route('/forum/comment', methods=['POST'])
@login_required
def post_comment():
    data = request.get_json()
    target_type = data.get('target_type')
    target_id = data.get('target_id')
    content = data.get('content')
    
    comment = Comment(
        target_type=target_type,
        target_id=target_id,
        user_id=session['user_id'],
        content=content
    )
    
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Comment posted successfully!'})

@app.route('/api/user-stats')
@login_required
def user_stats():
    user = User.query.get(session['user_id'])
    uploaded_notes = Note.query.filter_by(uploader_id=user.id).all()
    total_downloads = sum(note.downloads for note in uploaded_notes)
    total_views = sum(note.views for note in uploaded_notes)
    total_earnings = sum(note.downloads * note.price for note in uploaded_notes if note.price > 0)
    
    return jsonify({
        'coins': user.coins,
        'total_downloads': total_downloads,
        'total_views': total_views,
        'total_earnings': total_earnings,
        'notes_uploaded': len(uploaded_notes)
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)