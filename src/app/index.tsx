
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Difficulty = "Easy" | "MEDIUM" | "Hard";
type Variable = "force" | "mass" | "acceleration";
type Unit = {
  label: string;
  factor: number;
};
type Problem = {
  question: string;
  answer: number;
  answerUnit: string;
};
type Feedback = {
  correct: boolean;
  correctAnswer: string;
};

const variableNames: Record<Variable, string> = {
  force: "force",
  mass: "mass",
  acceleration: "acceleration",
};

const units: Record<Variable, Unit[]> = {
  force: [
    { label: "N", factor: 1 },
    { label: "kN", factor: 1000 },
  ],
  mass: [
    { label: "kg", factor: 1 },
    { label: "g", factor: 0.001 },
  ],
  acceleration: [
    { label: "m/s²", factor: 1 },
    { label: "cm/s²", factor: 0.01 },
  ],
};

const objects = [
  "box",
  "cart",
  "crate",
  "trolley",
  "machine",
  "container",
];

const colors = [
  "red",
  "blue",
  "green",
  "yellow",
  "black",
  "white",
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatNumber(value: number): string {
  if (Math.abs(value) < 0.000001) {
    return "0";
  }

  return Number(value.toFixed(2)).toString();
}

function getUnit(variable: Variable, difficulty: Difficulty): Unit {
  if (difficulty === "Easy") {
    return units[variable][0];
  }

  return randomItem(units[variable]);
}

function getPhysicalValues(difficulty: Difficulty) {
  if (difficulty === "Easy") {
    const mass = randomItem([2, 3, 4, 5]);
    const acceleration = randomItem([2, 3, 4, 5]);

    return {
      mass,
      acceleration,
      force: mass * acceleration,
    };
  }

  if (difficulty === "Medium") {
    const mass = randomItem([2, 3, 4, 5, 6, 8, 10]);
    const acceleration = randomItem([1, 2, 3, 4, 5, 6]);

    return {
      mass,
      acceleration,
      force: mass * acceleration,
    };
  }

  const mass = randomItem([1.5, 2.5, 3.5, 4.5, 5.5, 7.5, 8.5]);
  const acceleration = randomItem([1.2, 1.5, 2.4, 2.5, 3.2, 3.5, 4.5]);

  return {
    mass,
    acceleration,
    force: mass * acceleration,
  };
}

function createProblem(difficulty: Difficulty): Problem {
  const missing = randomItem<Variable>([
    "force",
    "mass",
    "acceleration",
  ]);

  const allVariables: Variable[] = [
    "force",
    "mass",
    "acceleration",
  ];

  const knownVariables = allVariables.filter(
    (variable) => variable !== missing
  );

  const first = knownVariables[0];
  const second = knownVariables[1];

  const valuesSI = getPhysicalValues(difficulty);

  const firstUnit = getUnit(first, difficulty);
  const secondUnit = getUnit(second, difficulty);
  const answerUnit = getUnit(missing, difficulty);

  const firstDisplayed = valuesSI[first] / firstUnit.factor;
  const secondDisplayed = valuesSI[second] / secondUnit.factor;

  let answerSI: number;

  if (missing === "force") {
    answerSI = valuesSI.mass * valuesSI.acceleration;
  } else if (missing === "mass") {
    answerSI = valuesSI.force / valuesSI.acceleration;
  } else {
    answerSI = valuesSI.force / valuesSI.mass;
  }

  const answer = answerSI / answerUnit.factor;

  const object = randomItem(objects);
  const color = randomItem(colors);

  const firstName = variableNames[first];
  const secondName = variableNames[second];

  const question =
    `A ${color} ${object} moves horizontally. ` +
    `Its ${firstName} is ${formatNumber(firstDisplayed)} ${firstUnit.label} ` +
    `and its ${secondName} is ${formatNumber(secondDisplayed)} ${secondUnit.label}. ` +
    `Ignoring friction, calculate the ${variableNames[missing]}. ` +
    `Give your answer in ${answerUnit.label}.`;

  return {
    question,
    answer,
    answerUnit: answerUnit.label,
  };
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} min ${seconds} sec`;
}

export default function Index() {
  const [screen, setScreen] = useState<
    "setup" | "quiz" | "results"
  >("setup");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("Easy");

  const [questionCountText, setQuestionCountText] =
    useState("10");

  const [problems, setProblems] = useState<Problem[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [answerText, setAnswerText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [setupError, setSetupError] = useState("");

  const currentProblem = problems[questionIndex];

  function startQuiz() {
    const count = Number(questionCountText);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 50
    ) {
      setSetupError("Enter a whole number from 1 to 50.");
      return;
    }

    const newProblems = Array.from(
      { length: count },
      () => createProblem(difficulty)
    );

    setProblems(newProblems);
    setQuestionIndex(0);
    setAnswerText("");
    setFeedback(null);
    setScore(0);
    setElapsedSeconds(0);
    setSetupError("");
    setStartTime(Date.now());
    setScreen("quiz");
  }

  function checkAnswer() {
    if (!currentProblem || feedback !== null) {
      return;
    }

    const submittedAnswer = Number(answerText.trim());

    if (
      answerText.trim() === "" ||
      !Number.isFinite(submittedAnswer)
    ) {
      setFeedback({
        correct: false,
        correctAnswer:
          `Please enter a valid number. Correct answer: ` +
          `${formatNumber(currentProblem.answer)} ${currentProblem.answerUnit}`,
      });
      return;
    }

    const difference = Math.abs(
      submittedAnswer - currentProblem.answer
    );

    const tolerance = Math.max(
      0.01,
      Math.abs(currentProblem.answer) * 0.01
    );

    const isCorrect = difference <= tolerance;

    if (isCorrect) {
      setScore((previousScore) => previousScore + 1);
    }

    setFeedback({
      correct: isCorrect,
      correctAnswer:
        `${formatNumber(currentProblem.answer)} ` +
        currentProblem.answerUnit,
    });
  }

  function goToNextQuestion() {
    if (feedback === null) {
      return;
    }

    if (questionIndex === problems.length - 1) {
      const endTime = Date.now();
      const duration = startTime
        ? Math.max(0, Math.floor((endTime - startTime) / 1000))
        : 0;

      setElapsedSeconds(duration);
      setScreen("results");
      return;
    }

    setQuestionIndex((previousIndex) => previousIndex + 1);
    setAnswerText("");
    setFeedback(null);
  }

  function returnToSetup() {
    setScreen("setup");
    setProblems([]);
    setQuestionIndex(0);
    setAnswerText("");
    setFeedback(null);
    setScore(0);
    setElapsedSeconds(0);
    setStartTime(null);
    setSetupError("");
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}><Text style={styles.heading}>Newton's Second Law Physics Quiz</Text></Text>
      <Text style={styles.subtitle}>
        Newton's Second Law — F = ma
      </Text>

      {screen === "setup" && (
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Quiz Setup</Text>

          <Text style={styles.label}>1. Difficulty Level</Text>

          <View style={styles.row}>
            {(["Easy", "Medium", "Hard"] as Difficulty[]).map(
              (level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.difficultyButton,
                    difficulty === level &&
                      styles.selectedDifficulty,
                  ]}
                  onPress={() => setDifficulty(level)}
                >
                  <Text
                    style={[
                      styles.difficultyText,
                      difficulty === level &&
                        styles.selectedDifficultyText,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <Text style={styles.label}>2. Number of Questions</Text>

          <TextInput
            style={styles.countInput}
            value={questionCountText}
            onChangeText={setQuestionCountText}
            keyboardType="number-pad"
            placeholder="Enter number of questions"
            maxLength={2}
          />

          <Text style={styles.helperText}>
            Choose between 1 and 50 questions.
          </Text>

          {setupError !== "" && (
            <Text style={styles.errorText}>{setupError}</Text>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startQuiz}
          >
            <Text style={styles.primaryButtonText}>Start Quiz</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Each correct answer earns 1 point. Incorrect answers
            earn 0 points. The timer starts when you press Start.
          </Text>
        </View>
      )}

      {screen === "quiz" && currentProblem && (
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Question {questionIndex + 1} of {problems.length}
            </Text>
            <Text style={styles.progressText}>
              Score: {score}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((questionIndex + 1) / problems.length) * 100
                  }%`,
                },
              ]}
            />
          </View>

          <Text style={styles.label}>Difficulty: {difficulty}</Text>

          <Text style={styles.questionText}>
            {currentProblem.question}
          </Text>

          <Text style={styles.label}>Your Answer</Text>

          <View style={styles.answerRow}>
            <TextInput
              style={styles.answerInput}
              value={answerText}
              onChangeText={setAnswerText}
              keyboardType="decimal-pad"
              placeholder="Enter numerical answer"
              editable={feedback === null}
            />
            <Text style={styles.unitText}>
              {currentProblem.answerUnit}
            </Text>
          </View>

          {feedback !== null && (
            <View style={styles.feedbackRow}>
              <Text
                style={[
                  styles.submittedAnswer,
                  feedback.correct
                    ? styles.correctText
                    : styles.incorrectText,
                ]}
              >
                {feedback.correct
                  ? `Your answer: ${answerText} ${currentProblem.answerUnit}`
                  : `Your answer: ${answerText || "—"} ${currentProblem.answerUnit}`}
              </Text>

              <Text style={styles.correctAnswer}>
                {feedback.correct
                  ? "✓ +1 point"
                  : `Correct: ${feedback.correctAnswer}`}
              </Text>

              {!feedback.correct && (
                <Text style={styles.zeroPointText}>
                  +0 points
                </Text>
              )}
            </View>
          )}

          {feedback === null ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={checkAnswer}
            >
              <Text style={styles.primaryButtonText}>
                Check Answer
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goToNextQuestion}
            >
              <Text style={styles.primaryButtonText}>
                {questionIndex === problems.length - 1
                  ? "Finish Quiz"
                  : "Next Question"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={returnToSetup}
          >
            <Text style={styles.secondaryButtonText}>
              End Quiz and Return to Setup
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === "results" && (
        <View style={styles.card}>
          <Text style={styles.resultsHeading}>Quiz Complete!</Text>

          <Text style={styles.resultsLabel}>Your Total Score</Text>
          <Text style={styles.bigScore}>
            {score} / {problems.length}
          </Text>

          <Text style={styles.percentageText}>
            Percentage:{" "}
            {problems.length > 0
              ? Math.round((score / problems.length) * 100)
              : 0}
            %
          </Text>

          <View style={styles.resultDivider} />

          <Text style={styles.resultsLabel}>Time Taken</Text>
          <Text style={styles.timeText}>
            {formatTime(elapsedSeconds)}
          </Text>

          <Text style={styles.infoText}>
            Difficulty: {difficulty}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={returnToSetup}
          >
            <Text style={styles.primaryButtonText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f3f6fb",
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 35,
    alignItems: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#17365d",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#526579",
    marginTop: 6,
    marginBottom: 22,
  },
card: {
  backgroundColor: "#ffffff",
  borderRadius: 14,
  padding: 18,
  elevation: 3,
  width: "100%",
  maxWidth: 450,
  alignSelf: "center",
},
  sectionHeading: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#17365d",
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263746",
    marginTop: 15,
    marginBottom: 9,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#b8c5d6",
    borderRadius: 9,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  selectedDifficulty: {
    backgroundColor: "#17365d",
    borderColor: "#17365d",
  },
  difficultyText: {
    fontSize: 15,
    color: "#17365d",
    fontWeight: "600",
  },
  selectedDifficultyText: {
    color: "#ffffff",
  },
  countInput: {
    borderWidth: 1,
    borderColor: "#b8c5d6",
    borderRadius: 9,
    padding: 13,
    fontSize: 17,
    backgroundColor: "#ffffff",
  },
  helperText: {
    color: "#68798b",
    fontSize: 13,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: "#1769aa",
    borderRadius: 9,
    padding: 15,
    alignItems: "center",
    marginTop: 22,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#526579",
    fontSize: 13,
  },
  infoText: {
    color: "#68798b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 18,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
    marginTop: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#17365d",
  },
  progressTrack: {
    height: 7,
    backgroundColor: "#e1e8f0",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 12,
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1769aa",
  },
  questionText: {
    fontSize: 18,
    lineHeight: 27,
    color: "#263746",
    marginTop: 18,
    marginBottom: 10,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  answerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#b8c5d6",
    borderRadius: 9,
    padding: 13,
    fontSize: 17,
    backgroundColor: "#ffffff",
  },
  unitText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#17365d",
  },
  feedbackRow: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f7f9fc",
    borderRadius: 9,
  },
  submittedAnswer: {
    fontSize: 15,
    fontWeight: "600",
  },
  correctText: {
    color: "#16803c",
  },
  incorrectText: {
    color: "#c62828",
  },
  correctAnswer: {
    color: "#16803c",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 7,
  },
  zeroPointText: {
    color: "#68798b",
    fontSize: 13,
    marginTop: 5,
  },
  resultsHeading: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#17365d",
    textAlign: "center",
    marginBottom: 25,
  },
  resultsLabel: {
    fontSize: 16,
    color: "#526579",
    textAlign: "center",
  },
  bigScore: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#1769aa",
    textAlign: "center",
    marginTop: 8,
  },
  percentageText: {
    fontSize: 18,
    color: "#16803c",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#e1e8f0",
    marginVertical: 25,
  },
  timeText: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#17365d",
    textAlign: "center",
    marginTop: 10,
  },
  // Automatic Vercel deployment test
});
