import { useRef, useState } from 'react'
import type { MessageAttachment as Attachment } from '@/entities/message/model/types'

type MessageAttachmentProps = { attachment: Attachment; onRefresh: () => Promise<boolean> }

export function MessageAttachment({ attachment, onRefresh }: MessageAttachmentProps) {
  const [failed, setFailed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const didRefresh = useRef(false)

  const refresh = () => {
    if (refreshing) return
    if (didRefresh.current) {
      setFailed(true)
      return
    }
    didRefresh.current = true
    setRefreshing(true)
    void onRefresh().then((updated) => {
      setFailed(!updated)
      setRefreshing(false)
    })
  }

  if (attachment.kind === 'image') {
    const source = failed && attachment.thumbnailUrl ? attachment.thumbnailUrl : attachment.url
    return <div className="message-media-wrap">
      <a className="message-media message-image" href={attachment.url} target="_blank" rel="noreferrer" aria-label={`Открыть изображение ${attachment.name}`}>
        <img src={source} alt={attachment.name} onError={refresh} />
      </a>
      <MediaLink attachment={attachment} label="Открыть изображение" />
    </div>
  }

  if (attachment.kind === 'video' || attachment.kind === 'video-note') {
    return <div className="message-media-wrap">
      {!failed && <video className={`message-media message-video ${attachment.kind === 'video-note' ? 'message-video-note' : ''}`} controls preload="metadata" poster={attachment.thumbnailUrl} onError={refresh}>
        <source src={attachment.url} type={attachment.type} />
      </video>}
      {failed && attachment.thumbnailUrl && <img className={`message-media message-video-fallback ${attachment.kind === 'video-note' ? 'message-video-note' : ''}`} src={attachment.thumbnailUrl} alt={`Превью ${attachment.name}`} />}
      <MediaLink attachment={attachment} label={failed ? 'Скачать видео' : 'Открыть видео'} />
    </div>
  }

  if (attachment.kind === 'audio') {
    return <div className="message-audio-wrap">
      <div className="message-audio">
      <span aria-hidden="true">♪</span>
      {!failed && <audio controls preload="metadata" onError={refresh}>
        <source src={attachment.url} type={attachment.type} />
      </audio>
      }
      </div>
      <MediaLink attachment={attachment} label={refreshing ? 'Обновляем файл…' : failed ? 'Скачать аудио' : 'Открыть аудио'} />
    </div>
  }

  return <a className="message-file" href={attachment.url} target="_blank" rel="noreferrer" download={attachment.name}>
    <span aria-hidden="true">📎</span>
    <span>{attachment.name}</span>
  </a>
}

function MediaLink({ attachment, label }: { attachment: Attachment; label: string }) {
  return <a className="message-media-link" href={attachment.url} target="_blank" rel="noreferrer">{label}</a>
}
