import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function, которая делает пользователя администратором.
 * Эта функция должна вызываться только из Firebase Admin SDK.
 * Она проверяет, что вызывающий пользователь является администратором,
 * и устанавливает пользовательский claim `admin` для целевого пользователя.
 */
export const addAdminRole = functions.https.onCall(async (data, context) => {
  // 1. Проверка аутентификации
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Только авторизованные пользователи могут вызывать эту функцию."
    );
  }

  // 2. Проверка, является ли вызывающий пользователь администратором
  const callerUid = context.auth.uid;
  const callerUserDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerUserDoc.data();
  
  if (!callerData || !callerData.isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "У вас нет прав для выполнения этого действия."
    );
  }

  // 3. Проверка входных данных
  const { targetEmail } = data;
  if (!targetEmail || typeof targetEmail !== 'string') {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Требуется действительный email целевого пользователя."
    );
  }

  try {
    // 4. Поиск пользователя по email
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    const targetUid = userRecord.uid;

    // 5. Установка пользовательского claim `admin`
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });

    // 6. Обновление поля `isAdmin` в Firestore (опционально, но рекомендуется)
    await db.collection("users").doc(targetUid).update({
      isAdmin: true,
    });

    console.log(`Пользователь ${targetEmail} был назначен администратором.`);

    return { message: `Пользователь ${targetEmail} успешно назначен администратором.` };
  } catch (error) {
    console.error("Ошибка при назначении администратора:", error);
    if (error instanceof Error) {
      if (error.message.includes("There is no user record corresponding to this identifier")) {
        throw new functions.https.HttpsError(
          "not-found",
          "Пользователь с таким email не найден."
        );
      }
      throw new functions.https.HttpsError(
        "internal",
        "Произошла ошибка при назначении администратора."
      );
    }
    // Обработка других типов ошибок, если необходимо
    throw new functions.https.HttpsError(
      "internal",
      "Произошла неизвестная ошибка."
    );
  }
});
