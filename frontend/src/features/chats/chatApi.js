import api from "../../services/api";

export function fetchProjectChatsApi(projectId) {
  return api.get("/chats", { params: { projectId } });
}

export function fetchChatMessagesApi(chatId, params = {}) {
  return api.get(`/chats/${chatId}/messages`, { params });
}

export function sendChatMessageApi(chatId, body) {
  return api.post(`/chats/${chatId}/messages`, body);
}

export function markChatReadApi(chatId) {
  return api.post(`/chats/${chatId}/read`);
}

export function createPrivateChatApi(userId, projectId) {
  return api.post("/chats/private", { userId, projectId });
}

export function createGroupChatApi(name, participantIds, projectId) {
  return api.post("/chats/group", { name, participantIds, projectId });
}

export function deleteMessageApi(chatId, messageId) {
  return api.delete(`/chats/${chatId}/messages/${messageId}`);
}

export function deleteChatApi(chatId) {
  return api.delete(`/chats/${chatId}`);
}
