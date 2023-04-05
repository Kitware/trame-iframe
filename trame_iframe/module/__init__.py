from pathlib import Path

serve_path = str(Path(__file__).with_name("serve").resolve())
serve = {"__trame_iframe": serve_path}
scripts = ["__trame_iframe/trame-iframe.umd.js"]
vue_use = ["trame_iframe"]
