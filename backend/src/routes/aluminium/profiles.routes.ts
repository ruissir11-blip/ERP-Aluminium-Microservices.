import { Router } from 'express';
import { ProfileController } from '../../controllers/aluminium/ProfileController';
import { authenticate } from '../../middleware/auth';

const router = Router();
const profileController = new ProfileController();

// Apply authentication to all profile routes
router.use(authenticate);

// GET /api/profiles - List all profiles
router.get('/', (req, res) => profileController.listProfiles(req, res));

// GET /api/profiles/:id - Get profile by ID
router.get('/:id', (req, res) => profileController.getProfile(req, res));

// POST /api/profiles - Create new profile
router.post('/', (req, res) => profileController.createProfile(req, res));

// PUT /api/profiles/:id - Update profile
router.put('/:id', (req, res) => profileController.updateProfile(req, res));

// DELETE /api/profiles/:id - Deactivate profile
router.delete('/:id', (req, res) => profileController.deleteProfile(req, res));

// POST /api/profiles/:id/calculate - Calculate weight/surface
router.post('/:id/calculate', (req, res) => profileController.calculate(req, res));

export default router;
