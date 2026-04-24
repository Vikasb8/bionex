# Bionex Deployment Guide (100% Free Tier Stack)

Deploying the Bionex Healthcare Platform requires hosting the React frontend as static files, the Django backend as a live server, a production PostgreSQL database, and an external cloud storage provider for medical files and QR codes.

Here is the exact step-by-step approach using the best **completely free** platforms available right now.

---

## The 100% Free Stack Architecture
1. **Frontend**: Vercel (Free forever for hobbyists)
2. **Backend**: Render.com (Free tier for web services)
3. **Database**: Supabase or Neon.tech (Free forever PostgreSQL)
4. **File Storage**: Cloudinary (Generous free tier for images and PDFs)

---

## 1. Database Deployment -> Supabase

Django requires a production database. You cannot use the local `db.sqlite3` file on a cloud server.

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new Project and wait for the database to provision.
3. Go to **Settings -> Database -> Connection String** and copy the URI.
4. It will look like: `postgresql://postgres.[your-project-id]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

---

## 2. File Storage Deployment -> Cloudinary

Platforms like Render erase files every time they deploy or restart. If a doctor uploads a PDF, it will be deleted! You must use external cloud storage.

1. Create a free account at [Cloudinary.com](https://cloudinary.com).
2. Note down your `Cloud Name`, `API Key`, and `API Secret` from the dashboard.
3. In your Django backend, you will install `django-cloudinary-storage`.
4. Update `settings.py` to use Cloudinary for `DEFAULT_FILE_STORAGE` and `MEDIA_URL`.

---

## 3. Backend Deployment -> Render.com

Render offers a free tier for hosting Python/Django backend APIs.

### Prerequisites for Backend
1. **WSGI Server**: Add `gunicorn` to your `requirements.txt`.
2. **Database Driver**: Add `dj-database-url` and `psycopg2-binary` to your `requirements.txt`.
3. **Static Files**: Add `whitenoise` to serve Django admin static files efficiently.

### Deployment Steps
1. Push your code to GitHub.
2. Log into [Render.com](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repo and select the `backend/` folder.
4. **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
5. **Start Command**: `gunicorn config.wsgi:application`
6. **Environment Variables**: Add the following:
    * `SECRET_KEY`: A long random string.
    * `DEBUG`: `False`
    * `DATABASE_URL`: Paste your Supabase Connection String here.
    * `CLOUDINARY_URL`: `cloudinary://<api_key>:<api_secret>@<cloud_name>`
    * `ALLOWED_HOSTS`: `*` (or your specific render URL)
    * `CORS_ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
7. Click **Deploy**.

---

## 4. Frontend Deployment -> Vercel

Vite generates optimized, pure static HTML/CSS/JS files, making it incredibly fast and completely free to host on Vercel.

### Prerequisites for Frontend
Currently, the Vite frontend relies on `vite.config.ts` to proxy `/api` requests to `localhost:8000`. In production, this proxy doesn't exist.

1. Update `src/api/client.ts` to use an environment variable for the backend URL:
    ```typescript
    const api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
    ```

### Deployment Steps
1. Log into [Vercel.com](https://vercel.com) and select "Add New Project".
2. Import your GitHub repository.
3. **Root Directory**: Click "Edit" and set this to `frontend/`.
4. **Framework Preset**: Vercel will auto-detect "Vite".
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Environment Variables**: Add `VITE_API_URL` pointing to your deployed Django backend (e.g., `https://bionex-backend.onrender.com/api`).
8. Click **Deploy**.

---

## 5. Final Production Checklist

- [ ] **Turn off DEBUG mode** (`DEBUG = False` in Django).
- [ ] **Change default passwords** for the Django Superuser (`python manage.py createsuperuser` via Render shell).
- [ ] **Check File Uploads**: Upload a dummy PDF as a doctor and verify it appears in your Cloudinary dashboard.
- [ ] **Wake Up Time**: Remember that Render's free tier "goes to sleep" after 15 minutes of inactivity. The first person to load the app after a period of inactivity might wait 30-50 seconds for the backend to wake up.
