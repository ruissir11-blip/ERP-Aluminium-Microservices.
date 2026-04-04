# ERP Aluminium - Disaster Recovery Plan

## Overview

This document outlines the disaster recovery procedures for the ERP Aluminium system.

## Recovery Objectives

| Metric | Target |
|--------|--------|
| RTO (Recovery Time Objective) | 4 hours |
| RPO (Recovery Point Objective) | 24 hours |
| Maximum Data Loss | 24 hours |

## Backup Strategy

### Automated Backups

| Type | Schedule | Retention |
|------|----------|-----------|
| Daily Full | 2:00 AM UTC | 30 days |
| Weekly Full | 3:00 AM UTC (Sunday) | 12 months |
| Transaction Logs | Continuous | 7 days |

### Backup Storage

- **Primary**: AWS S3 (erp-aluminium-backups)
- **Location**: us-east-1 (multi-AZ)
- **Encryption**: AES-256

## Disaster Recovery Procedures

### Scenario 1: Database Failure

1. **Detection** (5 minutes)
   - Monitor alerts trigger
   - Check PostgreSQL status

2. **Recovery** (30-60 minutes)
   ```bash
   # Restore from latest backup
   kubectl delete deployment erp-postgres -n production
   
   # Restore database
   aws s3 cp s3://erp-aluminium-backups/daily/erp_backup_YYYYMMDD.sql.gz /tmp/backup.sql.gz
   gunzip < /tmp/backup.sql.gz | psql -U postgres -d erp_aluminium
   
   # Verify
   psql -U postgres -d erp_aluminium -c "SELECT COUNT(*) FROM users;"
   ```

3. **Verification** (15 minutes)
   - Run health checks
   - Verify data integrity

### Scenario 2: Application Failure

1. **Detection** (1 minute)
   - Kubernetes health checks
   - Prometheus alerts

2. **Recovery** (5-10 minutes)
   ```bash
   # Automatic rollback via HPA
   kubectl rollout undo deployment/erp-backend -n production
   
   # Or redeploy
   kubectl rollout restart deployment/erp-backend -n production
   ```

3. **Verification** (5 minutes)
   - Check pod status
   - Verify API endpoints

### Scenario 3: Complete Data Center Failure

1. **Detection** (5 minutes)
   - Multi-region health checks

2. **Recovery** (2-4 hours)
   ```bash
   # Deploy to DR region
   kubectl apply -f deploy/kubernetes/
   
   # Restore from S3
   aws s3 sync s3://erp-aluminium-backups/ dr-bucket/
   
   # Update DNS
   # Point to new region
   ```

3. **Verification** (30 minutes)
   - Full system health check
   - User acceptance testing

## Runbooks

### Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call DevOps | | | oncall@erp.local |
| Security Lead | | | security@erp.local |
| Database Admin | | | dba@erp.local |

### Escalation Procedure

1. **Level 1** (0-15 min): On-call DevOps
2. **Level 2** (15-30 min): Team Lead
3. **Level 3** (30-60 min): CTO

## Testing Schedule

| Test | Frequency | Last Test |
|------|-----------|-----------|
| Database Restore | Monthly | - |
| DR Drill | Quarterly | - |
| Failover Test | Bi-annually | - |

## Post-Incident

1. **Immediate** (0-24 hours)
   - Document incident timeline
   - Notify stakeholders
   - Begin root cause analysis

2. **Short-term** (1-7 days)
   - Complete root cause analysis
   - Implement fixes
   - Update runbooks

3. **Long-term** (1-30 days)
   - Conduct lessons learned
   - Update disaster recovery plan
   - Schedule follow-up tests
