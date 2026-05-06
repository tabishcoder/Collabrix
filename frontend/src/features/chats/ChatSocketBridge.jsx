import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { store } from "../../app/store";
import { getSocket } from "../../services/socket";
import {
  fetchChatMessages,
  receiveInboxPreview,
  receiveMessageDeleted,
  receiveMessageStatus,
  receiveReadUpdated,
  receiveSocketMessage,
  removeChatFromList,
} from "./chatSlice";

export default function ChatSocketBridge() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const userId = useSelector((s) => s.auth.user?._id);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    const socket = getSocket();

    const resyncActiveChat = () => {
      const st = store.getState();
      const cid = st.chats.activeChatId;
      if (cid) dispatch(fetchChatMessages({ chatId: cid }));
    };

    const onMessage = (data) => {
      if (!data?.message) return;
      dispatch(
        receiveSocketMessage({
          chatId: data.chatId,
          message: data.message,
        }),
      );
    };

    const onInbox = (data) => {
      if (!data?.chatId) return;
      const st = store.getState();
      const active = st.chats.activeChatId;
      const me = st.auth.user?._id;
      const bump =
        data.senderId &&
        String(data.senderId) !== String(me) &&
        String(data.chatId) !== String(active);
      dispatch(receiveInboxPreview({ ...data, bumpUnread: bump }));
    };

    const onMessageStatus = (data) => {
      if (!data?.chatId || !data?.messageId) return;
      dispatch(receiveMessageStatus(data));
    };

    const onReadUpdated = (data) => {
      if (!data?.chatId || !data?.readerId) return;
      dispatch(
        receiveReadUpdated({
          chatId: data.chatId,
          readerId: data.readerId,
          readAt: data.readAt,
        }),
      );
    };

    const onMessageDeleted = (data) => {
      if (!data?.chatId || !data?.message) return;
      dispatch(receiveMessageDeleted({ chatId: data.chatId, message: data.message }));
    };

    const onChatRemoved = (data) => {
      if (!data?.chatId) return;
      dispatch(removeChatFromList({ chatId: data.chatId }));
    };

    socket.on("chat:message", onMessage);
    socket.on("chat:inbox", onInbox);
    socket.on("chat:message-status", onMessageStatus);
    socket.on("chat:read-updated", onReadUpdated);
    socket.on("chat:message-deleted", onMessageDeleted);
    socket.on("chat:removed", onChatRemoved);
    socket.on("connect", resyncActiveChat);
    socket.on("reconnect", resyncActiveChat);

    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:inbox", onInbox);
      socket.off("chat:message-status", onMessageStatus);
      socket.off("chat:read-updated", onReadUpdated);
      socket.off("chat:message-deleted", onMessageDeleted);
      socket.off("chat:removed", onChatRemoved);
      socket.off("connect", resyncActiveChat);
      socket.off("reconnect", resyncActiveChat);
    };
  }, [dispatch, isAuthenticated, userId]);

  return null;
}
