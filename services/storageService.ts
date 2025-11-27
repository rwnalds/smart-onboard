import { Answer, Submission } from "@/types";

const STORAGE_KEY = "smart_onboard_submissions";

export const saveSubmission = (
  answers: Answer[],
  summary: string
): Submission => {
  const submissions = getSubmissions();

  // Try to find a name in the answers to label the submission
  const nameAnswer = answers.find(
    (a) =>
      a.questionText.toLowerCase().includes("name") ||
      a.questionText.toLowerCase().includes("who")
  );

  const newSubmission: Submission = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    answers,
    summary,
    clientName: nameAnswer
      ? String(nameAnswer.value)
      : `Client ${submissions.length + 1}`,
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([newSubmission, ...submissions])
  );
  return newSubmission;
};

export const getSubmissions = (): Submission[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse submissions", e);
    return [];
  }
};

export const clearSubmissions = () => {
  localStorage.removeItem(STORAGE_KEY);
};
