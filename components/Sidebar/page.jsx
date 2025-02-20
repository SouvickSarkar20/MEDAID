import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Sidebar = ({ chats }) => {
  const router = useRouter();
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get("/api/get-token");
      const decode = jwtDecode(response.data.token);
      const user = decode.userId;
      console.log(decode.userId);
      setUserId(user);
    };
    fetchUser();
  }, []);

  const handleChatClick = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  const handleGenerateJournal = () => {
    router.push(`/journal/${userId}`);
  };

  return (
    <div className="sidebar w-1/4 bg-gray-800 text-white h-screen p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <ul>
          {chats.map((chat, index) => (
            <li
              key={chat._id}
              className="cursor-pointer p-2 mb-2 hover:bg-gray-600 rounded"
              onClick={() => handleChatClick(chat._id)}
            >
              {`Chat ${index + 1}`}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleGenerateJournal}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
      >
        Generate Journal
      </button>
    </div>
  );
};

export default Sidebar;
