import { useMemo, useState } from "react";
import {
  CATEGORY_GROUPS,
  CATEGORY_LABELS,
  Category,
  Difficulty,
  RoundConfig
} from "../core/types";

const QUESTION_COUNT_OPTIONS = [5, 10, 20];

type SettingsScreenProps = {
  onStart: (config: RoundConfig) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
};

export default function SettingsScreen({
  onStart,
  onLogout,
  isLoggingOut
}: SettingsScreenProps) {
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [categories, setCategories] = useState<Category[]>(
    CATEGORY_GROUPS.flatMap((group) => group.categories)
  );

  const canStart = categories.length > 0;

  const handleToggleCategory = (category: Category) => {
    setCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const selectedLabel = useMemo(
    () =>
      categories
        .map((category) => CATEGORY_LABELS[category])
        .sort()
        .join(", "),
    [categories]
  );

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>CodeTrainer</h1>
          <p>Rapid-fire Python drills to build coding muscle memory.</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="badge">MVP</span>
          <button
            className="button secondary"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>

      <div className="card grid">
        <section>
          <h2>Round settings</h2>
          <div className="grid two">
            <label>
              Question count
              <select
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
              >
                {QUESTION_COUNT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(Number(event.target.value) as Difficulty)
                }
              >
                <option value={1}>1 - Warm up</option>
                <option value={2}>2 - Moderate</option>
                <option value={3}>3 - Spicy</option>
              </select>
            </label>
          </div>
        </section>

        <section>
          <h2>Categories</h2>
          {CATEGORY_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 8 }}>{group.label}</h3>
              <div className="grid two">
                {group.categories.map((category) => (
                  <label key={category}>
                    <input
                      type="checkbox"
                      checked={categories.includes(category)}
                      onChange={() => handleToggleCategory(category)}
                    />{" "}
                    {CATEGORY_LABELS[category]}
                  </label>
                  
                ))}
              </div>
            </div>
          ))}
          <p>Selected: {selectedLabel || "None"}</p>
        </section>

        <button
          className="button"
          disabled={!canStart}
          onClick={() =>
            onStart({
              questionCount,
              categories,
              difficulty
            })
          }
        >
          Start Round
        </button>
      </div>
    </div>
  );
}
