import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, TextInput, View } from "react-native";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { ChatBubble } from "@/components/ChatBubble";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { SafetyNotice } from "@/components/SafetyNotice";
import type { RootStackParamList } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useSafetyStore } from "@/stores/safetyStore";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

const quickReplies = ["Still charging?", "Want to meet by the chargers?", "Coffee nearby?", "All good, thanks."];

export function ChatScreen({ navigation, route }: Props) {
  const { chatId } = route.params;
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const messages = useChatStore((state) => state.messagesByChat[chatId] ?? []);
  const loadChats = useChatStore((state) => state.loadChats);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const endChat = useChatStore((state) => state.endChat);
  const blockUser = useSafetyStore((state) => state.blockUser);
  const [body, setBody] = useState("");

  useEffect(() => {
    void loadChats();
    void loadMessages(chatId);
  }, [chatId, loadChats, loadMessages]);

  const chat = chats.find((item) => item.id === chatId);
  const otherUserId = useMemo(() => {
    if (!chat || !user) return null;
    return chat.user_one_id === user.id ? chat.user_two_id : chat.user_one_id;
  }, [chat, user]);

  const submit = async (text = body) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await sendMessage({ chat_id: chatId, body: trimmed });
      setBody("");
    } catch (error) {
      Alert.alert("Message blocked", error instanceof Error ? error.message : "The invite may no longer allow chat.");
    }
  };

  const confirmBlock = () => {
    if (!otherUserId) return;
    Alert.alert("Block user", "Blocking hides both of you from each other and prevents chat.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          await blockUser(otherUserId);
          navigation.goBack();
        }
      }
    ]);
  };

  return (
    <AppShell scroll={false}>
      <Header title="Chat" subtitle="Opened after accepted invite" onBackPress={() => navigation.goBack()} />
      <SafetyNotice body="Meet in public station areas. You can block, report, or end the chat at any time." />

      <View className="mt-4 flex-row gap-2">
        <Button title="Block" variant="danger" className="flex-1" onPress={confirmBlock} />
        <Button
          title="Report"
          variant="secondary"
          className="flex-1"
          onPress={() => otherUserId && navigation.navigate("Report", { reportedUserId: otherUserId })}
        />
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        className="mt-4 flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <EmptyState title="No messages yet" body="Start with a quick reply or send a short station meetup note." />
        }
        renderItem={({ item }) => <ChatBubble message={item} mine={item.sender_id === user?.id} />}
      />

      <View className="gap-3 border-t border-zinc-800 py-4">
        <View className="flex-row flex-wrap gap-2">
          {quickReplies.map((reply) => (
            <Button key={reply} title={reply} variant="ghost" onPress={() => submit(reply)} />
          ))}
        </View>
        <View className="flex-row gap-2">
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Message after accepted invite"
            placeholderTextColor="#71717A"
            className="min-h-12 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-base text-white"
          />
          <Button title="Send" onPress={() => submit()} />
        </View>
        <View className="flex-row gap-2">
          <Button
            title="Share meetup"
            variant="secondary"
            className="flex-1"
            onPress={() => Alert.alert("Trusted contact", "Trusted contact sharing is a Phase 2 placeholder.")}
          />
          <Button
            title="End chat"
            variant="secondary"
            className="flex-1"
            onPress={async () => {
              await endChat(chatId);
              navigation.goBack();
            }}
          />
        </View>
      </View>
    </AppShell>
  );
}
