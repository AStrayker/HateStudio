import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Убедимся, что приложение Firebase инициализируется только один раз.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud Function, которая обновляет роль пользователя (админ, подписчик, пользователь).
 * Эта функция должна вызываться только аутентифицированным администратором.
 */
export const updateUserRole = functions.https.onCall(async (data, context) => {
  // 1. Проверка аутентификации вызывающего пользователя
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
  const { targetUid, newRole } = data; // Теперь ожидаем targetUid и newRole
  if (!targetUid || typeof newRole !== 'string' || !['admin', 'user', 'subscriber'].includes(newRole)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Необходимо предоставить targetUid и действительную роль (admin, user, subscriber)."
    );
  }

  try {
    // 4. Получаем текущие данные целевого пользователя
    const userRecord = await admin.auth().getUser(targetUid);

    // 5. Устанавливаем пользовательский claim 'admin' в Firebase Authentication
    // Только если новая роль - 'admin', устанавливаем claim в true, иначе в false.
    await admin.auth().setCustomUserClaims(targetUid, { admin: newRole === 'admin' });

    // 6. Обновляем поле 'role' и 'isAdmin' в Firestore для целевого пользователя
    const userRef = db.collection("users").doc(targetUid);
    await userRef.set({
      role: newRole,
      isAdmin: newRole === 'admin' // Обновляем isAdmin в Firestore в соответствии с ролью
    }, { merge: true }); // Используем merge, чтобы не перезаписывать другие поля

    console.log(`Роль пользователя ${targetUid} обновлена на: ${newRole}.`);

    return { message: `Роль пользователя ${userRecord.email || targetUid} успешно обновлена на: ${newRole}.` };
  } catch (error) {
    console.error("Ошибка при обновлении роли пользователя:", error);
    if (error instanceof Error) {
      if (error.message.includes("There is no user record corresponding to this identifier")) {
        throw new functions.https.HttpsError(
          "not-found",
          "Пользователь с таким UID не найден."
        );
      }
      throw new functions.https.HttpsError(
        "internal",
        "Произошла ошибка при обновлении роли пользователя."
      );
    }
    throw new functions.https.HttpsError(
      "internal",
      "Произошла неизвестная ошибка."
    );
  }
});
