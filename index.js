import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

const port = process.env.PORT || 5050;

app.listen(port, () => `> Serving on PORT: ${port}`);

app.get('/', (req, res) => {
    res.send('Greetings from Swoosh!');
});