import type { Player } from "../types";

interface PlayerCardProps {
  player: Player;
  /** The current client's session ID to highlight "You" */
  mySessionId?: string;
}

/**
 * PlayerCard — displays a single player in the lobby.
 * Shows: avatar initial, username, host crown, ready status.
 */
export default function PlayerCard({ player, mySessionId }: PlayerCardProps) {
  const isMe = player.id === mySessionId;
  const initial = player.username.charAt(0).toUpperCase();

  return (
    <div
      className={`
        glass-card p-4 flex items-center gap-4 transition-all duration-300
        hover:border-primary/40 hover:shadow-glow
        ${isMe ? "border-primary/50 shadow-glow" : ""}
        animate-fade-in
      `}
    >
      {/* Avatar */}
      <div
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          text-lg font-bold shrink-0
          ${player.isHost
            ? "bg-gradient-to-br from-amber-500/30 to-amber-600/20 text-amber-400 border border-amber-500/40"
            : "bg-gradient-to-br from-primary/30 to-accent/20 text-text-primary border border-border-subtle"
          }
        `}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text-primary truncate">
            {player.username}
          </span>
          {isMe && (
            <span className="text-xs text-text-muted font-medium">(You)</span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mt-1.5">
          {player.isHost && (
            <span className="badge-host">
              <svg
                className="w-3 h-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Host
            </span>
          )}
          {player.ready ? (
            <span className="badge-ready">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Ready
            </span>
          ) : (
            <span className="badge-not-ready">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Not Ready
            </span>
          )}
        </div>
      </div>

      {/* Ready indicator dot */}
      <div
        className={`
          w-3 h-3 rounded-full shrink-0 transition-all duration-300
          ${player.ready
            ? "bg-success shadow-glow-green"
            : "bg-text-muted"
          }
        `}
      />
    </div>
  );
}
