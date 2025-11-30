/**
 * DEPRECATED: This component is part of the old agency onboarding system.
 * The app has migrated to a client-centric structure. See /app/clients instead.
 *
 * This file is kept for reference only and should not be used in new code.
 */

import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Hash,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Palette,
  Play,
  Save,
  Settings,
  Sliders,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AgencyConfig, Submission, User } from "@/types";
import { getSubmissions } from "@/app/actions";

interface Props {
  user: User;
  config: AgencyConfig;
  onSave: (config: AgencyConfig) => void;
  onStart: () => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({
  user,
  config,
  onSave,
  onStart,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"config" | "responses">("config");
  const [formData, setFormData] = useState<AgencyConfig>(config);
  const [isSaved, setIsSaved] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(
    null
  );
  const [isCopied, setIsCopied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Refresh submissions whenever rendering the responses tab or on mount
    const loadSubmissions = async () => {
      const data = await getSubmissions(user.id);
      setSubmissions(data);
    };
    loadSubmissions();
  }, [activeTab, user.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleThemeChange = (
    key: keyof AgencyConfig["theme"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [key]: value },
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const copyLink = () => {
    const link = config.slug
      ? `${window.location.origin}/onboard/${config.slug}`
      : `${window.location.origin}/#client`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedSubmission(expandedSubmission === id ? null : id);
  };

  // Stats calculation
  const totalSubmissions = submissions.length;
  const recentSubmissions = submissions.filter(
    (s) => Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navigation Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">
                  SmartOnboard
                </span>
              </div>

              <nav className="hidden md:flex space-x-1">
                <button
                  onClick={() => setActiveTab("config")}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "config"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Configuration
                </button>
                <button
                  onClick={() => setActiveTab("responses")}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "responses"
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Responses
                  {totalSubmissions > 0 && (
                    <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                      {totalSubmissions}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Share Link Button */}
              <button
                onClick={copyLink}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                {isCopied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {isCopied ? "Link Copied" : "Share Form"}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-slate-50 p-1 rounded-full pr-3 transition-colors border border-transparent hover:border-slate-200"
                >
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full bg-slate-200"
                  />
                  <span className="text-sm font-medium text-slate-700 hidden md:block">
                    {user.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden animate-fade-in-up origin-top-right">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-sm font-medium text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {activeTab === "config"
              ? "Agent Configuration"
              : "Client Submissions"}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {activeTab === "config"
              ? "Define your agency identity and let the AI handle the onboarding."
              : "Review and analyze the data collected from your potential clients."}
          </p>
        </div>

        {/* CONTENT: CONFIGURATION */}
        {activeTab === "config" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* General Settings */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    Agency Identity
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Agency Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Industry / Niche
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      What does your agency do? The AI uses this to introduce
                      your services.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Logic Configuration (Deep Tuning) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-500" />
                    Deep Tuning & Logic
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Ideal Client Profile
                      </label>
                      <input
                        type="text"
                        name="targetAudience"
                        value={formData.targetAudience}
                        onChange={handleChange}
                        placeholder="e.g. Dentists, SaaS Startups"
                        className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Helps AI contextualize the questions.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Max Questions
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          name="maxQuestions"
                          value={formData.maxQuestions}
                          onChange={handleChange}
                          min={3}
                          max={20}
                          className="w-full bg-white pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Prevent the form from becoming too long.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Onboarding Goal ("Definition of Done")
                    </label>
                    <textarea
                      name="onboardingGoal"
                      rows={3}
                      value={formData.onboardingGoal}
                      onChange={handleChange}
                      className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      The specific information the AI must gather before
                      finishing.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tone of Voice
                    </label>
                    <select
                      name="tone"
                      value={formData.tone}
                      onChange={handleChange}
                      className="w-full bg-white rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-colors py-2 px-3 border outline-none"
                    >
                      <option value="Professional & Formal">
                        Professional & Formal
                      </option>
                      <option value="Friendly & Casual">
                        Friendly & Casual
                      </option>
                      <option value="Enthusiastic & Energetic">
                        Enthusiastic & Energetic
                      </option>
                      <option value="Direct & Minimalist">
                        Direct & Minimalist
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Branding & Design */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-500" />
                    Branding & Design
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.theme?.primaryColor || "#4f46e5"}
                        onChange={(e) =>
                          handleThemeChange("primaryColor", e.target.value)
                        }
                        className="h-10 w-10 p-1 rounded border border-slate-200 cursor-pointer bg-white"
                      />
                      <span className="text-sm font-mono text-slate-500 uppercase">
                        {formData.theme?.primaryColor}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Buttons & Progress Bar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.theme?.backgroundColor || "#ffffff"}
                        onChange={(e) =>
                          handleThemeChange("backgroundColor", e.target.value)
                        }
                        className="h-10 w-10 p-1 rounded border border-slate-200 cursor-pointer bg-white"
                      />
                      <span className="text-sm font-mono text-slate-500 uppercase">
                        {formData.theme?.backgroundColor}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Form Page Background
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.theme?.textColor || "#111827"}
                        onChange={(e) =>
                          handleThemeChange("textColor", e.target.value)
                        }
                        className="h-10 w-10 p-1 rounded border border-slate-200 cursor-pointer bg-white"
                      />
                      <span className="text-sm font-mono text-slate-500 uppercase">
                        {formData.theme?.textColor}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Main Font Color
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actions & Preview */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white sticky top-28">
                <h3 className="text-lg font-bold mb-2">Ready to launch?</h3>
                <p className="text-indigo-100 text-sm mb-6">
                  Save your configuration and preview the onboarding flow as if
                  you were a client.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                      isSaved
                        ? "bg-green-500 text-white shadow-green-900/20"
                        : "bg-white text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaved ? "Changes Saved" : "Save Configuration"}
                  </button>
                  <button
                    onClick={onStart}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-500/30 border border-indigo-400/30 rounded-xl text-sm font-bold hover:bg-indigo-500/50 transition-all text-white backdrop-blur-sm"
                  >
                    Preview Form
                    <Play className="h-4 w-4 ml-2 fill-current" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  Share with Clients
                </h3>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                  <code className="text-xs text-slate-600 truncate flex-1">
                    {config.slug
                      ? `${window.location.origin}/onboard/${config.slug}`
                      : `${window.location.origin}/#client`}
                  </code>
                  <button
                    onClick={copyLink}
                    className="p-1.5 hover:bg-white rounded-md shadow-sm transition-all text-slate-500"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT: RESPONSES (Same as before) */}
        {activeTab === "responses" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {totalSubmissions}
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    This Week
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {recentSubmissions}
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Completion Rate
                  </p>
                  <p className="text-2xl font-bold text-slate-900">100%</p>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
              {submissions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-medium mb-1">
                    No responses yet
                  </h3>
                  <p className="text-slate-500 text-sm">
                    Share your link to start collecting onboarding data.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const isExpanded = expandedSubmission === sub.id;
                    return (
                      <div
                        key={sub.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <div
                          className="px-6 py-5 cursor-pointer flex items-center justify-between"
                          onClick={() => toggleExpand(sub.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-50">
                              {sub.clientName?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-900">
                                {sub.clientName}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {new Date(sub.timestamp).toLocaleDateString()}{" "}
                                at{" "}
                                {new Date(sub.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Completed
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Detailed View */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* AI Summary */}
                              <div className="lg:col-span-1">
                                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                      Executive Summary
                                    </h5>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                    {sub.summary}
                                  </p>
                                </div>
                              </div>

                              {/* Full Transcript */}
                              <div className="lg:col-span-2 space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
                                  Full Transcript
                                </h5>
                                {sub.answers.map((ans, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-colors"
                                  >
                                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-slate-200 rounded-r group-hover:bg-indigo-400 transition-colors"></div>
                                    <p className="text-xs font-medium text-slate-500 mb-1 ml-2 uppercase tracking-wide">
                                      Q{idx + 1}: {ans.questionText}
                                    </p>
                                    <p className="text-base text-slate-900 ml-2 font-medium">
                                      {Array.isArray(ans.value)
                                        ? ans.value.join(", ")
                                        : String(ans.value)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
