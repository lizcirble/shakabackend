# **DataRand Backend & Smart Contract Guide (Updated with Feedback)**

## **1. Overview**

DataRand is a **decentralized task execution network** for:

* Image labeling
* Audio transcription
* AI evaluation
* ComputeShare (pure computation)

**Backend:** Node.js + Supabase
**Escrow & payouts:** Smart contract on-chain

**Flow:**

```
Frontend → Node.js → Supabase / Smart Contract → Worker Devices → Node.js → Client
```

**Key Principles:**

* All tasks are **funded via escrow** before execution
* Human tasks require **manual approval** or **consensus**
* ComputeShare tasks run automatically and are logged in Supabase
* Reputation and audit logs ensure **trust & transparency**

---

## **2. Authentication & Identity**

* Users authenticate via **Privy**
* Frontend sends: `privy_id`, session token, device fingerprint

**Node.js workflow:**

1. Verify session via Privy API
2. Create/update user in Supabase
3. Generate JWT for API access

**Sybil attack prevention:**

* Max **1 active task per device fingerprint**
* Duplicate fingerprints **flagged**
* Reduced task priority for suspected duplicates

---

## **3. Task Types & Execution**

| Task Type           | Execution                | Approval / Verification                               |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| Image Labeling      | Human                    | Task creator manual approval                          |
| Audio Transcription | Human                    | Task creator manual approval                          |
| AI Evaluation       | Human + optional compute | ≥3 independent workers, reputation-weighted consensus |
| ComputeShare        | Automatic compute        | Auto-approved; outputs stored in Supabase             |

**Notes:**

* Large tasks → **split into sub-tasks** across multiple devices
* ComputeShare tasks → no human interaction, purely compute-based

---

## **4. Task Creation & Intake Gate**

1. User fills task input fields:

   * Category, instructions, payout per worker, # of workers, deadline

2. Node.js validates:

   * Allowed category
   * Keyword scan for harmful/illegal content
   * Assign `risk_level` (LOW / MEDIUM / HIGH)

3. Node.js calculates:

   * Subtotal = `payout × # workers`
   * Platform Fee = 15%
   * Total = subtotal + platform fee

4. Task saved as **DRAFT** in Supabase

**First-time creators:** capped payout/workers

---

## **5. Task Funding & Escrow**

* User clicks **Fund Task** → Node.js triggers **smart contract**

**Smart contract ensures:**

* Locks **worker payouts + platform fee** in escrow
* Task state → **FUNDED** in Supabase
* Cannot be assigned until funded

```solidity
struct Task {
    address creator;
    uint256 payoutPerWorker;
    uint256 platformFee;
    address[] assignedWorkers;
    bool isFunded;
    bool isCompleted;
}

function fundTask(uint256 taskId) external payable { ... }
function releasePayout(uint256 taskId, address worker) external { ... }
```

* **Platform fee is deterministic and cannot be altered**

---

## **6. Task Assignment**

* Node.js automatically selects **eligible workers**

* **Atomic reservation with TTL (2–5 min)** ensures:

  * Prevents bots & race conditions
  * Tasks return to pool if not completed within TTL

* Enforces:

  * Fingerprint uniqueness
  * Rate limits (# tasks per user/hour)
  * Reputation weighting
  * Random assignment

* Large tasks → **split across multiple devices or ComputeShare nodes**

**Assignable tasks:** Image, Audio, AI Evaluation, ComputeShare

---

## **7. Task Execution**

* **Image/Audio Tasks:** manual completion by worker

* **AI Evaluation:** human validation + optional WASM sandbox compute

* **ComputeShare:** automatic computation

* Submissions stored in **Supabase** with metadata (timestamps, worker ID, device info)

---

## **8. Submission & Verification**

* Node.js receives submission → runs automated checks + redundancy validation

**Approval Methods:**

| Task Type     | Approval Method                                       |
| ------------- | ----------------------------------------------------- |
| Image/Audio   | Task creator manually approves/rejects                |
| AI Evaluation | ≥3 independent workers; reputation-weighted consensus |
| ComputeShare  | Automatic                                             |

* All decisions logged in **append-only Supabase tables**
* Reputation updated (accuracy, completion, reliability)

---

## **9. Escrow Release / Payout**

* **Approved:** Node.js triggers smart contract → releases:

  * Worker payout → wallet
  * Platform fee → treasury wallet

* **Rejected / Expired:** full refund → creator

* **Dual-control for high-value tasks:** 2 independent approvals required

---

## **10. Reputation & Anchoring**

* Metrics: accuracy, completion rate, reliability
* Weekly: Node.js computes **Merkle root** → publishes on-chain
* Protects contribution history, ensures auditability

---

## **11. ComputeShare (No Task)**

* Runs automatically on idle devices (CPU/GPU)
* Outputs stored in Supabase
* Contributes to **network throughput & reputation metrics**
* Large workloads can fallback to **World Sandbox Alliance nodes** if local devices lack capacity

---

## **12. World Sandbox Alliance Integration**

* WSA provides **additional distributed compute** for large or heavy tasks

* Node.js backend workflow:

  1. Detect task > device capacity → split sub-tasks
  2. Submit sub-tasks to WSA API
  3. Poll for completion → fetch results
  4. Store outputs in Supabase
  5. Merge results with user device outputs for verification

* **Benefits:**

  * Tasks never fail due to insufficient local compute
  * Reliable execution → social impact & revenue generation
  * Maintains distributed model while scaling

---

## **13. Storage & Backend Tech**

| Data            | Storage                 |
| --------------- | ----------------------- |
| Users           | Supabase Postgres       |
| Tasks           | Supabase Postgres       |
| Submissions     | Supabase Postgres       |
| Media files     | Supabase Storage        |
| Reputation logs | Supabase Postgres       |
| Audit logs      | Supabase Postgres       |
| Escrow funds    | Smart contract on-chain |
| Business logic  | Node.js                 |

* Node.js → orchestrates all workflows, validation, assignment, and payouts
* Supabase → storage, logging, reputation metrics
* Smart contract → secures funds, automates payouts

---

## **14. Security & Loophole Mitigation**

* **Sybil attacks:** device fingerprint + behavioral limits
* **Malicious tasks:** category allowlist + keyword scan + risk levels
* **Backend power:** append-only logs, dual approval for high-value payouts
* **Fake consensus / collusion:** ≥3 workers, diverse fingerprints, weighted votes
* **Task sniping / race conditions:** atomic reservation + TTL + rate limits
* **Reputation gaming:** decay + difficulty weighting + probation periods
* **Platform fee:** deterministic, escrow-enforced
* **Abandoned tasks:** cooldowns, reduced priority, temporary suspension

---

## **15. Scalability Notes**

* Stateless Node.js → horizontal scaling
* Async task queue → Redis / BullMQ
* Backend never executes customer workloads
* Minimal blockchain usage → only escrow + reputation anchoring
* Large or heavy workloads → split to ComputeShare or WSA nodes

---

## **16. One-Line Summary**

**“Users create and fund tasks; Node.js orchestrates assignment, execution, and verification; outputs stored in Supabase; smart contracts handle escrowed payouts; large or compute-heavy tasks are split across devices or WSA nodes; reputation is anchored on-chain.”**

---

This is **fully updated with all 8 feedback fixes, ComputeShare, AI evaluation consensus, TTL assignments, smart contract funding, WSA integration**, and ready to save as:

```

