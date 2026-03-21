"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatPercent, formatSignedPercent } from "./format";

type SignalCardProps = {
  title: string;
  tag: string;
  marketProbability: number;
  aiProbability: number;
  edge: number;
  conviction: number;
  rationale: string;
  catalystLabel?: string | null;
  hoursToCatalyst?: number | null;
  hot?: boolean;
  locked?: boolean;
  href?: string;
  tradeHref?: string;
  index?: number;
};

export function SignalCard({
  title,
  tag,
  marketProbability,
  aiProbability,
  edge,
  conviction,
  rationale,
  catalystLabel,
  hoursToCatalyst,
  hot = false,
  locked = false,
  href,
  tradeHref,
  index = 0,
}: SignalCardProps) {
  const positive = edge >= 0;
  const edgeColor = positive ? "#7EB8FF" : "#f87171";
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="premium-card relative rounded-[12px] border border-white/[0.07] p-4"
      style={{
        filter: locked ? "blur(3px)" : "none",
        userSelect: locked ? "none" : "auto",
      }}
    >
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-[4px] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-white/35">
              {tag}
            </span>
            {hoursToCatalyst ? (
              <span className="data-number text-[11px] text-white/25">{hoursToCatalyst}h to catalyst</span>
            ) : null}
            {hot ? <span className="text-[10px] font-semibold text-[#22d3ee]">● HOT</span> : null}
          </div>
          <div className="luna-heading text-[13px] leading-[1.4] text-white/85">{title}</div>
        </div>

        <div className="shrink-0 text-right">
          <div className="data-number text-[20px] font-semibold" style={{ color: edgeColor }}>
            {formatSignedPercent(edge, 0)}
          </div>
          <div className="text-[10px] tracking-[0.06em] text-white/25">EDGE</div>
        </div>
      </div>

      <div className="mb-3 text-[12px] leading-[1.5] text-white/35">
        {rationale}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative h-[3px] rounded-[2px] bg-white/[0.06]">
            <div
              className="absolute left-0 top-0 h-full rounded-[2px] bg-white/[0.18]"
              style={{ width: `${marketProbability * 100}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-[2px]"
              style={{
                width: `${aiProbability * 100}%`,
                background: edgeColor,
                opacity: 0.6,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="data-number text-[10px] text-white/30">Market {formatPercent(marketProbability)}</span>
            <span className="data-number text-[10px]" style={{ color: edgeColor }}>AI {formatPercent(aiProbability)}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="data-number text-[14px] font-semibold text-white/70">{conviction}</div>
          <div className="text-[9px] tracking-[0.06em] text-white/20">CONV</div>
        </div>
      </div>

      {catalystLabel ? (
        <div className="mt-3 text-[10px] uppercase tracking-[0.06em] text-white/20">
          Catalyst: <span className="text-white/35">{catalystLabel}</span>
        </div>
      ) : null}

      {(!locked && (tradeHref || href)) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tradeHref ? (
            <a
              href={tradeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[36px] items-center justify-center rounded-[8px] bg-[linear-gradient(135deg,#7EB8FF,#00C4FF)] px-3.5 text-[12px] font-semibold text-[#0c0c0e] shadow-[0_0_18px_rgba(126,184,255,0.2)] transition-opacity hover:opacity-90"
            >
              Trade on Polymarket →
            </a>
          ) : null}
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-[36px] items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.02] px-3.5 text-[12px] font-medium text-white/72 transition-colors hover:border-[#7EB8FF]/25 hover:text-white"
            >
              View details
            </Link>
          ) : null}
        </div>
      ) : null}
    </motion.div>
  );

  if (href && !tradeHref && !locked) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
