import mongoose from 'mongoose';

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
    }
});

const Message = mongoose.model('message', MessageSchema);

export default Message;