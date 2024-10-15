import * as admin from 'firebase-admin';

admin.initializeApp();

let firestore: admin.firestore.Firestore | null = null;


export const db = (): admin.firestore.Firestore => {

    if (firestore === null) {
        firestore = admin.firestore();
        firestore.settings({ ignoreUndefinedProperties: true });
    }

    return firestore
}
