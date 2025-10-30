// plugins/firebase.js
const fp = require('fastify-plugin');
const admin = require('firebase-admin');

module.exports = fp(async function (fastify, opts) {
    if (!admin.apps.length) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(svc),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
            });
        } else {
            // when GOOGLE_APPLICATION_CREDENTIALS env var is present, applicationDefault() will use it
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
            });
        }
    }

    const firestore = admin.firestore();
    const storage = admin.storage ? admin.storage() : null;

    fastify.decorate('firebaseAdmin', admin);
    fastify.decorate('firestore', firestore);
    fastify.decorate('firebaseStorage', storage);

    // verify ID token (option to check revocation via checkRevoked argument)
    fastify.decorate('verifyIdToken', async (idToken, checkRevoked = false) => {
        if (!idToken) throw new Error('Missing ID token');
        return await admin.auth().verifyIdToken(idToken, checkRevoked);
    });

    // helper: get user record
    fastify.decorate('getUserRecord', async (uid) => {
        return admin.auth().getUser(uid);
    });
});
