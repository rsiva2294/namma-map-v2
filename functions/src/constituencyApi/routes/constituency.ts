import { Router } from 'express';
import { getConstituency, getStateSummary } from '../controllers/constituencyController';

const router = Router();

router.get('/state', getStateSummary);
router.get('/:id', getConstituency);

export default router;
