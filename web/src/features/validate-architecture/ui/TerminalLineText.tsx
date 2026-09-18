type Props = {
  text: string;
  warningCount?: number;
};

export function TerminalLineText({ text, warningCount = 0 }: Props) {
  if (warningCount < 1) return <>{text}</>;
  const warningText = `${warningCount} warning${warningCount === 1 ? '' : 's'}`;
  if (!text.endsWith(warningText)) return <>{text}</>;
  return <>{text.slice(0, -warningText.length)}<span className="terminal-summary-warning">{warningText}</span></>;
}
