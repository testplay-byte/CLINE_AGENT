'use client';

import type { ChatMessage, ActionPill, CodeDiff } from './project-chat-store';

// ============================================================
// AI SERVICE — Connects chat to LLM providers
// All calls are made directly from the client to the provider API.
// API keys never leave the user's machine.
// ============================================================

export interface AIConfig {
  providerId: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
  maxOutput: number;
  temperature: number;
  contextWindow: number;
}

interface AIResponse {
  text: string;
  actions?: ActionPill[];
  diff?: CodeDiff;
  thoughts?: string;
}

// Map provider IDs to API formats
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

// Convert messages to OpenAI format
function toOpenAIMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];
  // System prompt
  result.push({
    role: 'system',
    content: `You are ACUTE AGENT, an autonomous AI coding assistant built into a desktop application. You help developers write, refactor, debug, and understand code. You are concise, helpful, and technically precise. When showing code changes, use markdown code blocks. You have access to the user's project files and can help with any coding task.`,
  });

  for (const msg of messages) {
    if (msg.type === 'user') {
      result.push({ role: 'user', content: msg.content });
    } else if (msg.type === 'ai') {
      result.push({ role: 'assistant', content: msg.content });
    } else if (msg.type === 'thought') {
      // Include thoughts as assistant content with a prefix
      result.push({ role: 'assistant', content: `[thinking] ${msg.content}` });
    }
    // Skip 'actions' and 'diff' types — they're visual only
  }

  return result;
}

// Call OpenAI-compatible API (OpenAI, Groq, OpenRouter, Together, DeepSeek, Mistral, etc.)
async function callOpenAICompatible(config: AIConfig, messages: ChatMessage[]): Promise<AIResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const formattedMessages = toOpenAIMessages(messages);

  const body: Record<string, unknown> = {
    model: config.modelId,
    messages: formattedMessages,
    max_tokens: config.maxOutput || 8192,
    temperature: config.temperature || 0.7,
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
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || 'No response from model.';

  return { text };
}

// Call Anthropic API
async function callAnthropic(config: AIConfig, messages: ChatMessage[]): Promise<AIResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/v1/messages`;

  // Extract system message and conversation messages separately
  const allMessages = toOpenAIMessages(messages);
  const systemMessage = allMessages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = allMessages.filter(m => m.role !== 'system');

  const body: Record<string, unknown> = {
    model: config.modelId,
    max_tokens: config.maxOutput || 8192,
    system: systemMessage,
    messages: conversationMessages,
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
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || 'No response from Claude.';

  return { text };
}

// Call Gemini API
async function callGemini(config: AIConfig, messages: ChatMessage[]): Promise<AIResponse> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/v1beta/models/${config.modelId}:generateContent?key=${config.apiKey}`;

  const allMessages = toOpenAIMessages(messages);
  const systemMessage = allMessages.find(m => m.role === 'system')?.content || '';

  const contents = allMessages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: config.maxOutput || 8192,
      temperature: config.temperature || 0.7,
    },
  };

  if (systemMessage) {
    body.systemInstruction = { parts: [{ text: systemMessage }] };
  }

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
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

  return { text };
}

// ============================================================
// MAIN SEND FUNCTION
// ============================================================
export async function sendToAI(config: AIConfig, messages: ChatMessage[]): Promise<AIResponse> {
  const { providerId } = config;

  switch (providerId) {
    case 'anthropic':
      return callAnthropic(config, messages);
    case 'gemini':
      return callGemini(config, messages);
    case 'openai':
    case 'groq':
    case 'openrouter':
    case 'mistral':
    case 'cohere':
    case 'together':
    case 'deepseek':
    case 'openai-compatible':
    default:
      return callOpenAICompatible(config, messages);
  }
}

// ============================================================
// DEMO MODE — Simulated AI responses when no API key is configured
// ============================================================
export async function demoResponse(userMessage: string): Promise<AIResponse> {
  // Simulate a short delay to feel natural
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const lower = userMessage.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      thoughts: 'User is greeting. Respond warmly and offer help.',
      text: "Hey! I'm ACUTE AGENT, your AI coding assistant. I'm currently running in **demo mode** since no model is configured.\n\nTo get full AI capabilities, go to **Settings → Model** and connect an API provider.\n\nWhile in demo mode, I can help you explore the interface. Try asking me to explain code, suggest refactors, or help with a coding problem!",
    };
  }

  if (lower.includes('help') || lower.includes('what can you do')) {
    return {
      thoughts: 'User wants to know capabilities. List them clearly.',
      text: "Here's what I can do once you connect a model:\n\n• **Write Code** — Generate functions, components, modules\n• **Refactor** — Clean up, optimize, modernize code\n• **Debug** — Find and fix bugs\n• **Explain** — Break down complex code\n• **Test** — Write unit tests\n• **Review** — Code review and suggestions\n\n**To activate**: Settings → Model → Connect your API key",
    };
  }

  return {
    thoughts: 'Processing user request in demo mode. Provide helpful response.',
    text: `I received your message: "${userMessage}"\n\nI'm currently in **demo mode** — I can understand your request but need a connected AI model to provide full responses.\n\nTo enable full AI capabilities:\n1. Go to **Settings → Model**\n2. Choose a provider (OpenAI, Anthropic, etc.)\n3. Paste your API key\n4. Select a model\n\nYour keys are stored **locally only** and never leave your machine.`,
  };
}
