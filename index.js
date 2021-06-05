import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import uuidValidateV4 from './helpers/validateUUID.js';
import Message from './models/Message.js';
import asyncErrorHandler from './helpers/asyncErrorHandler.js';
import SwooshError from './errors/SwooshError.js';

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

app.get('/api/v1/messages/:id', asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    if (id && uuidValidateV4(id)) {
        try {
            const message = await Message.findById(id);
            if (!message) {
                const error = new SwooshError(404, `No message found for ${id}`);
                return next(error);
            }
            res.status(200).send({
                status: 200, data: true 
            });
        } catch (err) {
            const error = new SwooshError(400, 'Invalid ID');
            next(error);
        }
    } else {
        const error = new SwooshError(400, 'Invalid ID');
        next(error);
    }
}));

app.post('/api/v1/messages', asyncErrorHandler(async (req, res) => {
    const { content, validFor } = req.body;
    const _id = uuidv4();
    const message = new Message({ 
        _id,
        content,
        validFor,
        url: `${process.env.CLIENT_BASE_URI}${_id}`,
        createdAt: new Date().getTime(),
    });
    await message.save();
    res.send(message);
}));

app.use((err, req, res, next) => {
    let { message = 'Internal Server Error', status = 500, name } = err;
    res.status(status).send({
        message, status, name 
    });
});