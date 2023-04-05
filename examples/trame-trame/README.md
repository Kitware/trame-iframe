This example provide a single trame server acting as parent and child within the `app.py`.

```bash
python ./app.py
```

But if you want to physically split the parent and child you will need to run the following. (Expect an issue with same-origin policy unless you disable it https://stackoverflow.com/questions/25098021/securityerror-blocked-a-frame-with-origin-from-accessing-a-cross-origin-frame)

```bash
# Port of child.py needs to match CHILD_URL variable in parent.py
python ./child.py --port 1236 --server & python ./parent.py
```