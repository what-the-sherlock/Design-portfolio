import { Fragment } from "react";

/** Renders "plain *italic* plain" with <em> for the asterisk-wrapped fragments. */
export function StyledText({ text }: { text: string }) {
  return (
    <>
      {text.split("*").map((part, i) =>
        part === "" ? null : i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

export function plain(text: string) {
  return text.replaceAll("*", "");
}
