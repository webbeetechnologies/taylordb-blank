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

export const DevServerHMRPlugin: Plugin = async ({ client, $ }) => {
  return {
    event: async ({ event }) => {
      if (event.type !== "session.idle") return;

      const result = await $`pnpm build`.catch((error) => error);

      if (result.exitCode !== 0) {
        if (!client.session["tries"]) {
          client.session["tries"] = 0;
        } else {
          client.session["tries"]++;
        }

        if (client.session["tries"] > 3) {
          await updateAppStatus("Errored");

          console.log("CHANGE STATUS TO ERRORED");

          return;
        }

        await client.session.prompt({
          path: { id: event.properties.sessionID },
          body: {
            parts: [
              {
                type: "text",
                text: `While building the project, the following error occurred:\n\n${result.stderr.toString()}\n\nPlease fix the error and try again.`,
              },
            ],
          },
        });
      }

      try {
        const packageJson = JSON.parse(
          await fs.readFile("package.json", "utf-8")
        );
        const [major, minor, patch] = packageJson.version
          .split(".")
          .map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;

        const session = await client.session.get({
          path: { id: event.properties.sessionID },
        });

        const commitMessage =
          session.data?.title ?? `feat: release version v${newVersion}`;

        await $`git config user.name "Taylor AI"`;
        await $`git config user.email "ai@taylordb.io"`;
        await $`git add .`;
        await $`git commit -m ${commitMessage}`;
        await $`git tag v${newVersion}`;
        await $`git push origin main --tags`;

        packageJson.version = newVersion;

        await fs.writeFile(
          "package.json",
          JSON.stringify(packageJson, null, 2)
        );
      } catch (error) {
        console.error("Failed to push to git", error);
      }

      await updateAppStatus("Active");

      console.log("CHANGE STATUS TO ACTIVE");
    },

    "chat.message": async () => {
      await updateAppStatus("Pending");

      console.log("CHANGE STATUS TO PENDING");
    },
  };
};
