"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Project } from "@/content/site";
import { Modal } from "../Modal";
import { SnakeGame } from "../SnakeGame";
import { ProjectViewer } from "./ProjectViewer";

type Overlay = { kind: "snake" } | { kind: "project"; project: Project } | null;

const OverlayContext = createContext<{ openSnake: () => void; openProject: (p: Project) => void }>({
  openSnake: () => {},
  openProject: () => {},
});

export const useOverlays = () => useContext(OverlayContext);

export function Overlays({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<Overlay>(null);
  const [open, setOpen] = useState(false);

  const openSnake = useCallback(() => {
    setCurrent({ kind: "snake" });
    setOpen(true);
  }, []);
  const openProject = useCallback((project: Project) => {
    setCurrent({ kind: "project", project });
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  // Unmount the content (stops game loops / video audio) only after the close animation.
  const closed = useCallback(() => setCurrent(null), []);

  const label = current?.kind === "snake" ? "Snake game" : current?.kind === "project" ? current.project.title : "Dialog";

  return (
    <OverlayContext.Provider value={{ openSnake, openProject }}>
      {children}
      <Modal open={open} onClose={close} onClosed={closed} label={label} className={current?.kind === "snake" ? "snake-game-modal" : "viewer-modal"}>
        {current?.kind === "snake" && <SnakeGame />}
        {current?.kind === "project" && <ProjectViewer project={current.project} />}
      </Modal>
    </OverlayContext.Provider>
  );
}
