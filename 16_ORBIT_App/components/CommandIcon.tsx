import type { SVGProps } from "react";

export type CommandIconName =
  | "home"
  | "brain"
  | "projects"
  | "sparkles"
  | "launch"
  | "plus"
  | "arrow"
  | "check"
  | "clock"
  | "image"
  | "website"
  | "content"
  | "critic"
  | "library"
  | "menu"
  | "close"
  | "focus"
  | "strategy"
  | "bolt"
  | "bell"
  | "search"
  | "target"
  | "link"
  | "calendar"
  | "trash";

const paths: Record<CommandIconName, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/></>,
  brain: <><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.5A3.5 3.5 0 0 0 4.5 15H6v1a4 4 0 0 0 4 4h2V4H9.5Z"/><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.5a3.5 3.5 0 0 1 1.5 6.5H18v1a4 4 0 0 1-4 4h-2V4h2.5Z"/><path d="M8 9.5c1.2 0 2 .8 2 2M16 9.5c-1.2 0-2 .8-2 2M8 15c1.2 0 2-.8 2-2M16 15c-1.2 0-2-.8-2-2"/></>,
  projects: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4V2M16 4V2M3 9h18M8 13h3M8 17h7"/></>,
  sparkles: <><path d="m12 3 1.25 3.75L17 8l-3.75 1.25L12 13l-1.25-3.75L7 8l3.75-1.25L12 3Z"/><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.65 1.85L21.5 15.5l-1.85.65L19 18l-.65-1.85-1.85-.65 1.85-.65L19 13Z"/></>,
  launch: <><path d="M14 4c3.8.4 5.6 2.2 6 6l-6.5 6.5-6-6L14 4Z"/><path d="m7.5 10.5-3 1-1 3 4 4 3-1 1-3M14.5 9.5h.01M6 18l-2 2"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
  website: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></>,
  content: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  critic: <><path d="M12 3 4 7v5c0 4.8 3.1 7.6 8 9 4.9-1.4 8-4.2 8-9V7l-8-4Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
  library: <><path d="M4 5.5 8 4l4 1.5L16 4l4 1.5v14L16 18l-4 1.5L8 18l-4 1.5v-14Z"/><path d="M8 4v14M12 5.5v14M16 4v14"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  focus: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/><circle cx="12" cy="12" r="3"/></>,
  strategy: <><path d="M4 18 9 13l4 3 7-9"/><path d="M15 7h5v5"/></>,
  bolt: <><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  target: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></>,
  link: <><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 13 4.6a3.6 3.6 0 0 1 5 5L16.1 11.5M13 17.5 11 19.4a3.6 3.6 0 0 1-5-5L7.9 12.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
  trash: <><path d="M4 7h16"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/><path d="M6 7l1 12.5A2 2 0 0 0 9 21h6a2 2 0 0 0 2-1.5L18 7"/><path d="M10 11v6M14 11v6"/></>,
};

export default function CommandIcon({
  name,
  className = "h-5 w-5",
  ...props
}: { name: CommandIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
