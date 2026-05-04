"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConstituency = void 0;
const eciScraper_1 = require("../services/eciScraper");
const getConstituency = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Constituency ID is required' });
            return;
        }
        const data = await (0, eciScraper_1.fetchConstituencyData)(id);
        res.status(200).json(data);
    }
    catch (error) {
        console.error(`Error fetching constituency ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Failed to fetch election results',
            constituencyId: Number(req.params.id),
            candidates: [],
            lastUpdated: Date.now()
        });
    }
};
exports.getConstituency = getConstituency;
//# sourceMappingURL=constituencyController.js.map