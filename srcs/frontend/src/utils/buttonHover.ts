export function handleMouseMoveToSetFillOrigin(
  e: React.MouseEvent<HTMLElement>,
) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();

  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  target.style.setProperty("--x", `${x}%`);
  target.style.setProperty("--y", `${y}%`);
}
