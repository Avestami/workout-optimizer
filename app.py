from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# Predefined exercises
EXERCISES = [
    {"name": "Push-ups", "type": "strength", "calories_per_minute": 5},
    {"name": "Squats", "type": "strength", "calories_per_minute": 6},
    {"name": "Running", "type": "cardio", "calories_per_minute": 10},
    {"name": "Cycling", "type": "cardio", "calories_per_minute": 8},
    {"name": "Plank", "type": "core", "calories_per_minute": 4},
    {"name": "Jumping Jacks", "type": "cardio", "calories_per_minute": 7},
]

# Helper functions
def create_chromosome():
    """Create a random workout plan."""
    k = random.randint(3, min(5, len(EXERCISES)))  # Ensure k does not exceed available exercises
    return random.sample(EXERCISES, k=k)

def calculate_calories(chromosome, minutes):
    """Calculate the total calories burned for a workout plan."""
    return sum(exercise["calories_per_minute"] * minutes for exercise in chromosome)

def fitness_function(chromosome, goal, minutes):
    """Evaluate the fitness of a workout plan."""
    if goal == "fat_loss":
        return calculate_calories(chromosome, minutes)
    elif goal == "muscle_gain":
        return len([ex for ex in chromosome if ex["type"] == "strength"])
    elif goal == "endurance":
        return len([ex for ex in chromosome if ex["type"] == "cardio"])
    return 0

def mutate(chromosome):
    """Mutate a workout plan by replacing an exercise."""
    if len(chromosome) > 0:
        chromosome[random.randint(0, len(chromosome) - 1)] = random.choice(EXERCISES)
    return chromosome

def crossover(parent1, parent2):
    """Perform crossover between two workout plans."""
    split = random.randint(1, len(parent1) - 1)
    return parent1[:split] + parent2[split:]

@app.route("/optimize", methods=["POST"])
def optimize():

    data = request.get_json()

    selected_exercises = data.get("selected_exercises", [])

    # Validate that at least one exercise is selected
    if not selected_exercises:
        return jsonify({"error": "No exercises selected. Please select at least one workout."}), 400

    minutes = data.get("minutes", 10)
    goal = data.get("goal", "fat_loss")
    population_size = data.get("population_size", 10)
    mutation_rate = data.get("mutation_rate", 0.1)
    crossover_rate = data.get("crossover_rate", 0.7)
    generations = data.get("generations", 10)

    # Initialize population
    population = [create_chromosome() for _ in range(population_size)]
    fitness_over_generations = []
    average_fitness = []
    diversity = []
    best_fitness_progression = []

    for generation in range(generations):
        # Evaluate fitness
        fitness_scores = [fitness_function(chromo, goal, minutes) for chromo in population]
        population = sorted(
            population, key=lambda chromo: fitness_function(chromo, goal, minutes), reverse=True
        )
        top_fitness = fitness_function(population[0], goal, minutes)
        avg_fitness = sum(fitness_scores) / len(fitness_scores)

        # Record metrics
        fitness_over_generations.append(top_fitness)
        average_fitness.append(avg_fitness)
        diversity.append(len(set(tuple(frozenset(exercise.items()) for exercise in chromo) for chromo in population)))
        best_fitness_progression.append(top_fitness)

        # Select the top half
        selected = population[: len(population) // 2]

        # Generate next generation
        next_generation = []
        while len(next_generation) < population_size:
            parent1 = random.choice(selected)
            parent2 = random.choice(selected)

            # Crossover
            if random.random() < crossover_rate:
                child = crossover(parent1, parent2)
            else:
                child = parent1  # No crossover, retain parent1

            # Mutation
            if random.random() < mutation_rate:
                child = mutate(child)

            next_generation.append(child)

        population = next_generation

    # Return the results
    best_plan = sorted(population, key=lambda chromo: fitness_function(chromo, goal, minutes), reverse=True)[0]
    return jsonify({
        "best_plan": [{"name": exercise["name"], "calories_burned": calculate_calories([exercise], minutes)} for exercise in best_plan],
        "fitness_over_generations": fitness_over_generations,
        "average_fitness": average_fitness,
        "diversity": diversity,
        "best_fitness_progression": best_fitness_progression,
        "mutation_rate": mutation_rate,
        "crossover_rate": crossover_rate,
    })

if __name__ == "__main__":
    app.run(debug=True)
