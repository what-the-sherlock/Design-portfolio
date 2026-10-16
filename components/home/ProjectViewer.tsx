"use client";

import type { Project } from "@/content/site";

/** Modal body for a project: scrollable full-page capture (web) or the full film with sound (motion). */
export function ProjectViewer({ project }: { project: Project }) {
  const { slug, title, tags, summary, live, kind, media } = project;

  return (
    <div className="viewer">
      <div className="viewer-head">
        <div className="viewer-meta">
          <div className="viewer-tags mono">
            {tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <h2>{title}</h2>
          <p className="viewer-summary">{summary}</p>
        </div>
        <div className="viewer-actions">
          {kind === "web" && <span className="viewer-hint mono">Scroll to explore</span>}
          {live && (
            <a className="btn-primary" href={live} target="_blank" rel="noopener noreferrer">
              Visit live site
            </a>
          )}
        </div>
      </div>
      <div className="viewer-frame">
        {kind === "web" ? (
          <div className="viewer-scroll" data-lenis-prevent="" role="img" aria-label={`Full page design of ${title}`}>
            {/* Full page in 1200px-tall tiles: each loads lazily and picks 1x/2x from srcset. */}
            {media.full?.tiles.map((h, i) => {
              const n = String(i).padStart(2, "0");
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={`/media/${slug}/full/tile-${n}-1200.webp`}
                  srcSet={`/media/${slug}/full/tile-${n}-1200.webp 1200w, /media/${slug}/full/tile-${n}-2400.webp 2400w`}
                  sizes="(max-width: 1240px) 100vw, 1200px"
                  width={1200}
                  height={h}
                  alt=""
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              );
            })}
          </div>
        ) : (
          <div className="viewer-film">
            <video src={`/media/${slug}/film.mp4`} poster={`/media/${slug}/cover-1600.webp`} controls autoPlay playsInline preload="auto" />
          </div>
        )}
      </div>
    </div>
  );
}
