import React from "react";
import { useNavigate } from "react-router-dom";
import promptList from "../components/PromptList";

export default function CreateQuickStartPrompts() {
  const navigate = useNavigate();

  const promptClicked = (inputPrompt) => {
    navigate("/chat/new", {
      state: {
        isNewChat: true,
        initialPrompt: inputPrompt,
      },
    });
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
