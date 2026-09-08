"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-[#ffffff] [&_strong]:font-semibold [&_strong]:text-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="mt-1 text-base font-semibold text-white">{children}</h3>,
          h2: ({ children }) => <h3 className="mt-2 text-sm font-semibold text-fuchsia-300">{children}</h3>,
          h3: ({ children }) => <h4 className="mt-2 text-sm font-semibold text-fuchsia-300">{children}</h4>,
          p: ({ children }) => <p className="text-[#e4e9f5]">{children}</p>,
          ul: ({ children }) => <ul className="ml-4 list-disc space-y-1 text-[#e4e9f5]">{children}</ul>,
          ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1 text-[#e4e9f5]">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-fuchsia-400 underline hover:text-fuchsia-300">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.8em] text-fuchsia-200">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-fuchsia-500/40 pl-3 text-[#c0c8de]">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-[#2a2a4a]">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/5 text-[#c0c8de]">{children}</thead>,
          th: ({ children }) => <th className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-t border-[#1e2240] px-2.5 py-1.5 text-[#e4e9f5]">{children}</td>,
          hr: () => <hr className="border-[#2a2a4a]" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
