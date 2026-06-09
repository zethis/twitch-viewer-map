interface LogoProps {
  logoUrl?: string | null
  twitchUrl?: string | null
}

export default function Logo({ logoUrl, twitchUrl }: LogoProps) {
  if (logoUrl === '') {
    return null
  }

  const src = logoUrl || '/logos/jawedcs.svg'

  const img = (
    <img
      src={src}
      alt="Logo"
      style={{ width: '100%', maxWidth: '280px', display: 'block' }}
    />
  )

  if (twitchUrl) {
    return (
      <a
        href={twitchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block' }}
      >
        {img}
      </a>
    )
  }

  return img
}
