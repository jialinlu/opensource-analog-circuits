#!/usr/bin/env python3
"""
Genetic Algorithm (GA) demo for analog circuit sizing.

A lightweight real-coded GA that works with any NgspiceBenchmark config.
No external optimization libraries required (pure numpy).

Usage:
    python example_ga.py [config_file] [--generations N] [--popsize N]

Examples:
    python example_ga.py circuits/ptm180nm_opamp/config.json --generations 20 --popsize 30
    python example_ga.py circuits/gh_autockt_opamp/config.json -g 30 -p 40
"""
import sys
import argparse
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ngspice_benchmark import NgspiceBenchmark


class RealCodedGA:
    """Real-coded Genetic Algorithm for circuit sizing."""

    def __init__(
        self,
        benchmark: NgspiceBenchmark,
        pop_size: int = 30,
        n_generations: int = 20,
        crossover_rate: float = 0.9,
        mutation_rate: float = 0.2,
        mutation_sigma: float = 0.1,
        elitism: int = 2,
        seed: int = 42,
    ):
        self.bench = benchmark
        self.pop_size = pop_size
        self.n_generations = n_generations
        self.cx_rate = crossover_rate
        self.mut_rate = mutation_rate
        self.mut_sigma = mutation_sigma
        self.elitism = elitism
        self.rng = np.random.default_rng(seed)
        self.dim = benchmark.dim
        self.lb = np.zeros(self.dim)
        self.ub = np.ones(self.dim)

        # History
        self.best_obj_per_gen = []
        self.mean_obj_per_gen = []
        self.best_x = None
        self.best_obj = float("inf")

    def _evaluate_population(self, pop: np.ndarray) -> np.ndarray:
        """Evaluate objective for each individual in the population."""
        objs = np.zeros(len(pop))
        for i, x in enumerate(pop):
            objs[i] = self.bench.objective(x)
        return objs

    def _tournament_select(self, pop: np.ndarray, objs: np.ndarray, k: int = 3) -> np.ndarray:
        """Tournament selection (minimization)."""
        candidates = self.rng.choice(len(pop), size=k, replace=False)
        winner = candidates[np.argmin(objs[candidates])]
        return pop[winner].copy()

    def _simulated_binary_crossover(self, p1: np.ndarray, p2: np.ndarray, eta: float = 15.0) -> tuple:
        """SBX crossover for real-coded GA."""
        if self.rng.random() > self.cx_rate:
            return p1.copy(), p2.copy()

        c1, c2 = p1.copy(), p2.copy()
        for i in range(self.dim):
            if self.rng.random() > 0.5 or abs(p1[i] - p2[i]) < 1e-14:
                continue
            if p1[i] < p2[i]:
                y1, y2 = p1[i], p2[i]
            else:
                y1, y2 = p2[i], p1[i]

            beta = 1.0 + (2.0 * min(y1 - self.lb[i], y2 - self.ub[i]) / (y2 - y1))
            alpha = 2.0 - beta ** (-(eta + 1.0))
            rand = self.rng.random()

            if rand <= 1.0 / alpha:
                beta_q = (rand * alpha) ** (1.0 / (eta + 1.0))
            else:
                beta_q = (1.0 / (2.0 - rand * alpha)) ** (1.0 / (eta + 1.0))

            c1[i] = 0.5 * ((y1 + y2) - beta_q * (y2 - y1))
            c2[i] = 0.5 * ((y1 + y2) + beta_q * (y2 - y1))

            c1[i] = np.clip(c1[i], self.lb[i], self.ub[i])
            c2[i] = np.clip(c2[i], self.lb[i], self.ub[i])

        return c1, c2

    def _polynomial_mutation(self, x: np.ndarray, eta_m: float = 20.0) -> np.ndarray:
        """Polynomial mutation."""
        if self.rng.random() > self.mut_rate:
            return x

        y = x.copy()
        for i in range(self.dim):
            if self.rng.random() > 1.0 / self.dim:
                continue
            delta1 = (y[i] - self.lb[i]) / (self.ub[i] - self.lb[i])
            delta2 = (self.ub[i] - y[i]) / (self.ub[i] - self.lb[i])
            rand = self.rng.random()
            mut_pow = 1.0 / (eta_m + 1.0)

            if rand <= 0.5:
                xy = 1.0 - delta1
                val = 2.0 * rand + (1.0 - 2.0 * rand) * (xy ** (eta_m + 1))
                delta_q = val ** mut_pow - 1.0
            else:
                xy = 1.0 - delta2
                val = 2.0 * (1.0 - rand) + 2.0 * (rand - 0.5) * (xy ** (eta_m + 1))
                delta_q = 1.0 - val ** mut_pow

            y[i] += delta_q * (self.ub[i] - self.lb[i])
            y[i] = np.clip(y[i], self.lb[i], self.ub[i])
        return y

    def run(self, verbose: bool = True):
        """Run the GA optimization loop."""
        # Initialize population (include default design point)
        pop = self.rng.random((self.pop_size, self.dim))
        if self.pop_size > 0:
            pop[0] = self.bench.default_design_point()

        objs = self._evaluate_population(pop)

        # Track best ever
        best_idx = np.argmin(objs)
        self.best_obj = objs[best_idx]
        self.best_x = pop[best_idx].copy()

        for gen in range(self.n_generations):
            # Sort by objective
            sorted_idx = np.argsort(objs)
            pop = pop[sorted_idx]
            objs = objs[sorted_idx]

            self.best_obj_per_gen.append(float(objs[0]))
            self.mean_obj_per_gen.append(float(np.mean(objs)))

            if verbose:
                print(
                    f"Gen {gen+1:3d}/{self.n_generations}: best={objs[0]:.4f}, "
                    f"mean={np.mean(objs):.4f}, worst={objs[-1]:.4f}, "
                    f"feasible={np.sum(objs < 1000):d}/{self.pop_size}"
                )

            if objs[0] < self.best_obj:
                self.best_obj = float(objs[0])
                self.best_x = pop[0].copy()

            # Elitism: keep top individuals
            new_pop = pop[: self.elitism].copy()

            # Generate offspring
            while len(new_pop) < self.pop_size:
                p1 = self._tournament_select(pop, objs)
                p2 = self._tournament_select(pop, objs)
                c1, c2 = self._simulated_binary_crossover(p1, p2)
                c1 = self._polynomial_mutation(c1)
                c2 = self._polynomial_mutation(c2)
                new_pop = np.vstack([new_pop, c1.reshape(1, -1), c2.reshape(1, -1)])

            pop = new_pop[: self.pop_size]
            objs = self._evaluate_population(pop)

        # Final sort
        best_idx = np.argmin(objs)
        if objs[best_idx] < self.best_obj:
            self.best_obj = float(objs[best_idx])
            self.best_x = pop[best_idx].copy()

        return self.best_x, self.best_obj

    def report(self):
        """Print final optimization report."""
        print("\n" + "=" * 60)
        print("OPTIMIZATION REPORT")
        print("=" * 60)
        print(f"Circuit:        {self.bench.name}")
        print(f"Generations:    {self.n_generations}")
        print(f"Population:     {self.pop_size}")
        print(f"Total sims:     {self.bench.sim_count}")
        print(f"Total time:     {self.bench.sim_time:.1f}s")
        print(f"\nBest objective: {self.best_obj:.6f}")

        # Evaluate best to get metrics
        metrics = self.bench.evaluate(self.best_x)
        print(f"Meets specs:    {self.bench.meets_specs(metrics)}")
        print("\nBest metrics:")
        for k, v in metrics.items():
            if not k.startswith("_"):
                print(f"  {k:20s}: {v}")

        print("\nBest design (physical values):")
        params = self.bench._denormalize(self.best_x)
        for name in self.bench.names:
            print(f"  {name:20s}: {params[name]:.6g}")

        print("\nConvergence:")
        print(f"  Gen 1  best:   {self.best_obj_per_gen[0]:.4f}")
        print(f"  Gen {len(self.best_obj_per_gen)} best:   {self.best_obj_per_gen[-1]:.4f}")
        improvement = (
            (self.best_obj_per_gen[0] - self.best_obj_per_gen[-1])
            / max(abs(self.best_obj_per_gen[0]), 1e-9)
            * 100
        )
        print(f"  Improvement:   {improvement:.1f}%")


def main():
    parser = argparse.ArgumentParser(description="GA-based circuit sizing demo")
    parser.add_argument(
        "config",
        nargs="?",
        default="circuits/ptm180nm_opamp/config.json",
        help="Path to benchmark JSON config",
    )
    parser.add_argument("-g", "--generations", type=int, default=15, help="Number of generations")
    parser.add_argument("-p", "--popsize", type=int, default=20, help="Population size")
    parser.add_argument("--cx", type=float, default=0.9, help="Crossover rate")
    parser.add_argument("--mut", type=float, default=0.2, help="Mutation rate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--quiet", action="store_true", help="Suppress per-generation output")
    args = parser.parse_args()

    bench = NgspiceBenchmark.from_config(args.config)

    if bench.dim == 0:
        print(f"Circuit '{bench.name}' has no design variables. Nothing to optimize.")
        sys.exit(0)

    ga = RealCodedGA(
        benchmark=bench,
        pop_size=args.popsize,
        n_generations=args.generations,
        crossover_rate=args.cx,
        mutation_rate=args.mut,
        seed=args.seed,
    )

    print(f"GA Sizing Demo: {bench.name}")
    print(f"Design space: {bench.dim}D")
    print(f"Pop size: {args.popsize}, Generations: {args.generations}")
    print("-" * 60)

    ga.run(verbose=not args.quiet)
    ga.report()


if __name__ == "__main__":
    main()
