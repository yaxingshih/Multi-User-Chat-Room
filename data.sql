INSERT INTO "Users" ("UserID", "UserName", "CDTM", "Email", "Password")
VALUES
    ('admin', 'Admin', '2025-01-01 00:00:00', 'yaxing213@gmail.com', '12345'),
    ('evelyn', 'Evelyn', '2025-01-01 00:00:00', NULL, '12345');

INSERT INTO "ChatMember" ("GroupID", "UID", "ByUID", "ByDTM", "Accepted", "UNAME")
VALUES
    ('0HOE2FPTCH8P005SZBRJ', 'admin', 'ADMIN', '2024-08-27 23:15:02', '1', 'Admin'),
    ('0HOE2FPTCH8P005SZBRJ', 'evelyn', 'ADMIN', '2024-08-27 23:15:02', '1', 'Evelyn');

INSERT INTO "ChatGroup" ("GroupID", "GroupName", "MAUID", "CDTM", "GroupType", "Accepted", "ADTM", "LASTDTM", "LASTMSGID")
VALUES
    ('0HOE2FPTCH8P005SZBRJ', NULL, NULL, '2024-08-27 23:15:02', '1', '0', NULL, '2024-10-09 10:25:59', 'iY9KyDIFSOAGLy7RB2e4');

INSERT INTO "ChatMsg" ("MSGID", "GroupID", "DTM", "UID", "MSG", "FLAG", "FromMSGID", "IsVote", "VoteFrom", "VoteTo")
VALUES
    ('iY9KyDIFSOAGLy7RB2e4', '0HOE2FPTCH8P005SZBRJ', '2024-10-09 10:25:59', 'admin', '回應', NULL, NULL, NULL, NULL, NULL),
    ('KYjwOVrKcbAxPtG3SV3l', '0HOE2FPTCH8P005SZBRJ', '2024-10-09 10:16:06', 'evelyn', 'HELLO', NULL, NULL, NULL, NULL, NULL);

INSERT INTO "ChatRead" ("MSGID", "ReadUID", "ReadDTM", "Status", "Vote", "VoteDTM", "FLAG")
VALUES
    ('iY9KyDIFSOAGLy7RB2e4', 'ADMIN', '2024-10-09 10:25:59', '1', NULL, NULL, NULL),
    ('iY9KyDIFSOAGLy7RB2e4', 'N01', '2024-10-09 02:27:44', '1', NULL, NULL, NULL),
    ('KYjwOVrKcbAxPtG3SV3l', 'ADMIN', '2024-10-09 02:16:21', '1', NULL, NULL, NULL),
    ('KYjwOVrKcbAxPtG3SV3l', 'N01', '2024-10-09 10:16:06', '1', NULL, NULL, NULL);
