# Oasis (infra job runner)

Oasis runs scheduled and on-demand infrastructure jobs on the control plane — think lightweight cron/worker co-located with `engress-core`. It uses the same EC2 IAM role for SSM secrets and AWS API access.

## Topology

- **Combined mode:** oasis shares the edge instance with `engress-core`.
- **Split mode:** oasis runs on the control instance alongside `engress-core` only; the edge box stays tunnel-only (`:80`, `:443`, `:4433`).

Control instance bootstrap: [`deploy/scripts/control-bootstrap.sh`](../deploy/scripts/control-bootstrap.sh) and Terraform [`deploy/terraform/control.tf`](../deploy/terraform/control.tf).

## Operator notes

- Enable split topology in `terraform.tfvars`: `enable_control_instance = true`
- DNS: A-record `control-origin.<base_domain>` → control instance public IP (output `control_public_ip`)
- Deploy API to control: `./dev.sh api-up` (auto-targets control when split)

Job definitions and runner code live under `internal/oasis/` (see platform plan U12 for full job catalog).
