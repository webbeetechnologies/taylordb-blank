import type { Plugin } from "@opencode-ai/plugin";
import { Axios } from "axios";
import { promises as fs } from "fs";
import { z } from "zod";

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

const updateAppStatus = async (status: "Errored" | "Active" | "Pending") => {
  // await axios.put(
  //   "/",
  //   JSON.stringify({
  //     status,
  //   }),
  //   {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   }
  // );
};

const sessionHistory: { [sessionId: string]: { sessionFinished: boolean } } =
  {};

export const DevServerHMRPlugin: Plugin = async ({ client, $ }) => {
  return {
    event: async ({ event }) => {
      console.dir(event, { depth: null });
      // @ts-ignore
      if (1 === "1") {
        return;
      }
      if (
        event.type === "session.status" &&
        event.properties.status.type === "busy"
      ) {
        sessionHistory[event.properties.sessionID] = {
          sessionFinished: false,
        };

        return;
      }

      if (event.type === "session.idle") {
        sessionHistory[event.properties.sessionID] = {
          sessionFinished: true,
        };

        return;
      }

      if (event.type !== "message.updated") return;

      if (!event.properties.info.time["completed"]) return;

      console.log(
        sessionHistory[event.properties.info.sessionID],
        "isSessionfinished"
      );

      if (!sessionHistory[event.properties.info.sessionID]?.sessionFinished) {
        return;
      }

      const messages = await client.session.messages({
        path: { id: event.properties.info.sessionID },
      });

      if (!messages.data) {
        await client.app.log({
          body: {
            level: "error",
            message: "No messages found",
            service: "dev-server-hmr",
            extra: {
              sessionID: event.properties.info.sessionID,
            },
          },
        });

        return;
      }

      const session = await client.session.get({
        path: { id: event.properties.info.sessionID },
      });

      const commitAndPush = async () => {
        try {
          await client.app.log({
            body: {
              level: "info",
              message: "Committing and pushing",
              service: "dev-server-hmr",
              extra: {
                sessionID: event.properties.info.sessionID,
              },
            },
          });

          const packageJson = JSON.parse(
            await fs.readFile("package.json", "utf-8")
          );
          const [major, minor, patch] = packageJson.version
            .split(".")
            .map(Number);
          const newVersion = `${major}.${minor}.${patch + 1}`;

          const title = messages.data
            .reverse()
            .find(
              (message) =>
                message.info.role === "user" &&
                message.info.summary &&
                message.info.summary.title
            )?.info.summary?.["title"];
          const commitMessage = title ?? `feat: release version v${newVersion}`;
          packageJson.version = newVersion;
          await fs.writeFile(
            "package.json",
            JSON.stringify(packageJson, null, 2)
          );
          await $`git config user.name "Taylor AI"`.quiet();
          await $`git config user.email "ai@taylordb.io"`.quiet();
          await $`git add .`.quiet();
          await $`git commit -m ${commitMessage}`.quiet();
          await $`git tag v${newVersion}`.quiet();
          await $`git push origin main --tags`.quiet();

          await client.app.log({
            body: {
              level: "info",
              message: "Committed and pushed",
              service: "dev-server-hmr",
              extra: {
                sessionID: event.properties.info.sessionID,
              },
            },
          });
        } catch (error) {
          await client.app.log({
            body: {
              level: "error",
              message: "Failed to push to git",
              service: "dev-server-hmr",
              extra: {
                sessionID: event.properties.info.sessionID,
                error: error.message,
                stack: error.stack,
              },
            },
          });
        }
      };

      const isChatAborted =
        event.properties.info["error"] &&
        event.properties.info["error"]["name"] === "MessageAbortedError";

      const isAnyChange =
        session.data?.summary?.files && session.data.summary.files > 0;

      if (!isAnyChange) {
        await client.app.log({
          body: {
            level: "info",
            message: "No changes made",
            service: "dev-server-hmr",
            extra: {
              sessionID: event.properties.info.sessionID,
            },
          },
        });

        await updateAppStatus("Active");

        return;
      }

      if (isChatAborted) {
        await client.app.log({
          body: {
            level: "info",
            message: "Chat aborted",
            service: "dev-server-hmr",
            extra: {
              sessionID: event.properties.info.sessionID,
            },
          },
        });

        await updateAppStatus("Errored");
        await commitAndPush();
        return;
      }

      let itterations = 0;

      for (const message of messages.data.reverse()) {
        if (message.info.role !== "user") continue;

        if (
          !message.info.summary?.title?.startsWith("While building the project")
        ) {
          break;
        }

        itterations++;
      }

      await client.app.log({
        body: {
          level: "info",
          message: "Building project",
          service: "dev-server-hmr",
          extra: {
            sessionID: event.properties.info.sessionID,
          },
        },
      });

      // const result = await $`pnpm build`.quiet().catch((error) => error);

      const result = {
        exitCode: 1,
        stdout: "Build just failed, try changing the anything and try again",
        stderr: "",
      };

      if (result.exitCode !== 0) {
        if (itterations > 3) {
          await client.app.log({
            body: {
              level: "error",
              message: "Failed to build project",
              service: "dev-server-hmr",
              extra: {
                sessionID: event.properties.info.sessionID,
              },
            },
          });

          await updateAppStatus("Errored");

          return;
        }

        await client.app.log({
          body: {
            level: "error",
            message: `Failed to build project, trying again: ${itterations}`,
            service: "dev-server-hmr",
            extra: {
              sessionID: event.properties.info.sessionID,
            },
          },
        });

        await client.session.prompt({
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

        return;
      }

      await updateAppStatus("Active");

      await client.app.log({
        body: {
          level: "info",
          message: "Project built successfully",
          service: "dev-server-hmr",
        },
      });
    },

    "chat.message": async () => {
      await updateAppStatus("Pending");
    },
  };
};
