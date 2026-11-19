import { ChatScreen } from "@/components/screens/chat-screen";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/game/chat")({
    component: ChatScreen,
});