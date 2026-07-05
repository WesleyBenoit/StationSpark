import { Component, type ErrorInfo, type ReactNode } from "react";
import { SafeAreaView, Text, View } from "react-native";

import { Button } from "@/components/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-charge-bg px-6">
          <View className="w-full max-w-sm items-center gap-4 rounded-2xl border border-zinc-800 bg-charge-card p-6">
            <Text className="text-center text-lg font-semibold text-white">Something went wrong</Text>
            <Text className="text-center text-sm text-zinc-400">
              StationSpark hit an unexpected error. You can try again, or restart the app if this keeps happening.
            </Text>
            <Button title="Try again" onPress={this.reset} className="w-full" />
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
