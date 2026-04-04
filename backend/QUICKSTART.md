# ERP Aluminium - Guide de Démarrage Rapide

## 🚨 Problème Identifié

PostgreSQL n'est pas en cours d'exécution sur votre machine.

## 📋 Solutions

### Option 1: Démarrer PostgreSQL avec Docker (Recommandé)

```bash
# Aller dans le répertoire backend
cd backend

# Démarrer les services PostgreSQL et Redis
docker-compose up -d postgres redis

# Vérifier que PostgreSQL fonctionne
docker ps | grep postgres
```

### Option 2: Si vous n'avez pas Docker

Installez PostgreSQL localement et créez la base:

```bash
# Créer la base de données
createdb erp_aluminium

# Ou avec psql
psql -U postgres -c "CREATE DATABASE erp_aluminium;"
```

### Option 3: Démarrer tous les services backend

```bash
cd backend
docker-compose up -d
```

## 🔧 Vérification de la Configuration

Assurez-vous que votre fichier `backend/.env` contient:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_aluminium
DB_USER=postgres
DB_PASSWORD=postgres
```

## ✅ Après le démarrage

1. **Exécuter les migrations** (si c'est la première fois):
   ```bash
   cd backend
   npm run migration:run
   ```

2. **Vérifier les tables**:
   ```bash
   npm run migration:show
   ```

3. **Démarrer le serveur**:
   ```bash
   cd backend
   npm run dev
   ```

## 🎯 Résultat Attendu

Vous devriez voir toutes les tables:

```
[X] 7 ArchitectureModule0090000000000
[X] 8 AIModule1700000000000           ← Tables AI
[X] 9 ComptabiliteModule1700000000000
[X] 10 HRModule1705000000000           ← Tables RH (employees, departments, etc.)
[X] 11 InitialMigration1710000000000
[X] 12 AluminumModule1710100000000     ← Tables Aluminium (ventes, clients)
[X] 13 MaintenanceModule1710200000000  ← Tables Maintenance
[X] 15 CompleteMigration1775073888426