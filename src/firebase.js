import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyDz4Z4CHvQmGmr_kn2TsK8jwKYr3g3TUJI",
    authDomain: "remediosdavidmajollo.firebaseapp.com",
    projectId: "remediosdavidmajollo",
    storageBucket: "remediosdavidmajollo.firebasestorage.app",
    messagingSenderId: "795625995928",
    appId: "1:795625995928:web:616e2404283234253a1aed",
    measurementId: "G-BR1PZFEGQF"
}

const app = initializeApp(firebaseConfig)

export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})

export const auth = getAuth(app)

const SHARED_DATA_DOC_ID = 'main'
export const getSharedDataDocId = () => SHARED_DATA_DOC_ID

export const saveUserData = async (docId, data) => {
    try {
        await setDoc(doc(db, 'users', docId), {
            ...data,
            updatedAt: new Date().toISOString()
        }, { merge: true })
        return true
    } catch (error) {
        console.error('Error saving data:', error)
        return false
    }
}

export const getUserData = async (docId) => {
    try {
        const docSnap = await getDoc(doc(db, 'users', docId))
        if (docSnap.exists()) {
            return docSnap.data()
        }
        return null
    } catch (error) {
        console.error('Error getting data:', error)
        return null
    }
}

export const subscribeToUserData = (docId, callback) => {
    return onSnapshot(
        doc(db, 'users', docId),
        (snap) => {
            if (snap.exists()) {
                callback(snap.data())
            } else {
                callback(null)
            }
        },
        (error) => {
            console.error('Firestore listener error:', error)
        }
    )
}

export const initAuth = (callback) => {
    return onAuthStateChanged(auth, async (user) => {
        if (!user) {
            try {
                await signInAnonymously(auth)
            } catch (error) {
                console.error('Auth error:', error)
            }
        } else {
            callback(user)
        }
    })
}
