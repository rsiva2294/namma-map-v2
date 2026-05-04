"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const constituency_1 = require("./routes/constituency");
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use('/api/constituency', constituency_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map