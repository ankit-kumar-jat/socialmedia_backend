const fs = require('fs')
const User = require("../models/user");

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    }
    else {
        res.status(401).json({
            "success": false,
            "status": 401,
            "message": "Please login to continue"
        });
    }
}

const isNotAuthenticated = (req, res, next) => {
    if (req.session.user) {
        res.json({
            "success": true,
            "userId": req.session.user.userId,
            "username": req.session.user.username,
            "message": "You are already logged in"
        });
    } else {
        next();
    }
}

const parseError = (err) => {
    console.log(err);
    if (err.isJoi) return { "sucess": false, "message": err.details[0].message };
    else if (err.errors) {
        return {
            "success": false,
            // "error": err._message,
            "message": err.errors[Object.keys(err.errors)[0]].message,
        }
    }
    else if (err.stack) {
        return {
            "success": false,
            // "error": err.message,
            "message": err.message,
        }
    }
    return JSON.stringify(err, Object.getOwnPropertyNames(err));
}

const sessionizeUser = user => {
    return { userId: user.id, username: user.username };
}

const saveResetToken = async (resetPasswordToken, resetPasswordExpires, userId, Reset) => {
    const newReset = new Reset({ resetPasswordToken, resetPasswordExpires, userId });
    await newReset.save();
    return { "resetPasswordToken": resetPasswordToken, "tokenId": newReset._id };
}

const deleteImage = (imageName) => {
    if (imageName)
        fs.unlinkSync(`public${imageName}`);
}


module.exports.sessionizeUser = sessionizeUser;
module.exports.parseError = parseError;
module.exports.isAuthenticated = isAuthenticated;
module.exports.isNotAuthenticated = isNotAuthenticated;
module.exports.saveResetToken = saveResetToken;
module.exports.deleteImage = deleteImage;
