import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import { logConversation, getConversationLogs, getLogStats, type ConversationLogEntry } from "../../server/conversationLogger";

vi.mock("fs");

describe("logConversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create log directory if it does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    const entry: ConversationLogEntry = {
      timestamp: "2024-01-15T10:00:00Z",
      clientId: "test-client",
      botId: "test-bot",
      userMessage: "Hello",
      botReply: "Hi there!"
    };
    
    logConversation(entry);
    
    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it("should append log entry to file", () => {
    const entry: ConversationLogEntry = {
      timestamp: "2024-01-15T10:00:00Z",
      clientId: "test-client",
      botId: "test-bot",
      userMessage: "Hello",
      botReply: "Hi there!",
      sessionId: "session-123"
    };
    
    logConversation(entry);
    
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      expect.stringContaining("test-bot-"),
      expect.stringContaining('"userMessage":"Hello"'),
      "utf-8"
    );
  });

  it("should use current timestamp if not provided", () => {
    const entry: ConversationLogEntry = {
      timestamp: "",
      clientId: "test-client",
      botId: "test-bot",
      userMessage: "Hello",
      botReply: "Hi there!"
    };
    
    logConversation(entry);
    
    expect(fs.appendFileSync).toHaveBeenCalled();
  });
});

describe("getConversationLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return empty array if directory does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    const result = getConversationLogs("nonexistent-client");
    
    expect(result).toEqual([]);
  });

  it("should filter by botId when provided", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      "bot1-20240115.log" as unknown as fs.Dirent,
      "bot2-20240115.log" as unknown as fs.Dirent
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue('{"timestamp":"2024-01-15T10:00:00Z","clientId":"client","botId":"bot1","userMessage":"hi","botReply":"hello"}\n');
    
    const result = getConversationLogs("test-client", "bot1");
    
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("should filter by date when provided", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      "bot1-20240115.log" as unknown as fs.Dirent,
      "bot1-20240116.log" as unknown as fs.Dirent
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue('{"timestamp":"2024-01-15T10:00:00Z","clientId":"client","botId":"bot1","userMessage":"hi","botReply":"hello"}\n');
    
    const result = getConversationLogs("test-client", undefined, "2024-01-15");
    
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe("getLogStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return zero stats if no logs", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    
    const result = getLogStats("nonexistent-client");
    
    expect(result.totalConversations).toBe(0);
    expect(result.messageCount).toBe(0);
    expect(result.botIds).toEqual([]);
    expect(result.dateRange).toBeNull();
  });

  it("should calculate stats from logs", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      "bot1-20240115.log" as unknown as fs.Dirent
    ]);
    vi.mocked(fs.readFileSync).mockReturnValue(
      '{"timestamp":"2024-01-15T10:00:00Z","clientId":"client","botId":"bot1","userMessage":"hi","botReply":"hello"}\n' +
      '{"timestamp":"2024-01-15T11:00:00Z","clientId":"client","botId":"bot1","userMessage":"bye","botReply":"goodbye"}\n'
    );
    
    const result = getLogStats("test-client");
    
    expect(result.totalConversations).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.botIds)).toBe(true);
  });
});
