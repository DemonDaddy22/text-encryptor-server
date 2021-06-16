/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import asyncErrorHandler from './helpers/asyncErrorHandler';
import {
    createContentController,
    findContentByIdController,
} from './controllers/messageController';

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
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
db.on('error', (err) => console.error(err));
db.once('open', () => console.log('> Database connection established'));

app.listen(port, () => console.log(`> Serving on PORT: ${port}`));

// route to create new content message
app.post('/api/v1/messages', asyncErrorHandler(createContentController));

// route to verify ID
app.get(
    '/api/v1/messages/:id',
    asyncErrorHandler(findContentByIdController(false))
);

// route to decrypt message corresponding to ID
app.get(
    '/api/v1/messages/:id/decrypt',
    asyncErrorHandler(findContentByIdController(true))
);

app.use((err, req, res, next) => {
    let { message = 'Internal Server Error', status = 500, name } = err;
    res.status(status).send({
        message,
        status,
        name,
        error: true,
    });
});
