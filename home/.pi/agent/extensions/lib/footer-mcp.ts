/**
 * MCP server counts for the footer. Pi's built-in MCP support exposes no status or events, so
 * derive them: the enabled servers come from `mcp.json` plus extension registrations, and a
 * server counts as connected when it has at least one visible `mcp__<server>__<tool>` tool.
 * Tools of dropped or disabled servers stay registered as `hidden`, so they do not count.
 */

import { readFileSync } from "node:fs";

export interface McpToolLike {
	name: string;
	exposure: string;
}

export interface McpCounts {
	connected: number;
	enabled: number;
}

/** Names of the servers in an `mcp.json` that are not disabled. Missing or invalid files give none. */
export function readEnabledMcpServerNames(path: string): string[] {
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8")) as { mcpServers?: Record<string, { enabled?: boolean }> };
		return Object.entries(parsed.mcpServers ?? {})
			.filter(([, config]) => config?.enabled !== false)
			.map(([name]) => name);
	} catch {
		return [];
	}
}

export function countMcpServers(enabledNames: readonly string[], tools: readonly McpToolLike[]): McpCounts {
	const names = new Set(enabledNames);
	const connected = [...names].filter((server) =>
		tools.some((tool) => tool.exposure !== "hidden" && tool.name.startsWith(`mcp__${server}__`)),
	).length;
	return { connected, enabled: names.size };
}

export function formatMcpCounts({ connected, enabled }: McpCounts): string | undefined {
	return enabled > 0 ? `mcp: ${connected}/${enabled}` : undefined;
}
