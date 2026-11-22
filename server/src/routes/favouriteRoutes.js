import { Router } from 'express';
import {
  getFavourites,
  getFavouriteIds,
  toggleFavourite,
} from '../controllers/favouriteController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getFavourites);
router.get('/ids', getFavouriteIds);
router.post('/:propertyId', toggleFavourite);

export default router;
