/**
 * Custom footer: wraps Pi's built-in FooterComponent and adds only what it lacks.
 *
 * Everything the built-in footer shows (cwd/branch/session, token + cost + cache-hit
 * stats, "(sub)", context % with "(auto)", provider/model/thinking, extension statuses)
 * comes from the built-in component, so Pi upgrades flow through without changes here.
 *
 * Line 1 is rearranged: model (+ thinking) moves from the right of the stats line to the
 * start, with a right-aligned segment: cache warming • mcp • request age • AI/session time.
 * Line 2 gets the sub-agent cost on the right.
 */

import { join } from "node:path";
import { FooterComponent, getAgentDir } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { countMcpServers, formatMcpCounts, readEnabledMcpServerNames } from "./lib/footer-mcp.ts";
import { stripModelFromStatsLine, type ModelParts } from "./lib/footer-model.ts";
import { createFooterSession } from "./lib/footer-session.ts";
import { OVERVIEW_VISIBILITY_EVENT } from "./subagent/tracker.ts";

// Set true to show request, AI-turn, and session durations in the footer.
const SHOW_FOOTER_TIME_TRACKING = true;

// Statuses rendered on lines 1 and 2 instead of the built-in status line.
const CONSUMED_STATUSES = new Set(["cache-warming", "subagent-summary", "advisor-usage"]);

function formatDuration(ms: number): string {
	const totalSecs = Math.floor(ms / 1000);
	if (totalSecs < 60) return `${totalSecs}s`;
	const hours = Math.floor(totalSecs / 3600);
	const mins = Math.floor((totalSecs % 3600) / 60);
	const secs = totalSecs % 60;
	if (hours > 0) return `${hours}h${mins}m`;
	return `${mins}m${secs}s`;
}

function alignRight(left: string, right: string, width: number): string {
	let fittedLeft = left;
	let leftWidth = visibleWidth(fittedLeft);
	if (leftWidth > width) {
		fittedLeft = truncateToWidth(fittedLeft, width, "...");
		leftWidth = visibleWidth(fittedLeft);
	}

	const minPadding = 2;
	const availableForRight = width - leftWidth - minPadding;
	if (availableForRight <= 0) return fittedLeft;

	const fittedRight = truncateToWidth(right, availableForRight, "");
	const rightWidth = visibleWidth(fittedRight);
	const padding = " ".repeat(Math.max(0, width - leftWidth - rightWidth));
	return `${fittedLeft}${padding}${fittedRight}`;
}

function bootstrapLastRequestMs(ctx: ExtensionContext): number | undefined {
	const entries = ctx.sessionManager.getEntries();
	for (let index = entries.length - 1; index >= 0; index--) {
		const entry = entries[index];
		if (entry?.type === "message" && entry.message.role === "assistant") {
			return new Date(entry.timestamp).getTime();
		}
	}
	return undefined;
}

/** One-time scan of existing entries to bootstrap AI turn time for resumed sessions. */
function bootstrapAiTurnMs(ctx: ExtensionContext): number {
	let total = 0;
	for (const entry of ctx.sessionManager.getEntries()) {
		if (
			entry.type === "message" &&
			entry.message.role === "assistant" &&
			entry.parentId !== null
		) {
			const parent = ctx.sessionManager.getEntry(entry.parentId);
			if (parent) {
				const diff = new Date(entry.timestamp).getTime() - new Date(parent.timestamp).getTime();
				if (diff > 0) total += diff;
			}
		}
	}
	return total;
}

export default function (pi: ExtensionAPI) {
	let tui: { requestRender(): void } | undefined;
	let mcpServerNames: string[] = [];
	let unsubscribeSessionHandlers: Array<() => void> = [];
	const clearSessionHandlers = () => {
		for (const unsubscribe of unsubscribeSessionHandlers) unsubscribe();
		unsubscribeSessionHandlers = [];
		tui = undefined;
	};

	// Advisor detail view: the advisor's own usage status, shown below the editor by the
	// shared overview shortcut (toggled in subagent/index.ts). The footer shows only its cost.
	let overviewCtx: ExtensionContext | undefined;
	let overviewVisible = false;
	let getStatuses: (() => ReadonlyMap<string, string>) | undefined;
	const syncAdvisorOverview = () => {
		if (!overviewCtx) return;
		if (!overviewVisible) {
			overviewCtx.ui.setWidget("advisor-overview", undefined);
			return;
		}
		overviewCtx.ui.setWidget(
			"advisor-overview",
			(_tui, theme) => ({
				invalidate() {},
				render(width: number): string[] {
					const status = getStatuses?.().get("advisor-usage");
					return status ? [truncateToWidth(theme.fg("accent", status), width, "...")] : [];
				},
			}),
			{ placement: "belowEditor" },
		);
	};
	pi.events.on(OVERVIEW_VISIBILITY_EVENT, (data) => {
		overviewVisible = (data as { visible?: boolean }).visible === true;
		syncAdvisorOverview();
	});

	pi.on("session_start", (_event, ctx) => {
		clearSessionHandlers();
		// Servers are read once per session start; /reload starts a new session.
		mcpServerNames = [
			...new Set([
				...readEnabledMcpServerNames(join(getAgentDir(), "mcp.json")),
				...pi.getMcpServers().map((server) => server.name),
			]),
		];
		overviewCtx = ctx;
		overviewVisible = false;
		syncAdvisorOverview();
		// Bootstrap from existing entries (non-zero only on resumed sessions).
		let aiTurnMs = bootstrapAiTurnMs(ctx);
		// Resumed sessions do not persist request-start time; latest response is the best fallback.
		let lastRequestMs = bootstrapLastRequestMs(ctx);
		let requestStartMs: number | undefined;
		let lastTokensPerSecond: number | undefined;
		let turnStartMs = 0;

		// From here on, accumulate incrementally via events — O(1) per render.
		unsubscribeSessionHandlers.push(pi.on("turn_start", (event) => {
			turnStartMs = event.timestamp;
		}));

		unsubscribeSessionHandlers.push(pi.on("before_provider_request", () => {
			requestStartMs = Date.now();
			lastRequestMs = requestStartMs;
			tui?.requestRender();
		}));

		unsubscribeSessionHandlers.push(pi.on("message_end", (event) => {
			if (event.message.role === "assistant" && requestStartMs !== undefined) {
				const elapsedMs = Date.now() - requestStartMs;
				if (elapsedMs > 0 && event.message.usage.output > 0) {
					lastTokensPerSecond = Math.round(event.message.usage.output * 1000 / elapsedMs);
				}
				requestStartMs = undefined;
				tui?.requestRender();
			}
		}));

		unsubscribeSessionHandlers.push(pi.on("turn_end", () => {
			if (turnStartMs > 0) {
				aiTurnMs += Date.now() - turnStartMs;
				turnStartMs = 0;
			}
			tui?.requestRender();
		}));

		unsubscribeSessionHandlers.push(pi.on("model_select", () => tui?.requestRender()));

		ctx.ui.setFooter((_tui, theme, footerData) => {
			tui = _tui;
			getStatuses = () => footerData.getExtensionStatuses();

			// Hide the statuses we render ourselves; everything else (e.g. subagent-summary)
			// still lands on the built-in status line.
			const builtinData = {
				getGitBranch: () => footerData.getGitBranch(),
				getExtensionStatuses: () =>
					new Map([...footerData.getExtensionStatuses()].filter(([key]) => !CONSUMED_STATUSES.has(key))),
				// Pinned to 1 so the built-in never prefixes "(provider)"; we add it on line 1.
				getAvailableProviderCount: () => 1,
			};
			const builtin = new FooterComponent(createFooterSession(ctx, pi) as never, builtinData as never);

			const unsubBranch = footerData.onBranchChange(() => _tui.requestRender());
			const elapsedTimer = SHOW_FOOTER_TIME_TRACKING
				? setInterval(() => _tui.requestRender(), 1000)
				: undefined;

			return {
				dispose() {
					unsubBranch();
					if (elapsedTimer !== undefined) clearInterval(elapsedTimer);
					builtin.dispose();
					tui = undefined;
				},
				invalidate() {
					builtin.invalidate();
				},
				render(width: number): string[] {
					// The facade leans on FooterComponent internals; degrade to a minimal footer if
					// a Pi upgrade changes what it reads (plugin-tests/footer-session.test.ts catches this).
					let lines: string[];
					try {
						// Same default as SettingsManager.getCompactionEnabled(); the built-in reads its own flag.
						builtin.setAutoCompactEnabled(pi.getSettings().compaction?.enabled ?? true);
						lines = builtin.render(width);
					} catch (error) {
						const model = ctx.model?.id ?? "no-model";
						const reason = error instanceof Error ? error.message : String(error);
						lines = [truncateToWidth(theme.fg("warning", `footer error: ${reason}`), width), theme.fg("dim", model)];
					}

					// --- Line 1 left: model first, then the built-in cwd/branch/session ---
					const modelId = ctx.model?.id ?? "no-model";
					const level = pi.getThinkingLevel();
					const modelParts: ModelParts = {
						id: modelId,
						thinking: ctx.model?.reasoning ? (level === "off" ? "thinking off" : level) : undefined,
					};
					const statsWithoutModel = lines[1] === undefined ? undefined : stripModelFromStatsLine(lines[1], modelParts);
					const showProvider = footerData.getAvailableProviderCount() > 1 && ctx.model !== undefined;
					const buildLeft = (withProvider: boolean) => {
						const label = withProvider && ctx.model ? `(${ctx.model.provider}) ${modelId}` : modelId;
						const thinking = modelParts.thinking ? ` • ${modelParts.thinking}` : "";
						return `${theme.fg("dim", label + thinking)} ${lines[0] ?? ""}`;
					};

					// --- Line 1 right: statuses + timing. Line 2 right: sub-agent cost ---
					const statuses = footerData.getExtensionStatuses();
					const cacheStatus = statuses.get("cache-warming");
					const mcpStatus = formatMcpCounts(countMcpServers(mcpServerNames, pi.getAllTools()));

					const header = ctx.sessionManager.getHeader();
					const sessionStartMs = header ? new Date(header.timestamp).getTime() : Date.now();
					const sessionDurationMs = Date.now() - sessionStartMs;
					// Include elapsed time of any in-progress turn live.
					const liveAiTurnMs = aiTurnMs + (turnStartMs > 0 ? Date.now() - turnStartMs : 0);
					const tokensPerSecondStatus = lastTokensPerSecond === undefined ? undefined : `${lastTokensPerSecond} tok/s`;
					const requestStatus = SHOW_FOOTER_TIME_TRACKING && lastRequestMs
						? `req: ${formatDuration(Date.now() - lastRequestMs)}`
						: undefined;
					const timeStatus = SHOW_FOOTER_TIME_TRACKING
						? `${formatDuration(liveAiTurnMs)}/${formatDuration(sessionDurationMs)}`
						: undefined;

					const right = theme.fg(
						"dim",
						[cacheStatus, mcpStatus, tokensPerSecondStatus, requestStatus, timeStatus].filter(Boolean).join(" • "),
					);

					// Line 2 right: sub-agent cost ("+ sub-agents $0.123") then advisor cost only.
					const advisorStatus = statuses.get("advisor-usage");
					const advisorCost = advisorStatus && `+ advisor ${advisorStatus.match(/\$\d+(?:\.\d+)?/)?.[0] ?? "$?"}`;
					const costs = [statuses.get("subagent-summary"), advisorCost].filter(Boolean).join(" ");
					const subagentRight = costs && theme.fg("dim", costs);

					if (statsWithoutModel !== undefined) {
						let left = buildLeft(showProvider);
						// Drop the provider prefix first when the line is too tight.
						if (showProvider && visibleWidth(left) + visibleWidth(right) + 2 > width) left = buildLeft(false);
						lines[0] = alignRight(left, right, width);
						lines[1] = subagentRight ? alignRight(statsWithoutModel, subagentRight, width) : statsWithoutModel;
					}
					// Otherwise the built-in already truncated the model (narrow terminal): leave its lines as they are.
					return lines;
				},
			};
		});
	});

	pi.on("session_shutdown", () => {
		overviewVisible = false;
		syncAdvisorOverview();
		overviewCtx = undefined;
		getStatuses = undefined;
		clearSessionHandlers();
	});
}
