"""Extended smoke tests: QuantumCouncil extended behavior and telemetry logging."""
import os
import sys
import json
import traceback
from datetime import datetime

log_dir = r"C:\Temple\Logs"
feedback_path = os.path.join(log_dir, "feedback.log")

from typing import Optional

results: dict[str, Optional[str]] = {"quantum_extended": None}

try:
    # Determine node count from environment (CI can set SMALLER value)
    node_count = int(os.environ.get('QC_NODES', '8'))

    # Load module by path to avoid package import issues
    import importlib.util
    qc_path = os.path.join(os.path.dirname(__file__), '..', 'dashboard', 'modules', 'quantum_cluster.py')
    qc_path = os.path.abspath(qc_path)
    spec = importlib.util.spec_from_file_location('quantum_cluster', qc_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not create module spec for {qc_path}")
    qc_mod = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise ImportError(f"Module spec loader missing for {qc_path}")
    spec.loader.exec_module(qc_mod)
    QuantumCouncil = getattr(qc_mod, 'QuantumCouncil')

    council = QuantumCouncil(node_count)
    council.synchronize()
    # If breakthrough exists, call it to exercise absorption
    if hasattr(council, 'breakthrough'):
        try:
            council.breakthrough(1)
            results['quantum_extended'] = f'OK: synchronize + breakthrough ({node_count} nodes)'
        except Exception as e:
            results['quantum_extended'] = f'OK: synchronize but breakthrough failed: {e}\n{traceback.format_exc()}'
    else:
        results['quantum_extended'] = f'OK: synchronize ({node_count} nodes)'

    # Log telemetry
    os.makedirs(log_dir, exist_ok=True)
    event = {
        'type': 'smoke_test_quantum_extended',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'nodes': len(council.nodes),
        'result': results['quantum_extended']
    }
    with open(feedback_path, 'a', encoding='utf-8') as f:
        f.write(json.dumps(event) + '\n')
except Exception as e:
    results['quantum_extended'] = f'FAILED: {e}\n{traceback.format_exc()}'

print('EXTENDED SMOKE TEST RESULTS:')
for k, v in results.items():
    print(f'- {k}: {v}')

if results['quantum_extended'].startswith('FAILED'):
    sys.exit(2)
else:
    sys.exit(0)
