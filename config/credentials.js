const fs = require('fs');

const localSslCredentials = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

module.exports = {
    development: {
        session: {
            secret: 'aea68c59aa0667fbf97bc549d347092b',
            resave: true,
            saveUninitialized: true,
            cookie: {
                secure: false,
                httpOnly: false
            }
        }
    },
    secure: {
        ssl: localSslCredentials,
        session: {
            secret: '9c860e5d21965dba7dada1bac3b14466',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: true,
                httpOnly: true
            }
        }
    },
    production: {
        ssl: localSslCredentials, // TODO: Change this to production credentials!
        session: {
            secret: '77fd9b5446dda638287dfb871b3d9521',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: true,
                httpOnly: true
            }
        }
    }
};