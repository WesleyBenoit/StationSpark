import { Text, View } from "react-native";

import type { Message } from "@/types/domain";

export function ChatBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View className={`my-1 max-w-[82%] rounded-2xl px-4 py-3 ${mine ? "self-end bg-charge-accent" : "self-start bg-zinc-800"}`}>
      <Text className="text-base leading-5 text-white">{message.body}</Text>
      <Text className={`mt-1 text-xs ${mine ? "text-blue-100" : "text-charge-muted"}`}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </Text>
    </View>
  );
}
