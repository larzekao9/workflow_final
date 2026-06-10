# Workflow Final

Sistema de gestión de workflows empresariales compuesto por backend, frontend web y aplicación móvil.

## Estructura del proyecto

```
workflowfinal/
├── backend/         # API REST Spring Boot + servicios IA
│   ├── IA/          # Microservicio Python (FastAPI) — Claude AI
│   └── Tensorflow/  # Microservicio Python (FastAPI) — TensorFlow
├── frontend/        # Aplicación web Angular + Nginx
├── mobile/          # Aplicación móvil Flutter
└── docker-compose.yml
```

## Requisitos

- Docker y Docker Compose
- Git

## Configuración

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Claude AI
CLAUDE_API_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-2
AWS_BUCKET_NAME=
AWS_KEY_PREFIX=workflow-files

# MongoDB Atlas
MONGODB_URI=

# JWT
JWT_SECRET=

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost

# Firebase (JSON de cuenta de servicio, en una sola línea)
FIREBASE_SERVICE_ACCOUNT=
```

## Levantar el sistema

```bash
docker compose up --build -d
```

La primera vez tarda varios minutos porque compila el backend Java y construye las imágenes Python.

## Servicios

| Servicio   | Tecnología              | Puerto  |
|------------|-------------------------|---------|
| frontend   | Angular + Nginx         | 80      |
| backend    | Spring Boot (Java 21)   | 8080    |
| ia         | FastAPI + Claude AI     | 5000    |
| tf         | FastAPI + TensorFlow    | 8001    |

La app web está disponible en **http://localhost** una vez levantado el sistema.

## Credenciales por defecto

Al iniciar por primera vez se crean automáticamente:

| Rol        | Email                  | Contraseña |
|------------|------------------------|------------|
| SUPERADMIN | superadmin@viva.com    | 12345      |
| ADMIN      | admin@viva.com         | 12345      |

## Base de datos

MongoDB Atlas. La base de datos `workflow_db` y sus colecciones se crean automáticamente al levantar el backend por primera vez.

## App móvil

La app móvil está desarrollada en Flutter. Para correrla:

```bash
cd mobile
flutter pub get
flutter run
```

## Detener el sistema

```bash
docker compose down
```
