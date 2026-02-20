// app/judge/[eventId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy, Star, Send, Lock, Unlock, AlertCircle, 
  ChevronLeft, ChevronRight, Users, CheckCircle2,
  Loader2, LogOut, Timer
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


export default function JudgePanelPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId ;

  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isJudge, setIsJudge] = useState(false);
  const [scoresLocked, setScoresLocked] = useState(false);

  const currentRegistration = registrations[currentIndex];

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("codexdashtoken");
      if (!token) {
        router.push("/login");
        return;
      }

      const judgeRes = await fetch(`${API_URL}/judges/verify/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!judgeRes.ok) {
        setIsJudge(false);
        setLoading(false);
        return;
      }
      setIsJudge(true);

      const eventRes = await fetch(`${API_URL}/events/single/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        if (eventData.success) setEvent(eventData.data);
      }

      const regRes = await fetch(`${API_URL}/events/${eventId}/registrations?status=REGISTERED&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success) setRegistrations(regData.data);
      }

      const scoresRes = await fetch(`${API_URL}/judges/scores/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        if (scoresData.success) {
          const scoresMap = {};
          scoresData.data.forEach((s) => {
            scoresMap[s.registration] = s;
          });
          setScores(scoresMap);
        }
      }

      const lockRes = await fetch(`${API_URL}/judges/leaderboard/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (lockRes.ok) {
        const lockData = await lockRes.json();
        setScoresLocked(lockData.locked || false);
      }

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

const calculateTotal = (criteria) => {
    return (
      (criteria.innovation || 0) * 0.4 +
      (criteria.technical || 0) * 0.3 +
      (criteria.presentation || 0) * 0.2 +
      (criteria.design || 0) * 0.1
    );
  };

  const updateCriteria = (field, value) => {
    if (scoresLocked) return;
    
    const currentScore = scores[currentRegistration._id] || {
      criteria: { innovation: 0, technical: 0, presentation: 0, design: 0 },
      feedback: "",
      locked: false
    };

    const newCriteria = { ...currentScore.criteria, [field]: value };
    const newScore = {
      ...currentScore,
      criteria: newCriteria,
      total: calculateTotal(newCriteria)
    };

    setScores(prev => ({
      ...prev,
      [currentRegistration._id]: newScore
    }));
  };

  const updateFeedback = (feedback) => {
    if (scoresLocked) return;
    
    setScores(prev => ({
      ...prev,
      [currentRegistration._id]: {
        ...(prev[currentRegistration._id] || {
          criteria: { innovation: 0, technical: 0, presentation: 0, design: 0 },
          total: 0,
          locked: false
        }),
        feedback
      }
    }));
  };

  const submitScore = async () => {
    if (scoresLocked) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem("codexdashtoken");
      const currentScore = scores[currentRegistration._id];

      if (!currentScore) return;

      const res = await fetch(`${API_URL}/judges/score`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId: currentRegistration._id,
          criteria: currentScore.criteria,
          feedback: currentScore.feedback,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit score");

      if (currentIndex < registrations.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }

    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("codexdashtoken");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isJudge) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You are not assigned as a judge for this event.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Participants</h1>
          <p className="text-gray-400">No registered participants found for this event.</p>
        </div>
      </div>
    );
  }

  const currentScore = scores[currentRegistration._id] || {
    criteria: { innovation: 0, technical: 0, presentation: 0, design: 0 },
    feedback: "",
    total: 0,
    locked: false
  };

  const progress = ((currentIndex + 1) / registrations.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{event?.title || 'Judge Panel'}</h1>
              <p className="text-sm text-gray-500">Judge Interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Timer className="w-4 h-4 text-blue-400" />
              <span className="text-sm">
                {currentIndex + 1} of {registrations.length}
              </span>
            </div>
            
            {scoresLocked ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Lock className="w-3 h-3 mr-1" />
                Scoring Locked
              </Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Unlock className="w-3 h-3 mr-1" />
                Scoring Open
              </Badge>
            )}
            
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
        
        <div className="h-1 bg-white/10 w-full">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                {currentRegistration.user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{currentRegistration.user.fullName}</h2>
                <p className="text-gray-500">{currentRegistration.user.email}</p>
              </div>
            </div>

            {currentRegistration.formData?.teamName && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <p className="text-sm text-gray-500 mb-1">Team Name</p>
                <p className="text-lg font-semibold">{currentRegistration.formData.teamName}</p>
              </div>
            )}

            {currentRegistration.formData?.projectTitle && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                <p className="text-sm text-gray-500 mb-1">Project Title</p>
                <p className="text-lg font-semibold">{currentRegistration.formData.projectTitle}</p>
              </div>
            )}

            {currentRegistration.formData?.description && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {currentRegistration.formData.description}
                </p>
              </div>
            )}

            {currentRegistration.formData && Object.entries(currentRegistration.formData)
              .filter(([key]) => !['teamName', 'projectTitle', 'description'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-500 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-white">
                    {typeof value === 'object' ? (
                      value?.url ? (
                        <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          View File
                        </a>
                      ) : JSON.stringify(value)
                    ) : String(value)}
                  </p>
                </div>
              ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/10"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/10"
              onClick={() => setCurrentIndex(prev => Math.min(registrations.length - 1, prev + 1))}
              disabled={currentIndex === registrations.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Scoring Criteria
              </h3>
              {scores[currentRegistration._id] && (
                <Badge className="bg-blue-500/20 text-blue-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Scored
                </Badge>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Innovation & Creativity (40%)</label>
                  <span className="text-2xl font-bold text-blue-400">{currentScore.criteria.innovation || 0}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={currentScore.criteria.innovation || 0}
                  onChange={(e) => updateCriteria('innovation', parseFloat(e.target.value))}
                  disabled={scoresLocked}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Technical Implementation (30%)</label>
                  <span className="text-2xl font-bold text-purple-400">{currentScore.criteria.technical || 0}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={currentScore.criteria.technical || 0}
                  onChange={(e) => updateCriteria('technical', parseFloat(e.target.value))}
                  disabled={scoresLocked}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">Presentation & Demo (20%)</label>
                  <span className="text-2xl font-bold text-pink-400">{currentScore.criteria.presentation || 0}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={currentScore.criteria.presentation || 0}
                  onChange={(e) => updateCriteria('presentation', parseFloat(e.target.value))}
                  disabled={scoresLocked}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white font-medium">UI/UX Design (10%)</label>
                  <span className="text-2xl font-bold text-green-400">{currentScore.criteria.design || 0}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={currentScore.criteria.design || 0}
                  onChange={(e) => updateCriteria('design', parseFloat(e.target.value))}
                  disabled={scoresLocked}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-300">Total Weighted Score</span>
                <span className="text-4xl font-bold text-white">
                  {currentScore.total.toFixed(2)}
                  <span className="text-lg text-gray-500 ml-2">/10</span>
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0f0f0f] border border-white/10 p-6">
            <label className="block text-white font-medium mb-4">Feedback (Optional)</label>
            <Textarea
              placeholder="Provide constructive feedback to the participant..."
              value={currentScore.feedback}
              onChange={(e) => updateFeedback(e.target.value)}
              disabled={scoresLocked}
              className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-gray-600 resize-none"
            />
          </div>

          <Button
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl"
            onClick={submitScore}
            disabled={submitting || scoresLocked}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            {scoresLocked ? 'Scoring Locked' : 'Submit Score & Next'}
          </Button>
        </div>
      </main>
    </div>
  );
}