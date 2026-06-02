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
      usesCleartextTraffic: true,
      package: "com.anonymous.Biper",
      softwareKeyboardLayoutMode: "pan",
      permissions: [
        "NOTIFICATIONS",
        "WAKE_LOCK",
        "ACCESS_NETWORK_STATE",
        "ACCESS_WIFI_STATE",
        "INTERNET"
      ],
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/TS.png",
        backgroundImage: "./assets/images/app-icon-background.png"
      },
      edgeToEdgeEnabled: true,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: false,
          categories: [
            "BROWSABLE",
            "DEFAULT"
          ],
          data: [
            {
              scheme: "tsshara",
              host: "bip"
            }
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
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "android": {
            "usesCleartextTraffic": true,
            "networkSecurityConfig": {
              "domainConfig": {
                "cleartextTrafficPermitted": true,
                "domains": [
                  "192.168.0.150", 
                  "10.0.2.2",      
                  "localhost",
                  "tsgodev.tsapp.com.br"
                ]
              }
            }
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      disabled: {},
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