import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import uuidValidateV4 from './helpers/validateUUID.js';
import Message from './models/Message.js';

const app = express();

app.use(cors());
app.use(express.urlencoded({
    extended: true 
}));
app.use(express.json());

const port = process.env.PORT || 5050;
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/swoosh';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', err => console.error(err));
db.once('open', () => console.log('> Database connection established'));

app.listen(port, () => `> Serving on PORT: ${port}`);

app.get('/', async (req, res) => {
    const content = `Lorem ipsum amet minim adipisicing excepteur amet sit incididunt do laborum. Et excepteur et ipsum mollit tempor do reprehenderit ullamco minim.`;
    const _id = uuidv4();
    const message = new Message({ 
        _id,
        content,
        url: 'asasasfas',
        createdAt: new Date().getTime(),
        validFor: 360 * 60 * 1000
    });
    await message.save();
    res.send(message);
});

app.get('/api/v1/messages/:id', async (req, res) => {
    const { id } = req.params;
    if (id && uuidValidateV4(id)) {
        const message = await Message.findById(id);
        res.send(message);
    } else {
        res.send('Invalid ID');
    }
});

app.post('/api/v1/messages', async (req, res) => {
    const { content, validFor } = req.body;
    const _id = uuidv4();
    const message = new Message({ 
        _id,
        content,
        validFor,
        url: '',
        createdAt: new Date().getTime(),
    });
    await message.save();
    res.send(message);
});