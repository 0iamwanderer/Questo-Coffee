import 'server-only';

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

interface ServiceAccountJson {
  project_id: string;
  client_email: string;
  private_key: string;
}

const yukle = (): App => {
  if (getApps().length > 0) return getApp();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT ortam değişkeni eksik.');
  }

  let parsed: ServiceAccountJson;
  try {
    parsed = JSON.parse(raw) as ServiceAccountJson;
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT geçerli JSON değil.');
  }

  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  });
};

export const getAdminApp = (): App => yukle();
export const getAdminAuth = (): Auth => getAuth(yukle());
export const getAdminDb = (): Firestore => getFirestore(yukle());
