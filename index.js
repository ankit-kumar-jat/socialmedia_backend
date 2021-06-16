const mongoose = require("mongoose")
const MongoStore = require("connect-mongo");
const express = require("express");
// const http2 = require('http2');
const session = require("express-session");
require('dotenv').config();
const authRouter = require("./reoutes/auth/main");
const userRouter = require("./reoutes/users/user");
const postRouter = require("./reoutes/posts/posts");
const fileUpload = require('express-fileupload');
const cors = require("cors");
const app = express();

(async () => {
    try {
        const PORT = process.env.PORT || 3000;
        const MONGO_URI = process.env.MONGO_URI;
        const SESS_NAME = process.env.SESS_NAME;
        const SESS_SECRET = process.env.SESS_SECRET;
        const SESS_LIFETIME = process.env.SESS_LIFETIME;
        const NODE_ENV = process.env.NODE_ENV;
        const CORS_URL = process.env.CORS_URL;

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('MongoDB connected.')

        app.disable('x-powered-by');

        app.use(express.urlencoded({ extended: true }));
        app.use(express.json());
        app.use(fileUpload());

        app.use(session({
            name: SESS_NAME,
            secret: SESS_SECRET,
            store: new MongoStore({
                mongoUrl: MONGO_URI,
                mongooseConnection: mongoose.connection,
                collection: 'session',
                ttl: parseInt(SESS_LIFETIME),
            }),
            saveUninitialized: false,
            resave: false,
            cookie: {
                sameSite: true,
                // sameSite: "None",
                secure: NODE_ENV === 'production',
                maxAge: parseInt(SESS_LIFETIME)
            }
        }));

        //cache data for 5 min
        // ############ use this only on static resources. ##########
        // app.use(function (req, res, next) {
        //     res.set('Cache-control', 'public, max-age=300');
        //     next();
        // }); 


        // app.use(cors({ origin: 'http://127.0.0.1:3000', credentials: true }));
        app.use(cors({ origin: CORS_URL, credentials: true }));
        // app.use(cors({ origin: 'http://192.168.42.150:65146', credentials: true }));

        app.use('/images', express.static('public/images', { maxAge: 87000000 }))
        app.use("/auth", authRouter);
        app.use("/users", userRouter);
        app.use("/posts", postRouter);
        if (require.main === module) {
            app.listen(3000);
        } else {
            app.listen(PORT, () => console.log(`Server is rinning on 127.0.0.1:${PORT}`));
        }

        // http2.createServer({ allowHTTP1: true }, app)
        //     .listen(PORT, (err) => {
        //         if (err) {
        //             throw new Error(err);
        //         }

        //         /* eslint-disable no-console */
        //         // console.log('Listening on port: ' + argv.port + '.');
        //         console.log(`Server is rinning on 127.0.0.1:${PORT}`);
        //         /* eslint-enable no-console */
        //     });
    }
    catch (error) {
        console.log(error);
    }
})();

module.exports = app;

