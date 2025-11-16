declare module "react-native-jitsi-meet" {
  import { Component } from "react";
  import { ViewProps } from "react-native";

  type UserInfo = {
    displayName?: string;
    email?: string;
    avatar?: string;
  };

  export function call(url: string, userInfo?: UserInfo): void;
  export function audioCall(url: string, userInfo?: UserInfo): void;
  export function endCall(): void;

  interface JitsiMeetViewProps extends ViewProps {
    onConferenceTerminated?: (nativeEvent: any) => void;
    onConferenceJoined?: (nativeEvent: any) => void;
    onConferenceWillJoin?: (nativeEvent: any) => void;
  }

  export class JitsiMeetView extends Component<JitsiMeetViewProps> {}

  const JitsiMeet: {
    call: typeof call;
    audioCall: typeof audioCall;
    endCall: typeof endCall;
  };

  export default JitsiMeet;
}
