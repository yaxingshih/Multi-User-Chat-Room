const express = require('express');
const db = require('../services/database');
const router = express.Router();

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
    //const userId = req.params.userId;
    const userId = req.userId;
    const chatRooms = await loadUserChatRooms(userId);
    res.json(chatRooms);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching chat rooms');
  }
});

async function loadRoomsDetails({userId, roomId}) {
  const query = `
    SELECT STRING_AGG("UID", '/') AS "partnerUID", 
          COUNT(*) AS "peopleCnt", 
          MAX("ChatGroup"."GroupName") AS "GroupName"
    FROM "ChatMember"
    INNER JOIN "ChatGroup" 
            ON "ChatGroup"."GroupID" = "ChatMember"."GroupID"
    WHERE "ChatMember"."GroupID" = $2
      AND "UID" <> $1
    GROUP BY "ChatMember"."GroupID"
  `;
  
  const result = await db.query(query,  [userId, roomId]);
  return result.rows;
}

router.get('/roomDetails/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.userId;
    const roomDetails = await loadRoomsDetails({userId,roomId});
    res.json(roomDetails);
    console.log(roomDetails);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching room details');
  }
});

async function loadChatMsg({userId, roomId}) {
  const query = `
    WITH MessagesWithDates AS (
      SELECT 
          "MSGID", 
          "GroupID", 
          "DTM", 
          "DTM" AS "DT", 
          "UID", 
          "MSG",
          TO_CHAR("DTM", 'HH12:MI AM') AS "FormattedDTM",
          CASE 
              WHEN "UID" = $1 THEN 'my' 
              ELSE 'other' 
          END AS "CLASS",
          LAG(DATE("DTM")) OVER (ORDER BY "DTM") AS "PrevDate",
          DATE("DTM") AS "CurrentDate"
      FROM "ChatMsg"
      WHERE "GroupID" = $2
        AND "DTM" BETWEEN CURRENT_DATE - INTERVAL '365 days'
                      AND CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
    )
    SELECT 
        "MSGID", 
        "GroupID", 
        "DTM", 
        "UID", 
        "MSG", 
        "CLASS", 
        "FormattedDTM", 
        "DT"
    FROM MessagesWithDates
    UNION ALL
    SELECT 
        NULL AS "MSGID", 
        "GroupID", 
        "CurrentDate" AS "DTM", 
        NULL AS "UID", 
        NULL AS "MSG", 
        NULL AS "CLASS", 
        NULL AS "FormattedDTM", 
        NULL AS "DT"
    FROM MessagesWithDates
    WHERE ("PrevDate" IS NULL OR "CurrentDate" <> "PrevDate")
      AND "DTM" BETWEEN CURRENT_DATE - INTERVAL '365 days'
                    AND CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
    ORDER BY "DTM"

  `;
  
  const result = await db.query(query,  [userId, roomId]);
  return result.rows;
}

router.get('/chatMsg/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.userId;
    const chatMsg = await loadChatMsg({userId,roomId});
    res.json(chatMsg);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching chat msg');
  }
});

module.exports = router;
