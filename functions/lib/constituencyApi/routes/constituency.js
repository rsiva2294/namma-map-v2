"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const constituencyController_1 = require("../controllers/constituencyController");
const router = (0, express_1.Router)();
router.get('/:id', constituencyController_1.getConstituency);
exports.default = router;
//# sourceMappingURL=constituency.js.map