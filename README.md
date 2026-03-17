# Travel-platform
Internet Technology Coursework

Travel Platform

A full-stack tourism social platform that allows users to discover cities, create and share travel posts, interact with content, manage profiles, and record check-ins.

This repository contains both the backend and the frontend of the project.

Project Overview

Travel Platform is a travel-sharing web application designed for users to explore destinations, publish travel guides, search cities, rate and favorite posts, comment on content, and maintain a personal travel footprint.

The system is split into two parts:
	•	Backend: Django + Django REST Framework
	•	Frontend: React + Vite + TypeScript

Main Features
	•	User registration and login with JWT authentication
	•	Popular city listing and city search
	•	City detail page with related travel posts
	•	Create, view, like, favorite, rate, comment on, and delete posts
	•	Personal profile viewing and updating
	•	Avatar upload
	•	Personal post list and favorites list
	•	Check-in feature and travel footprint map
	•	Media upload support for avatars and post images

Tech Stack

## Python Version

This project is developed and tested with **Python 3.14**.

Please make sure you are using Python 3.14 when creating the virtual environment:

```bash
python3.14 -m venv .venv
source .venv/bin/activate
python3.14 -m pip install -r requirements.txt
```

Backend
	•	Python 3
	•	Django
	•	Django REST Framework
	•	djangorestframework-simplejwt
	•	django-cors-headers
	•	Pillow
	•	requests
	•	SQLite

Frontend
	•	React
	•	Vite
	•	TypeScript
	•	Tailwind CSS
	•	React Router
	•	TanStack Query
	•	Framer Motion
	•	Lucide React

Project Structure

Travel-platform/
├── config/
├── core/
├── media/
├── templates/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── manage.py
├── requirements.txt
└── README.md

Clone the Repository

git clone https://github.com/ZaneCarl98/Travel-platform.git
cd Travel-platform

Backend Setup

From the project root:

python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 manage.py test core
python3 manage.py migrate
python3 manage.py runserver

Backend will run at:

http://127.0.0.1:8000/

Frontend Setup

Open a new terminal and run:

cd frontend
npm install
npm run dev

Frontend will usually run at:

http://127.0.0.1:8080/

Running the Full Project

You need two terminals.

Terminal 1: backend

cd Travel-platform
source .venv/bin/activate
python3 manage.py runserver

Terminal 2: frontend

cd Travel-platform/frontend
npm install
npm run dev

Testing

Backend unit tests can be run with:

cd Travel-platform
source .venv/bin/activate
python3 manage.py test core

These tests cover key backend functionality such as:
	•	user registration and login
	•	popular city and city search APIs
	•	authenticated post creation
	•	like, favorite, and rating actions
	•	check-in logic

Backend Dependencies

Main backend packages used in this project:
	•	Django
	•	djangorestframework
	•	djangorestframework-simplejwt
	•	django-cors-headers
	•	Pillow
	•	requests

If needed, regenerate the dependency file with:

pip freeze > requirements.txt

Media Files

Uploaded avatars and post images are stored in the media/ directory.

In local development, media files are served through Django when DEBUG=True.

For deployment, media files must be configured separately on the hosting platform.

For example, on PythonAnywhere, /media/ should be mapped to the project’s media/ directory in the Web tab.

API Overview

Auth
	•	POST /api/auth/register
	•	POST /api/auth/login

Cities
	•	GET /api/cities/popular
	•	GET /api/cities/search?q=<keyword>
	•	GET /api/cities/<city_id>
	•	GET /api/cities/<city_id>/posts

Posts
	•	POST /api/posts
	•	GET /api/posts/<post_id>
	•	DELETE /api/posts/<post_id>/delete
	•	POST /api/posts/<post_id>/like
	•	POST /api/posts/<post_id>/favorite
	•	POST /api/posts/<post_id>/rate
	•	GET /api/posts/<post_id>/comments
	•	POST /api/posts/<post_id>/comments

Profile
	•	GET /api/users/<user_id>/profile
	•	PUT /api/users/profile

User Data
	•	GET /api/users/<user_id>/posts
	•	GET /api/users/<user_id>/favorites
	•	GET /api/users/<user_id>/checkins

Check-in
	•	POST /api/checkins

Admin Panel

Django admin is available at:

http://127.0.0.1:8000/admin

You can use the admin panel to:
	•	create and manage cities
	•	inspect users
	•	manage posts
	•	manage comments and check-ins

Frontend Notes

The frontend communicates with the Django backend through API requests.

Before running the frontend, make sure the backend server is already running.

If API base URLs or ports are changed, corresponding frontend configuration should also be updated.

Deployment Notes

This project backend has been deployed on PythonAnywhere.

When deploying, make sure to:
	•	set ALLOWED_HOSTS correctly
	•	configure media file mapping
	•	upload or preserve media files
	•	run migrations
	•	reload the web app after configuration changes

If images or avatars do not display after deployment, first check whether /media/ is correctly mapped and whether uploaded files exist on the server.

Known Notes
	•	Some endpoints require login and JWT authentication
	•	Uploaded media depends on correct production media configuration
	•	The frontend and backend are kept in the same repository for convenience
	•	node_modules and other generated frontend folders should not be committed

Author

Project maintained by Group CZ