const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// 🟢 1. Like Post → เพิ่มแต้มเจ้าของโพสต์
exports.onLikePost = functions.https.onCall(async (data, context) => {
  const { postId, userId } = data;
  const postRef = db.collection("posts").doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) throw new functions.https.HttpsError("not-found", "Post not found.");

  const postOwner = postDoc.data().createdBy;
  await postRef.update({ likeCount: admin.firestore.FieldValue.increment(1) });

  await db.collection("users").doc(postOwner).update({
    point: admin.firestore.FieldValue.increment(5) // ✅ กำหนดแต้มที่ได้
  });
});

// 🔴 2. Dislike Post → หักแต้ม + ทุก 5 ครั้ง หักเพิ่ม 10%
exports.onDislikePost = functions.https.onCall(async (data, context) => {
  const { postId, userId } = data;
  const postRef = db.collection("posts").doc(postId);
  const postDoc = await postRef.get();
  if (!postDoc.exists) throw new functions.https.HttpsError("not-found", "Post not found.");

  const postData = postDoc.data();
  const postOwner = postData.createdBy;
  const dislikeHistory = postData.dislikeHistory || [];

  if (dislikeHistory.includes(userId)) {
    throw new functions.https.HttpsError("already-exists", "Already disliked.");
  }

  dislikeHistory.push(userId);
  const totalDislikes = (postData.dislikeCount || 0) + 1;
  const basePenalty = 5;
  const extraPenalty = Math.floor(totalDislikes / 5) * 0.1;
  const penalty = Math.floor(basePenalty * (1 + extraPenalty));

  await postRef.update({
    dislikeCount: totalDislikes,
    dislikeHistory,
  });

  await db.collection("users").doc(postOwner).update({
    point: admin.firestore.FieldValue.increment(-penalty)
  });
});

// 🕒 3. Cron เพิ่มแต้มอัตโนมัติทุก 10 ชม.
exports.onAutoPointReward = functions.pubsub
  .schedule("every 10 hours")
  .onRun(async () => {
    const usersSnap = await db.collection("users").get();
    const itemsSnap = await db.collection("items").get();

    const itemMap = {};
    itemsSnap.forEach(doc => itemMap[doc.id] = doc.data());

    const updates = [];

    usersSnap.forEach(userDoc => {
      const user = userDoc.data();
      let base = 0;
      let percent = 0;

      const theme = itemMap[user.equippedThemeId];
      const pet = itemMap[user.equippedPetId];

      if (theme && theme.effectType === "fixed") base += theme.effectValue;
      if (pet && pet.effectType === "percent") percent += pet.effectValue;

      const total = Math.floor(base * (1 + percent / 100));
      updates.push(userDoc.ref.update({ point: admin.firestore.FieldValue.increment(total) }));
    });

    return Promise.all(updates);
  });

// 🌏 4. Reveal Link (ลิงก์ต้องจ่ายแต้มครั้งแรก)
exports.onRevealLink = functions.https.onCall(async (data, context) => {
  const { userId, postId } = data;
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  const revealed = userDoc.data().revealedLinks || [];

  if (revealed.includes(postId)) return { alreadyPaid: true };

  await userRef.update({
    point: admin.firestore.FieldValue.increment(-3),
    revealedLinks: [...revealed, postId]
  });

  return { alreadyPaid: false };
});

// 🛍 5. ซื้อไอเทม
exports.onBuyItem = functions.https.onCall(async (data, context) => {
  const { userId, itemId } = data;
  const itemDoc = await db.collection("items").doc(itemId).get();
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  const item = itemDoc.data();
  const user = userDoc.data();

  if (user.point < item.price) throw new functions.https.HttpsError("failed-precondition", "Not enough points.");

  await userRef.update({
    point: user.point - item.price,
    purchasedItems: [...(user.purchasedItems || []), itemId]
  });

  await db.collection("transactions").add({
    userId,
    itemId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    type: item.type
  });
});

// 💰 6. ซื้อแต้ม (ใช้สำหรับร้านค้า)
exports.onBuyPoint = functions.https.onCall(async (data, context) => {
  const { userId, amount } = data;
  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    point: admin.firestore.FieldValue.increment(amount)
  });
});
