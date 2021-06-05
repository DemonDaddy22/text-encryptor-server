/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
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

app.listen(port, () => `> Serving on PORT: ${port}`);

app.post(
    '/api/v1/messages',
    asyncErrorHandler(async (req, res) => {
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
    })
);

// Verifies if the ID is valid
// If valid, checks if entry exists in the DB corresponding to the ID
// If entry exists, check if it has expired or not
// else throws error
app.get(
    '/api/v1/messages/:id',
    asyncErrorHandler(async (req, res, next) => {
        const { id } = req.params;
        if (id && uuidValidateV4(id)) {
            const message = await Message.findById(id);
            if (!message) {
                const error = new SwooshError(
                    404,
                    `No message found for ${id}`
                );
                return next(error);
            }
            const createdAt = new Date(message.createdAt).getTime();
            const currTime = new Date().getTime();
            const validFor = message.validFor;
            if (isNaN(createdAt) || isNaN(validFor)) {
                const error = new SwooshError(500, 'Internal server error');
                return next(error);
            }
            if (createdAt + validFor < currTime) {
                await Message.findByIdAndDelete(id);
                return res.status(200).send({
                    status: 200,
                    data: {
                        id,
                        expired: true,
                        data: `The content corresponding to ${id} is no longer valid.`,
                    },
                });
            }
            res.status(200).send({ status: 200, data: true });
        } else {
            const error = new SwooshError(400, 'Invalid ID');
            next(error);
        }
    })
);

app.get(
    '/api/v1/messages/:id/decrypt',
    asyncErrorHandler(async (req, res, next) => {})
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
