import { defineConfig, devices } from "@playwright/test"; // import devices

export default defineConfig({
  testDir: "tests",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "safari",
      use: {
        ...devices["Iphone 6"],
      },
    },
  ],
});
