const express = require('express');
const db = require('../services/database');
const router = express.Router();

// 假設這是你的 PostgreSQL 查詢語句
async function loadUserChatRooms(userid) {
  const query = `
    SELECT * FROM (
      SELECT "ChatGroup"."GroupID", "ChatGroup"."GroupName","ChatGroup"."LASTMSGID","ChatGroup"."LASTDTM"
      FROM "ChatGroup"
      INNER JOIN "ChatMember" ON "ChatGroup"."GroupID" = "ChatMember"."GroupID"
      WHERE "ChatMember"."UID" = $1
      ORDER BY "ChatGroup"."LASTDTM" DESC
    ) AS chatRooms
  `;
  
  const result = await db.query(query, [userid]);
  return result.rows;
}

// 取得聊天室清單 API
router.get('/chatRooms/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatRooms = await loadUserChatRooms(userId);
    res.json(chatRooms);
    console.log(chatRooms);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching chat rooms');
  }
});

module.exports = router;
