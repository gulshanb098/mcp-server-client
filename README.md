# MCP Server Client

A powerful and extensible local tool execution environment built with ModelContext Protocol (MCP). This project showcases how to define, validate, and run structured tools with schema enforcement, local file manipulation, and user interaction via an LLM interface.

## Features

- **MCP Server Implementation**: Provides tools, resources, and prompts through the ModelContext Protocol
- **Interactive CLI Client**: User-friendly command-line interface to interact with the MCP server
- **User Management System**: Complete CRUD operations for user data with JSON storage
- **AI Integration**: Google Gemini AI integration for enhanced user interactions
- **Schema Validation**: Zod-based input validation and type safety
- **Real-time Development**: Hot-reload and watch modes for development

## Project Structure

```
mcp-server-client/
├── src/
│   ├── data/
│   │   └── users.json          # User data storage
│   ├── client.ts               # MCP client implementation
│   └── server.ts               # MCP server implementation
├── build/                      # Compiled JavaScript files
├── .vscode/
│   └── mcp.json               # VS Code MCP configuration
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Project dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── LICENSE                    # MIT License
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gulshanb098/mcp-server-client.git
cd mcp-server-client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your Gemini API key to .env file
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
GEMINI_API_KEY=enter-your-gemini-api-key-here
```

### VS Code Integration

The project includes VS Code MCP configuration in `.vscode/mcp.json`:

```json
{
  "servers": {
    "test-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["build/server.js"],
      "cwd": "${workspaceFolder}",
      "dev": {
        "watch": "build/**/*.js",
        "debug": {
          "type": "node"
        }
      }
    }
  },
  "inputs": []
}
```

## Available Scripts

- `npm run server:build` - Compile TypeScript to JavaScript
- `npm run server:build:watch` - Compile with watch mode
- `npm run server:dev` - Run server in development mode
- `npm run server:inspect` - Run server with MCP inspector
- `npm run client:dev` - Run interactive client

## Usage

### Running the Server

1. Build the project:
```bash
npm run server:build
```

2. Start the server:
```bash
npm run server:dev
```

### Running the Client

In a separate terminal, start the interactive client:
```bash
npm run client:dev
```

The client provides the following options:
- **Query**: Ask natural language questions using AI
- **Tools**: Execute available tools directly
- **Resources**: Access server resources
- **Prompts**: Use predefined prompts
- **Exit**: Close the client

## Server Capabilities

### Tools

1. **create-user**: Create a new user in the database
   - Parameters: `name`, `email`, `address`, `phone`
   - Validation: Uses Zod schema for input validation

2. **create-random-user**: Generate and create a random user with AI
   - No parameters required
   - Uses Gemini AI to generate realistic user data

### Resources

1. **users**: Get all users from the database
   - URI: `users://all`
   - Returns: JSON array of all users

2. **user-details**: Get specific user details
   - URI Template: `users://details/{userId}`
   - Returns: JSON object of user data or error if not found

### Prompts

1. **generate-fake-user**: Generate a fake user based on given name
   - Parameter: `name` (string)
   - Returns: Prompt for AI to generate realistic user details

## Data Structure

### User Schema

```typescript
{
  id: number,
  name: string,
  email: string,
  address: string,
  phone: string
}
```

### Sample User Data

The system comes with sample users in `src/data/users.json`:

```json
[
  {
    "id": 1,
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "address": "123 Maple Street, Springfield, IL 62704",
    "phone": "+1-217-555-1234"
  }
]
```

## Dependencies

### Production Dependencies
- `@ai-sdk/google` - Google AI SDK integration
- `@inquirer/prompts` - Interactive command-line prompts
- `@modelcontextprotocol/sdk` - MCP SDK for server/client implementation
- `ai` - AI SDK for text generation
- `dotenv` - Environment variable management
- `zod` - TypeScript-first schema validation

### Development Dependencies
- `@modelcontextprotocol/inspector` - MCP debugging and inspection tools
- `@types/node` - Node.js type definitions
- `tsx` - TypeScript execution engine
- `typescript` - TypeScript compiler

## Technology Stack

- **Language**: TypeScript/JavaScript (52.9% JS, 47.1% TS)
- **Runtime**: Node.js
- **Protocol**: Model Context Protocol (MCP)
- **AI**: Google Gemini 2.0 Flash
- **Validation**: Zod
- **Build**: TypeScript Compiler

## Development

### TypeScript Configuration

The project uses the following TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### MCP Inspector

For debugging and development, use the MCP inspector:

```bash
npm run server:inspect
```

This enables the MCP inspector interface for testing server capabilities.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Gulshan Baraik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Author

**Gulshan Baraik** - [GitHub Profile](https://github.com/gulshanb098)

## Contributing

This project demonstrates MCP implementation patterns and can be extended with additional tools, resources, and capabilities. Feel free to explore and build upon this foundation.