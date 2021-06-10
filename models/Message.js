import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import encrypt from 'mongoose-encryption';

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    _id: String,
    content: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    validFor: {
        type: Number,
        required: true,
    },
});

MessageSchema.plugin(encrypt, {
    encryptionKey: process.env.ENCRYPTION_KEY,
    signingKey: process.env.SIGN_KEY,
    encryptedFields: ['content'],
    decryptPostSave: false,
});

const Message = mongoose.model('message', MessageSchema);

export default Message;
