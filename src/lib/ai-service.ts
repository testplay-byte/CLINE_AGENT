'use client';

// ============================================================
// ACUTE AGENT — AI Service with Full Agent Capabilities
// Streaming, tool use (function calling), agent loop
// All calls are made directly from the client to the provider API.
// API keys never leave the user's machine.
// ============================================================

// ---- Types ----

export interface AIConfig {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  maxOutput: number;
  temperature: number;
  contextWindow: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: string;
  isError?: boolean;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface AgentResponse {
  text: string;
  toolCalls: ToolCall[];
  isComplete: boolean;
  thoughts?: string;
}

export type StreamCallback = (token: string) => void;
export type ToolCallCallback = (toolCalls: ToolCall[]) => void;

// ---- Tool Definitions ----
// These are the tools the AI agent can use to interact with the user's project

export const AGENT_TOOLS = {
  // OpenAI / Anthropic format
  openai: [
    {
      type: 'function' as const,
      function: {
        name: 'read_file',
        description: 'Read the contents of a file at the given path. Returns the file content with line numbers.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute or relative path to the file to read' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'write_to_file',
        description: 'Write content to a file. Creates the file if it doesn\'t exist, overwrites if it does. Use for creating new files or completely rewriting existing ones.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute or relative path to the file' },
            content: { type: 'string', description: 'The complete content to write to the file' },
          },
          required: ['path', 'content'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'apply_diff',
        description: 'Apply a search/replace diff to a file. Use this for targeted edits. The oldText must match exactly (including whitespace). Multiple diffs can be applied in one call.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute or relative path to the file' },
            diffs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  oldText: { type: 'string', description: 'Exact text to find in the file (must match precisely)' },
                  newText: { type: 'string', description: 'Replacement text' },
                },
                required: ['oldText', 'newText'],
              },
              description: 'Array of search/replace pairs to apply sequentially',
            },
          },
          required: ['path', 'diffs'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'execute_command',
        description: 'Execute a shell command in the project directory. Returns stdout, stderr, exit code, and duration. Use for running tests, builds, git commands, package managers, etc.',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The shell command to execute' },
            timeout: { type: 'number', description: 'Timeout in milliseconds (default: 60000)' },
          },
          required: ['command'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'list_files',
        description: 'List files and directories in a given path. Returns names, types, sizes, and extensions. Skips hidden files and common ignore directories like node_modules.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute or relative path to the directory' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'search_files',
        description: 'Search for a pattern in files within a directory. Returns matching file paths. Useful for finding where a function, class, or variable is used.',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: 'Text pattern or regex to search for' },
            directory: { type: 'string', description: 'Directory to search in' },
            includePattern: { type: 'string', description: 'Optional glob filter (e.g., "*.ts")' },
          },
          required: ['pattern', 'directory'],
        },
      },
    },
  ],

  // Gemini format
  gemini: [
    {
      functionDeclarations: [
        {
          name: 'read_file',
          description: 'Read the contents of a file at the given path.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file to read' },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_to_file',
          description: 'Write content to a file. Creates if not exists, overwrites if exists.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file' },
              content: { type: 'string', description: 'Content to write' },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'apply_diff',
          description: 'Apply search/replace diffs to a file.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to the file' },
              diffs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    oldText: { type: 'string', description: 'Exact text to find' },
                    newText: { type: 'string', description: 'Replacement text' },
                  },
                  required: ['oldText', 'newText'],
                },
              },
            },
            required: ['path', 'diffs'],
          },
        },
        {
          name: 'execute_command',
          description: 'Execute a shell command. Returns stdout, stderr, exit code.',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Shell command to execute' },
              timeout: { type: 'number', description: 'Timeout in ms (default 60000)' },
            },
            required: ['command'],
          },
        },
        {
          name: 'list_files',
          description: 'List files and directories at a given path.',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to list' },
            },
            required: ['path'],
          },
        },
        {
          name: 'search_files',
          description: 'Search for a pattern in files within a directory.',
          parameters: {
            type: 'object',
            properties: {
              pattern: { type: 'string', description: 'Pattern to search for' },
              directory: { type: 'string', description: 'Directory to search in' },
              includePattern: { type: 'string', description: 'Glob filter (e.g. "*.ts")' },
            },
            required: ['pattern', 'directory'],
          },
        },
      ],
    },
  ],
};

// ---- System Prompt ----

const SYSTEM_PROMPT = `You are ACUTE AGENT, an autonomous AI coding assistant built into a desktop application. You help developers write, refactor, debug, and understand code.

**Your capabilities:**
- Read, write, and edit files on the user's filesystem
- Execute shell commands (build, test, git, package managers, etc.)
- Search for patterns across codebases
- Apply targeted diffs to make precise edits

**How to work:**
1. **Understand** the user's request fully before acting
2. **Explore** the codebase first — read relevant files to understand context
3. **Plan** your approach — think through what needs to change
4. **Execute** — make changes systematically, one file at a time
5. **Verify** — run tests or commands to confirm changes work
6. **Summarize** — explain what you did and any important notes

**Best practices:**
- Use \`apply_diff\` for targeted edits (more precise than rewriting entire files)
- Use \`write_to_file\` only for new files or complete rewrites
- Always read a file before editing it to ensure your diffs match exactly
- Run tests after making changes when possible
- Be concise but thorough in explanations
- When showing code, use markdown code blocks with language tags
- If something might fail, mention it proactively

**Project context:** The user is working in their own project directory. Use relative paths when possible, absolute paths when needed. Always confirm the working directory context from the user's setup.`;

// ---- Helpers ----

function getOpenAIHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

function getAnthropicHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

// Convert AgentMessage[] to OpenAI format messages
function toOpenAIMessages(messages: AgentMessage[]): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        result.push({
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        });
      } else {
        result.push({ role: 'assistant', content: msg.content });
      }
    } else if (msg.role === 'tool') {
      result.push({
        role: 'tool',
        tool_call_id: msg.toolCallId,
        content: msg.content,
      });
    }
    // system messages beyond the first are merged
  }

  return result;
}

// Convert AgentMessage[] to Anthropic format
function toAnthropicMessages(messages: AgentMessage[]): { system: string; messages: Array<Record<string, unknown>> } {
  const convMessages: Array<Record<string, unknown>> = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      convMessages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        const content: Array<Record<string, unknown>> = [];
        if (msg.content) {
          content.push({ type: 'text', text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          });
        }
        convMessages.push({ role: 'assistant', content });
      } else {
        convMessages.push({ role: 'assistant', content: msg.content });
      }
    } else if (msg.role === 'tool') {
      convMessages.push({
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: msg.toolCallId,
          content: msg.content,
        }],
      });
    }
  }

  return { system: SYSTEM_PROMPT, messages: convMessages };
}

// Convert AgentMessage[] to Gemini format
function toGeminiMessages(messages: AgentMessage[]): { systemInstruction: { parts: Array<{ text: string }> }; contents: Array<Record<string, unknown>> } {
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const parts: Array<Record<string, unknown>> = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.arguments,
            },
          });
        }
      }
      if (m.role === 'tool') {
        return {
          role: 'function',
          parts: [{
            functionResponse: {
              name: m.toolCallId?.split('-')[0] || 'unknown',
              response: { result: m.content },
            },
          }],
        };
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
  };
}

// ---- Streaming SSE Parser ----

function parseSSELines(line: string): { type: string; data: any } | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6).trim();
  if (data === '[DONE]') return { type: 'done', data: null };
  try {
    return { type: 'chunk', data: JSON.parse(data) };
  } catch {
    return null;
  }
}

async function* streamOpenAI(
  config: AIConfig,
  messages: AgentMessage[],
): AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; content: string; toolCalls?: ToolCall[] }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const formattedMessages = toOpenAIMessages(messages);

  const body: Record<string, unknown> = {
    model: config.modelId,
    messages: formattedMessages,
    max_tokens: config.maxOutput || 8192,
    temperature: config.temperature || 0,
    tools: AGENT_TOOLS.openai,
    stream: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getOpenAIHeaders(config.apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `API error (${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson.error?.message || errJson.message || errorMsg;
    } catch {
      errorMsg += `: ${errorText.substring(0, 200)}`;
    }
    yield { type: 'error', content: errorMsg };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response stream' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const parsed = parseSSELines(line);
      if (!parsed) continue;
      if (parsed.type === 'done') continue;

      const delta = parsed.data?.choices?.[0]?.delta;
      if (!delta) continue;

      // Text token
      if (delta.content) {
        yield { type: 'token', content: delta.content };
      }

      // Tool calls (streamed incrementally)
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!accumulatedToolCalls.has(idx)) {
            accumulatedToolCalls.set(idx, {
              id: tc.id || `call_${idx}`,
              name: tc.function?.name || '',
              arguments: '',
            });
          }
          const existing = accumulatedToolCalls.get(idx)!;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
        }
      }
    }
  }

  // Emit accumulated tool calls
  if (accumulatedToolCalls.size > 0) {
    const toolCalls: ToolCall[] = [];
    const sortedIndices = [...accumulatedToolCalls.keys()].sort((a, b) => a - b);
    for (const idx of sortedIndices) {
      const tc = accumulatedToolCalls.get(idx)!;
      try {
        toolCalls.push({
          id: tc.id,
          name: tc.name,
          arguments: JSON.parse(tc.arguments || '{}'),
        });
      } catch {
        toolCalls.push({
          id: tc.id,
          name: tc.name,
          arguments: {},
        });
      }
    }
    yield { type: 'tool_call', content: '', toolCalls };
  }

  yield { type: 'done', content: '' };
}

async function* streamAnthropic(
  config: AIConfig,
  messages: AgentMessage[],
): AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; content: string; toolCalls?: ToolCall[] }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/v1/messages`;
  const { system, messages: formattedMessages } = toAnthropicMessages(messages);

  const body: Record<string, unknown> = {
    model: config.modelId,
    max_tokens: config.maxOutput || 8192,
    system,
    messages: formattedMessages,
    tools: AGENT_TOOLS.openai.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    })),
    stream: true,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getAnthropicHeaders(config.apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Anthropic API error (${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson.error?.message || errorMsg;
    } catch {
      errorMsg += `: ${errorText.substring(0, 200)}`;
    }
    yield { type: 'error', content: errorMsg };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response stream' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let currentToolUse: { id: string; name: string; inputStr: string } | null = null;
  const toolCalls: ToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const event = JSON.parse(data);

        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if (delta?.type === 'text_delta' && delta.text) {
            yield { type: 'token', content: delta.text };
          } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
            if (currentToolUse) {
              currentToolUse.inputStr += delta.partial_json;
            }
          }
        } else if (event.type === 'content_block_start') {
          if (event.content_block?.type === 'tool_use') {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputStr: '',
            };
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolUse) {
            try {
              toolCalls.push({
                id: currentToolUse.id,
                name: currentToolUse.name,
                arguments: JSON.parse(currentToolUse.inputStr || '{}'),
              });
            } catch {
              toolCalls.push({
                id: currentToolUse.id,
                name: currentToolUse.name,
                arguments: {},
              });
            }
            currentToolUse = null;
          }
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  if (toolCalls.length > 0) {
    yield { type: 'tool_call', content: '', toolCalls };
  }

  yield { type: 'done', content: '' };
}

async function* streamGemini(
  config: AIConfig,
  messages: AgentMessage[],
): AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; content: string; toolCalls?: ToolCall[] }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/v1beta/models/${config.modelId}:streamGenerateContent?key=${config.apiKey}&alt=sse`;
  const { systemInstruction, contents } = toGeminiMessages(messages);

  const body: Record<string, unknown> = {
    contents,
    systemInstruction,
    generationConfig: {
      maxOutputTokens: config.maxOutput || 8192,
      temperature: config.temperature || 0,
    },
    tools: AGENT_TOOLS.gemini,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Gemini API error (${response.status})`;
    try {
      const errJson = JSON.parse(errorText);
      errorMsg = errJson.error?.message || errorMsg;
    } catch {
      errorMsg += `: ${errorText.substring(0, 200)}`;
    }
    yield { type: 'error', content: errorMsg };
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', content: 'No response stream' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const toolCalls: ToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const parsed = parseSSELines(line);
      if (!parsed || parsed.type !== 'chunk') continue;

      const candidate = parsed.data?.candidates?.[0];
      if (!candidate) continue;

      for (const part of candidate.content?.parts || []) {
        if (part.text) {
          yield { type: 'token', content: part.text };
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${toolCalls.length}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }
    }
  }

  if (toolCalls.length > 0) {
    yield { type: 'tool_call', content: '', toolCalls };
  }

  yield { type: 'done', content: '' };
}

// ---- Non-Streaming Fallback ----

async function callNonStreaming(config: AIConfig, messages: AgentMessage[]): Promise<AgentResponse> {
  const { providerId } = config;
  let text = '';
  const toolCalls: ToolCall[] = [];

  if (providerId === 'anthropic') {
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/messages`;
    const { system, messages: formattedMessages } = toAnthropicMessages(messages);

    const body: Record<string, unknown> = {
      model: config.modelId,
      max_tokens: config.maxOutput || 8192,
      system,
      messages: formattedMessages,
      tools: AGENT_TOOLS.openai.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      })),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getAnthropicHeaders(config.apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Anthropic API error (${response.status})`;
      try { const e = JSON.parse(errorText); errorMsg = e.error?.message || errorMsg; } catch { errorMsg += `: ${errorText.substring(0, 200)}`; }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    for (const block of data.content || []) {
      if (block.type === 'text') text += block.text;
      if (block.type === 'tool_use') {
        toolCalls.push({ id: block.id, name: block.name, arguments: block.input || {} });
      }
    }
  } else if (providerId === 'gemini') {
    const url = `${config.baseUrl.replace(/\/$/, '')}/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`;
    const { systemInstruction, contents } = toGeminiMessages(messages);

    const body: Record<string, unknown> = {
      contents, systemInstruction,
      generationConfig: { maxOutputTokens: config.maxOutput || 8192, temperature: config.temperature || 0 },
      tools: AGENT_TOOLS.gemini,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Gemini API error (${response.status})`;
      try { const e = JSON.parse(errorText); errorMsg = e.error?.message || errorMsg; } catch { errorMsg += `: ${errorText.substring(0, 200)}`; }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.text) text += part.text;
      if (part.functionCall) {
        toolCalls.push({ id: `call_${toolCalls.length}`, name: part.functionCall.name, arguments: part.functionCall.args || {} });
      }
    }
  } else {
    // OpenAI-compatible
    const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const formattedMessages = toOpenAIMessages(messages);

    const body: Record<string, unknown> = {
      model: config.modelId,
      messages: formattedMessages,
      max_tokens: config.maxOutput || 8192,
      temperature: config.temperature || 0,
      tools: AGENT_TOOLS.openai,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: getOpenAIHeaders(config.apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `API error (${response.status})`;
      try { const e = JSON.parse(errorText); errorMsg = e.error?.message || e.error?.message || errorMsg; } catch { errorMsg += `: ${errorText.substring(0, 200)}`; }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message;
    text = msg?.content || '';
    if (msg?.tool_calls) {
      for (const tc of msg.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        });
      }
    }
  }

  return {
    text,
    toolCalls,
    isComplete: true,
  };
}

// ---- Public API ----

export async function streamAIResponse(
  config: AIConfig,
  messages: AgentMessage[],
): Promise<AsyncGenerator<{ type: 'token' | 'tool_call' | 'done' | 'error'; content: string; toolCalls?: ToolCall[] }>> {
  const { providerId } = config;

  try {
    switch (providerId) {
      case 'anthropic':
        return streamAnthropic(config, messages);
      case 'gemini':
        return streamGemini(config, messages);
      default:
        return streamOpenAI(config, messages);
    }
  } catch (error) {
    // If streaming fails, fall back to non-streaming
    return (async function* () {
      try {
        const result = await callNonStreaming(config, messages);
        if (result.text) {
          yield { type: 'token', content: result.text };
        }
        if (result.toolCalls.length > 0) {
          yield { type: 'tool_call', content: '', toolCalls: result.toolCalls };
        }
        yield { type: 'done', content: '' };
      } catch (err) {
        yield { type: 'error', content: err instanceof Error ? err.message : String(err) };
      }
    })();
  }
}

export async function sendAITools(
  config: AIConfig,
  messages: AgentMessage[],
): Promise<AgentResponse> {
  return callNonStreaming(config, messages);
}

// ---- Demo Mode ----

export async function demoResponse(userMessage: string): Promise<AgentResponse> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const lower = userMessage.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      text: "Hey! I'm ACUTE AGENT, your AI coding assistant. I'm currently running in **demo mode** since no model is configured.\n\nTo get full AI capabilities, go to **Settings → Model** and connect an API provider.\n\nWhile in demo mode, I can help you explore the interface. Try asking me to explain code, suggest refactors, or help with a coding problem!",
      toolCalls: [],
      isComplete: true,
    };
  }

  if (lower.includes('help') || lower.includes('what can you do')) {
    return {
      text: `Here's what I can do once you connect a model:

• **Read Files** — I can read any file in your project
• **Write Files** — Create new files or rewrite existing ones
• **Edit Files** — Apply precise search/replace diffs
• **Run Commands** — Execute terminal commands (build, test, git)
• **Search Code** — Find patterns across your codebase
• **Explain Code** — Break down complex code
• **Debug** — Find and fix bugs
• **Refactor** — Clean up, optimize, modernize code

**To activate**: Open a project folder → Settings → Model → Connect your API key`,
      toolCalls: [],
      isComplete: true,
    };
  }

  return {
    text: `I received your message: "${userMessage}"\n\nI'm currently in **demo mode** — I can understand your request but need a connected AI model to provide full responses with tool use.\n\nTo enable full agent capabilities:\n1. Go to **Settings → Model**\n2. Choose a provider (OpenAI, Anthropic, etc.)\n3. Paste your API key\n4. Select a model\n\nYour keys are stored **locally only** and never leave your machine.`,
    toolCalls: [],
    isComplete: true,
  };
}

// Re-export types for backward compatibility
export type { ChatMessage as LegacyChatMessage, ActionPill, CodeDiff } from './project-chat-store';
