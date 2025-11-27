import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AgencyConfig, Answer, InputType, SessionState } from "@/types";
import { generateNextQuestion } from "@/services/geminiService";
import { saveSubmission as saveSubmissionDB } from "@/app/actions";
import FormInput from "./FormInput";

interface Props {
  config: AgencyConfig;
  mode: "preview" | "client";
  onExit?: () => void;
  userId?: string;
}

const OnboardingFlow: React.FC<Props> = ({ config, mode, onExit, userId }) => {
  const [session, setSession] = useState<SessionState>({
    answers: [],
    currentQuestion: null,
    isLoading: true,
    isComplete: false,
  });

  const [currentAnswer, setCurrentAnswer] = useState<any>("");

  // Initialize first question
  useEffect(() => {
    loadNextQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNextQuestion = async (history: Answer[]) => {
    setSession((prev) => ({ ...prev, isLoading: true }));
    try {
      const nextQ = await generateNextQuestion(config, history);

      setSession((prev) => ({
        ...prev,
        isLoading: false,
        currentQuestion: nextQ,
        isComplete: nextQ.isComplete,
      }));

      // If complete and in client mode, save immediately
      if (nextQ.isComplete && mode === "client" && userId) {
        await saveSubmissionDB(userId, history, nextQ.summary || "No summary generated.");
      }

      // Reset input state
      if (nextQ.type === InputType.MULTI_SELECT) {
        setCurrentAnswer([]);
      } else {
        setCurrentAnswer("");
      }
    } catch (error) {
      setSession((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load question.",
      }));
    }
  };

  const handleSubmitAnswer = () => {
    if (!session.currentQuestion) return;

    // Validation
    if (Array.isArray(currentAnswer) && currentAnswer.length === 0) return;
    if (!Array.isArray(currentAnswer) && !currentAnswer) return;

    const newAnswer: Answer = {
      questionId: session.currentQuestion.id,
      questionText: session.currentQuestion.text,
      value: currentAnswer,
    };

    const newHistory = [...session.answers, newAnswer];
    setSession((prev) => ({ ...prev, answers: newHistory }));

    // Load next question - Motion will handle the exit animation
    loadNextQuestion(newHistory);
  };

  const primaryColor = config.theme?.primaryColor || "#4f46e5";
  const backgroundColor = config.theme?.backgroundColor || "#ffffff";
  const textColor = config.theme?.textColor || "#111827";

  // Completion View
  if (session.isComplete && session.currentQuestion) {
    if (mode === "client") {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in-up"
          style={{ backgroundColor: backgroundColor, color: textColor }}
        >
          <div className="max-w-xl w-full">
            <div
              className="mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-8 opacity-20"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle2
                className="h-12 w-12"
                style={{ color: primaryColor, opacity: 5 }}
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Thank you!
            </h1>
            <p className="text-xl mb-8 font-light opacity-70">
              Your information has been received. Our team at{" "}
              <span className="font-semibold">{config.name}</span> will review
              your needs and get back to you shortly.
            </p>
            <div
              className="w-16 h-1 mx-auto rounded-full"
              style={{ backgroundColor: primaryColor }}
            ></div>
          </div>
        </div>
      );
    }

    // Preview Mode (Admin)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in-up"
        style={{ backgroundColor: backgroundColor }}
      >
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100">
          <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Onboarding Complete
          </h1>
          <p className="text-sm text-gray-400 mb-8 uppercase tracking-wide">
            Preview Mode
          </p>

          {session.currentQuestion.summary && (
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-8 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                AI Summary of Client
              </h3>
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {session.currentQuestion.summary}
              </p>
            </div>
          )}

          <button
            onClick={onExit}
            className="w-full text-white font-medium py-4 rounded-xl hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading View
  if (session.isLoading && !session.currentQuestion) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: backgroundColor }}
      >
        <Loader2
          className="h-12 w-12 animate-spin mb-4"
          style={{ color: primaryColor }}
        />
        <p
          className="font-medium animate-pulse opacity-50"
          style={{ color: textColor }}
        >
          Thinking...
        </p>
      </div>
    );
  }

  // Error View
  if (session.error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: backgroundColor }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-4">{session.error}</p>
          <button
            onClick={onExit}
            className="underline"
            style={{ color: textColor }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Main Form View
  const progress = session.currentQuestion?.progressEstimation || 0;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: backgroundColor, color: textColor }}
    >
      {/* Progress Bar */}
      <div
        className="w-full h-1.5 fixed top-0 left-0 z-50 bg-gray-200"
      >
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: primaryColor,
            boxShadow: `0 0 10px ${primaryColor}40`
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-6 md:px-12 py-12">
        <AnimatePresence mode="wait">
          {/* Loading state between questions */}
          {session.isLoading && session.currentQuestion && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center justify-center py-20"
            >
              <Loader2
                className="h-8 w-8 animate-spin mb-3"
                style={{ color: primaryColor }}
              />
              <p className="text-sm opacity-50">Generating next question...</p>
            </motion.div>
          )}

          {/* Question content */}
          {session.currentQuestion && !session.isLoading && (
            <motion.div
              key={session.currentQuestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full"
            >
            {/* Question Number/Index */}
            <div className="flex items-center gap-2 mb-8 font-medium">
              <span
                className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                {config.name}
              </span>
              <span className="opacity-30">/</span>
              <span className="text-xs uppercase tracking-widest opacity-40">
                Question {session.answers.length + 1}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-2xl md:text-4xl font-normal mb-4 leading-tight">
              {session.currentQuestion.text}
            </h2>

            {/* Helper Text */}
            {session.currentQuestion.helperText && (
              <p className="text-lg mb-10 font-light opacity-60">
                {session.currentQuestion.helperText}
              </p>
            )}

            {/* Input Component */}
            <div className="mt-8 mb-12">
              <FormInput
                type={session.currentQuestion.type}
                value={currentAnswer}
                onChange={setCurrentAnswer}
                onSubmit={handleSubmitAnswer}
                options={session.currentQuestion.options}
                autoFocus={!session.isLoading}
                primaryColor={primaryColor}
              />
            </div>

            {/* Action Bar (Buttons) */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSubmitAnswer}
                disabled={session.isLoading}
                style={{ backgroundColor: primaryColor }}
                className="group text-white px-8 py-3 rounded text-lg font-medium transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-200 hover:opacity-90"
              >
                {session.isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    OK
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {!currentAnswer &&
                session.currentQuestion.type !== InputType.BOOLEAN && (
                  <span className="text-sm text-red-400 animate-pulse hidden group-hover:block transition-all">
                    Input required
                  </span>
                )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {mode === "preview" && (
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
          <div className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium border border-yellow-200">
            Preview Mode
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;
