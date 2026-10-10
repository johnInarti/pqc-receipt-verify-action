# PQC Readiness Scan — moved

This action now lives at the root of its own public repository:

**https://github.com/johnInarti/pqc-readiness-action**

```yaml
- uses: johnInarti/pqc-readiness-action@v1
```

Two reasons for the move. The `uses:` line is shorter, and more importantly the GitHub Marketplace
lists only **one** action per repository and it must sit at the root, so an action in a
subdirectory can never be listed there.

## Your existing workflow keeps working

`action.yml` in this directory is now a **forwarder**: it declares the same inputs and outputs and
calls the action in its own repository. Nothing was deleted, so a workflow that already wrote

```yaml
- uses: johnInarti/pqc-receipt-verify-action/readiness-scan@v2.1.0
```

keeps running and keeps receiving improvements, instead of meeting an `Unable to resolve action`
one Monday morning. It prints a notice asking you to switch the line when convenient.

Forwarding rather than duplicating is the point: a second copy of the scanner here would fall
behind in silence, and someone would eventually adopt a stale version believing it was current.
The code, the tests and the changelog live in one place.
