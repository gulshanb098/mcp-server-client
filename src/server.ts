import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

server.resource(
  "users",
  "users://all",
  {
    title: "Users",
    description: "A list of all users in the database",
    mimeType: "application/json",
  },
  async (uri) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((module) => module.default);
    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(users, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }
);

server.resource(
  "user-details",
  new ResourceTemplate("users://details/{userId}", { list: undefined }),
  {
    description: "Get user's details from database",
    title: "User Details",
    mimeType: "application/json",
  },
  async (uri, { userId }) => {
    const users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((module) => module.default);
    const user = users.find((u) => u.id === parseInt(userId as string));

    if (user == null) {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({ error: "User not found" }, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(user, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }
);

server.prompt(
  "generate-fake-user",
  "Generate a fake user based on given name",
  {
    name: z.string(),
  },
  ({ name }) => {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a fake user with the name "${name}". Provide the user realistic details including email, address, and phone number.`,
          },
        },
      ],
    };
  }
);

server.tool(
  "create-user",
  "Create a new user in the database",
  {
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    phone: z.string(),
  },
  {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async (params) => {
    try {
      const id = await createUser(params);
      return {
        content: [
          {
            type: "text",
            text: `User ${params.name} with ID ${id} created successfully!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating user: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

server.tool(
  "create-random-user",
  "Create a random user with fake data",
  {
    title: "Create Random User",
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
  async () => {
    const result = await server.server.request(
      {
        method: "sampling/createMessage",
        params: {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate a fake random user with only the following fields:
                  - name: full name as a string
                  - email: valid email address
                  - address: full address as a string
                  - phone: phone number as a string

                  Return the result as a pure JSON object (not inside markdown or text). Do not include any extra fields. Example:

                  {
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "address": "1234 Elm Street, Springfield, USA",
                    "phone": "555-123-4567"
                  }`,
              },
            },
          ],
          maxTokens: 1024,
        },
      },
      CreateMessageResultSchema
    );

    if (result.content.type !== "text") {
      return {
        content: [
          {
            type: "text",
            text: `Failed to generate user: Expected text content, got ${result.content.type}`,
          },
        ],
      };
    }

    try {
      const fakeUser = JSON.parse(
        result.content.text
          .trim()
          .replace(/^```json/, "")
          .replace(/```$/, "")
          .trim()
      );
      const id = await createUser(fakeUser);
      return {
        content: [
          {
            type: "text",
            text: `Random user created successfully with ID ${id}!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating random user: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

/*
 * User schema for validation
 */
const UserSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    phone: z.string(),
  })
  .strict(); // This ensures no extra fields are allowed

const createUser = async (user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) => {
  // Validate user format using Zod
  const parsed = UserSchema.safeParse(user);
  if (!parsed.success) {
    return {
      content: [
        {
          type: "text",
          text: `Validation failed: ${parsed.error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", ")}`,
        },
      ],
    };
  }
  let users: any[] = [];
  try {
    users = await import("./data/users.json", {
      with: { type: "json" },
    }).then((module) => module.default);
    console.log("Loaded users:", users);
  } catch (e) {
    console.error("Error reading users.json:", e);
    return;
  }
  const newUser = { id: users.length + 1, ...user };
  users.push(newUser);
  try {
    await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
    console.log("Successfully wrote users.json:", users);
  } catch (e) {
    console.error("Error writing users.json:", e);
    return;
  }
  return newUser.id;
};

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main();
