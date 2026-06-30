# Narrative: EKS Cutover & CloudFront Recovery (June 29–30, 2026)

## "We cut over to Kubernetes, then Terraform tried to delete the website"

Phase 4 shipped EKS, DNS cutover, and EC2 decommission. The cluster came up healthy. Then a bad `terraform apply` during decommission nearly took down `https://engress.io`. This narrative documents what broke, what we fixed, and how to recover if it happens again.

---

## What we accomplished (happy path)

| Milestone | Status |
|-----------|--------|
| EKS cluster `engress-east` | ✅ 4 nodes, workloads healthy |
| ALB/NLB provisioning | ✅ Fixed LBC IRSA + subnet tags (`fix-lbs`) |
| DNS cutover | ✅ `dns-audit` — origins point at EKS load balancers |
| `engress-deploy-target` | ✅ `eks` in SSM |
| EC2 decommission | ✅ `decommission_ec2=true` — edge/control instances destroyed |
| Legacy EIPs released | ✅ `18.216.236.251`, `3.138.150.231` (no longer needed) |
| `https://engress.io/api/healthz` | ✅ EKS core (`engress-core` pod) |
| `https://engress.io/` | ✅ SPA 200 from S3 via new CloudFront |

---

## Incident: bad decommission apply

### Trigger

Operator ran `terraform apply` with `decommission_ec2=true` **without a complete `terraform.tfvars`**. Defaults kicked in:

- `enable_frontend=false` → Terraform started destroying CloudFront, docs function, S3 bucket policy
- Missing `spa_bucket_name` → bucket rename `flux-spa-*` → `engress-spa-*` (forces replace)

### Damage

| Resource | Outcome |
|----------|---------|
| CloudFront `E1ABUIC4DB7I86` | Destroyed in AWS |
| S3 `flux-spa-327796148992` | Delete failed (`BucketNotEmpty`) — **SPA content saved** |
| Spaceship DNS | Still pointed `@` → `d14hs2jxwtjmu2.cloudfront.net` (deleted distribution) |
| `engress.io` | Down — TLS/connection errors |
| Terraform state | Drifted — thought it should create/replace resources that no longer matched AWS |

### Recovery attempts that failed (and why)

1. **Re-apply without `spa_bucket_name`** — plan tried to replace S3 bucket; delete failed (good).
2. **Import `E1ABUIC4DB7I86`** — distribution no longer exists in AWS.
3. **Create new CloudFront with aliases** — `CNAMEAlreadyExists`: DNS still pointed at the deleted distribution's `*.cloudfront.net` name.
4. **Import S3 bucket** — already in Terraform state; import rejected.
5. **`lifecycle { prevent_destroy = var.spa_bucket_name != "" }`** — Terraform rejects variables in `lifecycle` blocks.
6. **`mapfile` in recovery script** — macOS ships Bash 3.2; command not found.

---

## Fix: two-phase CloudFront recovery

**Root insight:** You cannot attach `engress.io` aliases to a new distribution while DNS still points at a deleted distribution's domain. You must either import a live distribution that already owns the aliases, or create in two phases.

### Code changes (on `main`)

| File | Change |
|------|--------|
| `core/deploy/terraform/frontend.tf` | `skip_frontend_aliases` — phase 1 creates CF without custom domains; phase 2 attaches aliases + ACM |
| `core/deploy/terraform/fix-cloudfront-recovery.sh` | Auto-detect live distro → import; else two-phase create |
| `core/deploy/terraform/recover-frontend.sh` | Standalone entry (core repo only) |
| `scripts/deploy/scripts/recover-frontend-terraform.sh` | Superproject entry |
| `scripts/deploy/lib/terraform-tfvars.sh` | Auto-write `terraform.tfvars` when gitignored file missing |
| `core/deploy/terraform/main.tf` | Skip EIP data source when `decommission_ec2=true` |
| `scripts/agent/dispatch-ops.sh` | `recover-frontend` action (runs locally with AWS profile) |

### Operator runbook (verified 2026-06-30)

```bash
cd engress
git pull origin main && git submodule update --remote core scripts
cd core/deploy/terraform

# terraform.tfvars auto-created if missing (gitignored — never commit)
AWS_PROFILE=ghostweasel-flux ./recover-frontend.sh
```

**Phase 1:** Creates CloudFront with default `*.cloudfront.net` cert (no `engress.io` aliases).

**Pause:** Update Spaceship DNS — `@`, `get`, `downloads` → new `terraform output cloudfront_domain`.

**Phase 2:** Attaches `engress.io` / `get.engress.io` / `downloads.engress.io` + ACM cert.

### Verification (post-recovery)

```bash
curl -sS https://engress.io/api/healthz
# {"service":"engress-core","status":"ok",...}

curl -sS -o /dev/null -w '%{http_code}\n' https://engress.io/
# 200
```

---

## Lessons learned

1. **Never run `decommission_ec2` without pinning production tfvars.** Required pins:
   - `enable_frontend = true`
   - `spa_bucket_name = "flux-spa-327796148992"`
   - `enable_eks = true`
   - `enable_control_instance = true`

2. **`terraform.tfvars` is gitignored** — recovery scripts must auto-generate or read from SSM (`engress-terraform-tfvars`).

3. **S3 bucket names are immutable** — default must stay `flux-spa-{account}`, not `{name_prefix}-spa-{account}`.

4. **CloudFront alias replacement requires DNS cooperation** — import if distro exists; two-phase create if it doesn't.

5. **Shell scripts must work on macOS Bash 3.2** — no `mapfile`, avoid bash 4+ features.

6. **GHA ops role lacks S3 state access** until `github_ops.tf` is applied locally — Terraform recovery runs on laptop with `AWS_PROFILE=ghostweasel-flux`.

---

## Current production topology (post-recovery)

| Layer | Target |
|-------|--------|
| `engress.io` | New CloudFront distribution (`terraform output cloudfront_domain`) |
| `/api/*` | CloudFront → `core-origin.engress.io` → EKS core ALB |
| `*.edge.engress.io` | Global Accelerator anycast A → east + west edge NLBs (P03, 2026-06-30) |
| SPA assets | S3 `flux-spa-327796148992` (unchanged) |
| Compute | EKS `engress-east` (core + edge) + `engress-west` (edge only) |

---

## Optional cleanup

- [ ] Delete orphaned ACM certs in us-east-1 from failed recovery applies (keep the one attached to live CloudFront)
- [ ] Close draft PR #6 (`walter/spa-bucket-recovery`) — merged directly to `main`
- [ ] Apply `github_ops.tf` locally so GHA can run Terraform without laptop SSO

---

## Related docs

- Plan: `docs/superpowers/plans/2026-06-28-p04-kubernetes-preparation.md`
- Phase 4 narrative (prep): `docs/superpowers/narratives/2026-06-28-p04-kubernetes-preparation.md`
- Recovery script: `core/deploy/terraform/fix-cloudfront-recovery.sh`
- Ops dispatch: `./scripts/agent/dispatch-ops.sh recover-frontend`
