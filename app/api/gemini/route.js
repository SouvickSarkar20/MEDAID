import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Message from "@/models/Message";

//to retreive the prev chats
await connectDB();
export async function GET(req) {
    try {
        await connectDB();

        const chatId = req.nextUrl.searchParams.get("chatId");

        if (!chatId) {
            return NextResponse.json(
                { error: "Chat ID is required" },
                { status: 400 }
            );
        }

        const chat = await Chat.findById(chatId).populate("messages");

        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        return NextResponse.json({ chatId: chat._id, messages: chat.messages });
    } catch (error) {
        console.error("API Request Failed:", error);
        return NextResponse.json({ message: "error", error: error.message });
    }
}

export async function POST(req) {
    try {
        await connectDB();

        const { userId, message, chatId } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        let chat;
        let newChat = false;
        if (!chatId) {
            chat = new Chat({ userId, messages: [] });
            await chat.save();
            newChat = true;
        } else {
            chat = await Chat.findById(chatId);
            if (!chat) {
                return NextResponse.json({ error: "Chat not found" }, { status: 404 });
            }
        }

        const userMessage = await Message.create({
            msg: message,
            user_msg: true,
            ai_msg: false,
            chatId: chat._id,
        });

        await Chat.findByIdAndUpdate(chat._id, {
            $push: { messages: userMessage._id },
        });

        const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `apologize if the messgaes comes of other topic rather than mental health, just give the response of mental health \n\n${message}`,
                            },
                        ],
                    },
                ],
            }),
        });

        const data = await response.json();
        console.log(data); // Check the full response object

        const aiResponse =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response received";

        const aiMessage = await Message.create({
            msg: aiResponse,
            user_msg: false,
            ai_msg: true,
            chatId: chat._id,
        });

        await Chat.findByIdAndUpdate(chat._id, {
            $push: { messages: aiMessage._id },
        });

        return NextResponse.json({
            message: "done",
            response: aiResponse,
            chatId: chat._id, // Always send chatId
            newChat,
        });
    } catch (error) {
        console.error("API Request Failed:", error);
        return NextResponse.json({ message: "error", error: error.message });
    }
}
