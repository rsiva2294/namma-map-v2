import { Router } from 'express';
import { getConstituency } from '../controllers/constituencyController';

const router = Router();

router.get('/:id', getConstituency);

export default router;
