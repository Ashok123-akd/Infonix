import base64
import os
from io import BytesIO

import face_recognition
import numpy as np
from PIL import Image

from .models import UserProfile


class FaceAuthenticator:
    def __init__(self):
        self.KNOWN_FACES_DIR = "face_images"  # Changed to face_images directory
        self.known_encodings = []
        self.known_names = []
        self.load_known_faces_from_db()

    def load_known_faces_from_db(self):
        """Load known faces from the database instead of directory"""
        print("Loading known faces from database...")

        # Clear existing data
        self.known_encodings = []
        self.known_names = []

        try:
            # Get all UserProfiles that have face embeddings
            user_profiles = UserProfile.objects.filter(
                face_embedding__isnull=False
            ).exclude(face_embedding="")

            for profile in user_profiles:
                try:
                    # Get the embedding data
                    encoding = profile.get_face_embedding()
                    if encoding is not None and encoding.shape == (128,):
                        self.known_encodings.append(encoding)
                        # Use username since user_name field was removed
                        self.known_names.append(profile.user.username)
                        print(
                            f"Loaded valid embedding for {profile.user.username} (shape: {encoding.shape})"
                        )
                    else:
                        print(
                            f"Skipping invalid embedding for {profile.user.username} (shape: {encoding.shape if encoding is not None else 'None'})"
                        )
                except Exception as e:
                    print(f"Error loading embedding for {profile.user.username}: {e}")
                    continue

            print(
                f"Loaded {len(self.known_names)} known faces from database: {self.known_names}"
            )

        except Exception as e:
            print(f"Error accessing database: {e}")
            # Fallback to loading from files if database fails
            self.load_known_faces_from_files()

    def load_known_faces_from_files(self):
        """Fallback method: Load known faces from the face_images directory"""
        print("Loading known faces from files (fallback)...")

        if not os.path.exists(self.KNOWN_FACES_DIR):
            print(f"Directory {self.KNOWN_FACES_DIR} does not exist")
            return

        for filename in os.listdir(self.KNOWN_FACES_DIR):
            if filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp")):
                try:
                    image_path = os.path.join(self.KNOWN_FACES_DIR, filename)
                    image = face_recognition.load_image_file(image_path)
                    encodings = face_recognition.face_encodings(image)
                    if encodings:
                        encoding = encodings[0]
                        self.known_encodings.append(encoding)
                        # Extract name from filename (remove extension)
                        name = os.path.splitext(filename)[0]
                        # Clean up the filename to make it more readable
                        name = name.replace("_", " ").replace("-", " ")
                        self.known_names.append(name)
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
                    continue

        print(
            f"Loaded {len(self.known_names)} known faces from files: {self.known_names}"
        )

    def reload_faces(self):
        """Reload faces from database - useful after admin changes"""
        self.load_known_faces_from_db()

    def authenticate_face(self, image_data):
        """
        Authenticate a face from base64 image data
        Returns tuple: (is_authenticated, name)
        """
        try:
            # Decode base64 image
            image_data = image_data.split(",")[
                1
            ]  # Remove data:image/jpeg;base64, prefix
            image_bytes = base64.b64decode(image_data)

            # Convert to PIL Image
            pil_image = Image.open(BytesIO(image_bytes))

            # Convert to RGB numpy array
            rgb_image = np.array(pil_image.convert("RGB"))

            # Detect faces
            face_locations = face_recognition.face_locations(rgb_image)
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)

            if not face_encodings:
                return False, "No face detected"

            # Reload faces from database to get latest data
            self.reload_faces()

            if not self.known_encodings:
                return False, "No known faces in database"

            # Compare with known faces
            for face_encoding in face_encodings:
                matches = face_recognition.compare_faces(
                    self.known_encodings, face_encoding, tolerance=0.6
                )

                if True in matches:
                    face_distances = face_recognition.face_distance(
                        self.known_encodings, face_encoding
                    )
                    best_match_index = np.argmin(face_distances)

                    if matches[best_match_index]:
                        name = self.known_names[best_match_index]
                        confidence = 1 - face_distances[best_match_index]
                        print(f"Face matched: {name} with confidence: {confidence:.2f}")
                        return True, name

            return False, "Unknown face"

        except Exception as e:
            print(f"Error in face authentication: {e}")
            return False, f"Error: {str(e)}"


# Utility functions for processing face images
def process_face_image_from_upload(uploaded_file):
    """Process uploaded image file and return face embedding"""
    try:
        # Convert uploaded file to PIL Image
        image = Image.open(uploaded_file)
        rgb_image = np.array(image.convert("RGB"))

        # Get face encodings
        face_encodings = face_recognition.face_encodings(rgb_image)

        if face_encodings:
            print(
                f"Successfully extracted face embedding with shape: {face_encodings[0].shape}"
            )
            return face_encodings[0]  # Return first face encoding
        else:
            print("No face found in uploaded image")
            return None
    except Exception as e:
        print(f"Error processing uploaded image: {e}")
        return None


def compare_face_embeddings(embedding1, embedding2, tolerance=0.6):
    """Compare two face embeddings and return True if they match"""
    try:
        if embedding1 is None or embedding2 is None:
            return False

        # Convert to numpy arrays if they aren't already
        if not isinstance(embedding1, np.ndarray):
            embedding1 = np.array(embedding1)
        if not isinstance(embedding2, np.ndarray):
            embedding2 = np.array(embedding2)

        # Calculate distance
        distance = np.linalg.norm(embedding1 - embedding2)

        # Return True if distance is below tolerance
        return distance <= tolerance
    except Exception as e:
        print(f"Error comparing embeddings: {e}")
        return False
