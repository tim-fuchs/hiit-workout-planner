const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadBrowserScripts() {
  const context = vm.createContext({
    console,
    fetch: async () => {
      throw new Error("fetch stub was not configured");
    },
    Math: Object.create(Math),
  });

  for (const [filePath, exports] of [
    ["js/utils/config.js", ["CONFIG"]],
    ["js/utils/validator.js", ["Validator"]],
    ["js/services/exercise-service.js", ["ExerciseService"]],
    ["js/services/workout-service.js", ["WorkoutService"]],
  ]) {
    const source = fs.readFileSync(path.join(rootDir, filePath), "utf8");
    const exportGlobals = exports
      .map((name) => `globalThis.${name} = ${name};`)
      .join("\n");
    vm.runInContext(`${source}\n${exportGlobals}`, context, { filename: filePath });
  }

  return context;
}

test("Validator reports missing categories and invalid round values", () => {
  const { Validator } = loadBrowserScripts();

  const result = Validator.validateWorkoutConfiguration([], 0, 0);

  assert.equal(result.isValid, false);
  assert.deepEqual(plain(result.errors), [
    "Select at least one exercise category.",
    "Number of rounds must be at least 1.",
    "Rounds before category change must be at least 1.",
  ]);
});

test("Validator accepts a minimal valid workout configuration", () => {
  const { Validator } = loadBrowserScripts();

  const result = Validator.validateWorkoutConfiguration(["Legs"], 1, 1);

  assert.deepEqual(plain(result), { isValid: true, errors: [] });
});

test("ExerciseService sanitizes exercise data and filters selected categories", async () => {
  const context = loadBrowserScripts();
  context.fetch = async (url) => {
    assert.equal(url, context.CONFIG.EXERCISES_FILE);
    return {
      async json() {
        return {
          exerciseCategories: [
            {
              categoryName: "Core",
              emoji: "C",
              exercises: [{ name: "<Plank>", description: "Hold & breathe" }],
            },
            {
              categoryName: "Legs",
              emoji: "L",
              exercises: [{ name: "Squat", description: "Don't rush" }],
            },
          ],
        };
      },
    };
  };

  const result = await context.ExerciseService.getExerciseData(["Core"]);

  assert.equal(result.length, 1);
  assert.equal(result[0].categoryName, "Core");
  assert.equal(result[0].exercises[0].name, "&lt;Plank&gt;");
  assert.equal(result[0].exercises[0].description, "Hold &amp; breathe");
});

test("ExerciseService returns category summaries", async () => {
  const context = loadBrowserScripts();
  context.fetch = async () => ({
    async json() {
      return {
        exerciseCategories: [
          { categoryName: "Core", emoji: "C", exercises: [] },
          { categoryName: "Legs", emoji: "L", exercises: [] },
        ],
      };
    },
  });

  const result = await context.ExerciseService.getExerciseCategories();

  assert.deepEqual(plain(result), [
    { categoryName: "Core", emoji: "C" },
    { categoryName: "Legs", emoji: "L" },
  ]);
});

test("WorkoutService alternates categories after the requested interval", async () => {
  const context = loadBrowserScripts();
  context.ExerciseService.getExerciseData = async () => [
    {
      categoryName: "Legs",
      emoji: "L",
      exercises: [{ name: "Squat", description: "Bend knees" }],
    },
    {
      categoryName: "Core",
      emoji: "C",
      exercises: [{ name: "Plank", description: "Brace core" }],
    },
  ];
  context.WorkoutService.shuffleArray = (array) => array;
  context.Math.random = () => 0;

  const workout = await context.WorkoutService.createWorkout(["Legs", "Core"], 4, 2);

  assert.deepEqual(
    plain(workout.map((round) => round.category)),
    ["Legs", "Legs", "Core", "Core"],
  );
  assert.deepEqual(
    plain(workout.map((round) => round.exercise)),
    ["Squat", "Squat", "Plank", "Plank"],
  );
});

test("WorkoutService shuffleArray preserves elements and mutates the array", () => {
  const context = loadBrowserScripts();
  context.Math.random = () => 0;
  const values = [1, 2, 3, 4];

  const shuffled = context.WorkoutService.shuffleArray(values);

  assert.equal(shuffled, values);
  assert.deepEqual([...values].sort(), [1, 2, 3, 4]);
});
