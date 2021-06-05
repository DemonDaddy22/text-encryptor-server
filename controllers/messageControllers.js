import { v4 as uuidv4 } from 'uuid';
import SwooshError from '../errors/SwooshError';
import uuidValidateV4 from '../helpers/validateUUID';
import Message from '../models/Message';

// creates a new content document for content and validFor
// if one of content or validFor is missing, throws error
const createContentController = async (req, res, next) => {
    const { content, validFor } = req.body;
    if (!content || !validFor) {
        const error = new SwooshError(
            400,
            'Bad request: Missing either content or valid for duration'
        );
        return next(error);
    }
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
};

// Verifies if the ID is valid
// If valid, checks if entry exists in the DB corresponding to the ID
// If entry exists, check if it has expired or not
// else throws error
const findContentByIdController =
    (respondWithContent) => async (req, res, next) => {
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
            res.status(200).send({
                status: 200,
                data: respondWithContent ? { content: message.content } : true,
            });
        } else {
            const error = new SwooshError(400, 'Invalid ID');
            next(error);
        }
    };

export { createContentController, findContentByIdController };
