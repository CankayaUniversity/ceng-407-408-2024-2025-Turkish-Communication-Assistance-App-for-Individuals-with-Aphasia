const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onHelpRequestUpdate = functions.firestore
  .document('users/{caregiverId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Eğer helpRequest alanı false'dan true'ya geçtiyse veya yoktan true'ya geçtiyse bildirim gönder
    if (
      (beforeData.helpRequest === false || beforeData.helpRequest === undefined) &&
      afterData.helpRequest === true
    ) {
      const pushToken = afterData.pushToken;
      if (!pushToken) {
        console.log("Bakıcı pushToken bulunamadı, bildirim gönderilemedi.");
        return null;
      }

      // FCM'ye gönderilecek mesaj
      const message = {
        token: pushToken,
        notification: {
          title: "Acil Durum",
          body: "Hastanızın size ihtiyacı var!",
        },
        data: {
          caretakerId: context.params.caregiverId,
        }
      };

      try {
        const response = await admin.messaging().send(message);
        console.log("Yardım isteği bildirimi gönderildi:", response);
      } catch (error) {
        console.error("Bildirimi gönderirken hata:", error);
      }
    }

    return null;
  });
