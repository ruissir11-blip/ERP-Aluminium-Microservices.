import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/dashboard/kpis
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        data: {
          chiffreAffaires: 1250000,
          chiffreAffairesChange: 5.2,
          stockValue: 850000,
          stockValueChange: -2.1,
          trs: 87.5,
          trsChange: 1.3,
          tauxNonConformite: 2.3,
          tauxNonConformiteChange: -0.5
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch KPIs' } });
  }
});

// GET /api/v1/dashboard/revenue
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || 'month';
    res.json({
      success: true,
      data: {
        data: [
          { month: 'Jan', revenue: 95000 },
          { month: 'Fév', revenue: 112000 },
          { month: 'Mar', revenue: 108000 },
          { month: 'Avr', revenue: 125000 },
          { month: 'Mai', revenue: 118000 },
          { month: 'Juin', revenue: 132000 },
          { month: 'Juil', revenue: 145000 },
          { month: 'Août', revenue: 98000 },
          { month: 'Sep', revenue: 110000 },
          { month: 'Oct', revenue: 125000 },
          { month: 'Nov', revenue: 138000 },
          { month: 'Déc', revenue: 152000 }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch revenue' } });
  }
});

// GET /api/v1/dashboard/stock-distribution
router.get('/stock-distribution', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        data: [
          { category: 'Profiles', percentage: 45 },
          { category: 'Accessories', percentage: 25 },
          { category: 'Glass', percentage: 15 },
          { category: 'Hardware', percentage: 10 },
          { category: 'Other', percentage: 5 }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stock distribution' } });
  }
});

// GET /api/v1/dashboard/recent-orders
router.get('/recent-orders', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    res.json({
      success: true,
      data: {
        data: [
          { id: '1', orderNumber: 'CMD-2026-001', customer: { name: 'Société Aluminium Sud' }, total: 15420.00, status: 'CONFIRMÉE' },
          { id: '2', orderNumber: 'CMD-2026-002', customer: { name: 'Menuiserie Dupont' }, total: 8750.50, status: 'EN_PRODUCTION' },
          { id: '3', orderNumber: 'CMD-2026-003', customer: { name: 'Construction Moderne' }, total: 22300.00, status: 'TERMINÉE' },
          { id: '4', orderNumber: 'CMD-2026-004', customer: { name: 'Batiment Plus' }, total: 5200.00, status: 'EN_ATTENTE' },
          { id: '5', orderNumber: 'CMD-2026-005', customer: { name: 'Ferrures Pro' }, total: 18900.00, status: 'CONFIRMÉE' }
        ].slice(0, limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch recent orders' } });
  }
});

// GET /api/v1/dashboard/stock-alerts
router.get('/stock-alerts', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        data: [
          { id: '1', profile: { name: 'Profile 70mm' }, quantity: 0, minThreshold: 50 },
          { id: '2', profile: { name: 'Profile 55mm' }, quantity: 25, minThreshold: 100 },
          { id: '3', profile: { name: 'Clover Cap' }, quantity: 80, minThreshold: 200 },
          { id: '4', profile: { name: 'Joint EPDM' }, quantity: 500, minThreshold: 1000 }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stock alerts' } });
  }
});

export default router;
