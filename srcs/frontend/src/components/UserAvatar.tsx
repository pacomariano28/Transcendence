import { NavLink } from "react-router-dom";

type UserAvatarProps = {
  username?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  active?: boolean;
};

export function UserAvatar({
  username,
  email,
  imageUrl,
  active = false,
}: UserAvatarProps) {
  const initials =
    (username?.[0] ?? email?.[0] ?? "U").toUpperCase() +
    ((username?.[1] ?? email?.[1] ?? "") || "").toUpperCase();

  return (
    <div
      className={[
        "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-white/5 ring-1 transition-all duration-300 ease-out",
        "group-hover:scale-105 group-hover:border-[#f7d046]/30 group-hover:ring-[#f7d046]/50",
        "group-hover:shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_8px_20px_rgba(247,208,70,0.15)]",
        "group-active:scale-[0.97]",
        active
          ? "border-[#f7d046]/40 ring-[#f7d046]/50 shadow-[0_0_0_1px_rgba(247,208,70,0.12),0_8px_20px_rgba(247,208,70,0.15)]"
          : "border-white/10 ring-white/10",
      ].join(" ")}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username ?? email ?? "User avatar"}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
        />
      ) : (
        <span className="text-sm font-semibold text-zinc-200 transition-colors duration-300 group-hover:text-[#fff3bf]">
          {initials}
        </span>
      )}
    </div>
  );
}

export function UserAvatarLink({
  username,
  email,
  imageUrl,
  label,
}: UserAvatarProps & { label: string }) {
  return (
    <NavLink
      to="/profile"
      className="group shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7d046]/50"
      aria-label={label}
      title={label}
    >
      <UserAvatar username={username} email={email} imageUrl={imageUrl} />
    </NavLink>
  );
}
