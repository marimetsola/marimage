# Image Host

A small self-hosted image hosting service built as a showcase project and for personal use.

The goal is to create a simple private image hosting application where authenticated users can upload images and receive public URLs that can be shared directly, for example in Discord.

The project is also a practical learning project covering Linux server administration, Docker, backend development, databases, web servers, and basic web security.

## Current Status

The project is currently under active development.

The current backend includes:

* FastAPI backend
* PostgreSQL database
* SQLAlchemy 2.x ORM
* Pydantic API schemas
* User registration
* Argon2 password hashing
* Session-based authentication
* Login and logout
* Current-user endpoint
* Image upload
* Image metadata stored in PostgreSQL
* Public image URLs
* Image listing for the authenticated user
* Image deletion with ownership checks
* Image type validation
* File size limits
* EXIF and image metadata sanitization
* Nginx reverse proxy
* Nginx static image serving
* Docker Compose development environment
* Development hot reload for the backend

The frontend dashboard is planned next.

## Architecture

```text
                         Browser
                            │
                            │ HTTP
                            ▼
                         Nginx
                       /        \
                      /          \
                 /api/...        /i/...
                    │               │
                    ▼               ▼
                 FastAPI        Image storage
                    │
                    ▼
                PostgreSQL
```

Nginx is the only service exposed to the host. FastAPI and PostgreSQL communicate through the internal Docker network.

The backend has read/write access to the image storage directory, while Nginx mounts the same directory read-only for serving public images.

## Technologies

### Backend

* Python
* FastAPI
* SQLAlchemy 2.x
* Pydantic
* Psycopg
* pwdlib with Argon2
* Pillow

### Infrastructure

* Docker
* Docker Compose
* Nginx
* PostgreSQL

### Development Environment

The application is currently developed and tested locally using Docker Compose.

The backend uses Uvicorn's development reload mode so Python code changes are picked up without rebuilding the container. Dependency changes still require rebuilding the backend image.

Environment-specific configuration is provided through a `.env` file.

## Authentication

User passwords are never stored as plain text. Passwords are hashed using Argon2 before being stored in PostgreSQL.

Authentication uses session-based authentication provided by Starlette's `SessionMiddleware`.

The application currently supports:

* User registration
* Login
* Logout
* Session cookies
* Current-user lookup
* Protected endpoints for authenticated users
* Image ownership checks
* Disabling public registration through an environment variable

Registration can be enabled or disabled with:

```env
REGISTER_ENABLED=true
```

For a production deployment, registration can be disabled:

```env
REGISTER_ENABLED=false
```

## Image Upload

Authenticated users can upload images through the API.

The upload process currently includes:

* Allowed image type checking
* Maximum file size checking
* Verification of the actual image format using Pillow
* Generated storage filenames
* Preservation of the original filename as metadata
* Image metadata stored in PostgreSQL
* EXIF and other image metadata sanitization
* EXIF orientation handling

Images are stored as files rather than as binary data inside PostgreSQL.

For example:

```text
Original filename:
Screenshot 2026-09-18.png

Stored filename:
8f31a2c4....png

Public URL:
https://img.example.com/i/8f31a2c4....png
```

The original filename is retained as metadata, while generated filenames are used for storage and public URLs.

## Image Management

Authenticated users can retrieve their own uploaded images through the API.

The image listing currently provides information such as:

* Image ID
* Original filename
* MIME type
* File size
* Upload timestamp
* Public URL

Users can also delete their own images.

Image ownership is checked server-side, so a user cannot delete another user's image by providing its ID.

## Storage

Uploaded images are stored separately from the PostgreSQL database.

PostgreSQL stores image metadata, while the actual image files are stored in the image storage directory.

The same host directory is mounted into the containers at different paths:

```text
Host:
storage/images/

Backend:
 /app/images/

Nginx:
 /usr/share/nginx/html/i/
```

The backend can write to the storage directory, while Nginx accesses it read-only.

This separation keeps application data and file storage independent and makes the system easier to back up and migrate.

## Database

PostgreSQL stores application data such as user accounts and image metadata.

The database runs in its own Docker container and uses a persistent Docker volume so that recreating the PostgreSQL container does not remove the database contents.

The application uses SQLAlchemy as its ORM layer.

The current database models include:

```text
users
images
```

Images reference their owner through a foreign key.

## API

The current API includes:

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me

GET    /api/images
POST   /api/upload
DELETE /api/images/{image_id}
```

FastAPI's automatically generated API documentation is available during development at:

```text
http://localhost/docs
```

## Project Structure

```text
image-host/
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── storage.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── nginx/
│   └── nginx.conf
│
├── storage/
│   └── images/
│       └── .gitkeep
│
├── .env
├── .gitignore
└── docker-compose.yml
```

## Running Locally

Create a `.env` file with the required configuration and start the application with:

```bash
docker compose up -d --build
```

The application is then available through Nginx at:

```text
http://localhost
```

FastAPI's API documentation is available at:

```text
http://localhost/docs
```

Stop the application with:

```bash
docker compose down
```

## Planned Features

Future development may include:

* Frontend dashboard
* Copyable image URLs
* Image previews
* Image sorting and filtering
* Image descriptions
* Image tags
* Image dimensions and additional metadata
* Pagination
* Rate limiting
* HTTPS
* Production deployment to a cloud VPS
* Database migrations with Alembic
* Automated deployment with Ansible
* Backups
* Additional security hardening
* Optional image metadata preservation

## Purpose

This project is primarily a personal learning and showcase project.

It combines application development with infrastructure and security topics in a single small-scale system.

The long-term goal is to have a simple, self-hosted alternative for sharing images while using the project to learn and demonstrate practical skills in Linux, Docker, cloud infrastructure, backend development, databases, and cybersecurity.
