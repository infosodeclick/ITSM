# RBAC Permission Model

## Roles

- `SUPER_ADMIN`: all modules and system settings
- `IT_ADMIN`: asset, workflow, license, warranty, repair, and reports
- `IT_STAFF`: daily IT operations such as asset updates, assign, transfer, return, and onboarding tasks
- `HR`: onboarding and offboarding requests, read-only request status
- `MANAGER`: approval and department reports
- `VIEWER`: dashboard and report viewing

## Initial Permission Keys

- `asset.read`
- `asset.write`
- `asset.delete`
- `asset.transfer`
- `employee.read`
- `employee.write`
- `hr.onboarding`
- `hr.offboarding`
- `license.manage`
- `report.export`
- `audit.read`
- `user.manage`

## Implementation Notes

The first foundation migration adds RBAC tables only. Login enforcement and route protection should be implemented in a separate feature to keep risk controlled.
