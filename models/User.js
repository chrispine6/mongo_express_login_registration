const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    communities: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Community',
        },
    ],
});

// Add passportLocalMongoose plugin
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
