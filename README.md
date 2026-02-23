# 🔐 AI-Powered Secure Cloud Vault for Encrypted File Sharing

A full-stack AI-enabled secure file storage and sharing platform that allows users to upload, encrypt, store, and share files using secret access keys.
The system integrates modern cloud storage, LLM-powered intelligence, and strong access control to ensure privacy, scalability, and real-time secure collaboration.


# 🚀 Live Demo

🔗 https://cloudvault-frontend-jogm.onrender.com

Click the link above to access the deployed application.


## 📌 Problem Statement

Traditional file-sharing platforms store files in plain format or rely only on basic authentication.  
Users face major issues:

- No end-to-end encryption for sensitive files  
- No intelligent file interaction  
- Limited access control for shared content  
- Lack of secure key-based sharing  

There is a need for a secure, AI-enhanced, cloud-based vault system.



# 🎯 Objectives

- Build a secure encrypted file storage system  
- Enable key-based secure file sharing  
- Integrate AI for intelligent file interaction  
- Implement role-based access control  
- Deploy a scalable full-stack cloud solution  


# ✨ Key Features

✅ End-to-end encrypted file upload & storage
✅ Secret key-based secure file sharing
✅ Role-based access control
✅ AI-powered file assistant (LLM integration)
✅ Real-time file access & management
✅ User authentication system
✅ Cloud storage using Supabase
✅ Fully deployed production-ready system


# 🧠 System Architecture

User
→ React Frontend (Vite)
→ Python Backend (Flask API)
→ Supabase (PostgreSQL + Storage)
→ Groq LLM API

# Benefits

- Secure encryption workflow  
- Scalable cloud architecture  
- Modular service-based design  
- High-performance file handling  
- AI-powered intelligent interaction  


# 🗄️ Database Schema Entities

- User  
- FileMetadata  
- SharedAccess  
- ChatHistory  

### Relationships

- One User → Many Files  
- One File → Many SharedAccess records  
- One User → Many ChatHistory records  

This structure ensures secure access tracking and efficient file management.


# 🛠️ Tech Stack

# Frontend
- React (Vite)  
- Tailwind CSS  

# Backend
- Python (Flask)  
- REST API  
- Gunicorn (Production WSGI)  
- AI Integration  
- Groq LLM API

# Database & Storage
- Supabase (PostgreSQL + Object Storage)  

# Security
- Client-side encryption  
- Secret access key validation  
- Role-based authorization 

# Deployment
- Render (Frontend + Backend)  

# Version Control
- GitHub


# 📂 Project Structure
cloudvault-secure-sharing
│── components        # UI components
│── services          # API & encryption logic
│── server.py         # Flask backend
│── package.json      # Frontend dependencies
│── requirements.txt  # Backend dependencies


# ⚙️ Installation & Setup

# 1️⃣ Clone the repository
git clone -  https://github.com/GOKUL-S2648/Cloud-valut
cd cloudvault-secure-sharing

# 2️⃣ Install dependencies
Frontend
npm install

Backend
pip install -r requirements.txt

# 3️⃣ Configure environment variables
Create .env file:
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GROQ_API_KEY=your_groq_api_key

# 4️⃣ Run locally
Start backend
python server.py

Start frontend
npm run dev

# 🌍 Deployment

The application is deployed using Render:

- Flask backend as Web Service  
- React frontend as Static Site  
- Supabase for database & storage  


# 🧪 Future Enhancements

- Multi-user collaboration on files  
- File versioning system  
- AI-based file summarization  
- Real-time notifications  
- Custom domain & CDN integration  



