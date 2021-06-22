import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import TinyURL from 'tinyurl';
import SwooshError from '../errors/SwooshError';
import uuidValidateV4 from '../helpers/validateUUID';
import Message from '../models/Message';
import isValidTinyURL from '../helpers/validateTinyURL';

// creates a new content document for content and validFor
// requires a secretKey which must be used for message decryption
// if any of content, secretKey or validFor is missing, throws error
const createContentController = async (req, res, next) => {
    const { content, validFor, secretKey } = req.body;
    if (!content || !validFor || !secretKey) {
        const error = new SwooshError(
            400,
            'Bad request: Missing either content, secretKey or validFor duration'
        );
        return next(error);
    }
    if (isNaN(validFor) || validFor < process.env.MIN_VALID_FOR) {
        const error = new SwooshError(
            400,
            'Bad request: Invalid validFor duration provided'
        );
        return next(error);
    }
    const _id = uuidv4();
    let url = `${process.env.CLIENT_BASE_URI}${_id}`;
    const tinyUrl = await TinyURL.shorten(url);
    url = isValidTinyURL(tinyUrl) ? tinyUrl : url;
    const message = new Message({
        _id,
        content,
        secretKey,
        validFor,
        url,
        createdAt: new Date().getTime(),
    });
    await message.save();
    res.status(200).send({
        status: 200,
        error: null,
        data: { url: message.url, message: '' },
    });
};

// Verifies if the ID is valid
// If valid, checks if entry exists in the DB corresponding to the ID
// If entry exists, check if it has expired or not
// If entry has not expired, check if secretKey matches with the one provided
// else throws error
const findContentByIdController =
    (respondWithContent) => async (req, res, next) => {
        const { id } = req.params;
        const { secretKey } = req.query;
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
                    error: null,
                    data: {
                        id,
                        expired: true,
                        message: `The content corresponding to ${id} is no longer valid.`,
                    },
                });
            }
            if (respondWithContent && !secretKey) {
                const error = new SwooshError(
                    400,
                    'Bad request: Missing secretKey'
                );
                return next(error);
            }
            if (respondWithContent && message.secretKey !== secretKey) {
                const error = new SwooshError(400, 'Invalid secret key');
                return next(error);
            }
            res.status(200).send({
                status: 200,
                error: null,
                data: {
                    message: respondWithContent ? message.content : '',
                    expired: false,
                },
            });
        } else {
            const error = new SwooshError(400, 'Invalid ID');
            next(error);
        }
    };

export { createContentController, findContentByIdController };
