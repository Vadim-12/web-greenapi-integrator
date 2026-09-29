import type { AvatarProps } from '@/entities/chat/ui/types'

export function Avatar({ name, initials, color, avatarUrl }: AvatarProps) {
  return <span className="avatar" style={{ background: color }}>{avatarUrl ? <img src={avatarUrl} alt="" /> : initials || name.slice(0, 2).toUpperCase()}</span>
}
