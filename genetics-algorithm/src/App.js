import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [exercises, setExercises] = useState([
    { name: "Push-ups", type: "strength" },
    { name: "Squats", type: "strength" },
    { name: "Running", type: "cardio" },
    { name: "Cycling", type: "cardio" },
    { name: "Plank", type: "core" },
    { name: "Jumping Jacks", type: "cardio" },
  ]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [minutes, setMinutes] = useState(30);
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState({});
  const [mutationRate, setMutationRate] = useState(0.1);
  const [crossoverRate, setCrossoverRate] = useState(0.8);
  const [elitismRate, setElitismRate] = useState(0.2);
  const [bestPlan, setBestPlan] = useState([]); // Store the best workout plan

  const handleExerciseChange = (exercise, checked) => {
    if (checked) {
      setSelectedExercises((prev) => [...prev, exercise]);
    } else {
      setSelectedExercises((prev) =>
        prev.filter((item) => item.name !== exercise.name)
      );
    }
  };

  const handleRunOptimization = async () => {
  try {
    if (selectedExercises.length === 0) {
      alert("Please select at least one workout.");
      return;
    }
    const response = await axios.post("http://localhost:5000/optimize", {
      selected_exercises: selectedExercises,
      minutes: minutes,
      goal: "fat_loss",
      mutation_rate: mutationRate,
      crossover_rate: crossoverRate,
      elitism_rate: elitismRate,
    });

    const result = response.data;

    if (!result.best_plan || result.best_plan.length === 0) {
      alert("No workout plan found! Please try again.");
      return;
    }

    setData(result);

    // Filter out exercises that were not selected
    const filteredBestPlan = result.best_plan.filter((exercise) =>
      selectedExercises.some((selected) => selected.name === exercise.name)
    );

    setBestPlan(filteredBestPlan);
    setChartData({
      fitness: {
        labels: result.fitness_over_generations.map((_, i) => `Generation ${i + 1}`),
        datasets: [
          {
            label: "Fitness Over Generations",
            data: result.fitness_over_generations,
            borderColor: "#3b82f6",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      averageFitness: {
        labels: result.average_fitness.map((_, i) => `Generation ${i + 1}`),
        datasets: [
          {
            label: "Average Fitness Over Generations",
            data: result.average_fitness,
            borderColor: "#10b981",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      diversity: {
        labels: result.diversity.map((_, i) => `Generation ${i + 1}`),
        datasets: [
          {
            label: "Diversity of Chromosomes",
            data: result.diversity,
            borderColor: "#f97316",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
      topFitness: {
        labels: result.best_fitness_progression.map((_, i) => `Generation ${i + 1}`),
        datasets: [
          {
            label: "Top Fitness Progression",
            data: result.best_fitness_progression,
            borderColor: "#e11d48",
            borderWidth: 2,
            fill: false,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching optimization:", error);
  }
};



  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Genetic Algorithm Workout Optimizer</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Select Workouts</h2>
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <div key={exercise.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={exercise.name}
                  onChange={(e) => handleExerciseChange(exercise, e.target.checked)}
                  className="rounded"
                />
                <label htmlFor={exercise.name}>{exercise.name}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Set Time for Each Workout</h2>
            <div className="flex items-center space-x-2">
              <label htmlFor="minutes">Minutes:</label>
              <input
                type="number"
                id="minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                min="1"
                className="border rounded px-2 py-1 w-20"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Genetic Algorithm Parameters</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="mutation-rate">Mutation Rate: {mutationRate}</label>
                <input
                  type="range"
                  id="mutation-rate"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mutationRate}
                  onChange={(e) => setMutationRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="crossover-rate">Crossover Rate: {crossoverRate}</label>
                <input
                  type="range"
                  id="crossover-rate"
                  min="0"
                  max="1"
                  step="0.01"
                  value={crossoverRate}
                  onChange={(e) => setCrossoverRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="elitism-rate">Elitism Rate: {elitismRate}</label>
                <input
                  type="range"
                  id="elitism-rate"
                  min="0"
                  max="1"
                  step="0.01"
                  value={elitismRate}
                  onChange={(e) => setElitismRate(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleRunOptimization}
          className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-2 rounded-md font-semibold transition-colors"
        >
          Run Optimization
        </button>
      </div>

      {data && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Fitness Over Generations</h2>
            <div className="w-full h-[300px]">
              <Line data={chartData.fitness} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Average Fitness Over Generations</h2>
            <div className="w-full h-[300px]">
              <Line data={chartData.averageFitness} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Diversity of Chromosomes</h2>
            <div className="w-full h-[300px]">
              <Line data={chartData.diversity} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Top Fitness Progression</h2>
            <div className="w-full h-[300px]">
              <Line data={chartData.topFitness} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      )}

      {bestPlan.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Best Workout Plan</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ul>
              {bestPlan.map((exercise, index) => (
                <li key={index} className="py-2">
                  <span className="font-semibold">{exercise.name}</span> - {exercise.calories_burned} calories burned
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;