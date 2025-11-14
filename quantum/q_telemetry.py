"""Generate real quantum telemetry (Von Neumann entropy & coherence) using Qiskit.
Writes rolling history to qiskit_telemetry.json (last 100 entries).
Integrates with Council audit logging if available.
"""
from datetime import datetime, timezone
from pathlib import Path
import argparse
import json
import math


import sys

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
try:
    # Prefer Qiskit's entropy if available
    from qiskit.quantum_info import entropy as qi_entropy  # type: ignore
except Exception:  # pragma: no cover - fallback when not available
    qi_entropy = None  # type: ignore

# Attempt council utils import (for audit)
UTILS_PATH = Path(__file__).parent.parent / 'scripts' / 'utils'
sys.path.append(str(Path(__file__).parent.parent / 'scripts'))
try:
    from utils.council_utils import logAudit  # type: ignore  # pylint: disable=import-error
    COUNCIL_MODE = True
except Exception:
    COUNCIL_MODE = False

    # pylint: disable=invalid-name
    def logAudit(msg: str):
        print(f"AUDIT(Fallback): {msg}")

BASE_DIR = Path(__file__).parent
OUT_FILE = BASE_DIR / 'qiskit_telemetry.json'


def calculate_entropy(statevector: np.ndarray) -> float:
    """Compute Von Neumann entropy for a pure-state density matrix.

    This treats the provided full-system statevector as a pure state and
    computes S(ρ) = -Tr(ρ log₂ ρ). For pure states, this is ~0.
    """
    # Convert to density matrix rho = |psi><psi|
    vec = np.array(statevector, dtype=complex)
    rho = np.outer(vec, np.conjugate(vec))
    # Eigenvalues of pure-state density matrix: one ~1, others ~0
    eigenvalues = np.linalg.eigvalsh(rho)
    eigenvalues = eigenvalues[eigenvalues > 1e-12]
    entropy = -float(sum(ev * math.log(ev, 2) for ev in eigenvalues))
    return entropy


def _von_neumann_entropy(dm: DensityMatrix) -> float:
    """Compute Von Neumann entropy S(ρ) using Qiskit if available, else numpy.

    Args:
        dm: DensityMatrix for the full or reduced system.
    Returns:
        Entropy in bits (log base 2).
    """
    if qi_entropy is not None:
        try:
            return float(qi_entropy(dm, base=2))
        except Exception:
            pass
    arr = np.array(dm.data, dtype=complex)
    eigs = np.linalg.eigvalsh(arr)
    eigs = eigs[eigs > 1e-12]
    return -float(sum(ev * math.log(ev, 2) for ev in eigs))


def build_circuit(kind: str) -> QuantumCircuit:
    """Build a small example circuit: bell_state, ghz_state, or random."""
    if kind == 'bell_state':
        qc = QuantumCircuit(2)
        qc.h(0)
        qc.cx(0, 1)
        return qc
    if kind == 'ghz_state':
        qc = QuantumCircuit(3)
        qc.h(0)
        qc.cx(0, 1)
        qc.cx(0, 2)
        return qc
    if kind == 'random':
        rng = np.random.default_rng()
        qc = QuantumCircuit(2)
        qc.h(0)
        qc.ry(float(rng.uniform(0.0, math.pi)), 1)
        qc.cx(0, 1)
    return qc


def generate(kind: str):
    """Generate telemetry for the provided circuit kind and append to history."""
    qc = build_circuit(kind)
    # Obtain statevector directly from circuit using Terra's Statevector
    sv = Statevector.from_instruction(qc)
    data = getattr(sv, 'data', sv)
    entropy = calculate_entropy(data)
    # Subsystem (single-qubit) entropy for qubit 0 to reveal entanglement
    dm_full = DensityMatrix(sv)
    trace_over = list(range(qc.num_qubits))[1:]
    if trace_over:
        reduced = partial_trace(dm_full, trace_over)
        subsystem_entropy = _von_neumann_entropy(reduced)
    else:
        subsystem_entropy = 0.0
    system_entropy = _von_neumann_entropy(dm_full)
    if subsystem_entropy >= 0.9:
        entanglement_measure = 'maximal'
    elif subsystem_entropy >= 0.1:
        entanglement_measure = 'partial'
    else:
        entanglement_measure = 'none'
    telemetry = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'circuit_type': kind,
        'num_qubits': qc.num_qubits,
        'entropy_index': entropy,
        'coherence_estimate': 1.0 - (entropy / max(qc.num_qubits, 1)),
        'backend': 'statevector',
        'system_entropy': system_entropy,
        'subsystem_entropy_q0': subsystem_entropy,
        'entanglement_measure': entanglement_measure,
        'statevector': {
            'real': [complex(x).real for x in data],
            'imag': [complex(x).imag for x in data]
        }
    }
    history = []
    if OUT_FILE.exists():
        try:
            history = json.loads(OUT_FILE.read_text())
        except Exception:
            history = []
    history.append(telemetry)
    history = history[-100:]
    OUT_FILE.write_text(json.dumps(history, indent=2))
    logAudit(f"[Quantum] Telemetry generated kind={kind} entropy={entropy:.5f}")
    print(f"Quantum telemetry OK: {kind} entropy={entropy:.5f}")
    return telemetry


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Quantum telemetry generator')
    parser.add_argument('--circuit', default='bell_state', choices=['bell_state', 'ghz_state', 'random'])
    args = parser.parse_args()
    try:
        generate(args.circuit)
    except Exception as e:
        logAudit(f"[Quantum] ERROR: {e}")
        print(f"Quantum telemetry error: {e}", file=sys.stderr)
        sys.exit(1)
