import { IconButton, TextArea } from "monday-ui-react-core";
import { useContext, useEffect, useRef, useState, KeyboardEvent } from "react";
import { ChatMessage, ChatUser } from "../../../domain";
import { Chat } from "../../../app/chat";
import "./ChatMessageForm.scss";
import { ChatContext } from "../../ChatContext";
import Emoji from "monday-ui-react-core/dist/icons/Emoji.js";
import Close from "monday-ui-react-core/dist/icons/Close.js";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useKeyDown } from "../../utils/useKeyDown";
import { ChatRoomContext } from "../ChatRoomContext";
import { ChatMessageMentionSuggestions } from "./ChatMessageMentionSuggestions";
import { usePrevious } from "../../utils/usePrevious";

interface ChatMessageFormProps {
  repyingToMessage: ChatMessage | null;
}

interface MentionRequest {
  user: ChatUser;
  start: number;
}

export function ChatMessageForm({ repyingToMessage }: ChatMessageFormProps) {
  const { selectedRoom, currentUser, userById, theme } =
    useContext(ChatContext);
  const { onMessageReply } = useContext(ChatRoomContext);

  const ref = useRef(null);
  const [message, setMessage] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [sendingInProgress, setSendingInProgress] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState<string>("");
  const [suggestionStart, setSuggestionStart] = useState<number | null>(null);
  const [mentionRequest, setMentionRequest] = useState<MentionRequest>(null);
  const [mentionedUsers, setMentionedUsers] =
    useState<Map<string, ChatUser>>(null);

  useKeyDown("Escape", () => setShowPicker(false));

  const prevMessage = usePrevious({ message });

  useEffect(() => {
    setMessage("");
    setSuggestionQuery("");
    setSuggestionStart(null);
    resetTextareaHeight();
    ref.current.focus();
  }, [selectedRoom]);

  useEffect(() => {
    const lastChar = message.slice(-1);
    if (lastChar === "@" && suggestionStart === null) {
      setSuggestionStart(message.length - 1);
      return;
    }

    if (lastChar === " ") {
      setSuggestionStart(null);
      setSuggestionQuery("");
      return;
    }

    if (suggestionStart !== null) {
      if (message.length <= suggestionStart) {
        setSuggestionStart(null);
        setSuggestionQuery("");
        return;
      }

      if (prevMessage?.message.length <= message.length) {
        setSuggestionQuery((query) => query + lastChar);
      }
    }
  }, [message]);

  useEffect(() => {
    if (!mentionRequest) {
      return;
    }

    const mentionString = `[@${mentionRequest.user.name}]`;

    setMentionedUsers(
      (users) =>
        new Map([...(users ?? []), [mentionString, mentionRequest.user]])
    );

    setMessage(
      (message) => `${message.slice(0, mentionRequest.start)} ${mentionString} `
    );
    adjustTextareaHeight();

    setMentionRequest(null);
  }, [mentionRequest]);

  const addMessage = async () => {
    const newMessage = new ChatMessage(
      crypto.randomUUID(),
      message,
      Date.now(),
      currentUser.uid,
      selectedRoom.id,
      repyingToMessage?.id
    );

    await Chat.addChatMessage(newMessage, mentionedUsers);
    Chat.updateLastSeen(selectedRoom.id, currentUser.uid);
  };

  const sendMessage = async () => {
    if (!message || sendingInProgress) {
      return;
    }

    setSendingInProgress(true);
    await addMessage();
    setMessage("");
    setShowPicker(false);
    setSendingInProgress(false);
    setMentionedUsers(new Map());
    onMessageReply(null);
    resetTextareaHeight();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && suggestionStart === null) {
      sendMessage();
      event.preventDefault();
      event.stopPropagation();
    }

    if (event.key === "Backspace" && suggestionStart !== null) {
      setSuggestionQuery((query) => query.slice(0, -1));
    }
  };

  const onFormChange = (value: string) => {
    const processedValue = value.replace(/\n/g, "");
    setMessage(processedValue);
    Chat.setTyping(selectedRoom?.id, currentUser.uid);
    adjustTextareaHeight();
  };

  const onEmojiSelect = (emoji) => {
    setMessage(message + emoji.native);
    Chat.setTyping(selectedRoom?.id, currentUser.uid);
    adjustTextareaHeight();
  };

  const onIconClick = () => {
    setShowPicker((show) => !show);
  };

  const onClickOutside = (event) => {
    if (
      event.target.closest &&
      event.target.closest(".chat-message-form, .chat-message-form__input")
    ) {
      return;
    }
    setShowPicker(false);
    ref.current?.focus();
  };

  const onCloseReplyClick = () => {
    onMessageReply(null);
  };

  const onMentionSuggestionSelect = (uid: string, suggestionStart: number) => {
    setSuggestionQuery("");
    setSuggestionStart(null);
    const user = userById.get(uid);
    setMentionRequest({ user: user, start: suggestionStart });
  };

  const onMentionSuggestionCancel = () => {
    setSuggestionQuery("");
    setSuggestionStart(null);
  };

  const resetTextareaHeight = () => {
    ref.current.style.height = 48 + "px";
  };

  const adjustTextareaHeight = () => {
    ref.current.style.height = 1 + "px";
    ref.current.style.height = 6 + ref.current.scrollHeight + "px";
  };

  return (
    <div
      className={`chat-message-form relative flex flex-col px-6 pb-6 pt-3 gap-6 ${
        repyingToMessage && "border-t ui-border"
      } ${showPicker ? "chat-message-form--picker-open" : ""}`}
      onKeyDown={(event) => onKeyDown(event)}
    >
      {repyingToMessage && (
        <div className="flex flex-row w-full justify-between">
          <div className="flex flex-col">
            <span className="font-medium">Replying</span>
            <span className="secondary flex-shrink overflow-hidden text-ellipsis max-w-xl text-sm text-nowrap">
              {repyingToMessage.text}
            </span>
          </div>
          <div>
            <IconButton icon={Close} onClick={() => onCloseReplyClick()} />
          </div>
        </div>
      )}
      <div>
        <TextArea
          ref={ref}
          autoFocus={true}
          disabled={selectedRoom === null}
          placeholder="Write a message"
          value={message}
          className="chat-message-form__textarea"
          size="large"
          onChange={(value) => onFormChange(value.target.value)}
        />
        <div className="chat-message-form__icon-wrapper absolute right-7 bottom-7">
          <IconButton
            icon={Emoji}
            onClick={() => onIconClick()}
            className="chat-message-form__icon"
          />
        </div>
      </div>
      {showPicker && (
        <div className="absolute bottom-20 right-6">
          <Picker
            data={data}
            onEmojiSelect={(emoji) => onEmojiSelect(emoji)}
            onClickOutside={(event) => onClickOutside(event)}
            theme={theme === "dark" || theme === "black" ? "dark" : "light"}
            previewPosition="none"
            autoFocus={true}
          />
        </div>
      )}
      <ChatMessageMentionSuggestions
        query={suggestionQuery}
        suggestionStart={suggestionStart}
        leftPosition={0}
        onSelect={onMentionSuggestionSelect}
        onCancel={onMentionSuggestionCancel}
      />
    </div>
  );
}
