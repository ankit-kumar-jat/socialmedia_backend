const mongoose = require("mongoose");
const { compareSync, hashSync } = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        validate: {
            validator: username => User.doesNotExist({ username }),
            message: "Username already exixts"
        },
        required: true,
        uniqe: true
    },
    email: {
        type: String,
        validate: {
            validator: email => User.doesNotExist({ email }),
            message: "Email already exists"
        },
        required: true,
        uniqe: true
    },
    password: {
        type: String,
        required: true
    },
    site_admin: {
        type: Boolean,
        required: false,
        default: false
    },
    type: {
        type: String,
        required: false,
        default: "user"
    },
    name: {
        type: String,
        required: false,
        default: null
    },
    location: {
        type: String,
        required: false,
        default: null
    },
    bio: {
        type: String,
        required: false,
        default: null
    },
    avatar_url: {
        type: String,
        required: false,
        default: null
    },
    website: {
        type: String,
        reqired: false,
        default: null
    },
    posts: {
        type: Number,
        reqired: false,
        default: 0
    },
    postsList: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    followers: {
        type: Number,
        required: false,
        default: 0
    },
    following: {
        type: Number,
        required: false,
        default: 0
    }
}, { timestamps: true });

UserSchema.pre('save', function () {
    if (this.isModified('password')) {
        this.password = hashSync(this.password, 10);
    }
});

UserSchema.statics.doesNotExist = async function (field) {
    return await this.where(field).countDocuments() === 0;
};

UserSchema.methods.comparePasswords = function (password) {
    return compareSync(password, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;