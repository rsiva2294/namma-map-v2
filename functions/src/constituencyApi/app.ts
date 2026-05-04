import * as express from 'express';
import * as cors from 'cors';
import constituencyRoutes from './routes/constituency';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/constituency', constituencyRoutes);

export default app;
