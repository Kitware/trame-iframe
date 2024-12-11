# Vite project

This example use npm package to illustrate how to use the trame iframe client.

## Trame setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install trame trame-iframe
```

## Build the client

```bash
cd client
npm i
npm run build
```

## Running example

```bash
python ./server.py --port 3000 --server
```
