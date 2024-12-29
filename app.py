from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

EXERCISES = {
    "Push-ups": {"type": "strength", "calories": 10},
    "Squats": {"type": "strength", "calories": 12},
    "Running": {"type": "cardio", "calories": 15},
    "Cycling": {"type": "cardio", "calories": 14},
    "Plank": {"type": "core", "calories": 8},
    "Jumping Jacks": {"type": "cardio", "calories": 12},
}

POPULATION_SIZE = 20
GENERATIONS = 50


def generate_population(exercises, num_individuals):
    population = []
    for _ in range(num_individuals):
        individual = [random.choice(exercises) for _ in range(random.randint(2, 5))]
        population.append(individual)
    return population


def fitness_function(plan, max_minutes):
    total_calories = sum(EXERCISES[exercise]["calories"] for exercise in plan)
    total_duration = len(plan) * max_minutes / len(plan)

    if total_duration > max_minutes:
        return total_calories * 0.5
    return total_calories


def select_parents(population, fitness_scores):
    total_fitness = sum(fitness_scores)
    probabilities = [score / total_fitness for score in fitness_scores]
    parents = random.choices(population, probabilities, k=2)
    return parents


def crossover(parent1, parent2):
    crossover_point = random.randint(1, min(len(parent1), len(parent2)) - 1)
    child1 = parent1[:crossover_point] + parent2[crossover_point:]
    child2 = parent2[:crossover_point] + parent1[crossover_point:]
    return child1, child2


def mutate(individual, exercises, mutation_rate):
    if random.random() < mutation_rate:
        mutation_point = random.randint(0, len(individual) - 1)
        individual[mutation_point] = random.choice(exercises)
    return individual


def evolve_population(population, exercises, max_minutes, mutation_rate, elitism_rate):
    fitness_scores = [fitness_function(plan, max_minutes) for plan in population]
    new_population = []

    elite_count = int(len(population) * elitism_rate)
    elite_individuals = [plan for _, plan in sorted(zip(fitness_scores, population), reverse=True)][:elite_count]
    new_population.extend(elite_individuals)

    while len(new_population) < len(population):
        parent1, parent2 = select_parents(population, fitness_scores)
        child1, child2 = crossover(parent1, parent2)
        new_population.append(mutate(child1, exercises, mutation_rate))
        if len(new_population) < len(population):
            new_population.append(mutate(child2, exercises, mutation_rate))

    return new_population


@app.route('/optimize', methods=['POST'])
def optimize():
    data = request.json
    selected_exercises = data.get("selected_exercises", [])
    max_minutes = int(data.get("minutes", 30))
    mutation_rate = float(data.get("mutation_rate", 0.1))
    elitism_rate = float(data.get("elitism_rate", 0.2))

    if not selected_exercises:
        return jsonify({"error": "No exercises selected"}), 400

    exercise_pool = [exercise['name'] for exercise in selected_exercises if exercise['name'] in EXERCISES]

    population = generate_population(exercise_pool, POPULATION_SIZE)
    fitness_over_generations = []
    best_fitness_progression = []

    for generation in range(GENERATIONS):
        fitness_scores = [fitness_function(plan, max_minutes) for plan in population]
        fitness_over_generations.append(sum(fitness_scores) / len(fitness_scores))
        best_plan = max(population, key=lambda plan: fitness_function(plan, max_minutes))
        best_fitness_progression.append(fitness_function(best_plan, max_minutes))

        population = evolve_population(population, exercise_pool, max_minutes, mutation_rate, elitism_rate)

    best_plan = max(population, key=lambda plan: fitness_function(plan, max_minutes))

    return jsonify({
        "best_plan": [{"name": exercise, "calories_burned": EXERCISES[exercise]["calories"]} for exercise in best_plan],
        "fitness_over_generations": fitness_over_generations,
        "best_fitness_progression": best_fitness_progression,
    })


if __name__ == '__main__':
    app.run(debug=True)
