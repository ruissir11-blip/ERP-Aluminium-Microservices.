# CAHIER DES CHARGES
## Plateforme ERP Intelligente — Secteur Aluminium
### Gestion Opérationnelle · Business Intelligence · Intelligence Artificielle

---

| Champ | Détail |
|---|---|
| **Titre du projet** | Plateforme ERP Intelligente pour Entreprise Aluminium |
| **Type de document** | Cahier des Charges Technique et Fonctionnel |
| **Version** | 1.0 — Document Initial |
| **Date de rédaction** | Mars 2025 |
| **Statut** | En cours de validation |
| **Domaine** | Industrie de transformation de l'aluminium |
| **Technologies cibles** | Web (React / Node.js / Python IA), Base de données relationnelle |
| **Méthodologie** | Cycle en Cascade (Waterfall) |

---

## SOMMAIRE

1. [Introduction et Contexte](#1-introduction-et-contexte)
2. [Périmètre du Projet](#2-périmètre-du-projet)
3. [Module A — Métier Aluminium](#3-module-a--métier-aluminium-personnalisé)
4. [Module B — Stock Avancé](#4-module-b--stock-avancé)
5. [Module C — Maintenance Industrielle](#5-module-c--maintenance-industrielle)
6. [Module D — Contrôle Qualité](#6-module-d--contrôle-qualité)
7. [Module E — Comptabilité Analytique](#7-module-e--comptabilité-analytique)
8. [Business Intelligence (BI)](#8-partie-business-intelligence-bi)
9. [Intelligence Artificielle (IA)](#9-partie-intelligence-artificielle-ia)
10. [Architecture Technique](#10-architecture-technique)
11. [Exigences Non Fonctionnelles](#11-exigences-non-fonctionnelles)
12. [Planning et Phasage](#12-planning-et-phasage)
13. [Livrables et Critères d'Acceptation](#13-livrables-et-critères-dacceptation)
14. [Glossaire](#14-glossaire-et-abréviations)

---

## 1. Introduction et Contexte

### 1.1 Présentation du Projet

Ce document constitue le Cahier des Charges complet pour la conception et le développement d'une **Plateforme ERP (Enterprise Resource Planning) intelligente**, spécifiquement conçue pour les entreprises opérant dans le secteur de la transformation de l'aluminium.

La plateforme intègre trois niveaux de valeur complémentaires :

- **Gestion opérationnelle complète** : pilotage de la production, des stocks, de la maintenance et de la qualité
- **Analyse décisionnelle (Business Intelligence)** : tableaux de bord temps réel et KPI métier
- **Intelligence Artificielle prédictive** : anticipation des besoins, optimisation des ressources

### 1.2 Contexte et Problématique

Les entreprises du secteur aluminium font face à des défis spécifiques qui rendent indispensable un ERP sur mesure :

- **Complexité des calculs métier** : surfaces, poids, coûts matière, marges sur profilés
- **Gestion multi-entrepôt** avec rotations stock spécifiques aux matières aluminium
- **Maintenance industrielle critique** de machines à haute valeur ajoutée
- **Contrôle qualité exigeant** avec traçabilité des non-conformités
- **Besoin de pilotage financier et commercial** granulaire par produit et commande

### 1.3 Objectifs Stratégiques

Le projet vise à transformer la gestion de l'entreprise en passant :

- D'une gestion opérationnelle manuelle ou fragmentée
- Vers une gestion **unifiée, centralisée et pilotée par les données**
- Avec une capacité d'**anticipation grâce à l'IA prédictive**

---

## 2. Périmètre du Projet

### 2.1 Modules Fonctionnels

| Module | Périmètre | Priorité |
|---|---|---|
| **A — Métier Aluminium** | Profilés, calculs, devis, commandes, production | HAUTE |
| **B — Stock Avancé** | Multi-entrepôt, alertes, mouvements, KPI | HAUTE |
| **C — Maintenance** | Machines, planification, pannes, disponibilité | HAUTE |
| **D — Qualité** | Contrôle, non-conformité, rapports, statistiques | MOYENNE |
| **E — Comptabilité Analytique** | Coûts, rentabilité, marges, performance | HAUTE |
| **F — Business Intelligence** | Tableaux de bord, KPI, reporting | HAUTE |
| **G — Intelligence Artificielle** | Prévision demande, ruptures, optimisation | MOYENNE |

### 2.2 Hors Périmètre — Phase 1

Les éléments suivants sont **explicitement exclus** du périmètre de la phase 1 et feront l'objet de phases ultérieures :

- **Application mobile native Flutter** — planifiée en phase 2
- **Module RH et Paie**
- **Module CRM** (Customer Relationship Management)
- **E-commerce et portail client externe**
- **Intégration EDI** avec partenaires externes

---

## 3. Module A — Métier Aluminium (Personnalisé)

> 🏭 Module Cœur de Métier — Spécifique Secteur Aluminium

### 3.1 Gestion des Profilés Aluminium

Chaque profilé aluminium est enregistré dans un référentiel complet :

| Attribut | Description | Type |
|---|---|---|
| **Référence** | Code unique d'identification du profilé | Texte (obligatoire) |
| **Longueur** | Dimension longitudinale en mm ou mètres | Numérique décimal |
| **Largeur** | Dimension transversale en mm | Numérique décimal |
| **Épaisseur** | Épaisseur du profil en mm | Numérique décimal |
| **Type** | Catégorie : cornière, tube, plat, UPN, IPE… | Liste déroulante |
| **Caractéristiques techniques** | Alliage, traitement surface, norme | Texte enrichi |
| **Prix unitaire** | Prix d'achat matière hors taxes | Monétaire |
| **Poids estimé** | Poids calculé ou renseigné en kg/ml | Numérique décimal |

### 3.2 Calculs Automatiques

Le moteur de calcul intégré génère automatiquement, à partir des dimensions saisies :

- **Calcul de surface** : `Surface = Longueur × Largeur (en m²)`
  - Formule appliquée selon le type de profilé (section plane, tubulaire, etc.)
- **Calcul du poids** : `Poids = Volume × Densité aluminium (2,70 g/cm³)`
  - Poids total calculé en kg avec affichage par unité et par lot
- **Calcul du coût matière** : `Coût = Poids × Prix unitaire`
  - Intégration du taux de chute et des pertes de coupe
- **Calcul de la marge** : `Marge = Prix vente − Coût de revient`
  - Affichage en valeur absolue et en pourcentage
- **Prix final automatique** : avec application de la marge souhaitée
  - Arrondi paramétrable, TVA intégrée, remise client applicable

### 3.3 Génération Automatique de Devis

Le module de devis est directement connecté au référentiel profilés :

- Création de devis à partir des dimensions saisies par le commercial
- Intégration automatique de tous les calculs (surface, poids, coût, marge)
- Gestion multi-lignes avec plusieurs références par devis
- Application de remises globales ou par ligne
- Génération PDF du devis avec en-tête société
- Envoi par email directement depuis la plateforme

**Workflow de conversion automatique :**

| Étape | Statut | Action disponible |
|---|---|---|
| **1. Devis** | Brouillon / Envoyé / Accepté | Modifier, dupliquer, envoyer |
| **2. Commande** | En attente / Confirmée / En production | Générer bon de commande |
| **3. Ordre de fabrication** | Planifié / En cours / Terminé | Lancer production |
| **4. Livraison** | Préparée / Expédiée / Livrée | Générer bon de livraison |
| **5. Facturation** | Brouillon / Envoyée / Payée | Générer facture automatique |

---

## 4. Module B — Stock Avancé

> 📦 Gestion Stocks Multi-entrepôt avec Analyse en Temps Réel

### 4.1 Fonctionnalités Principales

| Fonctionnalité | Description détaillée |
|---|---|
| **Gestion multi-entrepôt** | Suivi des stocks par site physique, zone, emplacement (rack/allée/niveau) |
| **Mise à jour automatique** | Déduction des quantités à chaque ordre de fabrication ou livraison validé |
| **Alertes seuil minimum** | Notification email + alerte visuelle dashboard quand stock < seuil paramétré |
| **Historique mouvements** | Journal complet : entrées, sorties, transferts, inventaires, avec horodatage |
| **Analyse rotation stock** | Calcul du taux de rotation par article sur période sélectionnable |
| **Lots et traçabilité** | Gestion par numéro de lot, date réception, fournisseur, certificat qualité |

### 4.2 KPI Stock

- **Taux de rupture** : nombre de jours en rupture / total jours × 100
- **Taux de surstock** : valeur stocks dormants > 90 jours
- **Valeur totale du stock** par entrepôt et par catégorie
- **Délai moyen de réapprovisionnement** fournisseur
- **Couverture stock** : quantité disponible / consommation moyenne journalière

---

## 5. Module C — Maintenance Industrielle

> 🛠️ Planification Préventive et Analyse de Disponibilité Machine

### 5.1 Gestion du Parc Machines

- Fiche machine complète : désignation, marque, modèle, n° série, date mise en service
- Documentation technique : manuels, schémas, plans de maintenance
- Affectation par atelier / ligne de production
- Valeur d'acquisition et valeur résiduelle (amortissement)

### 5.2 Maintenance Préventive

| Élément | Détail |
|---|---|
| **Planification** | Calendrier annuel des maintenances par machine avec rappels automatiques |
| **Fréquences** | Paramétrable : quotidienne, hebdomadaire, mensuelle, trimestrielle, annuelle |
| **Ordres de travail** | Génération automatique des OT avec instructions techniques |
| **Intervenants** | Affectation technicien interne ou prestataire externe |
| **Pièces détachées** | Lien avec module stock pour déduction automatique des pièces utilisées |
| **Coûts** | Enregistrement main-d'œuvre + pièces pour analyse coût de maintenance |

### 5.3 Gestion des Pannes (Correctif)

- Déclaration panne en temps réel depuis l'atelier (interface tactile possible)
- Qualification : gravité (critique / majeure / mineure), cause, machine impactée
- Suivi résolution : temps d'intervention, pièces remplacées, technicien
- Historique complet par machine avec analyse tendance

### 5.4 KPI Maintenance

- **Taux de disponibilité machine** (TRS — Taux de Rendement Synthétique)
- **MTBF** (Mean Time Between Failures) — temps moyen entre pannes
- **MTTR** (Mean Time To Repair) — temps moyen de réparation
- **Ratio maintenance préventive / corrective**
- **Coût total de maintenance** par machine et par période

---

## 6. Module D — Contrôle Qualité

> 📋 Traçabilité Qualité et Analyse des Non-Conformités

### 6.1 Contrôle Qualité Production

- Points de contrôle paramétrables à chaque étape du processus de fabrication
- Grilles d'inspection avec critères et seuils de tolérance par type de profilé
- Saisie des mesures réelles vs valeurs nominales avec calcul d'écart
- Décision : conforme / non-conforme / à retravailler / rebut
- Signature numérique du contrôleur qualité

### 6.2 Gestion des Non-Conformités (NC)

| Phase | Action |
|---|---|
| **Détection** | Enregistrement de la NC avec description, photos, lot concerné |
| **Analyse** | Identification cause racine (méthode 5 Pourquoi ou Ishikawa) |
| **Traitement** | Action corrective immédiate : retouche, isolement, rebut, retour fournisseur |
| **Prévention** | Action préventive : modification process, formation, mise à jour instructions |
| **Clôture** | Vérification efficacité et clôture formelle avec traçabilité |

### 6.3 Statistiques et Rapports Qualité

- Taux de non-conformité global et par produit / machine / opérateur
- Analyse de Pareto des défauts récurrents
- Suivi des indicateurs qualité dans le temps (tendances)
- Rapport qualité périodique automatiquement généré (hebdomadaire / mensuel)
- Certificats de conformité générés automatiquement à la livraison

---

## 7. Module E — Comptabilité Analytique

> 💰 Pilotage Financier et Analyse de Rentabilité

### 7.1 Analyse des Coûts

| Axe d'analyse | Indicateurs calculés |
|---|---|
| **Par produit** | Coût matière, main-d'œuvre, frais généraux, coût de revient total |
| **Par commande** | Marge brute, marge nette, rentabilité réelle vs estimée |
| **Par client** | CA total, nombre commandes, panier moyen, rentabilité client |
| **Par période** | Évolution mensuelle CA, coûts, marges avec courbes de tendance |
| **Par commercial** | Performance individuelle, taux de conversion devis, CA réalisé |

### 7.2 KPI Financiers

- **Chiffre d'affaires** réel vs objectif (en valeur et en pourcentage d'atteinte)
- **Marge brute et marge nette** globale et par segment
- **Délai moyen de paiement** clients (DSO — Days Sales Outstanding)
- **Taux de retard de paiement** et encours clients
- **Retour sur investissement (ROI)** des équipements

---

## 8. Partie Business Intelligence (BI)

> 📊 Tableaux de Bord Intégrés — Du Données à la Décision

### 8.1 Objectif de la Couche BI

Transformer les données opérationnelles brutes en **informations stratégiques actionnables**, permettant aux dirigeants et managers de prendre des décisions éclairées et en temps réel.

### 8.2 Tableaux de Bord par Profil Utilisateur

| Profil | Tableaux de bord | Indicateurs clés |
|---|---|---|
| **Dirigeant** | Vue exécutive consolidée | CA, marge, objectifs, alertes critiques |
| **Directeur Commercial** | Performance commerciale | Pipeline devis, taux conversion, CA/client |
| **Responsable Production** | Suivi fabrication | Ordres en cours, avancement, OTD |
| **Responsable Stock** | Tableau de bord stocks | Niveaux, alertes, rotations, valeur |
| **Responsable Maintenance** | Maintenance & disponibilité | TRS, pannes, planification |
| **Responsable Qualité** | Qualité & conformité | Taux NC, Pareto défauts, tendances |
| **Comptable / DAF** | Analyse financière | Coûts, rentabilité, trésorerie |

### 8.3 Fonctionnalités des Tableaux de Bord

- Actualisation des données en temps réel (ou quasi-réel selon fréquence paramétrée)
- Filtres dynamiques : période, produit, client, commercial, entrepôt
- **Drill-down** : clic sur un indicateur pour voir le détail sous-jacent
- Export des données : PDF, Excel, CSV
- Partage et distribution automatique par email (rapport périodique)
- Personnalisation des widgets par l'utilisateur (drag & drop)

---

## 9. Partie Intelligence Artificielle (IA)

> 🤖 ERP Intelligent — De la Réaction à l'Anticipation

### 9.1 Vision de l'IA dans le Projet

L'intégration de l'Intelligence Artificielle transforme l'ERP d'un outil de gestion **réactif** en un système **proactif**, capable d'anticiper les situations et de recommander des actions optimales aux utilisateurs.

### 9.2 Modules IA — Description Détaillée

#### 9.2.1 Prévision de la Demande

| Attribut | Détail |
|---|---|
| **Objectif** | Prédire les volumes de ventes futures par produit et par période |
| **Données d'entrée** | Historique ventes 24 mois, saisonnalité, carnet de commandes |
| **Algorithme** | SARIMA, Prophet (Facebook) ou LSTM selon la taille du dataset |
| **Horizon** | Court terme : 1–4 semaines / Moyen terme : 1–3 mois |
| **Sortie** | Quantités prévisionnelles par référence avec intervalles de confiance |

#### 9.2.2 Anticipation des Ruptures de Stock

| Attribut | Détail |
|---|---|
| **Objectif** | Alerter avant qu'une rupture de stock se produise |
| **Calcul** | Stock actuel + entrées prévues − consommation prévisionnelle |
| **Horizon** | Alerte J+7, J+14, J+30 configurable selon criticité produit |
| **Sortie** | Liste des articles à risque avec niveau de criticité et recommandation |

#### 9.2.3 Optimisation des Niveaux d'Approvisionnement

| Attribut | Détail |
|---|---|
| **Objectif** | Calculer automatiquement les quantités optimales à commander |
| **Modèle** | Quantité Économique de Commande (Wilson) adapté avec contraintes métier |
| **Variables** | Délai fournisseur, coût stockage, coût passation commande, consommation |
| **Sortie** | Recommandations de réapprovisionnement avec dates et quantités suggérées |

#### 9.2.4 Aide à la Planification Production

- Optimisation du séquençage des ordres de fabrication (minimisation des délais)
- Détection automatique des conflits de ressources (machines, matières, personnel)
- Suggestions de regroupement de commandes pour optimiser les découpes aluminium
- Prévision de la charge atelier sur les prochaines semaines

---

## 10. Architecture Technique

### 10.1 Stack Technologique Recommandée

| Couche | Technologie | Justification |
|---|---|---|
| **Frontend** | React.js + TypeScript | SPA performante, composants réutilisables |
| **UI / Design System** | Tailwind CSS + Ant Design | Productivité UI, composants métier disponibles |
| **Backend API** | Node.js (Express) ou Python (FastAPI) | API REST performante, scalable |
| **Base de données** | PostgreSQL | SGBD relationnel robuste, performant pour analytics |
| **Moteur BI** | Apache Superset ou Metabase | Open source, intégration native PostgreSQL |
| **IA / ML** | Python (scikit-learn, Prophet, TensorFlow) | Standard industrie pour ML/IA |
| **Cache & Fichiers** | Redis + MinIO | Performance cache, stockage documents/PDF |
| **Infrastructure** | Docker + Docker Compose / Kubernetes | Déploiement reproductible, scalabilité |
| **Authentification** | JWT + OAuth2 / Keycloak | Sécurité, SSO possible |

### 10.2 Sécurité et Gestion des Accès

- Authentification multi-facteurs (MFA) optionnelle
- Gestion des rôles et permissions granulaires **(RBAC)**
- Chiffrement des données sensibles au repos et en transit **(TLS 1.3)**
- Journalisation complète des actions utilisateurs (audit trail)
- Sauvegarde automatique quotidienne avec rétention paramétrable

---

## 11. Exigences Non Fonctionnelles

| Critère | Exigence | Mesure |
|---|---|---|
| **Performance** | Temps de chargement pages < 2 secondes | 95e percentile en conditions normales |
| **Disponibilité** | Uptime 99,5% minimum | Hors maintenances programmées |
| **Utilisateurs simultanés** | Support de 50 utilisateurs simultanés minimum | Sans dégradation des performances |
| **Compatibilité** | Navigateurs modernes : Chrome, Firefox, Edge, Safari | 2 dernières versions majeures |
| **Responsive** | Interface adaptée tablette et desktop | Mobile : lecture seule en phase 1 |
| **Accessibilité** | Conformité WCAG 2.1 niveau AA | Audit accessibilité avant livraison |
| **Sauvegarde** | Backup quotidien automatisé | RPO < 24h, RTO < 4h |
| **Internationalisation** | Français (principal), Arabe (futur) | Dates, monnaies, formats locaux |

---

## 12. Planning et Phasage

### 12.1 Découpage en Phases

| Phase | Durée | Livrables |
|---|---|---|
| **Phase 0 — Cadrage** | 2 semaines | Ateliers métier, maquettes UI, validation CDC |
| **Phase 1 — Socle technique** | 4 semaines | Architecture, authentification, référentiels de base |
| **Phase 2 — Module Aluminium + Stock** | 6 semaines | Profilés, calculs, devis, commandes, stocks |
| **Phase 3 — Maintenance + Qualité** | 4 semaines | Gestion machines, contrôles, non-conformités |
| **Phase 4 — Comptabilité + BI** | 4 semaines | Analytique, tableaux de bord, KPI |
| **Phase 5 — IA Prédictive** | 4 semaines | Modèles ML, prévisions, alertes intelligentes |
| **Phase 6 — Tests et Déploiement** | 4 semaines | Tests UAT, corrections, mise en production |
| **TOTAL** | **~28 semaines (7 mois)** | Plateforme ERP complète opérationnelle |

### 12.2 Méthodologie — Cycle en Cascade (Waterfall)

Le projet sera conduit selon la **méthodologie en cascade (Waterfall)**, garantissant une progression séquentielle et maîtrisée, avec validation formelle à la clôture de chaque phase avant le passage à la suivante.

| Étape | Activités | Livrables | Condition de passage |
|---|---|---|---|
| **1. Expression des besoins** | Recueil des exigences, ateliers métier, analyse de l'existant | Cahier des Charges validé, PV de réunion | Signature du CDC par le maître d'ouvrage |
| **2. Analyse & Conception** | Modélisation des données, spécifications fonctionnelles, maquettes UI/UX | Dossier de conception, MCD/MLD, wireframes validés | Validation formelle des spécifications |
| **3. Architecture technique** | Choix stack, conception infrastructure, sécurité, API design | Dossier d'architecture technique (DAT) | Validation par le responsable technique |
| **4. Développement** | Implémentation module par module, revues de code | Code source versionné, bases de données, API | Recette interne (tests unitaires et d'intégration) |
| **5. Tests & Validation** | Tests fonctionnels, performance, sécurité, UAT | Plan de tests, rapports, PV de recette | Taux succès ≥ 95%, zéro anomalie bloquante |
| **6. Déploiement** | Mise en production, migration données, formation | Environnement production opérationnel | Recette finale signée par le maître d'ouvrage |
| **7. Maintenance & Support** | Corrections post-livraison, support, évolutions mineures | Rapport de suivi, journal des anomalies | Conformité au contrat de maintenance |

**Principes directeurs de la méthode cascade :**

- Chaque phase doit être **entièrement terminée et validée** avant de démarrer la suivante
- Toute modification après validation d'une phase fait l'objet d'une **demande de changement formelle (RFC)**
- Un comité de pilotage valide la clôture de chaque phase par un **procès-verbal signé**
- La documentation est produite et livrée **à chaque étape** (pas uniquement en fin de projet)
- Les tests sont **planifiés dès la phase de conception** et non ajoutés en fin de développement

---

## 13. Livrables et Critères d'Acceptation

### 13.1 Livrables Documentaires

- Présent Cahier des Charges
- Spécifications fonctionnelles détaillées (par module)
- Maquettes UI/UX validées (Figma ou équivalent)
- Architecture technique détaillée (schémas, diagrammes)
- Manuel utilisateur par profil
- Documentation technique (API, déploiement, administration)
- Rapport de tests et recette finale

### 13.2 Livrables Applicatifs

- Code source complet versionné sur dépôt Git
- Application déployée en environnements : développement, recette, production
- Scripts de migration et d'installation
- Tableau de bord de monitoring opérationnel

### 13.3 Critères d'Acceptation

| Critère | Condition d'acceptation |
|---|---|
| **Couverture fonctionnelle** | 100% des fonctionnalités du CDC livrées et validées |
| **Tests métier** | Scénarios de test métier validés par les référents |
| **Performance** | Temps de réponse conformes aux exigences NFR |
| **Données de test** | Jeu de données représentatif fourni et validé |
| **Formation** | Formation dispensée à l'ensemble des utilisateurs |
| **Documentation** | Ensemble des livrables documentaires remis et validés |

---

## 14. Glossaire et Abréviations

| Terme | Définition |
|---|---|
| **ERP** | Enterprise Resource Planning — Progiciel de gestion intégré |
| **BI** | Business Intelligence — Informatique décisionnelle |
| **IA / ML** | Intelligence Artificielle / Machine Learning |
| **KPI** | Key Performance Indicator — Indicateur clé de performance |
| **TRS** | Taux de Rendement Synthétique — Mesure d'efficacité production |
| **MTBF** | Mean Time Between Failures — Temps moyen entre deux pannes |
| **MTTR** | Mean Time To Repair — Temps moyen de réparation |
| **NC** | Non-Conformité — Écart par rapport à une spécification qualité |
| **OT** | Ordre de Travail — Document déclenchant une intervention maintenance |
| **OF** | Ordre de Fabrication — Instruction de lancement de production |
| **DSO** | Days Sales Outstanding — Délai moyen de recouvrement clients |
| **RBAC** | Role-Based Access Control — Contrôle d'accès basé sur les rôles |
| **API REST** | Interface de programmation applicative — architecture web standard |
| **SPA** | Single Page Application — Application web à page unique |
| **RPO / RTO** | Recovery Point / Time Objective — Objectifs de reprise après sinistre |
| **DAT** | Dossier d'Architecture Technique |
| **RFC** | Request For Change — Demande de changement formelle |
| **MCD / MLD** | Modèle Conceptuel / Logique de Données |
| **UAT** | User Acceptance Testing — Tests de recette utilisateur |
| **MAPE** | Mean Absolute Percentage Error — Mesure de précision des modèles IA |
| **CDC** | Cahier des Charges |
| **NFR** | Non-Functional Requirements — Exigences non fonctionnelles |

---

*Document confidentiel — Tous droits réservés*
*Plateforme ERP Intelligente — Secteur Aluminium — Version 1.0*
