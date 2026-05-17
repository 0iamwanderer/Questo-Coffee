import 'server-only';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

const serviceAccountOku = (): string | null => {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline && inline.trim().length > 0) return inline;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path && path.trim().length > 0) {
    try {
      return readFileSync(resolve(path), 'utf8');
    } catch (e) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_PATH okunamadı (${path}): ${
          e instanceof Error ? e.message : e
        }`,
      );
    }
  }
  return null;
};

const yukle = (): App => {
  if (getApps().length > 0) return getApp();

  // Emulator modu: FIRESTORE_EMULATOR_HOST veya FIREBASE_AUTH_EMULATOR_HOST
  // set edilmişse Admin SDK bunları otomatik kullanır; service account
  // gerekmez, projectId yeter.
  const emulatorAcik =
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

  if (emulatorAcik) {
    return initializeApp({
      projectId:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-questo',
    });
  }

  const raw = serviceAccountOku();
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT veya FIREBASE_SERVICE_ACCOUNT_PATH tanımlı değil.',
    );
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
