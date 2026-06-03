'use client'

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/60 backdrop-blur-sm px-4 py-2 text-center text-sm text-white/90">
      Map by{' '}
      <a
        href="https://www.twitch.tv/JawedCS"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-purple-400 transition-colors duration-150 hover:text-purple-300"
      >
        JawedCS
      </a>
    </footer>
  )
}
