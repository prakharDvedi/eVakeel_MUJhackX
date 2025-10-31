const fp = require('fastify-plugin');
const admin = require('firebase-admin');

module.exports = fp(async function (fastify, opts) {
    if (!admin.apps.length) {
        try {
            let credential;
            if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
                credential = admin.credential.cert(svc);
            } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
                const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
                const svc = JSON.parse(decoded);
                credential = admin.credential.cert(svc);
            } else {
                credential = admin.credential.applicationDefault();
            }

            admin.initializeApp({
                credential,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
            });
        } catch (err) {
            fastify.log.error(err, 'Failed to initialize Firebase Admin. Ensure credentials are configured.');
            throw err;
        }
    }

    const firestore = admin.firestore();
    const storage = admin.storage ? admin.storage() : null;

    fastify.decorate('firebaseAdmin', admin);
    fastify.decorate('firestore', firestore);
    fastify.decorate('firebaseStorage', storage);

    fastify.decorate('verifyIdToken', async (idToken, checkRevoked = false) => {
        if (!idToken) throw new Error('Missing ID token');
        return await admin.auth().verifyIdToken(idToken, checkRevoked);
    });

    fastify.decorate('getUserRecord', async (uid) => {
        return admin.auth().getUser(uid);
    });
});
