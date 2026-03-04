import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Vercel 환경 변수 이름을 REACT_APP_ 계열로 통일합니다.
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,

  // 중요: authDomain을 Firebase 원본 주소로 고정하여 도메인 에러를 방지합니다.
  authDomain: "beaming-benefit-264610.firebaseapp.com",

  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: "beaming-benefit-264610.appspot.com",
  messagingSenderId: "403396575074",
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// 설정값이 비어있는지 확인하는 안전 장치입니다.
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase 설정값이 누락되었습니다. 환경 변수를 확인하세요.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;