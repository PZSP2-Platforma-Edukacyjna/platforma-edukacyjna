## Instrukcja uruchomienia
### Kontenery
Znajdując się w głównym katalogu projektu, przy użyciu Dockera lub Podmana należy wykonać:
```bash
podman-compose up --build
```
Żeby dodać do bazy danych przykładowe wartości należy wykonać:
```bash
podman exec platforma-edukacyjna_backend_1 python manage.py seed_data
```
Aby zatrzymać aplikację trzeba wykonać:
```bash
podman-compose down
```

### Bez kontenerów
Zależności:
- Python i Pip
- Node.js i NPM

Należy wykonać:
```bash
cd backend \
    && pip install -r requirements.txt
    && python manage.py seed_data # dla przykładowych danych
    && python manage.py runserver
```
```bash
cd frontend && npm install && npm run dev
```
