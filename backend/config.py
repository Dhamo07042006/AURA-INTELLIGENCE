import os
from pathlib import Path

# Dynamically compute Project Root Directory relative to backend package
# backend/config.py -> parent of backend/ is the Project Root Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Core Directory Paths
DATA_DIR = Path(os.getenv("CTS_DATA_DIR", BASE_DIR / "data"))
PROCESSED_DIR = DATA_DIR / "processed"
RAW_DIR = DATA_DIR / "raw"
MODELS_DIR = Path(os.getenv("CTS_MODELS_DIR", BASE_DIR / "models"))
DOCS_DIR = DATA_DIR / "documents"

# Database Path
DB_PATH = Path(os.getenv("CTS_DB_PATH", MODELS_DIR / "aura_intelligence.db"))

# Ensure directories exist upon module load
for directory in [DATA_DIR, PROCESSED_DIR, RAW_DIR, MODELS_DIR, DOCS_DIR]:
    os.makedirs(directory, exist_ok=True)

# Helper function to get string paths for compatibility
def get_path_str(p: Path) -> str:
    return str(p.resolve())
