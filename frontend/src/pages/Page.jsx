import React, { useEffect } from "react";


// Simple icons (SVGs) to replace lucide-react imports
const SearchIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
    </svg>
);

const UsersIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8zm0 0a9 9 0 01-9 9" />
    </svg>
);

const SettingsIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-1.14 1.902-1.14 2.202 0a1.724 1.724 0 001.516 1.224 1.724 1.724 0 011.716 1.716c0 .676.426 1.286 1.048 1.516 1.14.3 1.14 1.902 0 2.202a1.724 1.724 0 00-1.224 1.516 1.724 1.724 0 01-1.716 1.716 1.724 1.724 0 00-1.516 1.048c-.3 1.14-1.902 1.14-2.202 0a1.724 1.724 0 00-1.516-1.048 1.724 1.724 0 01-1.716-1.716 1.724 1.724 0 00-1.048-1.516c-1.14-.3-1.14-1.902 0-2.202a1.724 1.724 0 001.048-1.516 1.724 1.724 0 011.716-1.716 1.724 1.724 0 001.516-1.224z" />
    </svg>
);

const MessageIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8m-8 4h5m5-10H6a2 2 0 00-2 2v12l3.333-2H18a2 2 0 002-2V6a2 2 0 00-2-2z" />
    </svg>
);

function ChatSidebar(chats = [], selectedChatId, onSelectChat, isOpen, onCreateGroup) {
    useEffect(async () => {
        chats = [{
            id: "1",
            name: "Sarah Smith",
            isGroup: false,
            lastMessage: "See you tomorrow! 👋",
            lastMessageTime: "2m ago",
            unreadCount: 2,
            online: true,
        },
        {
            id: "2",
            name: "Team Project",
            isGroup: true,
            lastMessage: "Mike: Let's schedule a meeting",
            lastMessageTime: "15m ago",
            unreadCount: 5,
            members: mockUsers.slice(0, 4),
            admins: ["1", "3"],
        },
        {
            id: "3",
            name: "Emily Davis",
            isGroup: false,
            lastMessage: "Thanks for your help!",
            lastMessageTime: "1h ago",
            unreadCount: 0,
            online: true,
        },
        {
            id: "4",
            name: "Family Group",
            isGroup: true,
            lastMessage: "Mom: Dinner at 7?",
            lastMessageTime: "2h ago",
            unreadCount: 0,
            members: mockUsers.slice(2, 5),
            admins: ["1"],
        },
        {
            id: "5",
            name: "Alex Brown",
            isGroup: false,
            lastMessage: "Check out this article!",
            lastMessageTime: "1d ago",
            unreadCount: 0,
            online: false,
        }];
        isOpen = true;
        selectedChatId = "2"
    }, []);

    return (
        <div
            className={`flex flex-col border-r bg-white transition-all duration-300 ${isOpen ? "w-full md:w-80" : "w-0 md:w-20"
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <MessageIcon />
                        {isOpen && <h2 className="text-xl font-semibold">Chats</h2>}
                    </div>

                    {isOpen && (
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-full">
                                <UsersIcon />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-full">
                                <SettingsIcon />
                            </button>
                        </div>
                    )}
                </div>

                {isOpen && (
                    <>
                        <div className="relative mb-3">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="pl-9 w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={() => onCreateGroup && onCreateGroup("New Group", [])}
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                            + Create Group
                        </button>
                    </>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition-colors ${selectedChatId === chat.id ? "bg-gray-200" : ""
                            } ${!isOpen ? "justify-center" : ""}`}
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500 text-white text-lg font-bold">
                                {chat.name.charAt(0).toUpperCase()}
                            </div>
                            {!chat.isGroup && chat.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>

                        {isOpen && (
                            <div className="flex-1 text-left overflow-hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold truncate">{chat.name}</h3>
                                    <span className="text-xs text-gray-500">
                                        {chat.lastMessageTime}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500 truncate">
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default ChatSidebar;
