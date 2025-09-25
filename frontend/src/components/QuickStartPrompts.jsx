import React from "react";
import { useNavigate } from "react-router-dom";
import { createChat } from "../services/userAPI";
import promptList from "../components/PromptList";

export default function CreateQuickStartPrompts() {
  const navigate = useNavigate();

  const promptClicked = async (inputPrompt) => {
    try {
      // Create a new chat with the quick prompt directly
      const data = await createChat(inputPrompt);
      // Validate response structure
      if (!data.chat || !data.chat._id) {
        throw new Error("Invalid response structure: Missing chat._id");
      }

      // Navigate to the new chat page and pass the prompt as state
      navigate(`/chat/${data.chat._id}`, {
        state: {
          isNewChat: true,
          initialPrompt: inputPrompt,
          justCreated: true,
        },
      });
    } catch (err) {
      console.error("Error handling quick start prompt:", err);
    }
  };

  let chosenPrompts = [];
  let dupPrompts = [...promptList];

  for (let i = 0; i < 3; i++) {
    if (dupPrompts.length === 0) break;

    let prompt = dupPrompts.splice(
      Math.floor(Math.random() * dupPrompts.length),
      1
    )[0];

    if (!chosenPrompts.includes(prompt)) {
      chosenPrompts.push(prompt);
    } else {
      i--;
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      {chosenPrompts.map((prompt, index) => (
        <div
          key={index}
          data-testid="quick-start-prompt"
          className="bg-blue-300 hover:bg-blue-400 rounded-2xl px-4 py-2 text-sm cursor-pointer transition"
          onClick={() => promptClicked(prompt)}
        >
          {prompt}
        </div>
      ))}
    </div>
  );
}
