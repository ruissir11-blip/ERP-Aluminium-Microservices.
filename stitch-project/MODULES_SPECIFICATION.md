# ERP Aluminium - Module Specifications for UI Design

## Module A — Métier Aluminium (Aluminum Business Module)

### Screen 1: Aluminum Profiles Catalog (Gestion des Profilés)

**Purpose:** Manage the aluminum profile catalog with technical specifications and pricing.

**Layout Requirements:**
- Left sidebar navigation (dark blue #1e3a5f)
- Header: "Gestion des Profilés Aluminium" with search bar and "+ Nouveau Profilé" button (teal #0d9488)
- Filter bar with dropdowns: Type, Alliage, Fournisseur
- Data table with columns:
  - Référence (unique code)
  - Type (Cornière, Tube, Plat, UPN, IPE...)
  - Longueur (mm)
  - Largeur (mm)
  - Épaisseur (mm)
  - Poids/m (kg/m)
  - Prix unitaire (€/kg)
  - Stock (color-coded: green/adequate, orange/low, red/critical)
  - Actions (edit/view icons)
- Pagination: "Affichage 1-10 sur 245 profilés"

**Sample Data for Table:**
| Référence | Type | Longueur | Largeur | Épaisseur | Poids/m | Prix unitaire | Stock |
|-----------|------|----------|---------|-----------|---------|---------------|-------|
| PROF-001 | Cornière | 3000mm | 50mm | 5mm | 2.1 kg/m | €3.50/kg | 450 |
| PROF-002 | Tube rond | 2000mm | 25mm | 2mm | 0.8 kg/m | €4.20/kg | 120 |
| PROF-003 | Plat | 6000mm | 100mm | 10mm | 5.4 kg/m | €3.80/kg | 85 |
| PROF-004 | UPN | 4000mm | 80mm | 8mm | 3.2 kg/m | €3.90/kg | 32 |

---

### Screen 2: Quote Creation (Création de Devis)

**Purpose:** Generate professional quotes from profile selections.

**Layout Requirements:**
- Two-column layout:
  - Left (40%): Profile selector with search and catalog
  - Right (60%): Quote builder form

**Left Panel - Profile Selector:**
- Search bar with filters
- Scrollable list of profiles with thumbnails
- Click to add to quote

**Right Panel - Quote Form:**
- Customer selection dropdown
- Quote reference number (auto-generated)
- Line items table with columns:
  - Profilé (reference + type)
  - Longueur demandée (m)
  - Quantité
  - Surface (m²) - auto-calculated
  - Poids (kg) - auto-calculated
  - Prix unitaire (€)
  - Total ligne (€)
  - Actions (delete icon)
- Calculations summary box:
  - Sous-total HT
  - Remise globale (%) - input field
  - Montant TVA (20%)
  - **TOTAL TTC** (highlighted)
- Margin indicator: Marge: €XXX (XX%)
- Action buttons: "Enregistrer brouillon", "Générer PDF", "Envoyer par email"

---

### Screen 3: Orders Management (Gestion des Commandes)

**Purpose:** Track orders through their lifecycle.

**Layout Requirements:**
- Header with title "Gestion des Commandes" and filters
- Kanban-style workflow board with columns:
  - En attente
  - Confirmée
  - En production
  - Terminée
- Each column contains order cards with:
  - Order number
  - Customer name
  - Total amount
  - Date
  - Priority indicator
- List view alternative with table:
  - N° Commande
  - Client
  - Date
  - Montant
  - Statut (color-coded badges)
  - Actions (view, edit, convert to invoice)

---

## Module B — Stock Avancé (Advanced Stock)

### Screen 4: Multi-Warehouse Stock View

**Purpose:** Real-time stock monitoring across multiple warehouses.

**Layout Requirements:**
- Warehouse selector tabs (Entrepôt Nord, Entrepôt Sud, etc.)
- Stock summary cards:
  - Valeur totale du stock
  - Articles en stock
  - Alertes en cours
  - Rotation moyenne
- Main table with columns:
  - Article
  - Référence
  - Emplacement (Allée/Rack/Niveau)
  - Quantité
  - Seuil min
  - Seuil max
  - Dernier mouvement
  - Statut (Vert/Orange/Rouge)
- Filter options: par catégorie, par fournisseur, par rotation

---

### Screen 5: Stock Movement History

**Purpose:** Track all stock movements with audit trail.

**Layout Requirements:**
- Date range picker
- Movement type filter (Entrée, Sortie, Transfert, Inventaire)
- Data table with:
  - Date/Heure
  - Type
  - Article
  - Quantité
  - Entrepôt source
  - Entrepôt destination
  - Référence document
  - Utilisateur
- Export button (Excel/PDF)

---

## Module C — Maintenance Industrielle

### Screen 6: Machine Fleet Dashboard

**Purpose:** Overview of all machines and their status.

**Layout Requirements:**
- Machine cards grid showing:
  - Machine name and reference
  - Current status (En service / En maintenance / Hors service)
  - TRS indicator (green >90%, orange 70-90%, red <70%)
  - Last maintenance date
  - Next scheduled maintenance
  - MTBF / MTTR indicators
- Filters: par atelier, par statut, par criticité
- "Déclarer une panne" button (red, prominent)

---

### Screen 7: Work Order Management (Ordres de Travail)

**Purpose:** Manage preventive and corrective maintenance work orders.

**Layout Requirements:**
- Calendar view (monthly/weekly)
- Work order list with:
  - OT Number
  - Machine
  - Type (Préventif/Correctif)
  - Description
  - Date planifiée
  - Technicien assigné
  - Statut (À faire / En cours / Terminé)
  - Priorité
- "Nouvel Ordre de Travail" button

---

## Module D — Contrôle Qualité

### Screen 8: Quality Control Checkpoints

**Purpose:** Manage quality checkpoints during production.

**Layout Requirements:**
- Production order selector
- Checkpoint list with:
  - Étape de production
  - Critère contrôlé
  - Valeur nominale
  - Tolérance min/max
  - Valeur mesurée (input)
  - Écart calculé
  - Décision (Conforme/Non-conforme/À retravailler/Rebut)
  - Signature contrôleur
- Non-conformity declaration button

---

### Screen 9: Non-Conformity Management (Gestion des NC)

**Purpose:** Track and resolve non-conformities.

**Layout Requirements:**
- NC workflow tracker:
  - Détection → Analyse → Traitement → Prévention → Clôture
- NC table with:
  - N° NC
  - Date
  - Produit concerné
  - Description
  - Photos (thumbnails)
  - Cause racine
  - Action corrective
  - Action préventive
  - Statut
  - Responsable
- Charts: Pareto des défauts, Taux NC par produit

---

## Module E — Comptabilité Analytique

### Screen 10: Cost Analysis Dashboard

**Purpose:** Analyze costs by product, order, customer, and period.

**Layout Requirements:**
- Analysis dimension selector (tabs): Par Produit / Par Commande / Par Client / Par Période
- KPI cards:
  - Coût matière moyen
  - Coût main-d'œuvre
  - Frais généraux
  - Marge brute
  - Marge nette
- Detailed table based on selected dimension
- Charts: Évolution des coûts, Répartition des coûts

---

## Module F — Business Intelligence

### Screen 11: Executive Dashboard (Already Generated)

**Already created as Screen IDs:**
- 4fd5e0c43e3f4806a047d57452517952
- f22b1d63acc444a19668a0687b2e334b

**Features:**
- KPI cards (CA, Stock, TRS, NC)
- Monthly revenue bar chart
- Stock distribution pie chart
- Recent orders table
- Stock alerts table

---

### Screen 12: Commercial Dashboard

**Purpose:** Sales performance monitoring.

**Layout Requirements:**
- KPIs: CA réalisé, Objectif, Écart, Taux conversion devis
- Pipeline chart (Devis → Commandes → Livraisons)
- Top clients table
- Performance by commercial (if multiple)
- Monthly comparison chart

---

### Screen 13: Production Dashboard

**Purpose:** Production tracking and OTD (On Time Delivery).

**Layout Requirements:**
- KPIs: OF en cours, OTD rate, TRS moyen
- Gantt chart of production orders
- Machine utilization chart
- Late orders alert table
- Capacity planning view

---

## Module G — Intelligence Artificielle

### Screen 14: Demand Forecasting (Prévision de Demande)

**Purpose:** Display AI-generated demand forecasts.

**Layout Requirements:**
- Profile selector
- Forecast chart (historical + predicted with confidence intervals)
- Table with:
  - Période
  - Prévision volume
  - Intervalle confiance (min/max)
  - Commandes en carnet
  - Écart
- Seasonality indicators
- Accuracy metrics (MAPE)

---

### Screen 15: Stock Rupture Alerts

**Purpose:** AI-powered stock shortage predictions.

**Layout Requirements:**
- Alert cards showing:
  - Article à risque
  - Stock actuel
  - Date prédite de rupture (J+7, J+14, J+30)
  - Niveau de criticité (Critique/Élevée/Moyenne)
  - Recommandation (Quantité suggérée, Date commande)
- "Créer commande fournisseur" action button
- Filter by horizon and criticality

---

## Design System

### Color Palette
- **Primary:** #1e3a5f (Deep Blue)
- **Secondary:** #0d9488 (Teal)
- **Accent:** #0ea5e9 (Sky Blue)
- **Success:** #22c55e (Green)
- **Warning:** #f59e0b (Amber)
- **Danger:** #ef4444 (Red)
- **Background:** #f8fafc (Light Gray)
- **Card Background:** #ffffff (White)

### Typography
- **Font Family:** Manrope
- **Heading Sizes:** H1: 24px, H2: 20px, H3: 18px
- **Body Text:** 14px
- **Small Text:** 12px

### Spacing & Layout
- **Card Padding:** 24px
- **Card Border Radius:** 8px
- **Card Shadow:** 0 1px 3px rgba(0,0,0,0.1)
- **Grid Gap:** 24px
- **Sidebar Width:** 260px

### Components
- **Buttons:**
  - Primary: Teal background, white text, 8px radius
  - Secondary: White background, teal border
  - Danger: Red background
- **Tables:**
  - Header: Light gray background
  - Striped rows
  - Hover effect
- **Form Inputs:**
  - 8px border radius
  - Light border
  - Focus: Teal border

---

## Implementation Notes

### Responsive Behavior
- Desktop: Full sidebar + content layout
- Tablet: Collapsible sidebar
- Mobile: Hamburger menu (Phase 2)

### Interactions
- All buttons should have hover states
- Tables should support sorting and filtering
- Charts should be interactive (tooltips)
- Forms should have validation feedback

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios met

---

*Specifications derived from Cahier_Des_Charges_ERP_Aluminium.md*
*Document generated: March 4, 2026*
