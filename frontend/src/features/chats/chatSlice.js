import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logout, getMe, login } from "../auth/authSlice";
import {
  fetchProjectChatsApi,
  fetchChatMessagesApi,
  sendChatMessageApi,
  markChatReadApi,
  createPrivateChatApi,
  createGroupChatApi,
  deleteMessageApi,
  deleteChatApi,
} from "./chatApi";
import { mergeMessagesById } from "../../utils/chatReceipts";

function pickApiError(err, fallback) {
  const d = err.response?.data;
  if (!d) return fallback;
  return d.error || d.message || fallback;
}

export const fetchProjectChats = createAsyncThunk(
  "chats/fetchProjectChats",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await fetchProjectChatsApi(projectId);
      const payload = res.data?.chats ?? res.data;
      const chats = Array.isArray(payload) ? payload : [];
      return { projectId, chats };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Failed to load chats"));
    }
  },
);

export const fetchChatMessages = createAsyncThunk(
  "chats/fetchMessages",
  async ({ chatId, before }, { rejectWithValue }) => {
    try {
      const res = await fetchChatMessagesApi(chatId, { before, limit: 40 });
      return { chatId, ...res.data };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Failed to load messages"));
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "chats/sendMessage",
  async ({ chatId, content, clientMessageId }, { rejectWithValue }) => {
    try {
      const res = await sendChatMessageApi(chatId, { content, clientMessageId });
      return { chatId, message: res.data };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Send failed"));
    }
  },
);

export const markChatRead = createAsyncThunk(
  "chats/markRead",
  async (chatId, { rejectWithValue, getState }) => {
    try {
      await markChatReadApi(chatId);
      const me = getState().auth.user?._id;
      return {
        chatId,
        readerId: me ? String(me) : null,
        readAt: new Date().toISOString(),
      };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Failed to mark read"));
    }
  },
);

export const createPrivateChat = createAsyncThunk(
  "chats/createPrivate",
  async ({ userId, projectId }, { rejectWithValue }) => {
    try {
      const res = await createPrivateChatApi(userId, projectId);
      return res.data;
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Could not start chat"));
    }
  },
);

export const createGroupChat = createAsyncThunk(
  "chats/createGroup",
  async ({ name, participantIds, projectId }, { rejectWithValue }) => {
    try {
      const res = await createGroupChatApi(name, participantIds, projectId);
      return res.data;
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Could not create group"));
    }
  },
);

export const deleteMessage = createAsyncThunk(
  "chats/deleteMessage",
  async ({ chatId, messageId }, { rejectWithValue }) => {
    try {
      const res = await deleteMessageApi(chatId, messageId);
      return { chatId, message: res.data };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Could not delete message"));
    }
  },
);

export const deleteChat = createAsyncThunk(
  "chats/deleteChat",
  async (chatId, { rejectWithValue }) => {
    try {
      await deleteChatApi(chatId);
      return { chatId };
    } catch (err) {
      return rejectWithValue(pickApiError(err, "Could not delete chat"));
    }
  },
);

function chatKind(c) {
  return c.kind || (c.isGroup ? "group" : "direct");
}

function sortChats(chats) {
  return [...chats].sort((a, b) => {
    if (chatKind(a) === "project") return -1;
    if (chatKind(b) === "project") return 1;
    const ta = new Date(a.lastMessageAt || a.updatedAt).getTime();
    const tb = new Date(b.lastMessageAt || b.updatedAt).getTime();
    return tb - ta;
  });
}

function upsertChat(chats, chat) {
  const id = chat._id;
  const idx = chats.findIndex((c) => String(c._id) === String(id));
  const next = idx >= 0 ? [...chats] : [...chats, chat];
  if (idx >= 0) next[idx] = { ...next[idx], ...chat };
  return sortChats(next);
}

function defaultBucket() {
  return { items: [], readReceipts: {}, hasMore: true, loading: false };
}

const initialState = {
  projectId: null,
  chats: [],
  activeChatId: null,
  messagesByChatId: {},
  listLoading: false,
  listError: null,
  sendError: null,
  /** Another member started a chat voice session — prompt to join ({ chatId, meetingId }). */
  incomingVoiceInvite: null,
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setActiveChat(state, action) {
      state.activeChatId = action.payload;
    },
    clearChatUi(state) {
      state.chats = [];
      state.activeChatId = null;
      state.messagesByChatId = {};
      state.projectId = null;
      state.listError = null;
      state.sendError = null;
      state.incomingVoiceInvite = null;
    },
    setIncomingVoiceInvite(state, action) {
      const { chatId, meetingId } = action.payload || {};
      if (!chatId || !meetingId) return;
      state.incomingVoiceInvite = { chatId: String(chatId), meetingId: String(meetingId) };
    },
    clearIncomingVoiceInvite(state) {
      state.incomingVoiceInvite = null;
    },
    receiveSocketMessage(state, action) {
      const { chatId, message } = action.payload;
      if (!chatId || !message?._id) return;
      const key = String(chatId);
      const bucket = state.messagesByChatId[key] || defaultBucket();
      bucket.items = mergeMessagesById(bucket.items, [message]);
      state.messagesByChatId[key] = { ...bucket };

      const i = state.chats.findIndex((c) => String(c._id) === key);
      if (i >= 0 && !message.deletedAt) {
        const c = { ...state.chats[i] };
        c.lastMessageText = message.content?.slice(0, 200) || c.lastMessageText;
        c.lastMessageAt = message.createdAt || new Date().toISOString();
        state.chats = sortChats([...state.chats.slice(0, i), ...state.chats.slice(i + 1), c]);
      }
    },
    receiveInboxPreview(state, action) {
      const p = action.payload;
      const chatId = p.chatId;
      if (!chatId) return;
      const i = state.chats.findIndex((c) => String(c._id) === String(chatId));
      if (i < 0) return;
      const c = { ...state.chats[i] };
      if (p.lastMessageText != null) c.lastMessageText = p.lastMessageText;
      if (p.lastMessageAt) c.lastMessageAt = p.lastMessageAt;
      if (p.bumpUnread) c.unreadCount = (c.unreadCount || 0) + 1;
      state.chats = sortChats([...state.chats.slice(0, i), ...state.chats.slice(i + 1), c]);
    },
    receiveMessageStatus(state, action) {
      const { chatId, messageId, deliveredTo, receiptStatus } = action.payload;
      const key = String(chatId);
      const bucket = state.messagesByChatId[key];
      if (!bucket) return;
      bucket.items = bucket.items.map((m) => {
        if (String(m._id) !== String(messageId)) return m;
        return {
          ...m,
          deliveredTo: deliveredTo ?? m.deliveredTo,
          receiptStatus: receiptStatus ?? m.receiptStatus,
        };
      });
    },
    receiveReadUpdated(state, action) {
      const { chatId, readerId, readAt } = action.payload;
      const key = String(chatId);
      const bucket = state.messagesByChatId[key];
      if (!bucket || !readerId) return;
      bucket.readReceipts = { ...bucket.readReceipts, [String(readerId)]: readAt };
    },
    receiveMessageDeleted(state, action) {
      const { chatId, message } = action.payload;
      const key = String(chatId);
      const bucket = state.messagesByChatId[key];
      if (!bucket || !message?._id) return;
      bucket.items = bucket.items.map((m) =>
        String(m._id) === String(message._id) ? { ...m, ...message, content: "", deletedAt: message.deletedAt, isDeleted: true } : m,
      );
    },
    removeChatFromList(state, action) {
      const chatId = String(action.payload.chatId);
      state.chats = state.chats.filter((c) => String(c._id) !== chatId);
      delete state.messagesByChatId[chatId];
      if (String(state.activeChatId) === chatId) state.activeChatId = null;
    },
  },
  extraReducers: (builder) => {
    const reset = () => ({ ...initialState });

    builder
      .addCase(logout.fulfilled, reset)
      .addCase(logout.rejected, reset)
      .addCase(getMe.rejected, reset)
      .addCase(login.fulfilled, reset)

      .addCase(fetchProjectChats.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchProjectChats.fulfilled, (state, action) => {
        state.listLoading = false;
        state.projectId = action.payload.projectId;
        state.chats = sortChats(action.payload.chats);
        if (state.activeChatId && !state.chats.some((c) => String(c._id) === String(state.activeChatId))) {
          state.activeChatId = null;
        }
      })
      .addCase(fetchProjectChats.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload || "Error";
      })

      .addCase(fetchChatMessages.pending, (state, action) => {
        const { chatId } = action.meta.arg;
        const key = String(chatId);
        const prev = state.messagesByChatId[key] || defaultBucket();
        state.messagesByChatId[key] = { ...prev, loading: true };
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        const { chatId, messages, hasMore, readReceipts } = action.payload;
        const key = String(chatId);
        const prev = state.messagesByChatId[key] || defaultBucket();
        const before = action.meta.arg.before;
        const nextReceipts = { ...prev.readReceipts, ...(readReceipts || {}) };
        const merged = before
          ? mergeMessagesById(messages, prev.items)
          : mergeMessagesById(prev.items, messages);
        state.messagesByChatId[key] = {
          items: merged,
          readReceipts: nextReceipts,
          hasMore,
          loading: false,
        };
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        const { chatId } = action.meta.arg;
        const key = String(chatId);
        const prev = state.messagesByChatId[key] || defaultBucket();
        state.messagesByChatId[key] = { ...prev, loading: false };
      })

      .addCase(sendChatMessage.pending, (state, action) => {
        state.sendError = null;
        const { chatId, content, clientMessageId, sender } = action.meta.arg;
        const key = String(chatId);
        const bucket = state.messagesByChatId[key] || defaultBucket();
        const optimistic = {
          _id: `temp-${clientMessageId}`,
          chat: chatId,
          sender: sender || { _id: "", name: "" },
          content,
          createdAt: new Date().toISOString(),
          status: "sent",
          receiptStatus: "sent",
          clientMessageId,
        };
        state.messagesByChatId[key] = {
          ...bucket,
          items: mergeMessagesById(bucket.items, [optimistic]),
        };
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendError = null;
        const { chatId, message } = action.payload;
        const key = String(chatId);
        const bucket = state.messagesByChatId[key];
        if (!bucket) return;
        const cid = message.clientMessageId;
        const withoutTemp = bucket.items.filter((m) => {
          if (String(m._id) === String(message._id)) return false;
          if (cid && m._id === `temp-${cid}`) return false;
          return true;
        });
        state.messagesByChatId[key] = {
          ...bucket,
          items: mergeMessagesById(withoutTemp, [message]),
        };
        const idx = state.chats.findIndex((c) => String(c._id) === key);
        if (idx >= 0) {
          const c = { ...state.chats[idx] };
          c.lastMessageText = message.content?.slice(0, 200);
          c.lastMessageAt = message.createdAt;
          state.chats = sortChats([...state.chats.slice(0, idx), ...state.chats.slice(idx + 1), c]);
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendError = action.payload || "Send failed";
        const { chatId, clientMessageId } = action.meta.arg;
        const key = String(chatId);
        const bucket = state.messagesByChatId[key];
        if (bucket && clientMessageId) {
          bucket.items = bucket.items.filter((m) => m._id !== `temp-${clientMessageId}`);
        }
      })

      .addCase(markChatRead.fulfilled, (state, action) => {
        const { chatId, readerId, readAt } = action.payload;
        const key = String(chatId);
        const i = state.chats.findIndex((c) => String(c._id) === key);
        if (i < 0) return;
        const c = { ...state.chats[i], unreadCount: 0 };
        state.chats = [...state.chats.slice(0, i), c, ...state.chats.slice(i + 1)];
        const bucket = state.messagesByChatId[key];
        if (bucket && readerId && readAt) {
          bucket.readReceipts = { ...bucket.readReceipts, [readerId]: readAt };
        }
      })

      .addCase(createPrivateChat.fulfilled, (state, action) => {
        state.chats = upsertChat(state.chats, action.payload);
        state.activeChatId = action.payload._id;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.chats = upsertChat(state.chats, action.payload);
        state.activeChatId = action.payload._id;
      })

      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        const key = String(chatId);
        const bucket = state.messagesByChatId[key];
        if (!bucket) return;
        bucket.items = bucket.items.map((m) => (String(m._id) === String(message._id) ? { ...m, ...message } : m));
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        const id = String(action.payload.chatId);
        state.chats = state.chats.filter((c) => String(c._id) !== id);
        delete state.messagesByChatId[id];
        if (String(state.activeChatId) === id) state.activeChatId = null;
      });
  },
});

export const {
  setActiveChat,
  clearChatUi,
  setIncomingVoiceInvite,
  clearIncomingVoiceInvite,
  receiveSocketMessage,
  receiveInboxPreview,
  receiveMessageStatus,
  receiveReadUpdated,
  receiveMessageDeleted,
  removeChatFromList,
} = chatSlice.actions;

export default chatSlice.reducer;
