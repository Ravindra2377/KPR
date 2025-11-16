/* eslint-env jest */
import "react-native-gesture-handler/jestSetup";

const optionalMock = (moduleName) => {
  try {
    jest.mock(moduleName);
  } catch (err) {
    // Module might not exist in this React Native version.
  }
};

optionalMock("react-native/Libraries/LayoutAnimation/LayoutAnimation");
optionalMock("react-native/Libraries/EventEmitter/NativeEventEmitter");
optionalMock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});
