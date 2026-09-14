# Image Host

A small self-hosted image hosting service built as a showcase project and for personal use.

The goal is to create a simple private image hosting application where authenticated users can upload images and receive public URLs that can be shared directly, for example in Discord.

The project is also intended as a practical learning project covering Linux server administration, Docker, backend development, databases, web servers, and basic web security.

## Current Status

The project is currently under active development.

The current version includes:

- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- User registration
- Argon2 password hashing
- Login with session-based authentication
- Current-user endpoint
- Nginx reverse proxy
- Docker Compose development environment
- Static image file serving

Image uploading and the frontend are planned next.

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

Nginx is the only service exposed to the host. The FastAPI and PostgreSQL containers communicate through the internal Docker network.

## Technologies

### Backend

- Python
- FastAPI
- SQLAlchemy 2.x
- Pydantic
- Psycopg
- pwdlib with Argon2

### Infrastructure

- Docker
- Docker Compose
- Nginx
- PostgreSQL

### Development Environment

The application is currently developed and tested locally using Docker Compose. Environment-specific configuration is provided through a `.env` file.

## Authentication

User passwords are never stored as plain text. Passwords are hashed using Argon2 before being stored in PostgreSQL.

Authentication currently uses session-based authentication provided by Starlette's `SessionMiddleware`.

The application supports:

- User registration
- Login
- Session cookies
- Current-user lookup
- Disabling public registration through an environment variable

Registration can be enabled or disabled with:

```env
REGISTER_ENABLED=true
```

For a production deployment, registration can be disabled:

```env
REGISTER_ENABLED=false
```

## Database

PostgreSQL stores application data such as user accounts.

The database runs in its own Docker container and its data is stored in a persistent Docker volume so that recreating the container does not remove the database.

The application uses SQLAlchemy as its ORM layer.

## Storage

Uploaded images are intended to be stored as files rather than as binary data inside PostgreSQL.

PostgreSQL will store metadata about uploaded images, while the actual image files will be kept in the image storage directory.

This separation makes the application easier to manage, back up, and migrate.

## Project Structure

```text
image-host/
├── backend/
│   ├── app/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
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

FastAPI's automatically generated API documentation is available at:

```text
http://localhost/docs
```

Stop the application with:

```bash
docker compose down
```

## Planned Features

Future development may include:

- Image upload
- Image management
- Public image URLs
- Frontend UI
- Image metadata
- Image validation and size limits
- Rate limiting
- HTTPS
- Production deployment to a cloud VPS
- Automated deployment with Ansible
- Backups
- Additional security hardening

## Purpose

This project is primarily a personal learning and showcase project. It combines application development with infrastructure and security topics in a single small-scale system.

The long-term goal is to have a simple, self-hosted alternative for sharing images while using the project to learn and demonstrate practical skills in Linux, Docker, cloud infrastructure, backend development, and cybersecurity.