# API Reference

## Authentication
All authenticated endpoints require an `Authorization` header with a JWT token.

## Response Format
Every endpoint returns:
```json
{
  "status": 2,
  "data": { },
  "errors": {},
  "exception": null
}
```

### Status Codes
| Value | Status | Description |
|---|---|---|
| 1 | Pending | Operation pending |
| 2 | Success | Operation succeeded |
| 3 | NotFound | Resource not found |
| 4 | Duplicate | Duplicate resource |
| 5 | Rejected | Operation rejected |
| 6 | UnAuthorized | Authentication required |
| 7 | Validation | Validation error |
| 8 | Failed | Operation failed |

## Endpoints

### Account
| Endpoint | Description |
|---|---|
| POST /account/login | Authenticate user |
| POST /account/register | Register new user |
| POST /account/profile | Get current user profile |
| POST /account/profile/update | Update profile (FormData) |
| POST /account/password/change | Change password |

### Groups
| Endpoint | Description |
|---|---|
| POST /groups/list | List user's groups |
| POST /groups/create | Create new group |
| POST /groups/{id}/edit | Edit group |
| POST /groups/{id}/fetch | Get group details |

### Projects
| Endpoint | Description |
|---|---|
| POST /projects/list | List user's projects |
| POST /projects/create | Create new project |
| POST /projects/{id}/edit | Edit project |
| POST /projects/{id}/fetch | Get project details |

### Work Packages
| Endpoint | Description |
|---|---|
| POST /work-packages/create/{projectId} | Create work package |
| POST /work-packages/fetch/{id} | Get work package |
| POST /work-packages/{id}/lists/create | Create list |
| POST /work-packages/lists/{id}/rename | Rename list |

### Tasks
| Endpoint | Description |
|---|---|
| POST /tasks/{listId}/create | Create task |
| POST /tasks/{id}/detail | Get task details |
| POST /tasks/{id}/change-state | Update task state |
| POST /tasks/{id}/comment | Add comment |

See full API reference in the backend documentation for complete request/response schemas.
