# ERP Aluminium - Diagnostic de la Architecture Base de Données

## 📋 Résumé Exécutif

**Problème identifié**: L'utilisateur ne voit que les 7 tables du microservice IA (`ai_*`) dans la base `erp_aluminium`, mais les tables RH et Backend Principal sont introuvables.

**Cause racine**: Configuration complexe avec deux instances PostgreSQL différentes pointant vers la même base de données logique `erp_aluminium`.

---

## 🔍 Analyse de la Configuration Actuelle

### Instances PostgreSQL Configurées

| Instance | Port | Base de données | Contenu |
|----------|------|-----------------|---------|
| **Main PostgreSQL** (docker-compose.yml) | 5432 | `erp_aluminium` | Tables Backend Principal + RH + IA |
| **TimescaleDB AI** (docker-compose.ai.yml) | 5433 | `erp_aluminium` | Tables IA uniquement |

### Fichiers de Configuration

```yaml
# docker-compose.yml - Port 5432
postgres:
  image: timescale/timescaledb:latest-pg15
  ports: "5432:5432"
  POSTGRES_DB: erp_aluminium

# docker-compose.ai.yml - Port 5433 (DÉCONSEILLÉ)
postgres-timescale:
  image: timescale/timescaledb:latest-pg16
  ports: "5433:5432"
  POSTGRES_DB: erp_aluminium
```

### Environnements .env

```bash
# backend/.env - Node.js Backend
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_aluminium

# .env.ai - Python AI Service
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/erp_aluminium
```

### Migration Files Analysés

| Fichier | Tables créées |
|---------|----------------|
| [`008-AIModule.ts`](backend/src/migrations/008-AIModule.ts) | 7 tables `ai_*` |
| [`010-HRModule.ts`](backend/src/migrations/010-HRModule.ts) | 14+ tables HR (`employees`, `departments`, `postes`, etc.) |
| [`1710100000000-AluminumModule.ts`](backend/src/migrations/1710100000000-AluminumModule.ts) | Tables Aluminium |
| [`1710200000000-MaintenanceModule.ts`](backend/src/migrations/1710200000000-MaintenanceModule.ts) | Tables Maintenance |

---

## 🎯 Recommandation: Architecture à Schémas PostgreSQL

Pour résoudre ce problème et permettre une coexistence propre des microservices, je recommande **l'utilisation de schémas PostgreSQL distincts** au sein d'une **seule base de données**.

### Structure Recommandée

```sql
-- Base unique: erp_aluminium

CREATE SCHEMA public;      -- Tables système (users, roles, sessions)
CREATE SCHEMA aluminium;   -- Ventes, Clients, Stock
CREATE SCHEMA hr;          -- Ressources Humaines
CREATE SCHEMA maintenance; -- Machines, Ordres de travail
CREATE SCHEMA quality;     -- Contrôle qualité
CREATE SCHEMA comptabilite;-- Comptabilité
CREATE SCHEMA ai;          -- Prédictions et optimisations IA
```

### Schéma de Données Final

```mermaid
erDiagram
    DATABASE erp_aluminium {
        string name "erp_aluminium"
    }
    
    DATABASE ||--o| SCHEMA public : contains
    DATABASE ||--o| SCHEMA aluminium : contains
    DATABASE ||--o| SCHEMA hr : contains
    DATABASE ||--o| SCHEMA ai : contains
    
    SCHEMA public {
        table users
        table roles
        table sessions
        table audit_logs
    }
    
    SCHEMA hr {
        table employees
        table departments
        table postes
        table employee_contracts
        table leave_requests
        table attendances
        table payslips
    }
    
    SCHEMA ai {
        table ai_model
        table ai_forecast
        table ai_stockout_prediction
        table ai_inventory_optimization
    }
```

---

## ✅ Étapes de Correction

### Étape 1: Détruire l'instance PostgreSQL redondante (port 5433)

```bash
# Arreter et supprimer le conteneur postgres-timescale sur port 5433
docker ps -a | grep 5433
docker rm <container_id>
```

### Étape 2: Vérifier que les migrations sont exécutées

```bash
# Dans le répertoire backend
cd backend

# Vérifier l'état des migrations
npm run migration:run
```

### Étape 3: Créer les schémas (optionnel - si désiré isolation)

```sql
-- Exécuter via psql ou pgAdmin
CREATE SCHEMA IF NOT EXISTS ai AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS hr AUTHORIZATION postgres;
CREATE SCHEMA IF NOT EXISTS aluminium AUTHORIZATION postgres;
```

### Étape 4: Mettre à jour la configuration TypeORM

Modifier [`database.ts`](backend/src/config/database.ts) pour utiliser les schémas:

```typescript
const AppDataSource = new DataSource({
  // ... existing config
  entities: [...],
  migrations: ['src/migrations/**/*.{ts,js}'],
  extra: {
    schema: 'public',  // Ou dynamique selon le module
  }
});
```

---

## 🔧 Configuration Docker Recommandée

Simplifier `docker-compose.yml` en utilisant une seule instance PostgreSQL:

```yaml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: erp_aluminium
    volumes:
      - postgres_data:/var/lib/postgresql/data
    command: postgres -c shared_preload_libraries=timescaledb
  
  # Supprimer postgres-timescale sur port 5433
  # AI service utilise le même postgres:5432
```

---

## 📝 Checklist de Vérification

- [ ] **Vérifier**: Instances Docker en cours d'exécution (`docker ps`)
- [ ] **Vérifier**: Connexion à la base sur port 5432 uniquement
- [ ] **Vérifier**: Toutes les tables visibles (`\dt` dans psql)
- [ ] **Vérifier**: Exécuter les migrations manquantes (`npm run migration:run`)
- [ ] **Vérifier**: Tester les endpoints HR API (`/api/v1/hr/*`)

---

## 🔍 Commandes de Diagnostic Utiles

```bash
# Lister toutes les tables dans erp_aluminium
docker exec -it erp-postgres psql -U postgres -d erp_aluminium -c "\dt"

# Vérifier les migrations exécutées
docker exec -it erp-postgres psql -U postgres -d erp_aluminium -c "SELECT * FROM migrations"

# Vérifier les tables AI
docker exec -it erp-postgres psql -U postgres -d erp_aluminium -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'ai_%'"

# Vérifier les tables HR
docker exec -it erp-postgres psql -U postgres -d erp_aluminium -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('employees', 'departments', 'payslips')"
```

---

## 📌 Conclusion

Le problème provient d'une **configuration Docker avec deux instances PostgreSQL** utilisant le même nom de base de données. La solution simple est de:

1. **Conserver uniquement** l'instance sur port 5432
2. **Exécuter les migrations** pour créer toutes les tables
3. **共用** la même base `erp_aluminium` pour tous les services

Les tables HR et Backend Principal **existent** dans la base `erp_aluminium` sur port 5432, elles n'étaient juste pas visibles car l'utilisateur se connectait probablement à l'instance AI sur port 5433.
