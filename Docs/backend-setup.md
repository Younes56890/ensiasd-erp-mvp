# Backend Setup (ERPNext + Education)

## Prerequisites
- Docker Desktop installed and running.
- Git installed.
- Access to this GitHub repository.

## Start ERPNext stack

git clone https://github.com/Younes56890/ensiasd-erp-mvp.git
cd ensiasd-erp-mvp/docker
docker compose -f pwd.yml up -d

Wait 2–3 minutes, then check services:

docker compose -f pwd.yml ps


You should see `docker-frontend-1` with port `8080:8080`.

## First login

- Open `http://localhost:8080` .
- User: `Administrator`
- Password: `admin`
