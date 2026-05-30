# Audit Log Policy

## Required Fields

- actor user
- date and time
- module
- action
- entity type
- entity id
- before data
- after data
- reason
- IP address
- user agent
- status

## Actions To Log

- Login
- Logout
- Create asset
- Update asset
- Delete asset
- Assign asset
- Transfer asset
- Return asset
- Change asset status
- Create license
- Update license
- Renew license
- Create onboarding request
- Create offboarding request
- Approve request
- Reject request
- Export report
- Change permission
- Create user
- Disable user

## Rule

Workflow features must write audit logs as part of the same business action. The current foundation only creates the table; enforcement will be added with each workflow feature.
