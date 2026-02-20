"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Home, ArrowLeft, Zap, Search, 
  AlertCircle, Compass 
} from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse delay-1000" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white italic tracking-tighter">
            <Zap className="w-8 h-8 text-blue-500 fill-blue-500" />
            hackbyte<span className="text-blue-500">codex</span>
          </Link>
        </div>

        {/* 404 Content */}
        <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-12 shadow-2xl shadow-blue-500/5">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Page Not Found
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Oops! The page you&apos;re looking for seems to have wandered off into the digital void.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.back()}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl h-12 px-6 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 shadow-lg shadow-blue-500/25 group w-full sm:w-auto">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-gray-500 text-sm mb-4">You might be looking for:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1">
                <Compass className="w-4 h-4" />
                Dashboard
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/dashboard/events" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Events
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/dashboard/projects" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Projects
              </Link>
              <span className="text-gray-600">•</span>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500/30 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
