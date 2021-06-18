var nodemailer = require('nodemailer');

const USER = process.env.MAIL_USER;
const PASS = process.env.MAIL_PASS;

// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: USER,
//         pass: PASS
//     }
// });



const sendEmail = async (body, to, subject) => {
    // const mailOptions = {
    //     from: "LinkBook", // sender address
    //     to: to, // list of receivers
    //     subject: subject, // Subject line
    //     html: body// plain text body
    // };

    // transporter.sendMail(mailOptions, function (err, info) {
    //     if (err)
    //         console.log(err)
    //     else
    //         console.log(info);
    // })

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "mail.privateemail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: USER, // generated ethereal user
            pass: PASS, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'linkbook@ankitkumarjat.me', // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        // text: '', // plain text body
        html: body, // html body
    });

    console.log("Message sent: %s", info);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

module.exports.sendEmail = sendEmail;