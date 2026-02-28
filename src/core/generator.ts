import { RoundConfig, Question } from "./types";
import { templates } from "./templates";

const randomChoice = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export const generateRound = (config: RoundConfig): Question[] => {
  const filtered = templates.filter(
    (template) =>
      config.categories.includes(template.category) &&
      template.difficulty <= config.difficulty
  );

  const eligible =
    filtered.length > 0
      ? filtered
      : templates.filter((template) =>
          config.categories.includes(template.category)
        );

  if (eligible.length === 0) {
    throw new Error("No templates available for the selected categories.");
  }

  return Array.from({ length: config.questionCount }, () =>
    randomChoice(eligible).generate()
  );
};
