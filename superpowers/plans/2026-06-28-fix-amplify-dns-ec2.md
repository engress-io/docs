# Fix Amplify Deployment, DNS, and Core EC2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three blocking issues preventing engress.io from serving the SPA: Amplify 404, missing DNS records, and core EC2 timeout.

**Architecture:** Three independent fixes applied in parallel: (1) update `core/amplify.yml` to fix `baseDirectory`, (2) manually configure DNS records at Spaceship, (3) verify and redeploy core EC2 instance.

**Tech Stack:** AWS Amplify, Spaceship DNS, AWS EC2/SSM, Terraform (read-only for state inspection)

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `core/amplify.yml` | Modify | Fix `baseDirectory` from `web/dist` to `.` |
| Spaceship DNS UI/API | Manual | Create/update DNS records |
| Core EC2 (SSM) | Verify/fix | Ensure `engress-core` container is running |

---

## Task 1: Fix Amplify Build Spec

**Files:**
- Modify: `core/amplify.yml:16-19`

- [ ] **Step 1: Update `baseDirectory` in `core/amplify.yml`**

Change line 17 from `baseDirectory: web/dist` to `baseDirectory: .`.

- [ ] **Step 2: Commit and push the change**

```bash
cd /Users/walter/Projects/engress/core
git add amplify.yml
git commit -m "fix: update Amplify baseDirectory from web/dist to . to match artifact structure"
git push origin main
```

Expected: Amplify automatically triggers a new build job.

- [ ] **Step 3: Verify Amplify build succeeds**

```bash
# List recent Amplify build jobs
aws amplify list-jobs --app-id <app-id> --branch-name main --region us-east-2 --max-items 5
```

Expected: Latest job status is `SUCCEEDED`.

- [ ] **Step 4: Verify `https://engress.io` loads `index.html`**

```bash
curl -I https://engress.io
```

Expected: HTTP 200, `Content-Type: text/html`.

---

## Task 2: Configure DNS at Spaceship

**Files:**
- Manual: Spaceship DNS settings UI or API

- [ ] **Step 1: Log into Spaceship DNS settings**

Navigate to: https://www.spaceship.com/application/domains/engress.io/dns/

- [ ] **Step 2: Create/update DNS records**

Add these records:

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

- [ ] **Step 3: Verify DNS propagation**

```bash
dig +short engress.io
dig +short www.engress.io
dig +short test.edge.engress.io
dig +short downloads.engress.io
```

Expected:
- `engress.io` → CloudFront IP(s)
- `www.engress.io` → CloudFront IP(s)
- `test.edge.engress.io` → `18.216.236.251`
- `downloads.engress.io` → CloudFront downloads domain

---

## Task 3: Fix Core EC2

**Files:**
- Verify: Core EC2 instance (SSM session)
- Modify: Security group if needed

- [ ] **Step 1: Check if `engress-core` container is running**

```bash
# Start SSM session to control instance
aws ssm start-session --target <control-instance-id> --region us-east-2

# Inside the session:
docker ps | grep engress-core
```

Expected: `engress-core` container is running.

If not running, proceed to Step 2.

- [ ] **Step 2: Redeploy with latest image (if container not running)**

```bash
cd /Users/walter/Projects/engress/scripts/deploy/scripts
./app-update.sh
```

Expected: Script completes successfully, `engress-core` container is running.

- [ ] **Step 3: Verify security group allows :8080 from CloudFront**

```bash
# Get security group ID for control instance
aws ec2 describe-instances --instance-ids <control-instance-id> --region us-east-2 --query "Reservations[].Instances[].SecurityGroups[].GroupId" --output text
```

Check if port 8080 is open. If not, add ingress rule:

```bash
aws ec2 authorize-security-group-ingress \
  --group-id <security-group-id> \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0 \
  --region us-east-2
```

**Note:** For production, restrict to CloudFront origin IP ranges or VPC CIDR.

- [ ] **Step 4: Verify `/api/healthz` responds**

```bash
curl -I https://core-origin.engress.io/api/healthz
```

Expected: HTTP 200.

---

## Verification

After completing all tasks, run full verification:

```bash
# 1. Verify Amplify serves SPA
curl -I https://engress.io

# 2. Verify DNS records
dig +short engress.io
dig +short www.engress.io
dig +short test.edge.engress.io
dig +short downloads.engress.io

# 3. Verify core EC2 health
curl -I https://core-origin.engress.io/api/healthz

# 4. Run smoke tests (if available)
cd /Users/walter/Projects/engress/scripts/deploy/scripts
./beta-smoke.sh
```

---

## Rollback

If any fix causes issues:

| Failure | Rollback |
|---------|----------|
| Amplify build fails after spec change | Revert `core/amplify.yml` to `baseDirectory: web/dist` and push |
| DNS changes don't propagate | Verify Spaceship API credentials and record names |
| Core EC2 still times out after redeploy | Check security group, verify container logs (`docker logs <container-id>`) |

---

## Next Steps

After applying these fixes:
1. Run full smoke tests
2. Monitor CloudWatch logs for errors
3. Consider importing Amplify into Terraform state for future manageability
