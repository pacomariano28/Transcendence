import express from 'express';
import { getTracks } from './controllers/search.controller.js';

const app = express();
const port = process.env.PORT || 4003;

app.use(express.json());

// Define the internal route
app.get('/internal/search', getTracks);

app.listen(port, () => {
    console.log(`Content service listening on port ${port}`);
});
