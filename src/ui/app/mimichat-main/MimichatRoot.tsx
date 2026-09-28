import { useEffect, useState } from "react";
import { Chat } from "@chat";
import { Loader } from "monday-ui-react-core";
import { ChatRoot } from "./ChatRoot";
import { ChatBoardRoot } from "../mimichat-board/ChatBoardRoot";
import { Monday } from "../../../infrastructure/monday/Monday";

export function MimichatRoot() {
  const [isBoardView, setIsBoardView] = useState<boolean | null>(null);

  useEffect(() => {
    Chat.getContext()
      .then((context) => setIsBoardView(Monday.isBoardViewSurface(context)))
      .catch(() => setIsBoardView(false));
  }, []);

  if (isBoardView === null) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loader size={Loader.sizes.LARGE} />
      </div>
    );
  }

  return isBoardView ? <ChatBoardRoot /> : <ChatRoot />;
}
