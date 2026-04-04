# Quick Start Guide - ERP Aluminium Stitch Project

## Project Information

| Field | Value |
|-------|-------|
| **Project ID** | `14269760717500464917` |
| **Project Name** | ERP Aluminium - Enterprise Resource Planning |
| **Status** | Active |
| **Screens Generated** | 2 (Executive Dashboard) |

## Accessing Your Project

### Method 1: Via Stitch MCP View Command

```bash
npx @_davideast/stitch-mcp view -p 14269760717500464917
```

### Method 2: Via Stitch Website

1. Go to the Stitch platform
2. Log in with your credentials
3. Navigate to project ID: `14269760717500464917`

### Method 3: Via Kilo Code MCP Tools

Use the Kilo Code assistant to query the project:
- Get project details
- List screens
- Generate new screens
- Download HTML/CSS

## Generated Screens

### Screen 1: AluTech ERP Executive Dashboard
- **ID:** `4fd5e0c43e3f4806a047d57452517952`
- **Dimensions:** 2560x2220px
- **Download URL:** Available via Stitch platform
- **HTML Code:** Available for export

### Screen 2: AluTech ERP Executive Dashboard (Variant)
- **ID:** `f22b1d63acc444a19668a0687b2e334b`
- **Dimensions:** 2560x2366px
- **Download URL:** Available via Stitch platform
- **HTML Code:** Available for export

## Exporting Screens

### Export as HTML/CSS

```bash
# Export all screens to a local directory
npx @_davideast/stitch-mcp site -p 14269760717500464917 -o ./exported-ui
```

### Serve Screens Locally

```bash
# Start a local server to preview screens
npx @_davideast/stitch-mcp serve -p 14269760717500464917
```

## Generating Additional Screens

To add more screens to the project, use the Kilo Code assistant with prompts like:

```
Generate a screen for the ERP Aluminium project showing the aluminum profiles catalog with:
- Table listing profiles (Reference, Type, Dimensions, Weight, Price)
- Filter options
- Add/Edit buttons
- Stock level indicators
```

## Screen Checklist

### Module A - Métier Aluminium
- [x] Executive Dashboard
- [ ] Aluminum Profiles Catalog
- [ ] Quote Creation
- [ ] Orders Management
- [ ] Production Orders
- [ ] Delivery Notes
- [ ] Invoicing

### Module B - Stock Avancé
- [ ] Multi-Warehouse Stock View
- [ ] Stock Movement History
- [ ] Low Stock Alerts

### Module C - Maintenance
- [ ] Machine Fleet Dashboard
- [ ] Work Order Management
- [ ] Breakdown Declaration

### Module D - Qualité
- [ ] Quality Control Checkpoints
- [ ] Non-Conformity Management

### Module E - Comptabilité
- [ ] Cost Analysis Dashboard
- [ ] Financial Reports

### Module F - BI Dashboards
- [x] Executive Dashboard
- [ ] Commercial Dashboard
- [ ] Production Dashboard
- [ ] Stock Dashboard
- [ ] Maintenance Dashboard
- [ ] Quality Dashboard
- [ ] Financial Dashboard

### Module G - Intelligence Artificielle
- [ ] Demand Forecasting
- [ ] Stock Rupture Alerts
- [ ] Supply Optimization

## Design Theme

The project uses the following design theme:

- **Color Mode:** Light
- **Primary Color:** #1f3b61 (Deep Blue)
- **Font:** Manrope
- **Border Radius:** 8px
- **Style:** Professional, clean, modern

## Integration with Backend

The UI designs are intended to connect with the existing Node.js/Express backend:

**Backend Location:** `../backend/`

**Key API Endpoints Expected:**
- `/api/v1/profiles` - Aluminum profiles
- `/api/v1/quotes` - Quotes management
- `/api/v1/orders` - Orders management
- `/api/v1/stock` - Stock management
- `/api/v1/maintenance` - Maintenance management
- `/api/v1/quality` - Quality control
- `/api/v1/accounting` - Financial data

## Next Steps

1. **View Generated Screens:** Use the methods above to view the executive dashboard
2. **Export HTML/CSS:** Download the generated code for implementation
3. **Generate More Screens:** Use the Kilo Code assistant to create additional screens
4. **Implement Backend:** Connect the UI to the existing backend API
5. **Test Integration:** Verify data flow between frontend and backend

## Troubleshooting

### Issue: Cannot view project
**Solution:** Ensure you are authenticated with the Stitch MCP. Run:
```bash
npx @_davideast/stitch-mcp init
```

### Issue: Screens not loading
**Solution:** Check your internet connection and try again. The Stitch platform requires an active connection.

### Issue: Export fails
**Solution:** Ensure the output directory exists and you have write permissions:
```bash
mkdir -p ./exported-ui
npx @_davideast/stitch-mcp site -p 14269760717500464917 -o ./exported-ui
```

## Resources

- **Full Requirements:** `../Cahier_Des_Charges_ERP_Aluminium.md`
- **Module Specifications:** `./MODULES_SPECIFICATION.md`
- **Backend Code:** `../backend/`
- **Project Plans:** `../plans/`

## Support

For issues with the Stitch MCP:
1. Check the [Stitch documentation](https://stitch.mesh.studio)
2. Run diagnostics: `npx @_davideast/stitch-mcp doctor`
3. View help: `npx @_davideast/stitch-mcp --help`

---

*Quick Start Guide - Generated March 4, 2026*
