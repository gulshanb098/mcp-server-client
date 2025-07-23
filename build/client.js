"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const google_1 = require("@ai-sdk/google");
const prompts_1 = require("@inquirer/prompts");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const ai_1 = require("ai");
require("dotenv/config");
const process_1 = require("process");
const googleAI = (0, google_1.createGoogleGenerativeAI)({
    apiKey: process.env.GEMINI_API_KEY,
});
const mcpClient = new index_js_1.Client({
    name: "MCP Client",
    version: "1.0.0",
}, {
    capabilities: {
        sampling: {},
    },
});
const transport = new stdio_js_1.StdioClientTransport({
    command: "node",
    args: ["build/server.js"],
    stderr: "ignore",
});
const main = async () => {
    await mcpClient.connect(transport);
    const [{ tools }, { prompts }, { resources }, { resourceTemplates }] = await Promise.all([
        mcpClient.listTools(),
        mcpClient.listPrompts(),
        mcpClient.listResources(),
        mcpClient.listResourceTemplates(),
    ]);
    mcpClient.setRequestHandler(types_js_1.CreateMessageRequestSchema, async (request) => {
        const texts = [];
        for (const msg of request.params.messages) {
            const text = await handleResponseMessagePrompt(msg);
            if (text != null) {
                texts.push(text);
            }
        }
        return {
            role: "user",
            model: "gemini-2.0-flash",
            stopReason: "endTurn",
            content: {
                type: "text",
                text: texts.join("\n"),
            },
        };
    });
    console.log("You are connected");
    while (true) {
        const option = await (0, prompts_1.select)({
            message: "What would you like to do?",
            choices: ["Query", "Tools", "Resources", "Prompts", "Exit"],
        });
        switch (option) {
            case "Query":
                await handleQuery(tools);
                break;
            case "Tools":
                const toolName = await (0, prompts_1.select)({
                    message: "Select a tool to execute",
                    choices: tools.map((tool) => {
                        return {
                            name: tool.annotations?.title || tool.name,
                            value: tool.name,
                            description: tool.description || "No description available",
                        };
                    }),
                });
                const tool = tools.find((t) => t.name === toolName);
                if (tool == null) {
                    console.error("Tool not found");
                    continue;
                }
                else {
                    await handleTool(tool);
                }
                break;
            case "Resources":
                const resourceUri = await (0, prompts_1.select)({
                    message: "Select a resource to execute",
                    choices: [
                        ...resources.map((resource) => ({
                            name: resource.name,
                            value: resource.uri,
                            description: resource.description || "No description available",
                        })),
                        ...resourceTemplates.map((template) => ({
                            name: template.name,
                            value: template.uriTemplate,
                            description: template.description || "No description available",
                        })),
                    ],
                });
                const uri = resources.find((r) => r.uri === resourceUri)?.uri ??
                    resourceTemplates.find((r) => r.uriTemplate === resourceUri)
                        ?.uriTemplate;
                if (uri == null) {
                    console.error("Resource not found");
                    continue;
                }
                else {
                    await handleResource(uri);
                }
                break;
            case "Prompts":
                const promptName = await (0, prompts_1.select)({
                    message: "Select a prompt to execute",
                    choices: prompts.map((prompt) => {
                        return {
                            name: prompt.name,
                            value: prompt.name,
                            description: prompt.description || "No description available",
                        };
                    }),
                });
                const prompt = prompts.find((p) => p.name === promptName);
                if (prompt == null) {
                    console.error("Prompt not found");
                    continue;
                }
                else {
                    await handlePrompt(prompt);
                }
                break;
            case "Exit":
                (0, process_1.exit)(0);
        }
    }
};
/*
 * Sanitizes the JSON schema by removing unsupported formats and ensuring
 * compatibility with the API.
 */
const sanitizeJsonSchema = (schema) => {
    if (schema == null || typeof schema !== "object")
        return schema;
    const copy = { ...schema };
    if (copy.type === "string" &&
        copy.format &&
        !["date-time", "enum"].includes(copy.format)) {
        delete copy.format;
    }
    if (copy.properties) {
        for (const key in copy.properties) {
            copy.properties[key] = sanitizeJsonSchema(copy.properties[key]);
        }
    }
    if (copy.items) {
        copy.items = sanitizeJsonSchema(copy.items);
    }
    return copy;
};
const handleQuery = async (tools) => {
    const query = await (0, prompts_1.input)({
        message: "Enter your query",
    });
    const { text, toolResults } = await (0, ai_1.generateText)({
        model: googleAI("gemini-2.0-flash"),
        prompt: query,
        tools: tools.reduce((acc, tool) => ({
            ...acc,
            [tool.name]: {
                description: tool.description || "No description available",
                parameters: (0, ai_1.jsonSchema)(sanitizeJsonSchema(tool.inputSchema ?? {})),
                execute: async (args) => {
                    const res = await mcpClient.callTool({
                        name: tool.name,
                        arguments: args,
                    });
                    return res;
                },
            },
        }), {}),
    });
    console.log("Query response:", 
    // @ts-expect-error
    text || toolResults[0]?.result?.content[0]?.text || "No response generated");
};
const handleTool = async (tool) => {
    console.log(`Executing tool: ${tool.name}`);
    const args = {};
    for (const [key, value] of Object.entries(tool.inputSchema.properties ?? {})) {
        args[key] = await (0, prompts_1.input)({
            message: `Enter value for ${key} (${value.type}): `,
        });
    }
    const res = await mcpClient.callTool({ name: tool.name, arguments: args });
    console.log("Tool response:", res.content[0].text);
};
const handleResource = async (uri) => {
    console.log(`Executing resource: ${uri}`);
    let finalUri = uri;
    const paramMatches = uri.match(/{([^}]+)}/g);
    if (paramMatches != null) {
        for (const match of paramMatches) {
            const paramName = match.replace("{", "").replace("}", "");
            const value = await (0, prompts_1.input)({
                message: `Enter value for parameter ${paramName}: `,
            });
            finalUri = finalUri.replace(match, encodeURIComponent(value));
        }
    }
    const res = await mcpClient.readResource({ uri: finalUri });
    console.log("Resource response:", JSON.stringify(JSON.parse(res.contents[0].text), null, 2));
};
const handlePrompt = async (prompt) => {
    console.log(`Executing prompt: ${prompt.name}`);
    const args = {};
    for (const arg of prompt.arguments ?? []) {
        args[arg.name] = await (0, prompts_1.input)({
            message: `Enter value for ${arg.name}: `,
        });
    }
    const res = await mcpClient.getPrompt({
        name: prompt.name,
        arguments: args,
    });
    for (const msg of res.messages) {
        console.log("Prompt Response -> ", await handleResponseMessagePrompt(msg));
    }
};
const handleResponseMessagePrompt = async (msg) => {
    if (msg.content.type !== "text")
        return;
    console.log("Prompt -> ", msg.content.text);
    const run = await (0, prompts_1.confirm)({
        message: "Would you like to run this prompt?",
        default: true,
    });
    if (!run)
        return;
    const { text } = await (0, ai_1.generateText)({
        model: googleAI("gemini-2.0-flash"),
        prompt: msg.content.text,
    });
    return text;
};
main();
