import type { AvatarProps } from '@/entities/chat/ui/types'

export function Avatar({ name, initials, color }: AvatarProps) {
  return <span className="avatar" style={{ background: color }}>{initials || name.slice(0, 2).toUpperCase()}</span>
}
