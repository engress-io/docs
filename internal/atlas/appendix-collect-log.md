---
title: Atlas collector raw log
sidebar_position: 14
---

# Atlas collector raw log

# Atlas collection appendix

**Generated:** 2026-07-01T02:58:49Z (UTC)

Curated summary: [appendix-live.md](appendix-live.md) · Update `last_verified: 2026-07-01` in atlas sections after review.

> Read-only. No secret values are printed.

## Environment

| Item | Value |
|------|-------|
| Host | ghostweasel.local |
| AWS_PROFILE | ghostweasel-flux |
| AWS_REGION | us-east-2 |
| kubectl | not installed |
| terraform | Terraform v1.15.6 |
| aws cli | aws-cli/2.35.7 Python/3.14.5 Darwin/25.5.0 exe/arm64 |

## AWS caller identity

```
{
    "UserId": "AROAUYURMJMAN5J4M7VRN:dave@ghostweasel.net",
    "Account": "327796148992",
    "Arn": "arn:aws:sts::327796148992:assumed-role/AWSReservedSSO_AdministratorAccess_0db069c62d06fa16/dave@ghostweasel.net"
}
```

## SSM engress-deploy-target

```
eks
```

## SSM GA IPs

```
166.117.111.75,166.117.142.224
```

## CloudFront distributions

```
[
    {
        "Id": "E1H1FGG5MSUPN5",
        "Domain": "d1y7wdtfae903c.cloudfront.net",
        "Aliases": [
            "engress.io",
            "get.engress.io",
            "downloads.engress.io"
        ]
    }
]
```

## Spaceship DNS table

```
A	*.edge	166.117.111.75	300
A	*.edge	166.117.142.224	300
CNAME	@	d1y7wdtfae903c.cloudfront.net	300
CNAME	_35db150a96b725b485f46a279d319fe4.get	_bcae663af94cbd0b78bf634d7f2bb4a2.jkddzztszm.acm-validations.aws.	1800
CNAME	_9b11052da5f0ef1e2ce452a372583593	_de14965b198a7bef5b6874359b961a32.jkddzztszm.acm-validations.aws.	1800
CNAME	_e468cf3567e5ba09bd216cee895a85d4.downloads	_26a55badf6029148b8e89360635bf085.jkddzztszm.acm-validations.aws.	1800
CNAME	accounts	accounts.clerk.services	1800
CNAME	clerk	frontend-api.clerk.services	1800
CNAME	clk._domainkey	dkim1.e3rzmv1xmc9u.clerk.services	1800
CNAME	clk2._domainkey	dkim2.e3rzmv1xmc9u.clerk.services	1800
CNAME	clkmail	mail.e3rzmv1xmc9u.clerk.services	1800
CNAME	core-origin	k8s-engress-engressc-0e6d362187-1276529689.us-east-2.elb.amazonaws.com	1800
CNAME	downloads	d1y7wdtfae903c.cloudfront.net	300
CNAME	edge-origin	k8s-engress-engresse-05043a6385-1111899267.us-east-2.elb.amazonaws.com	1800
CNAME	get	d1y7wdtfae903c.cloudfront.net	300
MX	@	-	300
MX	@	-	300
SRV	@	-	300
TXT	@	-	300
TXT	spacemail._domainkey	-	300
```

## Dispatch ops (manual)

Run via GitHub Actions when AWS SSO is unavailable:

```
./deploy/agents/dispatch-ops.sh kubectl-status
./deploy/agents/dispatch-ops.sh audit-ssm-tfvars
./deploy/agents/dispatch-ops.sh dns-audit
./deploy/agents/dispatch-ops.sh smoke-test
```

## Terraform outputs (non-sensitive)

```
```

## SSM parameter names (engress-deploy-*)

```
-------------------------------------------
|           DescribeParameters            |
+-----------------------------------------+
|  engress-deploy-core-host               |
|  engress-deploy-core-ip                 |
|  engress-deploy-core-irsa-arn           |
|  engress-deploy-east-edge-alb-arn       |
|  engress-deploy-eks-cluster-name        |
|  engress-deploy-eks-west-cluster-name   |
|  engress-deploy-lbc-irsa-arn            |
|  engress-deploy-lbc-west-irsa-arn       |
|  engress-deploy-target                  |
|  engress-deploy-west-nlb-arn            |
|  engress-deploy-aws-region-west         |
|  engress-deploy-core-west-irsa-arn      |
|  engress-deploy-east-nlb-arn            |
|  engress-deploy-edge-host               |
|  engress-deploy-edge-ip                 |
|  engress-deploy-edge-irsa-arn           |
|  engress-deploy-edge-west-irsa-arn      |
|  engress-deploy-github-role-arn         |
|  engress-deploy-global-accelerator-ips  |
|  engress-deploy-west-edge-alb-arn       |
+-----------------------------------------+
```

## SSM parameter names (app secrets, names only)

```
-------------------------------
|     DescribeParameters      |
+-----------------------------+
|  neon-db-connection-string  |
+-----------------------------+
--------------------------
|   DescribeParameters   |
+------------------------+
|  clerk-secret-key      |
|  clerk-webhook-secret  |
+------------------------+
-------------------------------------------
|           DescribeParameters            |
+-----------------------------------------+
|  engress-deploy-core-ip                 |
|  engress-deploy-core-irsa-arn           |
|  engress-deploy-east-edge-alb-arn       |
|  engress-deploy-eks-cluster-name        |
|  engress-deploy-eks-west-cluster-name   |
|  engress-deploy-lbc-irsa-arn            |
|  engress-deploy-lbc-west-irsa-arn       |
|  engress-session-key                    |
|  engress-source-checkout-token          |
|  engress-tunnel-ca-cert-pem             |
|  engress-deploy-core-host               |
|  engress-deploy-edge-irsa-arn           |
|  engress-deploy-github-role-arn         |
|  engress-deploy-global-accelerator-ips  |
|  engress-deploy-target                  |
|  engress-deploy-west-nlb-arn            |
|  engress-github-dispatch-token          |
|  engress-github-read-token              |
|  engress-neon-db-connection-string      |
|  engress-tunnel-ca-key-pem              |
|  engress-clerk-publishable-key          |
|  engress-deploy-aws-region-west         |
|  engress-deploy-core-west-irsa-arn      |
|  engress-deploy-east-nlb-arn            |
|  engress-deploy-edge-host               |
|  engress-deploy-edge-ip                 |
|  engress-deploy-edge-west-irsa-arn      |
|  engress-deploy-west-edge-alb-arn       |
|  engress-metrics-ingest-secret          |
+-----------------------------------------+
```

## kubectl nodes

```
NAME                                       STATUS   ROLES    AGE   VERSION                INTERNAL-IP   EXTERNAL-IP   OS-IMAGE                        KERNEL-VERSION                     CONTAINER-RUNTIME
ip-10-0-1-101.us-east-2.compute.internal   Ready    <none>   28h   v1.31.14-eks-93b80c6   10.0.1.101    <none>        Amazon Linux 2023.12.20260611   6.1.174-217.345.amzn2023.aarch64   containerd://2.2.4+unknown
ip-10-0-1-61.us-east-2.compute.internal    Ready    <none>   28h   v1.31.14-eks-93b80c6   10.0.1.61     <none>        Amazon Linux 2023.12.20260611   6.1.174-217.345.amzn2023.aarch64   containerd://2.2.4+unknown
ip-10-0-2-216.us-east-2.compute.internal   Ready    <none>   28h   v1.31.14-eks-93b80c6   10.0.2.216    <none>        Amazon Linux 2023.12.20260611   6.1.174-217.345.amzn2023.aarch64   containerd://2.2.4+unknown
ip-10-0-2-31.us-east-2.compute.internal    Ready    <none>   28h   v1.31.14-eks-93b80c6   10.0.2.31     <none>        Amazon Linux 2023.12.20260611   6.1.174-217.345.amzn2023.aarch64   containerd://2.2.4+unknown
```

## kubectl engress namespace

```
NAME                                                READY   STATUS    RESTARTS   AGE    IP           NODE                                       NOMINATED NODE   READINESS GATES
pod/aws-load-balancer-controller-549468dbfb-6n9f9   1/1     Running   0          23h    10.0.1.244   ip-10-0-1-101.us-east-2.compute.internal   <none>           <none>
pod/aws-load-balancer-controller-549468dbfb-8bqlc   1/1     Running   0          23h    10.0.2.114   ip-10-0-2-31.us-east-2.compute.internal    <none>           <none>
pod/engress-core-c79b9c8cb-brdtn                    1/1     Running   0          106m   10.0.1.55    ip-10-0-1-61.us-east-2.compute.internal    <none>           <none>
pod/engress-core-c79b9c8cb-x8qlf                    1/1     Running   0          106m   10.0.2.165   ip-10-0-2-216.us-east-2.compute.internal   <none>           <none>
pod/engress-edge-d455877d9-4qfpg                    1/1     Running   0          105m   10.0.1.247   ip-10-0-1-61.us-east-2.compute.internal    <none>           <none>
pod/engress-edge-d455877d9-xvwv2                    1/1     Running   0          105m   10.0.2.203   ip-10-0-2-216.us-east-2.compute.internal   <none>           <none>

NAME                                        TYPE           CLUSTER-IP       EXTERNAL-IP                                                                    PORT(S)                                     AGE   SELECTOR
service/aws-load-balancer-webhook-service   ClusterIP      172.20.245.146   <none>                                                                         443/TCP                                     23h   app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller
service/engress-core                        ClusterIP      172.20.22.26     <none>                                                                         8080/TCP                                    26h   app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core
service/engress-edge                        ClusterIP      172.20.99.150    <none>                                                                         80/TCP,443/TCP,4433/TCP                     26h   app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge
service/engress-edge-nlb                    LoadBalancer   172.20.187.231   k8s-engress-engresse-07cd533391-9e85f5e66eeb6988.elb.us-east-2.amazonaws.com   80:30769/TCP,443:32365/TCP,4433:30094/TCP   23h   app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge

NAME                                           READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS                     IMAGES                                                              SELECTOR
deployment.apps/aws-load-balancer-controller   2/2     2            2           23h   aws-load-balancer-controller   public.ecr.aws/eks/aws-load-balancer-controller:v3.4.0              app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller
deployment.apps/engress-core                   2/2     2            2           26h   core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:e8ba319   app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core
deployment.apps/engress-edge                   2/2     2            2           26h   edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:e8ba319   app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge

NAME                                                      DESIRED   CURRENT   READY   AGE     CONTAINERS                     IMAGES                                                                                               SELECTOR
replicaset.apps/aws-load-balancer-controller-549468dbfb   2         2         2       23h     aws-load-balancer-controller   public.ecr.aws/eks/aws-load-balancer-controller:v3.4.0                                               app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller,pod-template-hash=549468dbfb
replicaset.apps/aws-load-balancer-controller-59d5b6685    0         0         0       23h     aws-load-balancer-controller   public.ecr.aws/eks/aws-load-balancer-controller:v3.4.0                                               app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller,pod-template-hash=59d5b6685
replicaset.apps/aws-load-balancer-controller-5b7bb748b5   0         0         0       23h     aws-load-balancer-controller   public.ecr.aws/eks/aws-load-balancer-controller:v3.4.0                                               app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller,pod-template-hash=5b7bb748b5
replicaset.apps/aws-load-balancer-controller-5fbd9d9f8d   0         0         0       23h     aws-load-balancer-controller   public.ecr.aws/eks/aws-load-balancer-controller:v3.4.0                                               app.kubernetes.io/instance=aws-load-balancer-controller,app.kubernetes.io/name=aws-load-balancer-controller,pod-template-hash=5fbd9d9f8d
replicaset.apps/engress-core-5549c7d984                   0         0         0       120m    core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:e4557010edfeae962da99aa30c494d5cce70f4d0   app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=5549c7d984
replicaset.apps/engress-core-555d4fcf5f                   0         0         0       9h      core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:latest                                     app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=555d4fcf5f
replicaset.apps/engress-core-5bc5c45fcf                   0         0         0       9h      core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:latest                                     app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=5bc5c45fcf
replicaset.apps/engress-core-65bf4689c8                   0         0         0       5h13m   core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:cc56888                                    app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=65bf4689c8
replicaset.apps/engress-core-65ffdb7c48                   0         0         0       9h      core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:latest                                     app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=65ffdb7c48
replicaset.apps/engress-core-6b5f494d                     0         0         0       9h      core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:latest                                     app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=6b5f494d
replicaset.apps/engress-core-8655b8d5f9                   0         0         0       9h      core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:latest                                     app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=8655b8d5f9
replicaset.apps/engress-core-86b6f469fb                   0         0         0       5h12m   core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:cc56888                                    app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=86b6f469fb
replicaset.apps/engress-core-8f9fcbb7b                    0         0         0       124m    core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:e455701                                    app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=8f9fcbb7b
replicaset.apps/engress-core-b99549fd8                    0         0         0       117m    core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:20fa4d04587b30c9fffbf60bd2a45fb7ae37238e   app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=b99549fd8
replicaset.apps/engress-core-c79b9c8cb                    2         2         2       106m    core                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-core:e8ba319                                    app.kubernetes.io/instance=engress-core,app.kubernetes.io/name=engress-core,pod-template-hash=c79b9c8cb
replicaset.apps/engress-edge-56479864f9                   0         0         0       9h      edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=56479864f9
replicaset.apps/engress-edge-5ddc7479b5                   0         0         0       5h12m   edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:cc56888                                    app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=5ddc7479b5
replicaset.apps/engress-edge-648b9d8646                   0         0         0       9h      edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=648b9d8646
replicaset.apps/engress-edge-65b94f899                    0         0         0       23h     edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=65b94f899
replicaset.apps/engress-edge-6d7f84cc79                   0         0         0       24h     edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=6d7f84cc79
replicaset.apps/engress-edge-7447f479df                   0         0         0       23h     edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=7447f479df
replicaset.apps/engress-edge-766fbf67f9                   0         0         0       24h     edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=766fbf67f9
replicaset.apps/engress-edge-858ff9756b                   0         0         0       23h     edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=858ff9756b
replicaset.apps/engress-edge-8b8bc74c4                    0         0         0       9h      edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:latest                                     app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=8b8bc74c4
replicaset.apps/engress-edge-d455877d9                    2         2         2       105m    edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:e8ba319                                    app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=d455877d9
replicaset.apps/engress-edge-db6cd8d4c                    0         0         0       5h13m   edge                           327796148992.dkr.ecr.us-east-2.amazonaws.com/engress-edge:cc56888                                    app.kubernetes.io/instance=engress-edge,app.kubernetes.io/name=engress-edge,pod-template-hash=db6cd8d4c

NAME                                               REFERENCE                 TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
horizontalpodautoscaler.autoscaling/engress-core   Deployment/engress-core   cpu: 3%/70%   2         6         2          26h
horizontalpodautoscaler.autoscaling/engress-edge   Deployment/engress-edge   cpu: 1%/70%   2         20        2          26h
```

## Clerk verify (no secrets)

```
=== Clerk verify (Engress) ===
Publishable host: clerk.engress.io
Clerk API domain: clerk.engress.io
Expected org:     org_3FN4VwPcUUsNUKi0yf6cdFLhG7J
[warn] org API unavailable — keys verified via clerk.engress.io domain match
[ok] keys match Engress Clerk application
```

## Production health

```
engress.io/api/healthz HTTP 200
{"service":"engress-core","status":"ok","uptime":"1h46m16s","version":"e8ba319"}
```

## Next steps

1. Review and update [appendix-live.md](appendix-live.md) curated summary
2. Update atlas section headers: `last_verified: 2026-07-01`
3. Run `docs/scripts/sync-atlas.sh` and commit internal/ for Docusaurus
4. File new gaps in [10-gap-register.md](10-gap-register.md)
