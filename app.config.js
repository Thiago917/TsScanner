export default {
  expo: {
    name: "TS Scanner",
    slug: "Biper",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/TS.png",
    scheme: "tsshara",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      package: "com.anonymous.Biper",
      softwareKeyboardLayoutMode: "pan",
      permissions: [
        "NOTIFICATIONS",
        "WAKE_LOCK"
      ],
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/TS.png",
        backgroundImage: "./assets/images/app-icon-background.png"
      },
      edgeToEdgeEnabled: true,
      intentFilter: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "tsshara",
              host: "bip"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/TS.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-notifications"
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "47342b13-5c85-412f-aa05-a06c4dd07b0a"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/47342b13-5c85-412f-aa05-a06c4dd07b0a"
    }
  }
};