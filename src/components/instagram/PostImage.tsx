"use client";

import { useState } from "react";
import type { Post } from "@/lib/instagram-types";
import { typeLabel } from "@/lib/instagram-analytics";

type Status = "loading" | "ok" | "error";

export function PostImage({
  post,
  className = "",
  rounded = "rounded-xl",
}: {
  post: Post;
  className?: string;
  rounded?: string;
}) {
  const [status, setStatus] = useState<Status>("loading");

  return (
    <div className={`relative overflow-hidden bg-white/5 ${rounded} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/media/${post.id}`}
        alt={`Publicación ${post.date}`}
        loading="lazy"
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("error")}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          status === "ok" ? "opacity-100" : "opacity-0"
        }`}
      />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2b62ff]/40 border-t-white/70" />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="text-2xl opacity-60">{post.type === "REELS" ? "🎬" : "🖼️"}</span>
          <span className="text-[10px] leading-tight text-[#aab3cf]">
            {typeLabel(post.type)}
          </span>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] text-fuchsia-400 hover:underline"
            >
              Ver en IG ↗
            </a>
          )}
        </div>
      )}

      {status === "ok" && (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
          {post.type === "REELS" ? "Reel" : "Carrusel"}
        </span>
      )}
    </div>
  );
}
