<template>
  <div class="chat-page">
    <!-- Sidebar -->
    <aside :class="['sidebar', { collapsed: isMobile && !showSidebar }]">
      <!-- Toggle button inside sidebar on mobile -->
      <button
        class="toggle-sidebar absolute"
        v-if="isMobile"
        @click="showSidebar = false"
      >
        ✕
      </button>

      <div class="sidebar-content">
        <div v-if="chats.length">
          <h3 class="app-title" v-if="!isMobile || showSidebar">chats</h3>

          <div
            class="user-card"
            v-for="friend in chats"
            :key="friend.id"
            @click="createChat(friend)"
            :class="{ active: activeFriend?.other && friend.other && activeFriend.other._id === friend.other._id }"
          >
            <div class="avatar">
              <img
                v-if="friend.other?.profileImage"
                :src="friend.other?.profileImage"
                alt="Avatar"
                class="avatar-img"
              />
            </div>
            <div v-if="!isMobile || showSidebar" class="friend-info">
              <strong>{{ friend.other?.name }}</strong>
              <p class="email">{{ friend.other?.email }}</p>
            </div>
          </div>
        </div>
        <div class="app-users">
          <h3 class="app-title" v-if="!isMobile || showSidebar">App Users</h3>

          <div
            class="user-card"
            v-for="friend in friends"
            :key="friend.id"
            @click="createChat(friend)"
            :class="{ active: activeFriend?._id === friend._id }"
          >
            <div class="avatar">
              <img
                v-if="friend.profileImage"
                :src="friend.profileImage"
                alt="Avatar"
                class="avatar-img"
              />
            </div>
            <div v-if="!isMobile || showSidebar" class="friend-info">
              <strong>{{ friend.name }}</strong>
              <p class="email">{{ friend.email }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Chat Section -->
    <main class="chat-section">
      <!-- Top Bar for Mobile -->
      <div class="top-bar" v-if="isMobile">
        <button class="toggle-sidebar" @click="showSidebar = !showSidebar">
          ☰
        </button>
        <span class="top-bar-title">{{ activeFriend?.name || appName }}</span>
      </div>

      <header
        class="chat-header"
        v-if="activeFriend && (!isMobile || !showSidebar)"
      >
        <h3>{{ activeFriend.name }}</h3>
        <span class="chat-email">{{ activeFriend.email }}</span>
      </header>

      <div
        class="chat-container"
        v-if="activeFriend && (!isMobile || !showSidebar)"
      >
        <div class="messages" ref="messagesRef">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'message',
              {
                outgoing: msg.senderId === (user._id || 'You'),
                incoming: msg.senderId !== (user._id || 'You'),
              },
            ]"
          >
            {{ msg.content }}
          </div>
        </div>

        <form class="input-area" @submit.prevent="sendMessage">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            required
          />
          <button type="submit">Send</button>
        </form>
      </div>

      <div class="select-user-hint" v-else-if="!activeFriend">
        <p>Select a friend to start chatting 💬</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuthCheck } from "../utils/useAuth";

useAuthCheck();

interface Friend {
  id: number;
  _id?: string;
  name: string;
  email: string;
  profileImage?: string;
  other?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
}
const friends = ref<Friend[]>([]);
const chats = ref<Friend[]>([]);

const user = JSON.parse(localStorage.getItem("user") || "{}");
const chatId = ref("");
const activeFriend = ref<null | {
  id: number;
  name: string;
  email: string;
  _id?: string;
  other?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
}>(null);
const newMessage = ref("");
const messages = ref<{ senderId: string; content: string; chatId?: string; type?: string; timestamp?: string }[]>([]);
const messagesRef = ref<HTMLElement | null>(null);

const showSidebar = ref(false);
const isMobile = window.innerWidth <= 1024;
const appName = "My Chat App";

// Setup socket connection
const socket = io("http://192.168.21.113:4000");

function selectFriend(friend: typeof activeFriend.value) {
  activeFriend.value = friend;
  messages.value = [];
  showSidebar.value = false;
  scrollToBottom();
}

function sendMessage() {
  if (newMessage.value.trim() && activeFriend.value) {
    const message = {
      chatId: chatId.value,
      senderId: user._id,
      receiverId: activeFriend.value?.other?._id,
      type: "text",
      content: newMessage.value.trim(),
    };


    // Emit message via socket with acknowledgement callback
    socket.emit("send_message", message, (response:any) => {
      if (response.status === "ok") {
        console.log("Message sent successfully!");
      } else {
        console.error("Failed to send message:", response);
      }
    });

    // Optimistic update: add message immediately to the chat UI
    messages.value.push({
      senderId: user._id || "You",
      content: message.content,
      chatId: message.chatId,
    });

    newMessage.value = "";
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}

onMounted(() => {
  if (user) {
    axios
      .get(`http://192.168.21.113:4000/user/getAll/${user.appName}`, {
        headers: {
          Authorization: `Bearer ${user.fcmToken}`,
        },
      })
      .then((response) => {
        friends.value = response.data.data;
      })
      .catch((error) => {
        console.error("Error fetching friends:", error);
      });

    axios
      .post(`http://192.168.21.113:4000/user/getAllChats`, {
        userId: user._id,
      })
      .then((res) => {
        chats.value = res.data.data;
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
      });
  }

  // ✅ Listen for messages only once socket is ready
  socket.on("new_message", (message) => {
    console.log("📩 New message received:", message);
    if (activeFriend.value && message.data.chatId === chatId.value) {
      messages.value.push({
        senderId:
          message.data.senderId === user._id ? "You" : activeFriend.value.name,
        content: message.data.content,
        type: message.data.type,
        timestamp: new Date().toISOString(), // optional for UI sorting
      });
      scrollToBottom();
    }
  });
});

onUnmounted(() => {
  // ✅ Cleanup listeners to avoid memory leaks
  socket.off("new_message");
});

const createChat = async (friend: any) => {
  // Emit leave-chat if already in a chat
  if (chatId.value) {
    socket.emit(
      "leave-chat",
      {
        chatId: chatId.value,
        senderId: user._id,
      },
      (response:any) => {
        console.log("Left previous chat:", response);
      }
    );
  }
  selectFriend(friend);
  const response = await axios.post(
    "http://192.168.21.113:4000/user/createChat",
    {
      user: user._id,
      other: friend.other._id,
    }
  );
  if (response.status === 200) {
    socket.emit(
      "join-chat",
      {
        chatId: response.data.data.chatId,
        senderId: user._id,
      },
      (response:any) => {
        console.log("join chat response", response);
      }
    );
    chatId.value = response.data.data.chatId;
    const res = await axios.get(
      `http://192.168.21.113:4000/user/getAllMessages/${response.data.data.chatId}`
    );
    messages.value = res.data.data;
    scrollToBottom();
  } else {
    console.error("Failed to create chat");
  }
};
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

/* Sidebar */
.sidebar {
  /* width: 280px; */
  background-color: #f7f7f7;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
}
.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
}

.sidebar.collapsed {
  width: 0;
  padding: 0;
  overflow: hidden;
}

/* Toggle button inside sidebar */
.sidebar .toggle-sidebar.absolute {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.app-title {
  text-align: center;
  margin-bottom: 24px;
  color: #3498db;
}

/* User Card */
.user-card {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: background 0.2s;
}

.user-card:hover,
.user-card.active {
  background-color: #e6f0fb;
}

.avatar {
  background-color: #3498db;
  color: white;
  font-weight: bold;
  border-radius: 50%;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.friend-info {
  display: flex;
  flex-direction: column;
}

.friend-info .email {
  font-size: 12px;
  color: gray;
}

/* Chat Section */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

/* Top bar for mobile */
.top-bar {
  display: flex;
  align-items: center;
  background-color: #3498db;
  color: white;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
}

.toggle-sidebar {
  font-size: 20px;
  background: none;
  border: none;
  color: white;
  margin-right: 16px;
  cursor: pointer;
}

.chat-header {
  background-color: #3498db;
  color: white;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

/* Incoming messages (left aligned) */
.incoming {
  padding: 4px 10px;

  background-color: #f1f0f0;
  color: black;
  align-self: flex-start;
  border-top-left-radius: 0;
  width: fit-content;
  border-radius: 6px;
}

/* Outgoing messages (right aligned) */
.outgoing {
  padding: 4px 10px;
  background-color: #4f93ff;
  color: white;
  align-self: flex-end;
  margin-left: auto;
  width: fit-content;
  border-radius: 6px;
}

.message {
  margin-bottom: 10px;
}

.input-area {
  display: flex;
  gap: 8px;
}

.input-area input {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
}

.input-area button {
  padding: 10px 16px;
  background-color: #3498db;
  border: none;
  color: white;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
}

.input-area button:hover {
  background-color: #2980b9;
}

.select-user-hint {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #666;
  font-size: 18px;
}

/* Mobile */
@media (max-width: 768px) {
  .chat-page {
    flex-direction: row;
  }

  .sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    background: #f7f7f7;
  }
  .sidebar.collapsed {
    width: 0;
    padding: 0;
    overflow: hidden;
  }
  .sidebar .toggle-sidebar.absolute {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }
  .sidebar-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .chat-section {
    flex: 1;
  }
}
</style>
