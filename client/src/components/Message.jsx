import React from 'react';
import './Message.css';
import { useUser } from '../context/UserContext';

const Message = ({ MSGID, GroupID, DTM, UID, MSG, CLASS, FormattedDTM, DT }) => {
  const formatDate = (dateString) => {
    // 直接取前 10 個字元
    return dateString.substring(0, 10);
  };
  
  if (!MSGID) {
    return (
      <li id={DT}>
        <div style={{ textAlign: 'center' }}>
        <span className="message__DTtag">{formatDate(DTM)}</span>
        </div>
      </li>
    );
  }
  const { userId } = useUser();
  if (UID == userId) {
    return (
      <li className={`${CLASS}__message`} title={MSGID}>
          <div className="message__block">
              <span className="message__time">
                  {FormattedDTM}
              </span>
              <div className="message__content">{MSG}</div>
          </div>
      </li>
    )
  }
  return (
    <li className={`${CLASS}__message`}>
        <div className="message__block">
            <div className="message__usericon">
                <img src={`/assets/userIcon/${UID}.jpg`} alt="" className="messageusericon__img"/>
                <span>{UID}</span>
            </div>
            <div class="message__content">{MSG}</div>
            <div class="message__time">{FormattedDTM}</div>
        </div>
    </li>
  );
};

export default Message;
