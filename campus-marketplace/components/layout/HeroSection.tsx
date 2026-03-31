// components/layout/HeroSection.tsx
export default function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-indigo-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-4xl font-bold mb-3">Campus Marketplace</h2>
        <p className="text-brand-200 text-lg max-w-xl mx-auto">
          Buy and sell textbooks, electronics, furniture and more — live, in real-time, with your campus community.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-brand-200">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Real-time updates
          </span>
          <span>·</span>
          <span>Safe campus trades</span>
          <span>·</span>
          <span>Zero commission</span>
        </div>
      </div>
    </div>
  )
}
