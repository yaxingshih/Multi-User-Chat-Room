import axios from 'axios';

// 建立 Axios 實例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // 固定的基底 URL
});

export const fetchChatRooms = async (userId) => {
  try {
    const response = await apiClient.get(`/chatRooms/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};
export const fetchRoomDetails = async (roomId) => {
    try {
      const response = await apiClient.get(`/roomDetails/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error;
    }
};
export const fetchChatMsg = async (roomId) => {
    try {
      const response = await apiClient.get(`/chatMsg/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat Msg:', error);
      throw error;
    }
};