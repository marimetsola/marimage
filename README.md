# Marimage

Marimage is a self-hosted image hosting application built as a personal project and a practical learning environment for Linux server administration, Docker, networking, web services, databases, cloud infrastructure, and cybersecurity.

The application allows authenticated users to upload images, manage their uploads, and obtain public URLs that can be shared directly, for example in Discord.

Marimage is built with React, TypeScript, FastAPI, PostgreSQL, Docker Compose, and Nginx. Caddy provides HTTPS and reverse proxy functionality in the public deployment.

## Current Status

Marimage is deployed on an Ubuntu virtual machine in Microsoft Azure and is publicly accessible over HTTPS.

Implemented features include:

- User registration and login
- Session-based authentication
- Argon2 password hashing
- Registration controlled by an environment variable
- Configurable application name and browser page titles
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
- Separate development and production Docker Compose configurations
- Production frontend build served by Nginx
- HTTPS with automatic TLS certificate management through Caddy
- Public deployment using a custom domain

The live deployment has registration disabled. Image uploads, account authentication, and image management have been tested in the deployed environment.

Automated backups and ongoing operational monitoring remain important maintenance tasks.

## Architecture

The application uses separate containers for the web server, backend, and database. The frontend is served by Nginx in production, while development uses a separate Vite development server.

Caddy runs directly on the Ubuntu host rather than in a Docker container. It handles public HTTPS connections and forwards requests to the Nginx container.

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

FastAPI
   |
   +-- PostgreSQL
   |
   +-- Image storage
```

The frontend source is bind-mounted into the development container. Vite Hot Module Replacement (HMR) updates frontend changes while the application is running. The backend uses Uvicorn's reload mode to detect Python source changes.

### Production request flow

In production, Caddy handles public HTTP and HTTPS traffic. HTTPS terminates at Caddy, which forwards requests to Nginx on the host's loopback address, port 8080.

```text
Internet
   |
   | HTTPS
   v
Caddy
   |
   | HTTP to 127.0.0.1:8080
   v
Nginx (Docker container)
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

The frontend is compiled into static files during the Docker image build. Nginx serves those files and proxies API requests to FastAPI.

The backend and database are not published directly on host ports. Nginx is bound to `127.0.0.1:8080`, preventing direct access to the container through the public network. Caddy is responsible for handling public web traffic.

Development and production use separate Compose configurations, database volumes, and image storage directories.

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

- Microsoft Azure Virtual Machines
- Ubuntu Server
- Docker Engine
- Docker Compose
- Nginx
- Caddy
- PostgreSQL 18
- SSH
- DNS and TLS
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
│   ├── dev/
│   │   ├── images/
│   │   └── thumbnails/
│   └── prod/
│       ├── images/
│       └── thumbnails/
│
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── .gitignore
└── README.md
```

Environment files, uploaded images, database contents, and private keys are runtime configuration or data rather than application source code. They must not be committed to version control.

Caddy's production configuration is maintained on the Azure host in `/etc/caddy/Caddyfile`.

## Configuration

The application uses environment-specific configuration files created locally or on the server:

- `.env.dev` for development
- `.env.prod` for production

These files are excluded from Git because they contain environment-specific settings and secrets. Each environment must have its own configuration.

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

The application name is configurable through `APP_NAME`. It is used in the application interface and browser page titles.

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

## Production Docker Environment

The production configuration provides a deployment-like environment without running the Vite development server.

It uses:

- `compose.yaml` for shared service definitions
- `compose.prod.yaml` for production-specific settings
- `nginx/Dockerfile.prod` to build the frontend and create the production web image
- `nginx/nginx.prod.conf` to serve frontend files and proxy API requests
- `.env.prod` for production-specific configuration
- `scripts/prod-up.sh` to validate the configuration, build images, and start services
- `scripts/prod-down.sh` to stop the production services

The frontend is compiled during the Docker image build. The resulting static files are copied into an Nginx image, so the production frontend does not require the Vite development server.

The web image is tagged:

```text
marimage-web:prod
```

### Production storage

The production environment uses separate directories for original images and generated thumbnails:

```text
storage/prod/
├── images/
└── thumbnails/
```

The development and production environments should not share image directories or database volumes.

The backend has read/write access to the image and thumbnail directories. Nginx mounts these directories read-only to serve images.

On SELinux-enabled systems such as Fedora, the Docker bind mounts use SELinux labels to allow access by the relevant containers. Host directories must also have suitable filesystem permissions.

### Starting production

From the project root:

```bash
./scripts/prod-up.sh
```

The script validates the Compose configuration, builds the images, and starts the production services.

For local production testing, Nginx is available at:

```text
http://127.0.0.1:8080
```

The same Docker production configuration is used on the Azure server. There, Nginx remains bound to the loopback address, and Caddy forwards public requests to it.

### Stopping production

```bash
./scripts/prod-down.sh
```

The production scripts use the Compose project name `image-host-prod`, keeping the production containers and database volume separate from development.

On the live Azure server, stopping this Compose project stops Marimage's Docker services. Caddy is managed independently by systemd.

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

Check the application configuration locally on the server:

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

## Azure Deployment and HTTPS

The live application runs on an Ubuntu virtual machine in Microsoft Azure.

The deployment consists of Docker Compose services for Nginx, FastAPI, and PostgreSQL, with Caddy installed directly on the host.

### Network configuration

Azure network security rules allow inbound TCP traffic on ports 80 and 443 for public web access. SSH access on port 22 is restricted to an explicitly allowed source IP address.

Nginx is published only on the host's loopback address:

```text
127.0.0.1:8080
```

The port is not exposed directly to the public internet.

### Caddy reverse proxy

Caddy receives requests for the configured domain names, handles HTTPS, and forwards requests to Nginx.

The host configuration in `/etc/caddy/Caddyfile` follows this pattern:

```caddyfile
example.com, www.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Replace the example domain names with the domain names configured for the deployment.

Caddy automatically obtains and renews TLS certificates for the configured domain names. This avoids having to manage certificate renewal manually.

The production flow is:

1. DNS points the domain to the Azure virtual machine's public IP address.
2. Azure network rules allow public HTTP and HTTPS traffic.
3. Caddy terminates HTTPS and forwards requests to Nginx.
4. Nginx serves the frontend and image files and proxies API requests to FastAPI.
5. FastAPI accesses PostgreSQL and the image storage directories.

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

Set it to `false` to disable registration. The live deployment has registration disabled.

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
https://example.com/i/78ae810e92a24985afdfaf8a3ff2979f.png
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

The separation between database metadata and image files makes backup, migration, and storage management easier. Database backups and image backups must both be included in any migration or recovery plan.

Automated backups have not yet been configured, so setting up and testing backups remains an important maintenance task.

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
- HTTPS provided by Caddy
- SSH access restricted through Azure network security rules

Ongoing maintenance should include:

- Operating system and container image updates
- SSH access and network rule reviews
- Database and image backups
- Backup restoration tests
- Resource usage monitoring
- Review of upload limits and registration settings

This is a personal project and is not intended to provide the security or operational guarantees of a managed image hosting service.

## Planned Improvements

Potential future work includes:

- Automated database and image backups
- Backup restoration testing
- Resource and service monitoring
- Image sorting and filtering
- Pagination
- Image descriptions and tags
- Image dimensions and additional metadata
- Rate limiting
- Database schema migrations with Alembic
- Automated deployment using Ansible

## Purpose

Marimage is a personal learning and showcase project.

It combines application development with practical infrastructure work: Linux administration, container management, reverse proxy configuration, storage permissions, databases, networking, cloud deployment, HTTPS, and basic application security.

The project also provided an opportunity to use AI as a development aid while evaluating implementation options, understanding commands, and learning how the application's components fit together.
