import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { connectDB } from "@/lib/db";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

export async function GET(req) {
  try {
    await connectDB();

    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find all chats for the user
    const chats = await Chat.find({ userId }).populate("messages");

    if (!chats || chats.length === 0) {
      return NextResponse.json(
        { error: "No chats found for this user" },
        { status: 404 }
      );
    }

    // Get the last pair of messages (user + bot)
    const lastChat = chats[chats.length - 1];
    const lastUserMessage = lastChat.messages[lastChat.messages.length - 2];
    const lastBotMessage = lastChat.messages[lastChat.messages.length - 1];

    if (lastUserMessage && lastBotMessage) {
      // Send the last pair of messages to Gemini for summarization
      const summary = await getSummaryFromGemini(
        lastUserMessage.msg,
        lastBotMessage.msg
      );

      // Return the chat data and the summary
      return NextResponse.json({
        chats, // Previous chat data
        summary, // Summary of the last pair of messages
      });
    }

    return NextResponse.json({
      chats, // Return previous chats if no summary is available
    });
  } catch (error) {
    console.error("API Request Failed:", error);
    return NextResponse.json({ message: "error", error: error.message });
  }
}

async function getSummaryFromGemini(userMessage, botMessage) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `reading the above conversation describe how is the mental health of the user, return the response in json analyzing the stress, peace, anxiety, depression of the user as i will be creating a table with the data, additonally generate a lengthy paragraph by analazying the data: \n\nUser: ${userMessage}\nBot: ${botMessage}`,
              },
            ],
          },
        ],
      }),
    });
    const data = await response.json();

    // Check if the response contains candidates and extract the summary content
    if (data && data.candidates && data.candidates.length > 0) {
      const summaryContent =
        data.candidates[0].content?.parts[0].text || "No summary available";
      return summaryContent;
    } else {
      return "No valid response or summary returned from Gemini.";
    }
  } catch (error) {
    console.error("Gemini API Request Failed:", error);
    return "Unable to generate summary.";
  }
}