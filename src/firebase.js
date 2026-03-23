import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAlRSb5zXusTw4BoniKDwMthFq7vHwxadw',
  authDomain: 'budget-tracker-23666.firebaseapp.com',
  projectId: 'budget-tracker-23666',
  storageBucket: 'budget-tracker-23666.firebasestorage.app',
  messagingSenderId: '111538509821',
  appId: '1:111538509821:web:223b93d059133895776b94'
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
