'use client';

import { create } from 'zustand';
import { streamAIResponse, demoResponse, type AIConfig, type AgentMessage, type ToolCall, type ToolResult } from './ai-service';

// ============================================================
// TYPES
// ============================================================

export type ChatPanelPosition = 'right' | 'left' | 'center';
export type PanelId = 'explorer';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  lang?: string;
  lines?: number;
  path?: string;
  children?: FileNode[];
}

export interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

export interface ActionPill {
  icon: 'file' | 'search' | 'edit' | 'terminal';
  label: string;
  duration: string;
}

export interface CodeDiff {
  fileName: string;
  additions: string;
  context?: string;
  deletions?: string;
  status: 'applied' | 'pending' | 'rejected';
}

export type MessageType = 'user' | 'ai' | 'thought' | 'actions' | 'diff' | 'tool_use' | 'tool_result' | 'terminal' | 'error';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  actions?: ActionPill[];
  diff?: CodeDiff;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  toolIsError?: boolean;
  terminalOutput?: string;
  timestamp?: string;
  isStreaming?: boolean;
}

export interface PanelConfig {
  id: PanelId;
  label: string;
  icon: string;
  defaultCollapsed: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export interface PermissionRequest {
  id: string;
  toolName: string;
  description: string;
  args: Record<string, unknown>;
  resolve: (approved: boolean) => void;
}

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number | null;
  duration: number;
  timestamp: string;
}

// ============================================================
// MODEL OPTIONS
// ============================================================

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-4', name: 'Claude 4', provider: 'Anthropic', description: 'Most capable model' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Fast & reliable' },
  { id: 'gemini-2.5', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Long context window' },
  { id: 'llama-3.1', name: 'Llama 3.1 405B', provider: 'Meta', description: 'Open weights' },
];

// ============================================================
// PANEL DEFAULTS
// ============================================================

export const PANEL_CONFIGS: Record<PanelId, PanelConfig> = {
  explorer: { id: 'explorer', label: 'Explorer', icon: 'Files', defaultCollapsed: false },
};

export const DEFAULT_PANEL_ORDER: PanelId[] = ['explorer'];

// ============================================================
// FREE-FORM PANEL POSITIONS (for experimental mode)
// ============================================================

export interface FreeformPanel {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
}

export const DEFAULT_FREEFORM_PANELS: FreeformPanel[] = [
  { id: 'sidebar', title: 'Explorer', x: 20, y: 50, width: 280, height: 420, zIndex: 10, minimized: false },
  { id: 'code', title: 'Code', x: 320, y: 50, width: 580, height: 420, zIndex: 9, minimized: false },
  { id: 'chat', title: 'Agent Chat', x: 920, y: 50, width: 360, height: 420, zIndex: 11, minimized: false },
  { id: 'todo', title: 'To-Do', x: 320, y: 490, width: 280, height: 220, zIndex: 8, minimized: false },
];

// ============================================================
// HELPER: Get Electron API
// ============================================================

function getElectronAPI() {
  if (typeof window !== 'undefined' && (window as any).acuteAgent) {
    return (window as any).acuteAgent;
  }
  return null;
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).acuteAgent?.isElectron;
}

// ============================================================
// HELPER: Generate unique ID
// ============================================================

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// HELPER: Get AI config from localStorage
// ============================================================

function getAIConfig(): { config: AIConfig | null; isDemo: boolean } {
  const raw = localStorage.getItem('acute-agent-config');
  if (!raw) return { config: null, isDemo: true };

  try {
    const parsed = JSON.parse(raw);
    if (parsed.apiKey && parsed.apiKey.length > 6 && parsed.modelId !== 'demo') {
      return {
        config: {
          providerId: parsed.providerId || 'openai',
          baseUrl: parsed.baseUrl || 'https://api.openai.com/v1',
          apiKey: parsed.apiKey,
          modelId: parsed.modelId,
          maxOutput: parsed.maxOutput || 8192,
          temperature: parsed.temperature || 0,
          contextWindow: parsed.contextWindow || 100000,
        },
        isDemo: false,
      };
    }
  } catch { /* ignore */ }

  return { config: null, isDemo: true };
}

// ============================================================
// TOOL EXECUTION ENGINE
// ============================================================

async function executeTool(toolCall: ToolCall, cwd: string): Promise<ToolResult> {
  const electron = getElectronAPI();
  const startTime = Date.now();

  try {
    switch (toolCall.name) {
      case 'read_file': {
        const path = String(toolCall.arguments.path);
        if (electron) {
          const result = await electron.file.readFile(path);
          if (result.success) {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `File: ${result.name}\nPath: ${result.path}\nLines: ${result.lines}\n\n${result.content}` };
          } else {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Error: ${result.error}`, isError: true };
          }
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: File reading is not available in web mode. Use the Electron desktop app for full agent capabilities.', isError: true };
      }

      case 'write_to_file': {
        const path = String(toolCall.arguments.path);
        const content = String(toolCall.arguments.content);
        if (electron) {
          const result = await electron.file.writeFile(path, content);
          if (result.success) {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Successfully wrote ${result.lines} lines to ${result.name} (${result.path})` };
          } else {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Error writing file: ${result.error}`, isError: true };
          }
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: File writing is not available in web mode.', isError: true };
      }

      case 'apply_diff': {
        const path = String(toolCall.arguments.path);
        const diffs = (toolCall.arguments.diffs || []) as Array<{ oldText: string; newText: string }>;
        if (electron) {
          const result = await electron.file.applyDiff(path, diffs);
          if (result.success) {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Applied ${result.appliedCount}/${result.totalDiffs} diffs to ${result.name}. File now has ${result.newLines} lines.` };
          } else {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Diff error: ${result.error}`, isError: true };
          }
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: Diff application not available in web mode.', isError: true };
      }

      case 'execute_command': {
        const command = String(toolCall.arguments.command);
        const timeout = Number(toolCall.arguments.timeout) || 60000;
        if (electron) {
          const result = await electron.agent.executeCommand(command, { cwd, timeout });
          const duration = Math.round(result.duration / 1000);
          let output = `Command: ${command}\nExit Code: ${result.exitCode}\nDuration: ${duration}s`;
          if (result.stdout) output += `\n\n[stdout]\n${result.stdout}`;
          if (result.stderr) output += `\n\n[stderr]\n${result.stderr}`;
          if (result.timedOut) output += `\n\n⚠️ Command timed out after ${timeout}ms`;
          return { toolCallId: toolCall.id, name: toolCall.name, result: output, isError: !result.success };
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: Command execution not available in web mode. Use the Electron desktop app.', isError: true };
      }

      case 'list_files': {
        const path = String(toolCall.arguments.path);
        if (electron) {
          const result = await electron.file.listDirectory(path);
          if (result.success) {
            const listing = result.items.map((item: any) => {
              const prefix = item.type === 'folder' ? '📁' : '📄';
              const info = item.size ? ` (${Math.round(item.size / 1024)}KB)` : '';
              return `  ${prefix} ${item.name}${info}`;
            }).join('\n');
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Directory: ${result.path}\n${result.items.length} items:\n${listing}` };
          } else {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Error: ${result.error}`, isError: true };
          }
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: Directory listing not available in web mode.', isError: true };
      }

      case 'search_files': {
        const pattern = String(toolCall.arguments.pattern);
        const directory = String(toolCall.arguments.directory);
        const includePattern = toolCall.arguments.includePattern ? String(toolCall.arguments.includePattern) : undefined;
        if (electron) {
          const result = await electron.file.searchFiles({ pattern, directory, includePattern });
          if (result.success && result.files.length > 0) {
            const listing = result.files.map((f: string) => `  📄 ${f}`).join('\n');
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Found ${result.count} files matching "${pattern}":\n${listing}` };
          } else if (result.success) {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `No files found matching "${pattern}" in ${directory}` };
          } else {
            return { toolCallId: toolCall.id, name: toolCall.name, result: `Error: ${result.error}`, isError: true };
          }
        }
        return { toolCallId: toolCall.id, name: toolCall.name, result: 'Error: File search not available in web mode.', isError: true };
      }

      default:
        return { toolCallId: toolCall.id, name: toolCall.name, result: `Unknown tool: ${toolCall.name}`, isError: true };
    }
  } catch (error) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}

// ============================================================
// STATE
// ============================================================

interface ProjectChatState {
  // Chat panel position
  chatPanelPosition: ChatPanelPosition;
  setChatPanelPosition: (pos: ChatPanelPosition) => void;

  // Experimental mode
  experimentalMode: boolean;
  setExperimentalMode: (on: boolean) => void;
  freeformPanels: FreeformPanel[];
  updateFreeformPanel: (id: string, updates: Partial<FreeformPanel>) => void;

  // Chat
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  sendMessage: () => void;
  stopAgent: () => void;
  showSuggestion: boolean;
  dismissSuggestion: () => void;

  // Agent status
  isAgentThinking: boolean;
  agentStatus: string;
  setAgentThinking: (thinking: boolean, status?: string) => void;
  isAgentRunning: boolean;

  // Project
  projectFolder: string | null;
  setProjectFolder: (folder: string | null) => void;
  openProjectFolder: () => Promise<void>;

  // Todo items
  todoItems: TodoItem[];
  addTodoItem: (text: string) => void;
  removeTodoItem: (id: number) => void;
  toggleTodo: (id: number) => void;

  // Files (real)
  files: FileNode[];
  selectedFileId: string | null;
  selectedFilePath: string | null;
  selectFile: (id: string, path?: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  refreshExplorer: () => Promise<void>;

  // Code view (real)
  code: string;
  codeFilePath: string | null;
  codeFileName: string | null;
  loadFileContent: (path: string) => Promise<void>;

  // Panels (sidebar)
  panelOrder: PanelId[];
  setPanelOrder: (order: PanelId[]) => void;
  collapsedPanels: Set<string>;
  togglePanel: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Model
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;

  // Code visibility
  codeVisible: boolean;
  setCodeVisible: (v: boolean) => void;

  // Hamburger menu
  hamburgerOpen: boolean;
  setHamburgerOpen: (open: boolean) => void;

  // Permission system
  pendingPermission: PermissionRequest | null;
  resolvePermission: (approved: boolean) => void;

  // Agent conversation history (for context)
  agentMessages: AgentMessage[];
  clearConversation: () => void;
}

let nextTodoId = 100;

export const useProjectChatStore = create<ProjectChatState>((set, get) => ({
  // Chat panel position
  chatPanelPosition: 'right',
  setChatPanelPosition: (pos) => set({ chatPanelPosition: pos }),

  // Experimental mode
  experimentalMode: false,
  setExperimentalMode: (on) => set({ experimentalMode: on }),
  freeformPanels: DEFAULT_FREEFORM_PANELS,
  updateFreeformPanel: (id, updates) => set((s) => ({
    freeformPanels: s.freeformPanels.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  // Chat
  messages: [],
  inputMessage: '',
  setInputMessage: (msg) => set({ inputMessage: msg }),
  sendMessage: async () => {
    const { inputMessage, messages, isAgentRunning } = get();
    if (!inputMessage.trim() || isAgentRunning) return;
    const trimmed = inputMessage.trim();

    const userMsg: ChatMessage = {
      id: `m-${uid()}`,
      type: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set({
      messages: [...messages, userMsg],
      inputMessage: '',
      showSuggestion: false,
      isAgentRunning: true,
      isAgentThinking: true,
      agentStatus: 'Processing...',
    });

    try {
      const { config: aiConfig, isDemo } = getAIConfig();
      const store = get();

      if (isDemo || !aiConfig) {
        // Demo mode
        set({ agentStatus: 'Demo mode active' });
        const result = await demoResponse(trimmed);
        set({ isAgentThinking: false, agentStatus: '' });
        set({
          messages: [...get().messages, {
            id: `m-${uid()}`,
            type: 'ai',
            content: result.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }],
        });
        set({ isAgentRunning: false });
        return;
      }

      // Real agent mode — run the agentic loop
      const cwd = store.projectFolder || process.cwd?.() || '/';

      // Add user message to agent conversation history
      const agentMessages: AgentMessage[] = [...get().agentMessages, { role: 'user', content: trimmed }];
      set({ agentMessages });

      const MAX_ITERATIONS = 25;
      let iteration = 0;
      let currentMessages = [...agentMessages];

      while (iteration < MAX_ITERATIONS) {
        iteration++;
        set({ agentStatus: iteration === 1 ? 'Thinking...' : `Step ${iteration}...` });

        // Stream the AI response
        const stream = await streamAIResponse(aiConfig, currentMessages);
        let fullText = '';
        let collectedToolCalls: ToolCall[] = [];
        let aiMsgId = `m-${uid()}`;

        // Add a streaming AI message
        set({
          messages: [...get().messages, {
            id: aiMsgId,
            type: 'ai',
            content: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isStreaming: true,
          }],
        });

        for await (const chunk of stream) {
          if (chunk.type === 'token') {
            fullText += chunk.content;
            // Update the streaming message
            set({
              messages: get().messages.map(m =>
                m.id === aiMsgId ? { ...m, content: fullText } : m
              ),
            });
          } else if (chunk.type === 'tool_call' && chunk.toolCalls) {
            collectedToolCalls = chunk.toolCalls;
          } else if (chunk.type === 'error') {
            set({
              messages: get().messages.map(m =>
                m.id === aiMsgId ? { ...m, type: 'error', content: `**Error:** ${chunk.content}` } : m
              ),
              isAgentThinking: false,
              agentStatus: '',
              isAgentRunning: false,
            });
            return;
          }
        }

        // Mark streaming message as complete
        set({
          messages: get().messages.map(m =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          ),
        });

        // If no tool calls, the agent is done
        if (collectedToolCalls.length === 0) {
          // Save assistant message to agent history
          set({ agentMessages: [...get().agentMessages, { role: 'assistant', content: fullText }] });
          break;
        }

        // Save assistant message with tool calls to history
        const assistantMsg: AgentMessage = {
          role: 'assistant',
          content: fullText,
          toolCalls: collectedToolCalls,
        };

        // Display tool call messages in chat
        const toolCallMessages: ChatMessage[] = collectedToolCalls.map(tc => ({
          id: `tool-${uid()}`,
          type: 'tool_use' as MessageType,
          content: '',
          toolName: tc.name,
          toolArgs: tc.arguments,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        set({ messages: [...get().messages, ...toolCallMessages] });

        // Execute each tool call
        const toolResults: ToolResult[] = [];
        for (const tc of collectedToolCalls) {
          set({ agentStatus: `Executing ${tc.name}...` });
          const result = await executeTool(tc, cwd);
          toolResults.push(result);

          // Create action pill for the tool execution
          const duration = `${Math.round((Date.now() - (Date.now() - 100)) / 10) / 100}s`;
          const iconMap: Record<string, 'file' | 'search' | 'edit' | 'terminal'> = {
            read_file: 'file',
            list_files: 'search',
            search_files: 'search',
            write_to_file: 'file',
            apply_diff: 'edit',
            execute_command: 'terminal',
          };

          // Display tool result in chat
          const argsSummary = Object.entries(tc.arguments).map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 60) : JSON.stringify(v).slice(0, 60)}`).join(', ');
          set({
            messages: [...get().messages, {
              id: `toolresult-${uid()}`,
              type: 'tool_result' as MessageType,
              content: result.result,
              toolName: tc.name,
              toolIsError: result.isError,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }],
          });
        }

        // Build tool result messages for the API
        const toolResultMessages: AgentMessage[] = toolResults.map(tr => ({
          role: 'tool' as const,
          content: tr.result,
          toolCallId: tr.toolCallId,
        }));

        // Update agent history
        currentMessages = [
          ...currentMessages,
          assistantMsg,
          ...toolResultMessages,
        ];
        set({ agentMessages: currentMessages });

        // If there are terminal commands, refresh the explorer
        if (collectedToolCalls.some(tc => tc.name === 'execute_command' || tc.name === 'write_to_file' || tc.name === 'apply_diff')) {
          get().refreshExplorer();
        }
      }

      set({ isAgentThinking: false, agentStatus: '', isAgentRunning: false });

      if (iteration >= MAX_ITERATIONS) {
        set({
          messages: [...get().messages, {
            id: `m-${uid()}`,
            type: 'thought',
            content: 'Reached maximum iteration limit (25 steps). The agent stopped to prevent infinite loops.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }],
        });
      }
    } catch (error) {
      set({ isAgentThinking: false, agentStatus: '', isAgentRunning: false });
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      set({
        messages: [...get().messages, {
          id: `err-${uid()}`,
          type: 'error',
          content: `**Error:** ${errorMsg}\n\nCheck your API key and model configuration in Settings → Model.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }],
      });
    }
  },
  stopAgent: () => {
    set({ isAgentRunning: false, isAgentThinking: false, agentStatus: 'Stopped by user' });
  },
  showSuggestion: false,
  dismissSuggestion: () => set({ showSuggestion: false }),

  // Agent status
  isAgentThinking: false,
  agentStatus: '',
  setAgentThinking: (thinking, status) => set({
    isAgentThinking: thinking,
    agentStatus: status || '',
  }),
  isAgentRunning: false,

  // Project
  projectFolder: null,
  setProjectFolder: (folder) => {
    set({ projectFolder: folder });
    if (folder) {
      localStorage.setItem('acute-agent-project-folder', folder);
    }
  },
  openProjectFolder: async () => {
    const electron = getElectronAPI();
    if (!electron) return;
    const folder = await electron.file.openFolder();
    if (folder) {
      const store = get();
      store.setProjectFolder(folder);
      store.refreshExplorer();
    }
  },

  // Todo items
  todoItems: [],
  addTodoItem: (text) => set((s) => ({
    todoItems: [...s.todoItems, { id: nextTodoId++, text, done: false }],
  })),
  removeTodoItem: (id) => set((s) => ({
    todoItems: s.todoItems.filter((t) => t.id !== id),
  })),
  toggleTodo: (id) => set((s) => ({
    todoItems: s.todoItems.map((t) => t.id === id ? { ...t, done: !t.done } : t),
  })),

  // Files (real)
  files: [],
  selectedFileId: null,
  selectedFilePath: null,
  selectFile: (id, path) => set({ selectedFileId: id, selectedFilePath: path || null }),
  expandedFolders: new Set<string>(),
  toggleFolder: (id) => set((s) => {
    const next = new Set(s.expandedFolders);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { expandedFolders: next };
  }),
  refreshExplorer: async () => {
    const electron = getElectronAPI();
    const folder = get().projectFolder;
    if (!electron || !folder) return;

    try {
      const result = await electron.file.listDirectory(folder, { maxDepth: 3 });
      if (result.success && result.items) {
        const fileNodes = mapToTree(result.items, folder);
        set({ files: fileNodes });
      }
    } catch { /* silently fail */ }
  },

  // Code view (real)
  code: '',
  codeFilePath: null,
  codeFileName: null,
  loadFileContent: async (path: string) => {
    const electron = getElectronAPI();
    if (!electron) {
      set({ code: 'File content preview requires the Electron desktop app.' });
      return;
    }
    try {
      const result = await electron.file.readFile(path);
      if (result.success) {
        set({
          code: result.content,
          codeFilePath: result.path,
          codeFileName: result.name,
        });
      } else {
        set({ code: `Error reading file: ${result.error}` });
      }
    } catch {
      set({ code: 'Error reading file.' });
    }
  },

  // Panels
  panelOrder: DEFAULT_PANEL_ORDER,
  setPanelOrder: (order) => set({ panelOrder: order }),
  collapsedPanels: new Set<string>(),
  togglePanel: (id) => set((s) => {
    const next = new Set(s.collapsedPanels);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { collapsedPanels: next };
  }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Model
  selectedModelId: 'claude-4',
  setSelectedModelId: (id) => set({ selectedModelId: id }),

  // Code visibility
  codeVisible: true,
  setCodeVisible: (v) => set({ codeVisible: v }),

  // Hamburger menu
  hamburgerOpen: false,
  setHamburgerOpen: (open) => set({ hamburgerOpen: open }),

  // Permission system
  pendingPermission: null,
  resolvePermission: (approved) => set({ pendingPermission: null }),

  // Agent conversation history
  agentMessages: [],
  clearConversation: () => set({
    messages: [],
    agentMessages: [],
    todoItems: [],
    code: '',
    codeFilePath: null,
    codeFileName: null,
    showSuggestion: true,
  }),
}));

// ============================================================
// HELPER: Convert flat file list to tree structure
// ============================================================

function mapToTree(items: Array<{ name: string; path: string; type: string; children?: any[]; size?: number; extension?: string }>, rootPath: string): FileNode[] {
  const nodes: FileNode[] = [];
  for (const item of items) {
    const node: FileNode = {
      id: item.path,
      name: item.name,
      type: item.type as 'file' | 'folder',
      path: item.path,
    };
    if (item.type === 'folder' && item.children && item.children.length > 0) {
      node.children = mapToTree(item.children, rootPath);
    }
    if (item.extension) node.lang = item.extension.replace('.', '');
    nodes.push(node);
  }
  return nodes;
}

// ============================================================
// INIT: Restore project folder from localStorage
// ============================================================

if (typeof window !== 'undefined') {
  const savedFolder = localStorage.getItem('acute-agent-project-folder');
  if (savedFolder) {
    // Delay to let store initialize
    setTimeout(() => {
      const store = useProjectChatStore.getState();
      store.setProjectFolder(savedFolder);
      store.refreshExplorer();
    }, 100);
  }
}
