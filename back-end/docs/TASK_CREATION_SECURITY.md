# Task Creation Security Architecture

## Overview
This document outlines the security measures implemented for task creation in the DataRand platform, supporting both authenticated and anonymous users while maintaining platform integrity.

## Authentication Flow

### 1. Authenticated Users
- **Route**: `POST /api/v1/tasks`
- **Middleware**: `optionalAuth` → `anonymousTaskLimiter`
- **Process**:
  1. JWT token validated via `optionalAuth` middleware
  2. User profile resolved from token
  3. Standard task limits applied based on user reputation
  4. Full blockchain integration enabled

### 2. Anonymous Users
- **Route**: `POST /api/v1/tasks`
- **Middleware**: `optionalAuth` → `anonymousTaskLimiter`
- **Process**:
  1. No token required
  2. Stricter rate limiting applied (3 tasks/hour per IP)
  3. Reduced task limits enforced
  4. Task created in DRAFT state
  5. Authentication required for funding

## Security Layers

### Layer 1: Rate Limiting
**File**: `src/middleware/rateLimitMiddleware.js`

```javascript
// Anonymous users: 3 tasks per hour per IP
// Authenticated users: Bypass rate limit
```

**Protection Against**:
- Spam task creation
- DDoS attacks
- Resource exhaustion

### Layer 2: Input Validation
**File**: `src/services/taskService.js`

**Authenticated Users**:
- First-time creators: Max 10 workers, 0.1 ETH per worker
- Established users: Higher limits based on reputation

**Anonymous Users**:
- Max 5 workers
- Max 0.05 ETH per worker
- Treated as first-time creators

**Protection Against**:
- Economic attacks
- Platform abuse
- Excessive resource allocation

### Layer 3: Content Filtering
**File**: `src/services/taskService.js`

```javascript
const FORBIDDEN_KEYWORDS = ['hack', 'illegal', 'malicious', 'attack'];
```

**Protection Against**:
- Malicious task content
- Illegal activities
- Platform reputation damage

### Layer 4: Task State Management
**States**:
1. `DRAFT` - Created but not funded
2. `FUNDED` - Payment confirmed on-chain
3. `available` - Ready for worker assignment

**Anonymous Task Flow**:
```
Create (DRAFT) → Authenticate → Fund → Available
```

**Protection Against**:
- Unfunded task spam
- Resource allocation without payment
- Blockchain transaction failures

## Database Schema

### Tasks Table Extensions
```sql
-- Support anonymous task creation
is_anonymous boolean DEFAULT false
client_id uuid NULLABLE  -- Can be null for anonymous tasks
funding_tx_hash text     -- Track blockchain funding
wsa_job_id text          -- WSA integration tracking
```

## API Endpoints

### Public Endpoints (No Auth Required)
```
POST   /api/v1/tasks              - Create task (rate limited)
GET    /api/v1/tasks/available    - List available tasks
GET    /api/v1/tasks/:id          - Get task details
```

### Protected Endpoints (Auth Required)
```
GET    /api/v1/tasks              - Get my tasks
GET    /api/v1/tasks/my-assignments - Get my assignments
POST   /api/v1/tasks/:id/fund     - Fund task
POST   /api/v1/tasks/:id/confirm-funding - Confirm funding
POST   /api/v1/tasks/request      - Request task assignment
```

## Rate Limiting Strategy

### Anonymous Users
- **Window**: 1 hour
- **Limit**: 3 tasks
- **Identifier**: IP address
- **Response**: 429 Too Many Requests

### Authenticated Users
- **Window**: N/A (bypassed)
- **Limit**: Based on reputation
- **Identifier**: User ID
- **Response**: Standard limits apply

## Security Best Practices

### 1. Defense in Depth
Multiple security layers ensure no single point of failure:
- Rate limiting (network level)
- Input validation (application level)
- Content filtering (business logic level)
- State management (data integrity level)

### 2. Fail-Safe Defaults
- Anonymous users get minimal privileges
- Tasks default to DRAFT state
- Blockchain operations are optional during creation
- Strict validation before state transitions

### 3. Least Privilege
- Anonymous users: Create only
- Authenticated users: Create + Fund + Manage
- Task owners: Full control over their tasks
- Workers: View + Request + Submit

### 4. Audit Trail
All task operations logged:
```javascript
logger.info('Anonymous task creation attempt');
logger.warn('Rate limit exceeded for IP: ${req.ip}');
logger.error('Failed to create task in DB');
```

## Attack Mitigation

### Spam Prevention
- **Threat**: Mass task creation
- **Mitigation**: IP-based rate limiting (3/hour)
- **Fallback**: Content filtering, manual review queue

### Economic Attacks
- **Threat**: High-value unfunded tasks
- **Mitigation**: DRAFT state, funding requirement
- **Fallback**: Task expiration, automatic cleanup

### Sybil Attacks
- **Threat**: Multiple fake identities
- **Mitigation**: Device fingerprinting, IP tracking
- **Fallback**: Reputation system, manual verification

### Content Abuse
- **Threat**: Malicious task descriptions
- **Mitigation**: Keyword filtering, validation
- **Fallback**: Reporting system, moderation queue

## Monitoring & Alerts

### Key Metrics
1. Anonymous task creation rate
2. Rate limit violations per IP
3. Failed validation attempts
4. DRAFT task abandonment rate
5. Funding completion rate

### Alert Thresholds
- Rate limit violations > 10/hour from single IP
- Failed validations > 20/hour globally
- DRAFT tasks > 100 unfunded for > 24 hours

## Future Enhancements

### Phase 1 (Current)
- ✅ Optional authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ Content filtering

### Phase 2 (Planned)
- [ ] Device fingerprinting integration
- [ ] Reputation-based limits
- [ ] Machine learning content moderation
- [ ] Geographic rate limiting

### Phase 3 (Future)
- [ ] Proof-of-humanity verification
- [ ] Stake-based task creation
- [ ] Community moderation
- [ ] Advanced fraud detection

## Testing Checklist

### Anonymous User Tests
- [ ] Can create task without authentication
- [ ] Rate limit enforced (3 tasks/hour)
- [ ] Worker limit enforced (max 5)
- [ ] Payout limit enforced (max 0.05 ETH)
- [ ] Cannot fund without authentication
- [ ] Task remains in DRAFT state

### Authenticated User Tests
- [ ] Can create task with authentication
- [ ] Rate limit bypassed
- [ ] Higher limits applied
- [ ] Can fund immediately
- [ ] Task transitions to FUNDED state
- [ ] Blockchain integration works

### Security Tests
- [ ] Forbidden keywords rejected
- [ ] SQL injection prevented
- [ ] XSS attacks blocked
- [ ] Rate limit cannot be bypassed
- [ ] Invalid tokens handled gracefully

## Deployment Notes

### Database Migration
Run before deploying:
```bash
psql -d datarand -f sql/migrations/add_anonymous_tasks.sql
```

### Environment Variables
Ensure these are set:
```
JWT_SECRET=<secure-secret>
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_ANONYMOUS=3
```

### Monitoring Setup
Configure alerts for:
- Rate limit violations
- Failed authentication attempts
- Unusual task creation patterns

## Support & Maintenance

### Common Issues
1. **Rate limit too strict**: Adjust `anonymousTaskLimiter` max value
2. **Validation too loose**: Update `FORBIDDEN_KEYWORDS` array
3. **Performance issues**: Add database indexes, cache frequently accessed data

### Contact
For security concerns: security@datarand.io
For technical support: dev@datarand.io
