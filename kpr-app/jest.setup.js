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

jest.mock("react-native/Libraries/Interaction/InteractionManager", () => {
  return {
    runAfterInteractions: (cb) => {
      cb && cb();
      return { then: (resolve) => resolve && resolve() };
    },
    createInteractionHandle: jest.fn(() => 1),
    clearInteractionHandle: jest.fn(),
    setDeadline: jest.fn(),
    Events: {
      interactionStart: "interactionStart",
      interactionComplete: "interactionComplete"
    }
  };
});

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const Fragment = React.Fragment;
  return {
    __esModule: true,
    NavigationContainer: ({ children }) => React.createElement(Fragment, null, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn((cb) => cb && cb()),
    useIsFocused: () => true,
    createNavigationContainerRef: () => ({ current: null })
  };
});

jest.mock("@react-navigation/stack", () => {
  const React = require("react");
  const Fragment = React.Fragment;
  return {
    __esModule: true,
    createStackNavigator: () => {
      const Navigator = ({ children }) => React.createElement(Fragment, null, children);
      const Screen = () => null;
      return { Navigator, Screen };
    }
  };
});

jest.mock("react-native/src/private/animated/NativeAnimatedHelper", () => {
  const mockListener = { remove: jest.fn() };

  return {
    __esModule: true,
    default: {
      API: {
        startListeningToAnimatedNodeValue: jest.fn(),
        stopListeningToAnimatedNodeValue: jest.fn(),
        setAnimatedNodeValue: jest.fn(),
        setAnimatedNodeOffset: jest.fn(),
        extractAnimatedNodeOffset: jest.fn(),
        flattenAnimatedNodeOffset: jest.fn(),
        connectAnimatedNodes: jest.fn(),
        disconnectAnimatedNodes: jest.fn(),
        createAnimatedNode: jest.fn(),
        updateAnimatedNodeConfig: jest.fn(),
        startAnimatingNode: jest.fn(),
        stopAnimation: jest.fn(),
        flushQueue: jest.fn(),
        disableQueue: jest.fn()
      },
      generateNewNodeTag: jest.fn().mockReturnValue(1),
      generateNewAnimationId: jest.fn().mockReturnValue(1),
      assertNativeAnimatedModule: jest.fn(),
      shouldUseNativeDriver: jest.fn().mockReturnValue(false),
      shouldSignalBatch: false,
      transformDataType: jest.fn((value) => value),
      nativeEventEmitter: {
        addListener: jest.fn().mockReturnValue(mockListener)
      }
    }
  };
});

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-bootsplash", () => ({
  hide: jest.fn(),
  show: jest.fn()
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  const { View, ScrollView } = require("react-native");

  Reanimated.default = Reanimated;
  Reanimated.View = View;
  Reanimated.ScrollView = ScrollView;
  Reanimated.createAnimatedComponent = (Component) => Component;
  Reanimated.useSharedValue = () => ({ value: 0 });
  Reanimated.useAnimatedStyle = () => ({});
  Reanimated.useAnimatedScrollHandler = () => () => {};
  Reanimated.withTiming = (value) => value;
  Reanimated.withSpring = (value) => value;
  Reanimated.FadeIn = { springify: () => ({ damping: () => ({}) }) };
  Reanimated.runOnJS = (fn) => fn;
  Reanimated.runOnUI = (fn) => fn;

  return Reanimated;
});
