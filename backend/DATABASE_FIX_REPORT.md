# Diagnostic et Correction de la Base de Données ERP

## Résumé du Problème

Le problème signalé est que lors de la connexion à la base de données `erp_aluminium`, seules les 7 tables du microservice IA sont visibles, mais pas les tables du module RH ni du Backend Principal.

## Découverte Critique

**IL EXISTE DEUX BASES DE DONNÉES SÉPARÉES !**

| Instance | Type | Adresse IP | Contenu |
|----------|------|-------------|---------|
| `erp-postgres` (Docker) | Conteneur Docker | 172.18.0.4 | Tables IA uniquement (`ai_...`) |
| PostgreSQL Local | Windows Service | 127.0.0.1:5432 | Tables Backend + RH + Stock |

Le service Docker `erp-backend` est configuré pour se connecter à l'hostname `postgres` qui pointe vers le conteneur Docker `erp-postgres` (base de données quasi vide).

## Preuves

1. **API Backend (port 3000 - Docker)** - Fonctionne部分ellement:
   ```
   GET /api/v1/dashboard/kpis → Retourne des données (probablement en cache)
   POST /api/v1/auth/login → Erreur "relation users does not exist"
   ```

2. **Connexion PostgreSQL locale**:
   ```
   tables dans public: ~70 tables (Backend + RH + Stock)
   ```

3. **Connexion PostgreSQL Docker**:
   ```
   tables dans public: uniquement la table "migrations"
   ```

## Solution Recommandée

### Option A : Utiliser la base de données locale pour le Backend Docker (RECOMMANDÉE)

Modifier la configuration du conteneur backend pour utiliser le PostgreSQL local :

1. Arrêter le conteneur backend
2. Changer la variable `DB_HOST` de `postgres` vers `host.docker.internal` ou l'IP du host
3. Redémarrer le conteneur

### Option B : Exécuter les migrations dans le conteneur Docker

Cela créera les tables dans la base de données Docker, mais elles seront séparées de la base locale.

### Option C : Vérifier pgAdmin (destination correcte)

L'utilisateur utilisait probablement pgAdmin-configuré pour se connecter au Docker au lieu du PostgreSQL local.

Vérifier la configuration de connexion pgAdmin à http://localhost:5050.

## Statut Actuel des Tables

### Dans PostgreSQL local (127.0.0.1:5432) - BASE PRINCIPALE
```
Tables RH: employees, departments, postes, employee_contracts, leave_requests, 
           attendances, payslips, trainings, training_sessions, performance_reviews, 
           recruitment_jobs, recruitment_candidates

Tables Backend: users, roles, sessions, audit_logs, customers, quotes, orders, 
                invoices, aluminum_profiles, machines, work_orders, inventory_items, etc.

Tables IA: AUCUNE (les tables AI sont dans la base Docker)
```

### Dans erp-postgres Docker (172.18.0.4)
```
Tables: ONLY migrations table
```

## Commandes de Diagnostic

Pour voir toutes les tables de la base locale (celle qui contient vos données) :

```bash
# Via Docker vers la base locale
docker exec -it erp-postgres psql -h host.docker.internal -U postgres -d erp_aluminium -c "\dt"

# OU via pgAdmin
# Se connecter à localhost:5050 avec admin@erp.com / admin
# Servers > PostgreSQL Local > Databases > erp_aluminium > Schemas > public > Tables
```

## Prochaines Étapes

1. **Décider** quelle base de données utiliser comme base principale
2. **Configurer** pgAdmin pour se connecter à la bonne instance
3. **Unifier** si nécessaire en migrant les données ou en changeant les connexions