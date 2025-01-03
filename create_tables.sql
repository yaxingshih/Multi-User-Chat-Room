CREATE TABLE "Users" (
    "UserID" VARCHAR(10) NOT NULL,
    "UserName" VARCHAR(20) NOT NULL,
    "CDTM" TIMESTAMP,
    "Email" VARCHAR(100),
    "Password" VARCHAR(50),
    CONSTRAINT "PK_USERS" PRIMARY KEY ("UserID")
);

CREATE TABLE "ChatGroup" (
    "GroupID" VARCHAR(20) NOT NULL,
    "GroupName" VARCHAR(30),
    "MAUID" VARCHAR(20),
    "CDTM" TIMESTAMP,
    "GroupType" CHAR(1),
    "Accepted" CHAR(1),
    "ADTM" TIMESTAMP,
    "LASTDTM" TIMESTAMP,
    "LASTMSGID" VARCHAR(20),
    CONSTRAINT "PK_CHATGROUP" PRIMARY KEY ("GroupID")
);

CREATE TABLE "ChatMember" (
    "GroupID" VARCHAR(20) NOT NULL,
    "UID" VARCHAR(20) NOT NULL,
    "ByUID" VARCHAR(20),
    "ByDTM" TIMESTAMP,
    "Accepted" CHAR(1),
    "UNAME" VARCHAR(20),  -- PostgreSQL uses VARCHAR for Unicode strings, not NVARCHAR
    CONSTRAINT "PK_CHATMEMBER" PRIMARY KEY ("GroupID", "UID")
);

-- Foreign key constraint with reference to the ChatGroup table
ALTER TABLE "ChatMember"
    ADD CONSTRAINT "FK_CHATMEMB_REFERENCE_CHATGROU"
    FOREIGN KEY ("GroupID") REFERENCES "ChatGroup" ("GroupID");

CREATE TABLE "ChatMsg" (
    "MSGID" VARCHAR(20) NOT NULL,
    "GroupID" VARCHAR(20),
    "DTM" TIMESTAMP,
    "UID" VARCHAR(20),
    "MSG" TEXT,  -- PostgreSQL uses TEXT instead of NVARCHAR(MAX) for large strings
    "FLAG" CHAR(1),
    "FromMSGID" VARCHAR(20),
    "IsVote" CHAR(1),
    "VoteFrom" TIMESTAMP,
    "VoteTo" TIMESTAMP,
    CONSTRAINT "PK_CHATMSG" PRIMARY KEY ("MSGID")
);

-- Foreign key constraint with reference to the ChatGroup table
ALTER TABLE "ChatMsg"
    ADD CONSTRAINT "FK_CHATMSG_REFERENCE_CHATGROU"
    FOREIGN KEY ("GroupID") REFERENCES "ChatGroup" ("GroupID");

CREATE TABLE "ChatRead" (
    "MSGID" VARCHAR(20) NOT NULL,
    "ReadUID" VARCHAR(20) NOT NULL,
    "ReadDTM" TIMESTAMP,
    "Status" CHAR(1),
    "Vote" CHAR(1),
    "VoteDTM" TIMESTAMP,
    "FLAG" CHAR(1),
    CONSTRAINT "PK_CHATREAD" PRIMARY KEY ("MSGID", "ReadUID")
);

-- Foreign key constraint with reference to the ChatMsg table
ALTER TABLE "ChatRead"
    ADD CONSTRAINT "FK_CHATREAD_REFERENCE_CHATMSG"
    FOREIGN KEY ("MSGID") REFERENCES "ChatMsg" ("MSGID");


