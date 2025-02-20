"use client";

import Sidebar from "@/components/Sidebar/page";
import { jwtDecode } from "jwt-decode";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

export default function chatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const router = useRouter();

  const { chatId } = useParams();

  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch("/api/get-token");
      const data = await res.json();
      const decoded = jwtDecode(data.token);
      setUserId(decoded.userId);
    };

    fetchToken();
  }, []);

  //fetch all chats to be displayed on the sidebar
  useEffect(() => {
    const fetchChats = async () => {
      try {
        console.log(userId);
        
        const res = await fetch(`/api/get-chats?userId=${userId}`);
        
        const data =await res.json();
        console.log(data.chats);
        
        if (Array.isArray(data.chats)) {
          setChats(data.chats);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    if (userId) {
      fetchChats();
    }
  }, [userId]);

  //get the chat history for a specific chat
  useEffect(() => {
    if (!chatId) return;

    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`/api/gemini?chatId=${chatId}`, {
          method: "GET",
        });

        const data = await response.json();

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg) => ({
            text: msg.msg,
            sender: msg.ai_msg ? "bot" : "user",
          }));
          setMessages(formattedMessages);
        } else {
          console.warn("No previous chat found.");
        }
      } catch (error) {
        console.error("Error fetching previous chat:", error);
      }
    };

    fetchChatHistory();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;

    const newMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const chatHistoryString = messages
        .map((msg) => `${msg.sender === "user" ? "User" : "Bot"}: ${msg.text}`)
        .join("\n");

      const fullMessage = `${chatHistoryString}\nUser: ${input}`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          chatId, // Use chatId from URL
          message: fullMessage,
        }),
      });

      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { text: data.response, sender: "bot" },
        ]);
      } else {
        console.error("No valid AI response received:", data);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar chats={chats} />

      {/* ChatBox */}
      <div className="flex-1 bg-blue-100 text-gray-800 p-6">
        <h1 className="text-3xl font-bold text-sky-700 mb-4">
          Mental Health Chat
        </h1>

        <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-4 h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 my-1 rounded-md ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-300 text-black self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div className="w-full max-w-2xl flex mt-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-l-md"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
