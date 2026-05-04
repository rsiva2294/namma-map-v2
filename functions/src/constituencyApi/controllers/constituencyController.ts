import { Request, Response } from 'express';
import { fetchConstituencyData } from '../services/eciScraper';

export const getConstituency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Constituency ID is required' });
      return;
    }

    const data = await fetchConstituencyData(id as string);
    res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching constituency ${req.params.id}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch election results',
      constituencyId: Number(req.params.id),
      candidates: [],
      lastUpdated: Date.now()
    });
  }
};
