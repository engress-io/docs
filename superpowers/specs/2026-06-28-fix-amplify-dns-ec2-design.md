# Fix Amplify Deployment, DNS Configuration, and Core EC2

**Date:** 2026-06-28
**Status:** Approved
**Scope:** Fix deployment issues preventing engress.io from serving the SPA

---

## 1. Overview

Three issues are blocking the engress.io deployment:

1. **Amplify 404:** The SPA builds successfully but returns 404 when accessed via engress.io. The root cause is a mismatch between the Amplify `baseDirectory` setting and the actual artifact structure.

2. **Missing DNS records:** Several DNS records are missing or misconfigured at Spaceship (the DNS provider for engress.io).

3. **Core EC2 timeout:** `core-origin.engress.io` resolves but `/api/healthz` times out, indicating the control-plane EC2 is running stale code or has a security group issue.

---

## 2. Root Cause Analysis

### Issue 1: Amplify 404

**Symptom:** Amplify build succeeds, artifact contains `index.html` at root, but `https://engress.io` returns 404.

**Root cause:** `core/amplify.yml` specifies `baseDirectory: web/dist`, telling Amplify to serve files from a `web/dist/` subdirectory within the artifact. However, the build artifact has files at the root (`index.html`, `assets/`). Amplify looks for `web/dist/index.html` in the artifact, doesn't find it, and returns 404.

**Why API updates didn't work:** Amplify prioritizes the `amplify.yml` file in the repo over the stored buildSpec when both are present. Direct API calls to update the buildSpec were ignored because Amplify was reading from the file in the repo.

### Issue 2: Missing DNS Records

**Symptom:** `www.engress.io` and `downloads.engress.io` don't resolve. `*.edge.engress.io` may also be missing.

**Root cause:** DNS records were not created or were deleted during the Flux → Engress cutover.

### Issue 3: Core EC2 Timeout

**Symptom:** `core-origin.engress.io` resolves but `/api/healthz` times out.

**Likely causes:**
1. Security group blocks inbound :8080 from CloudFront
2. `engress-core` container is not running or unhealthy
3. Wrong image tag deployed (stale from June 26)

---

## 3. Implementation Steps

### Step 1: Fix Amplify Build Spec

**File:** `core/amplify.yml`

**Change:**
```yaml
# Before:
artifacts:
  baseDirectory: web/dist
  files:
    - '**/*'

# After:
artifacts:
  baseDirectory: .
  files:
    - '**/*'
```

**Reasoning:** The build output (`web/dist/`) is packaged into the artifact with files at root. `baseDirectory: .` tells Amplify to serve from the artifact root, which matches the actual structure.

**Verification:**
1. Commit and push the change
2. Wait for Amplify to rebuild (monitor in AWS Console or via CLI)
3. Check the build log to confirm it uses the new spec
4. Verify `https://engress.io` loads `index.html`

### Step 2: Configure DNS at Spaceship

**Action:** Log into Spaceship DNS settings and create/update these records:

| Host / Name | Type | Value | TTL | Purpose |
|-------------|------|-------|-----|---------|
| `@` (apex) | ALIAS/CNAME | `d14hs2jxwtjmu2.cloudfront.net` | 300 | Main site |
| `www` | CNAME | `d14hs2jxwtjmu2.cloudfront.net` | 300 | WWW subdomain |
| `*.edge` | A | `18.216.236.251` | 300 | Wildcard for tunnel subdomains |
| `edge-origin` | A | `18.216.236.251` | 300 | CloudFront `/api/*` origin |
| `downloads` | CNAME | `<downloads-cloudfront-domain>` | 300 | CLI downloads |

**Note:** The downloads CloudFront domain can be found via:
```bash
aws cloudfront list-distributions --query "DistributionList[?Comment=='Engress CLI downloads (private S3 origin)'].DomainName" --output text
```

**Verification:**
```bash
dig +short engress.io
dig +short www.engress.io
dig +short test.edge.engress.io
dig +short downloads.engress.io
```

### Step 3: Fix Core EC2

**Action:** Verify and fix the control-plane EC2 instance.

**Sub-steps:**

1. **Check if `engress-core` container is running:**
   ```bash
   aws ssm start-session --target <control-instance-id> --region us-east-2
   docker ps | grep engress-core
   ```

2. **If not running, redeploy with latest image:**
   ```bash
   cd /Users/walter/Projects/engress/scripts/deploy/scripts
   ./app-update.sh
   ```

3. **Verify security group allows :8080 from CloudFront:**
   - Check the security group for the control instance
   - Add ingress rule if missing: port 8080 from CloudFront origin IP ranges (or from the VPC if using private connectivity)

**Verification:**
```bash
curl -I https://core-origin.engress.io/api/healthz
```

---

## 4. Error Handling & Rollback

| Failure | Response |
|---------|----------|
| Amplify build fails after spec change | Revert `core/amplify.yml` to previous working spec |
| DNS changes don't propagate | Verify Spaceship API credentials and record names |
| Core EC2 still times out after redeploy | Check security group, verify container logs (`docker logs <container-id>`) |

---

## 5. Dependencies

- None. These fixes are independent of each other and can be applied in parallel.

---

## 6. Trade-offs & Decisions

| Decision | Rationale |
|----------|-----------|
| Fix `baseDirectory` in repo file (not Terraform) | Minimal change, matches actual artifact structure |
| Manual DNS updates at Spaceship | Terraform doesn't manage Route 53 for engress.io (DNS is at Spaceship) |
| Redeploy core without Terraform import | Faster than importing state, can be done via SSM |

---

## 7. Next Steps

After applying these fixes:
1. Run full smoke tests
2. Monitor CloudWatch logs for errors
3. Consider importing Amplify into Terraform state for future manageability
