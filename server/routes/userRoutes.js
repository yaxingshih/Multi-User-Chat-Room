const { express, https, socketIo, cors, crypto, sql, moment, webpush } = require('./modules'); 
const { dbConfig, sslOptions, vapidKeys } = require('./config');
const app = express();

webpush.setVapidDetails(
    'mailto:yaxing.igms@gmail.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);
const subscriptions = {};
const server = https.createServer(sslOptions, app);

app.get('/', (req, res) => {
    res.send('chat server');
});

const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}));

const users = {};

io.on('connection', (socket) => {
    
    socket.on('subscribe', (subscription) => {
        if (socket.userid) {
            subscriptions[socket.userid] = subscription;
            //console.log(`訂閱資訊已儲存：${socket.userid}`);
        } else {
            //console.log('用戶名尚未設置，無法儲存訂閱資訊');
        }
    });

    async function loadUserChatRooms(userid) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);
        const query = `
            SELECT * FROM (
                SELECT ChatMember.GroupID, ChatMember.UID, UNAME AS Name, ChatMsg.MSG AS LASTMSG,
                    CONVERT(VARCHAR, ChatGroup.LASTDTM, 120) AS LASTDTM, GroupType, 1 AS Cnt, 
                    ISNULL(ChatRead.Status, 1) AS isRead
                FROM ChatMember
                INNER JOIN ChatGroup ON ChatGroup.GroupID = ChatMember.GroupID
                INNER JOIN (
                    SELECT G.GroupID
                    FROM ChatGroup G
                    INNER JOIN ChatMember M ON G.GroupID = M.GroupID
                    WHERE GroupType = '1' AND UID = @UID
                ) UserInGroup ON UserInGroup.GroupID = ChatMember.GroupID AND ChatMember.UID <> @UID
                LEFT JOIN ChatMsg ON ChatMsg.MSGID = ChatGroup.LASTMSGID
                LEFT JOIN ChatRead ON ChatRead.MSGID = ChatGroup.LASTMSGID AND ChatRead.ReadUID = @UID
    
                UNION
    
                SELECT ChatMember.GroupID, STRING_AGG(ChatMember.UID, '/') AS UID, MAX(ChatGroup.GroupName) as Name,
                    MAX(ChatMsg.MSG) as LASTMSG, MAX(CONVERT(VARCHAR, ChatGroup.LASTDTM, 120)) AS LASTDTM, 
                    MAX(ChatGroup.GroupType) AS GroupType, count(*) as Cnt, MAX(ISNULL(ChatRead.Status, 1)) AS isRead
                FROM ChatMember
                INNER JOIN ChatGroup ON ChatGroup.GroupID = ChatMember.GroupID
                INNER JOIN (
                    SELECT DISTINCT G.GroupID
                    FROM ChatGroup G
                    INNER JOIN ChatMember M ON G.GroupID = M.GroupID
                    WHERE GroupType = '2' AND UID = @UID
                ) UserInGroup ON UserInGroup.GroupID = ChatMember.GroupID
                LEFT JOIN ChatMsg ON ChatMsg.MSGID = ChatGroup.LASTMSGID
                LEFT JOIN ChatRead ON ChatRead.MSGID = ChatGroup.LASTMSGID AND ChatRead.ReadUID = @UID
                GROUP BY ChatMember.GroupID
            ) allList
            ORDER BY LASTDTM DESC
        `;
        const result = await request.input('UID', sql.VarChar(20), userid).query(query);
    
        return result.recordset;
    }

    async function updateUserChatList(userid, socket) {

        const chatRooms = await loadUserChatRooms(userid);

        if (!users[userid]) {
            users[userid] = { sockets: new Set(), rooms: new Set() };
        }
        chatRooms.forEach(row => users[userid].rooms.add(row.GroupID));
    
        // 發送聊天室清單到前端
        socket.emit('chat list', chatRooms);
    }

    socket.on('set userid', async (userid) => {
        if (!users[userid]) {
            users[userid] = { sockets: new Set(), rooms: new Set() };
        }
        users[userid].sockets.add(socket.id);
        socket.userid = userid; 

        if (!subscriptions[userid]) {
            socket.emit('subscribe');
        }

        io.emit('user status', { userid, status: 'online' });
    });
    
    socket.on('get chatlist', async(userid) => {
        await updateUserChatList(userid, socket);
    });

    socket.on('check user online', (userid, callback) => {
        const isOnline = !!users[userid] && users[userid].sockets.size > 0;
        callback(isOnline);
    });
    
    socket.on('join room', async(roomName) => {
        const userid = getUseridBySocketId(socket.id);
        if (userid) {
            if (!users[userid].activeRooms) {
                users[userid].activeRooms = new Set();
            }
            users[userid].activeRooms.add(roomName);

            socket.join(roomName);
            users[userid].rooms.add(roomName);
            
            const onlineRoomUsers = getOnlineRoomUsers(roomName);

            io.to(roomName).emit('user list', onlineRoomUsers); // 更新房間內的用戶列表
            socket.emit('room users', onlineRoomUsers); 
            
            await notifyOnlineMessageSender({userid, roomName, onlineRoomUsers});
            await readAllMessageByRoom({ userid, roomName });
        }
    });

    socket.on('update msg read status', (userid, callback) => {
        const isOnline = !!users[userid] && users[userid].sockets.size > 0;
        callback(isOnline);
    });

    let pool;

    async function getSqlPool() {
        if (!pool) {
            pool = await sql.connect(dbConfig);
        }
        return pool;
    }

    // 儲存聊天訊息的函數
    async function saveChatMessage({ MSGID, roomName, dbTimestamp, message, userid }) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);

        const query = 
            `INSERT INTO ChatMsg (MSGID, GroupID, DTM, MSG, UID)
            VALUES (@MSGID, @GroupID, @DTM, @MSG, @UID)`;

        await request
            .input('MSGID', sql.VarChar(20), MSGID)
            .input('GroupID', sql.VarChar(20), roomName)
            .input('DTM', sql.DateTime, dbTimestamp)
            .input('MSG', sql.NVarChar(sql.MAX), message)
            .input('UID', sql.VarChar(20), userid)
            .query(query);
    }

    // 更新聊天群組的函數
    async function updateChatGroup({ roomName, dbTimestamp, MSGID }) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);

        const query = 
            `UPDATE ChatGroup 
            SET LASTDTM = @LASTDTM, LASTMSGID = @LASTMSGID
            WHERE GroupID = @GroupID`;

        await request
            .input('GroupID', sql.VarChar(20), roomName)
            .input('LASTDTM', sql.DateTime, dbTimestamp)
            .input('LASTMSGID', sql.VarChar(20), MSGID)
            .query(query);
    }

    async function InsertChatRead({ MSGID, roomName, userid, dbTimestamp }) {

        const pool = await getSqlPool();
        const request = new sql.Request(pool);
        const senderUserid = userid;

        let result = await pool.request()
            .input('roomName', sql.NVarChar, roomName)
            .query('SELECT UID FROM ChatMember WHERE GroupID = @roomName');

        // 針對每個撈取到的 userid 執行插入語法
        for (let row of result.recordset) {
            let userid = row.UID;
            const status = userid == senderUserid ? '1' : '0';
            const query = 
                `INSERT INTO ChatRead (MSGID, ReadUID, ReadDTM, Status)
                    VALUES (@MSGID, @ReadUID, @ReadDTM, @Status)`;
            // 在這裡執行您的 INSERT 語法
            await pool.request()
                .input('MSGID', sql.VarChar(20), MSGID)
                .input('ReadUID', sql.VarChar(20), userid)
                .input('ReadDTM', sql.DateTime, dbTimestamp)
                .input('Status', sql.Char(1), status)
                .query(query);
        }
    }
    
    async function sendPushNotification(subscription, message, userid, roomName) {
        
        const roomUrl = 'https://oa.igms.com.tw/msp?p=chat/room&roomid=' + roomName;
        const userName = await getUserName(userid);
        const payload = JSON.stringify({
            title: '您有新訊息!',
            body: `${userName}: ${message}  - 點擊此處: ${roomUrl}`
        });
        
       /*
        const roomUrl = 'https://oa.igms.com.tw/msp?p=chat/room&roomid=' + roomName;
    
        // 定義 payload，將 URL 放在 data 中
        const payload = JSON.stringify({
            title: '您有新訊息!',
            body: `${userid}: ${message}`,
            data: { // 將 URL 放入 data
                url: roomUrl
            }
        });
        */
        const options = {
            TTL: 60 * 60 * 24,
        };
        try {
            await webpush.sendNotification(subscription, payload, options)
            .then(response => {
                //console.log('Notification sent successfully:', response);
            })
            .catch(error => {
                console.error('Error sending notification:', error);
            });

        } catch (error) {
            console.error('推送通知發送失敗:', error);
        }
    }
    // 處理 chat message 事件
    socket.on('chat message', async ({ roomName, message }) => {
        const user = Object.keys(users).find(userid => users[userid].sockets.has(socket.id));
        
        if (!user || !users[user].rooms.has(roomName)) {
            return; 
        }
    
        const originalTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        //const dbTimestamp = new Date();
        //const dbTimestamp = moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
        //const dbTimestamp = moment().tz('Asia/Taipei').toDate();
        //const dbTimestamp = moment().tz('Asia/Taipei').utc().format('YYYY-MM-DDTHH:mm:ss');
        const dbTimestamp = moment().tz('Asia/Taipei').toDate();

        dbTimestamp.setHours(dbTimestamp.getHours() + 8);

        const MSGID = generateRandomString(20);
    
        try {
            await saveChatMessage({ MSGID, roomName, dbTimestamp, message, userid: user });
            await updateChatGroup({ roomName, dbTimestamp, MSGID });
            await InsertChatRead({ MSGID, roomName, userid: user, dbTimestamp });

            const roomUsers = getOnlineRoomUsers(roomName);
            await Promise.all(
                roomUsers
                    .filter(userid => userid !== user) // 排除自己
                    .map(userid => handleUserReadStatusAndNotification(userid, roomName, dbTimestamp, MSGID))
            );
    
        } catch (err) {
            console.error('資料庫操作錯誤:', err);
            socket.emit('error', '發生錯誤，請稍後再試');
            return;
        }
    
        io.to(roomName).emit('chat message', { userid: user, message, timestamp: originalTimestamp, MSGID});
        try {
            const roomUsers = await getDBRoomUsers(roomName);
            await Promise.all(roomUsers
                .filter(userid => userid !== user) // 排除自己
                .map(async userid => {
                    const subscription = subscriptions[userid];
                    if (subscription) {
                        await sendPushNotification(subscription, message, user, roomName);
                    }
                    console.log("getSocketIdsByUserid");
                    // const socketIds = getSocketIdsByUserid_test(userid);
                    // console.log("userid");
                    // console.log(userid);
                    // console.log("socketIds"+socketIds);
                    // if (socketIds.length > 0) { 
                    //     socketIds.forEach(socketId => {
                    //         io.to(socketId).emit('app chat notification', {
                    //             message,
                    //             userid,
                    //             roomName
                    //         });
                    //     });
                    // }
                    io.emit('app chat notification', {
                        message,
                        userid: user,
                        roomName
                    });
                    // const receviceUser = users[userid];
                    // if (receviceUser && receviceUser.sockets) {
                    //     receviceUser.sockets.forEach((socketId) => {
                    //         io.emit('app chat notification', {
                    //             message,
                    //             userid: user,
                    //             roomName
                    //         });
                    //         console.log(`Notification sent to user ${userid} with socket ID: ${socketId}`);
                    //     });
                    // } 
                    
                })
            );
        } catch (err) {
            console.error('推送通知發送失敗:', err);
        }
        try {
            // 針對在聊天室的所有使用者發送通知
            await Promise.all(Object.keys(users).map(userid => notifyUser(userid, roomName)));
        } catch (err) {
            console.error('通知更新失敗:', err);
        }
    });
    
    async function handleUserReadStatusAndNotification(userid, roomName, dbTimestamp, MSGID) {
        const sender = getUseridBySocketId(socket.id);
        const userSockets = Array.from(users[userid].sockets);
        const isInRoom = userSockets.some(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            return socket && socket.rooms.has(roomName);
        });
    
        if (isInRoom) {
            await updateChatRead({ roomName, userid, dbTimestamp });
            setReadStatusByMsg(sender, MSGID, roomName); 
        } 
    }
    
    // 通知使用者並更新聊天清單
    async function notifyUser(userid, roomName) {
        if (users[userid].rooms.has(roomName)) {
            const userSockets = Array.from(users[userid].sockets);
            await Promise.all(userSockets.map(async (socketId) => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    await updateUserChatList(userid, socket);
                    socket.emit('play notification sound');
                }
            }));
        }
    }
    

    
    async function updateChatRead({ roomName, userid, dbTimestamp }) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);

        const query = 
            `UPDATE ChatRead
             SET ChatRead.Status = '1', ReadDTM=@ReadDTM
             FROM ChatRead
             INNER JOIN ChatMsg ON ChatMsg.MSGID = ChatRead.MSGID
             WHERE ChatRead.ReadUID = @ReadUID
             AND ChatMsg.GroupID = @GroupID
             AND ChatRead.Status = '0'`;

        await request
            .input('GroupID', sql.VarChar(20), roomName)
            .input('ReadDTM', sql.DateTime, dbTimestamp)
            .input('ReadUID', sql.VarChar(20), userid)
            .query(query);
    }

    socket.on('read message', async ({ userid, roomName }) => {
        await readAllMessageByRoom({ userid, roomName });
    });

    async function readAllMessageByRoom({ userid, roomName }) {
        const dbTimestamp = new Date();
        if (userid) {
            try {
                await updateChatRead({ roomName, userid, dbTimestamp });
        
            } catch (err) {
                console.error('資料庫操作錯誤:', err);
            }
            socket.emit('remove message notification', roomName);
            
            
        }
    }

    async function notifyOnlineMessageSender({userid, roomName, onlineRoomUsers}) {
        
        const pool = await getSqlPool();
        const request = new sql.Request(pool);
        const usersList = onlineRoomUsers.map(user => `'${user}'`).join(', ');

        const query = 
            `SELECT ChatMsg.UID,ChatMsg.MSGID FROM ChatMsg 
            INNER JOIN ChatRead ON ChatMsg.MSGID=ChatRead.MSGID AND Status = 0
            WHERE ChatMsg.GroupID=@GroupID AND ReadUID=@ReadUID AND ChatMsg.UID IN (${usersList})
            ORDER BY UID`;

        const result = await request
            .input('GroupID', sql.VarChar(20), roomName)
            .input('ReadUID', sql.VarChar(20), userid)
            .query(query);


        result.recordset.forEach(row => {
            setReadStatusByMsg(row.UID, row.MSGID, roomName); 
        });

    }

    async function setReadStatusByMsg(UID, MSGID, roomName) {
        const socketIds = getActiveSocketIdsByUseridAndRoomid(UID, roomName);
        if (socketIds.length > 0) { 
            socketIds.forEach(socketId => {
                io.to(socketId).emit('set message read', MSGID); 
            });
        }
        
    }

    socket.on('disconnect', () => {
        const user = Object.keys(users).find(userid => users[userid].sockets.has(socket.id));
        
        if (user) {
            users[user].sockets.delete(socket.id);
            if (users[user].sockets.size === 0) {
                delete users[user];
            }

            io.emit('user status', { userid: user, status: 'offline' });
        }

        const userid = getUseridBySocketId(socket.id);
        if (userid && users[userid].activeRooms && users[userid].activeRooms.has(roomName)) {
            users[userid].activeRooms.delete(roomName);
            socket.leave(roomName);
            io.to(roomName).emit('user left', userid);
        }
    });
    

    // 獲取房間的用戶列表
    function getOnlineRoomUsers(roomName) {
        return Object.keys(users).filter(userid => users[userid].rooms.has(roomName));
    }

    async function getDBRoomUsers(roomName) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);
        const query = `
                SELECT ChatMember.UID as userid
                FROM ChatMember
                WHERE GroupID = @GroupID
        `;
        const result = await request.input('GroupID', sql.VarChar(20), roomName).query(query);

        return result.recordset.map(row => row.userid);

    }

    async function getUserName(userid) {
        const pool = await getSqlPool();
        const request = new sql.Request(pool);
        const query = `
                SELECT top 1 ChatMember.UNAME as UNAME
                FROM ChatMember
                WHERE UID = @UID
        `;
        const result = await request.input('UID', sql.VarChar(20), userid).query(query);

        if (result.recordset.length > 0) {
            const uname = result.recordset[0].UNAME;
            return uname; 
        } else {
            return null; 
        }
    }

    function getUseridBySocketId(socketId) {
        return Object.keys(users).find(userid => users[userid].sockets.has(socketId));
    }

    function getSocketIdsByUserid(userid) {
        const user = users[userid];
        if (user && user.sockets) {
            return Array.from(user.sockets); 
        }
        return []; 
    }

    function getActiveSocketIdsByUseridAndRoomid(userid, roomid) {
        const user = users[userid];
        const socketIds = [];
        if (user && user.activeRooms && user.activeRooms.has(roomid)) {  
            user.sockets.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);  
                if (socket && socket.rooms.has(roomid)) { 
                    socketIds.push(socketId);
                }
            });
        }
    
        return socketIds; 
    }

    function getSocketIdsByUserid_test(userid) {
        const user = users[userid];
        const socketIds = [];
        console.log(users);
        console.log(user);
        if (user){
            user.sockets.forEach(socketId => {
                socketIds.push(socketId);
            });
        }   
        
    
        return socketIds; 
    }

    function generateRandomString(length) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const bytes = crypto.randomBytes(length);
        return Array.from(bytes)
            .map(byte => charset[byte % charset.length])
            .join('');
    }

});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});