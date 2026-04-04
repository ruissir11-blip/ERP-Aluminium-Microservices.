import { Router } from 'express';
import { QuoteController } from '../../controllers/aluminium/QuoteController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const quoteController = new QuoteController();

// Apply authentication to all quote routes
router.use(authenticate);

// GET /api/quotes - List all quotes
router.get('/', (req, res) => quoteController.listQuotes(req, res));

// GET /api/quotes/:id - Get quote by ID
router.get('/:id', (req, res) => quoteController.getQuote(req, res));

// POST /api/quotes - Create new quote
router.post('/', (req, res) => quoteController.createQuote(req, res));

// POST /api/quotes/:id/lines - Add line to quote
router.post('/:id/lines', (req, res) => quoteController.addLine(req, res));

// PUT /api/quotes/:id/lines/:lineId - Update line in quote
router.put('/:id/lines/:lineId', (req, res) => quoteController.updateLine(req, res));

// DELETE /api/quotes/:id/lines/:lineId - Remove line from quote
router.delete('/:id/lines/:lineId', (req, res) => quoteController.removeLine(req, res));

// POST /api/quotes/:id/send - Send quote
router.post('/:id/send', (req, res) => quoteController.sendQuote(req, res));

// POST /api/quotes/:id/accept - Accept quote
router.post('/:id/accept', (req, res) => quoteController.acceptQuote(req, res));

// POST /api/quotes/:id/refuse - Refuse quote
router.post('/:id/refuse', (req, res) => quoteController.refuseQuote(req, res));

// POST /api/quotes/:id/convert - Convert quote to order
router.post('/:id/convert', (req, res) => quoteController.convertToOrder(req, res));

// GET /api/quotes/:id/pdf - Generate quote PDF
router.get('/:id/pdf', (req, res) => quoteController.generatePdf(req, res));

export default router;
