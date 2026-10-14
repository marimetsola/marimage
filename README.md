# Marimage

A self-hosted image hosting application built as a personal project and a practical learning environment for Linux server administration, Docker, networking, web services, databases, and cybersecurity.

Marimage allows authenticated users to upload images, manage their uploads, and obtain public URLs that can be shared directly, for example in Discord.

The application is built with React, TypeScript, FastAPI, PostgreSQL, Docker Compose, and Nginx.

## Current Status

The application is functional, and separate development and local production configurations are available.

Implemented features include:

- User registration and login
- Session-based authentication
- Argon2 password hashing
- Registration controlled by an environment variable
- Configurable application name
- Custom favicon
- Image upload with file type and size validation
- Generated storage filenames and original filename metadata
- EXIF orientation handling and image metadata sanitization
- Image metadata stored in PostgreSQL
- Image listing for authenticated users
- Image deletion with server-side ownership checks
- Public image URLs
- Generated image thumbnails
- Copyable image URLs
- Responsive frontend
- Full-size image viewer with zoom controls
- Image deletion confirmation and notifications
- Development hot reload for the frontend and backend
- Separate production frontend build and Compose configuration

The production configuration has been built and tested locally. Deployment to a public cloud server, domain configuration, and HTTPS setup are not yet complete.

## Architecture

The application consists of four main services.

| Service | Responsibility |
|---|---|
| Nginx | Serves the frontend and image files and proxies API requests |
| Frontend | React application built with TypeScript and Vite |
| FastAPI | Authentication, uploads, image metadata, and image management |
| PostgreSQL | User accounts and image metadata |

### Development request flow

During development, Nginx forwards browser requests to the Vite development server and the backend API.

```text
Browser
   |
   v
Nginx
   |
   +-- /       --> Vite development server
   |
   +-- /api/   --> FastAPI
   |
   +-- /i/     --> Original images
   |
   +-- /t/     --> Image thumbnails
```

The frontend source is bind-mounted into the development container. Vite Hot Module Replacement (HMR) updates frontend changes while the application is running. The backend uses Uvicorn's reload mode to detect Python source changes.

### Production request flow

The production frontend is built into static files during the Docker image build. Nginx serves these files directly instead of using the Vite development server.

```text
Browser
   |
   v
Nginx
   |
   +-- /       --> Static frontend files
   |
   +-- /api/   --> FastAPI
   |
   +-- /i/     --> Original images
   |
   +-- /t/     --> Image thumbnails

FastAPI
   |
   +-- PostgreSQL
   |
   +-- Image storage
```

The backend and database are not published directly on host ports. Development and production use separate Compose configurations and separate database volumes.

## Technologies

### Frontend

- React
- TypeScript
- React Router
- Vite
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy 2.x
- Pydantic
- Psycopg
- Starlette SessionMiddleware
- Argon2 password hashing
- Pillow

### Infrastructure

- Docker Engine
- Docker Compose
- Nginx
- PostgreSQL 18
- Linux
- SELinux on the Fedora development host

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
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── pages/
│   ├── Dockerfile
│   └── package.json
│
├── nginx/
│   ├── Dockerfile.prod
│   ├── nginx.conf
│   └── nginx.prod.conf
│
├── scripts/
│   ├── dev-up.sh
│   ├── dev-down.sh
│   ├── prod-up.sh
│   └── prod-down.sh
│
├── storage/
│   ├── images/
│   ├── thumbnails/
│   └── prod/
│       ├── images/
│       └── thumbnails/
│
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── .env.dev
├── .env.prod
├── .gitignore
└── README.md
```

Environment files and uploaded image data are runtime configuration and data, not application source code. They should be excluded from version control.

## Configuration

The application uses environment-specific configuration files:

- `.env.dev` for development
- `.env.prod` for local production testing

Both files are excluded from Git. They contain configuration and secrets that must not be committed.

The main environment variables include:

| Variable | Purpose |
|---|---|
| `IMAGE_DIR` | Host directory for original images |
| `THUMBNAIL_DIR` | Host directory for generated thumbnails |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `REGISTER_ENABLED` | Enables or disables user registration |
| `APP_NAME` | Public application name |
| `NGINX_CONFIG` | Selects the Nginx configuration file |
| `NGINX_BIND_IP` | Host IP address to which Nginx is bound |
| `NGINX_PORT` | Host port used to access Nginx |

Generate strong, unique secrets instead of using example values:

```bash
openssl rand -hex 32
```

The application name is configurable through `APP_NAME`. It is used in the header, homepage, and browser tab titles.

## Development Environment

The development environment uses Docker Compose with a Vite frontend container and a FastAPI backend container.

The configuration files are:

- `compose.yaml`: shared service definitions
- `compose.dev.yaml`: development-specific configuration
- `scripts/dev-up.sh`: starts the development services
- `scripts/dev-down.sh`: stops the development services

The development scripts load `.env.dev` and combine the two Compose files.

### Starting development

From the project root:

```bash
./scripts/dev-up.sh
```

The application is available at:

```text
http://localhost
```

FastAPI's interactive API documentation is available during development at:

```text
http://localhost/docs
```

### Stopping development

```bash
./scripts/dev-down.sh
```

This stops and removes the development containers and network. The persistent database volume is retained.

### Development diagnostics

Show the service status:

```bash
sudo docker compose \
  --env-file .env.dev \
  -f compose.yaml \
  -f compose.dev.yaml \
  ps
```

Follow the service logs:

```bash
sudo docker compose \
  --env-file .env.dev \
  -f compose.yaml \
  -f compose.dev.yaml \
  logs -f
```

The frontend source is bind-mounted into the development container, so most frontend changes appear through Vite HMR without rebuilding the image. The backend uses Uvicorn's reload mode for Python source changes. Dependency changes may require rebuilding the relevant image.

Avoid `docker compose down -v` unless you intentionally want to remove the associated volumes and their data.

## Local Production Environment

The production configuration tests a deployment-like environment without running the Vite development server.

It uses:

- `compose.yaml` for shared service definitions
- `compose.prod.yaml` for production-specific settings
- `nginx/Dockerfile.prod` to build the frontend and create the production web image
- `nginx/nginx.prod.conf` to serve static frontend files and proxy API requests
- `.env.prod` for production-specific configuration
- `scripts/prod-up.sh` to validate the configuration, build images, and start the services
- `scripts/prod-down.sh` to stop the production test services

The production frontend is compiled during the Docker image build. The resulting static files are copied into an Nginx image, so the production frontend does not require the Vite development server.

The local web image is tagged:

```text
marimage-web:prod
```

### Production storage

The local production environment uses separate directories for uploaded images and generated thumbnails:

```text
storage/prod/
├── images/
└── thumbnails/
```

The development and production environments should not share image directories or database volumes.

The backend has read/write access to the image and thumbnail directories. Nginx mounts the same directories read-only to serve images.

On SELinux-enabled systems such as Fedora, the Docker bind mounts use SELinux labels to allow access by the relevant containers. The host directories must also have suitable filesystem permissions.

### Starting production

From the project root:

```bash
./scripts/prod-up.sh
```

The script validates the Compose configuration and builds the images before starting the production services.

The local production version is accessible at:

```text
http://127.0.0.1:8080
```

The Nginx service is bound to the loopback address for local testing. This prevents the test service from being directly published to the network.

### Stopping production

```bash
./scripts/prod-down.sh
```

The production scripts use the Compose project name `image-host-prod`, keeping the production test containers and database volume separate from development.

### Production diagnostics

Check service status:

```bash
sudo docker compose \
  --project-name image-host-prod \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  ps
```

Check the public application configuration:

```bash
curl http://127.0.0.1:8080/api/config
```

Inspect service logs:

```bash
sudo docker compose \
  --project-name image-host-prod \
  --env-file .env.prod \
  -f compose.yaml \
  -f compose.prod.yaml \
  logs --tail=100
```

The configuration endpoint returns the public application name and the current registration setting.

The local production configuration is not yet a complete public deployment. Domain configuration, HTTPS, external access rules, backups, and final production security checks remain to be completed.

## Authentication

Passwords are hashed using Argon2 before being stored in PostgreSQL.

Authentication uses session cookies provided by Starlette's `SessionMiddleware`. Protected API endpoints require an authenticated user.

The application supports:

- User registration
- Login and logout
- Session-based authentication
- Current-user lookup
- Protected endpoints
- Server-side image ownership checks
- Configurable registration policy

Registration is controlled using:

```dotenv
REGISTER_ENABLED=true
```

Registration can be disabled by setting it to `false`.

Before public deployment, session-cookie settings must be reviewed for HTTPS, including secure-cookie behavior. Public registration should remain disabled unless account creation is explicitly required.

## Image Upload and Management

Authenticated users can upload images through the API and manage their own uploaded files.

The upload process includes:

- File type validation
- Maximum file size checking
- Image format verification using Pillow
- Generated storage filenames
- Preservation of the original filename as metadata
- EXIF orientation handling
- Image metadata sanitization
- Thumbnail generation
- Image metadata stored in PostgreSQL

Images are stored as files rather than as binary data inside PostgreSQL.

For example:

```text
Original filename:
Screenshot 2026-10-14.png

Stored filename:
78ae810e92a24985afdfaf8a3ff2979f.png

Public URL:
https://example.invalid/i/78ae810e92a24985afdfaf8a3ff2979f.png
```

The original filename is retained as metadata, while generated filenames are used for storage and public URLs.

Users can list their own images and delete them. Ownership is checked server-side, so a user cannot delete another user's image merely by providing its ID.

Image URLs are publicly accessible. Generated filenames make URLs less predictable but do not provide access control. Images that must remain private require additional access protection.

## Storage and Database

PostgreSQL stores user accounts and image metadata. Original images and generated thumbnails are stored separately on disk.

The database runs in its own Docker container and uses a persistent Docker volume. Recreating the database container does not remove the volume contents.

The current data model includes:

```text
users
images
```

Each image references its owner through a foreign key.

The separation between database metadata and image files makes backup, migration, and storage management easier. Database backups and image backups must both be established before public deployment.

## API

The main API endpoints are:

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me
GET    /api/config

GET    /api/images
POST   /api/upload
DELETE /api/images/{image_id}
```

FastAPI's interactive API documentation is available during development at:

```text
http://localhost/docs
```

The production Nginx configuration returns `404` for the API documentation and OpenAPI schema paths.

## Security Considerations

The project includes several baseline security measures:

- Password hashing with Argon2
- Session-based authentication
- Authentication requirements for protected endpoints
- Server-side image ownership checks
- Image type and size validation
- Image metadata sanitization
- Separate database and image storage
- Read-only image mounts for Nginx
- No direct host-port publishing for the backend or database
- Environment files excluded from version control
- Separate development and production Compose configurations

The public deployment still requires review of:

- SSH access and server firewall rules
- Cloud network security rules
- HTTPS and TLS certificate management
- Secure session cookies
- Registration policy
- Database and image backups
- Software updates and service monitoring
- Resource usage and upload limits

## Planned Work

The next infrastructure-related tasks include:

- Deployment to a Linux virtual machine in Azure
- Domain and DNS configuration
- HTTPS using a reverse proxy and TLS certificates
- Automated database and image backups
- Production security hardening
- Monitoring and maintenance procedures

Possible application improvements include image sorting and filtering, pagination, descriptions, tags, image dimensions, rate limiting, database migrations with Alembic, and automated deployment with Ansible.

## Purpose

Marimage is a personal learning and showcase project.

It combines application development with practical infrastructure work: Linux administration, container management, reverse proxy configuration, storage permissions, databases, networking, and basic application security.

The long-term goal is to operate a small, self-hosted image hosting service while documenting the practical steps required to deploy and maintain it reliably.
