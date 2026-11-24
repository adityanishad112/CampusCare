import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "edu.campuscare.app",
  appName: "CampusCare",
  webDir: "dist",
  server: {
    androidScheme: "http",
  },
};

export default config;
