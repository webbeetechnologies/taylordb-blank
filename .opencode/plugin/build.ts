/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { Plugin } from "@opencode-ai/plugin";
import { Axios } from "axios";
import { promises as fs } from "fs";
import { z } from "zod";

enum AppStatus {
  PENDING_PROVISION = "PENDING_PROVISION",
  PROVISIONING = "PROVISIONING",
  RUNNING = "RUNNING",
  FAILED = "FAILED",
  TERMINATED = "TERMINATED",
}

const { vmOrchestrationStatusUpdateUrl } = z
  .object({
    vmOrchestrationStatusUpdateUrl: z.string(),
  })
  .parse({
    vmOrchestrationStatusUpdateUrl:
      process.env.TAYLORDB_VM_ORCHESTRATION_STATUS_UPDATE_URL,
  });

const axios = new Axios({
  baseURL: vmOrchestrationStatusUpdateUrl,
});

const updateAppStatus = async (status: AppStatus) => {
  await axios.put(
    "/",
    JSON.stringify({
      status,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

const sessionRetries: Record<string, number> = {};

export const BuildPlugin: Plugin = async ({ client, $ }) => {
  return {
    event: async ({ event }) => {
      const isMessagedDone =
        event.type === "message.updated" &&
        // @ts-ignore
        event.properties.info["finish"] === "stop";

      if (!isMessagedDone) return;

      // @ts-ignore
      const error = event.properties.info["error"];

      const isAbortionError = error && error.name === "MessageAbortedError";

      const isAnyChange =
        (await $`git status --porcelain`.quiet()).stdout.toString().trim() !==
        "";

      console.log({ isAnyChange });

      if (!isAnyChange || isAbortionError) {
        await updateAppStatus(AppStatus.RUNNING);

        return;
      }

      console.log("Building...");

      const result = await $`pnpm build`.quiet().catch((error) => error);

      if (result.exitCode !== 0) {
        if (!sessionRetries[event.properties.info.sessionID]) {
          sessionRetries[event.properties.info.sessionID] = 1;
        } else {
          sessionRetries[event.properties.info.sessionID]++;
        }

        if (sessionRetries[event.properties.info.sessionID] > 3) {
          await updateAppStatus(AppStatus.FAILED);

          return;
        }

        console.log(
          `Retrying... ${sessionRetries[event.properties.info.sessionID]}`
        );

        await client.session.promptAsync({
          path: { id: event.properties.info.sessionID },
          body: {
            parts: [
              {
                type: "text",
                text: `While building the project, the following error occurred:\n\n${result.stdout.toString()}\n\nPlease fix the error and try again.`,
              },
            ],
          },
        });
      }

      sessionRetries[event.properties.info.sessionID] = 1;

      try {
        const packageJson = JSON.parse(
          await fs.readFile("package.json", "utf-8")
        );
        const [major, minor, patch] = packageJson.version
          .split(".")
          .map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;

        const messages = await client.session.messages({
          path: { id: event.properties.info.sessionID },
        });

        if (!messages.data) {
          return;
        }

        const currentMessage = messages.data
          .reverse()
          .find(
            (message) =>
              message.info.role === "user" &&
              message.info.summary &&
              message.info.summary.title
          );

        if (!currentMessage) {
          return;
        }

        const commitMessage =
          // @ts-ignore
          currentMessage.info.summary?.["title"] ??
          `feat: release version v${newVersion}`;

        packageJson.version = newVersion;

        await fs.writeFile(
          "package.json",
          JSON.stringify(packageJson, null, 2)
        );

        console.log("Pushing");
        await $`git add .`.quiet();
        await $`GIT_AUTHOR_NAME="Taylor AI" GIT_AUTHOR_EMAIL="ai@taylordb.io" GIT_COMMITTER_NAME="Taylor AI" GIT_COMMITTER_EMAIL="ai@taylordb.io" git commit -m ${commitMessage}`.quiet();
        await $`git tag v${newVersion}`.quiet();
        await $`git push origin main --tags`.quiet();
      } catch (error) {
        console.error("Failed to push to git", error);
      }

      await updateAppStatus(AppStatus.RUNNING);
    },

    "chat.message": async () => {
      await updateAppStatus(AppStatus.PROVISIONING);
    },
  };
};
