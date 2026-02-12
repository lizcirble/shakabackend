# **DataRand Backend & Smart Contract Guide**

## **1. Overview**

DataRand is a **decentralized task execution network** for:

* Image labeling
* Audio transcription
* AI evaluation
* ComputeShare (pure computation)

**Backend**: Node.js + Supabase
**Escrow & payouts**: Smart contract on-chain

**Flow:**

```
Frontend → Node.js → Supabase / Smart Contract → Worker Devices → Node.js → Client
```

---

## **2. Authentication & Identity**

* Users authenticate via **Privy**

* Frontend sends: `privy_id`, session token, device fingerprint

* Node.js:

  * Verifies Privy session
  * Creates/updates user record in Supabase
  * Generates JWT for API access

* **Device fingerprint enforcement** prevents Sybil attacks

  * Max 1 active account per fingerprint
  * Duplicate accounts flagged & task priority reduced

---

## **3. Task Types**

| Task Type           | Execution                | Approval                                                   |
| ------------------- | ------------------------ | ---------------------------------------------------------- |
| Image Labeling      | Human                    | Task creator manually approves/rejects                     |
| Audio Transcription | Human                    | Task creator manually approves/rejects                     |
| AI Evaluation       | Human + optional compute | ≥3 independent workers, weighted by reputation (consensus) |
| ComputeShare        | Compute-only             | Auto-approved, stored in Supabase                          |

* Large tasks exceeding device capacity → **split into sub-tasks**

---

## **4. Task Creation & Intake Gate**

1. User fills task input fields:

   * Category, instructions, payout per worker, # of workers, deadline
2. Node.js validates:

   * Allowed category
   * Keyword scan for harmful/illegal content
   * Assigns `risk_level` (LOW / MEDIUM / HIGH)
3. Node.js calculates:

   * Subtotal = `payout × workers`
   * Platform Fee = 15% of subtotal
   * Total = subtotal + platform fee
4. Task stored as **DRAFT** in Supabase

**First-time creators:** capped payout/workers

---

## **5. Task Funding & Escrow**

* User clicks **Fund Task**
* Node.js triggers **smart contract**:

  * Locks **worker payouts + platform fee** in escrow
  * Task state → **FUNDED** in Supabase
* Task cannot be assigned until funded

**Smart contract logic:**

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

---

## **6. Task Assignment**

* Node.js selects eligible workers automatically

* Creates **atomic reservation with TTL (2–5 min)**

* Enforces:

  * Fingerprint uniqueness
  * Rate limits (# tasks per user/hour)
  * Reputation weighting
  * Randomization

* Large tasks → **split into sub-tasks**

* Assignable tasks: Image, Audio, AI Evaluation, ComputeShare

---

## **7. Task Execution**

* **Human Tasks (Image/Audio):** manual completion

* **AI Evaluation:** human validation + optional WASM sandbox compute

* **ComputeShare:** automatic computation; Node.js records outputs

* Submissions stored in **Supabase** with metadata

---

## **8. Submission & Verification**

* Node.js receives submissions
* Runs automated checks & redundancy validation

**Approval Methods:**

| Task Type     | Approval Method                           |
| ------------- | ----------------------------------------- |
| Image/Audio   | Task creator manual approval              |
| AI Evaluation | Consensus ≥3 workers, reputation-weighted |
| ComputeShare  | Automatic                                 |

* Decisions logged in Supabase (append-only) for audit
* Reputation updated based on accuracy, completion, reliability

---

## **9. Escrow Release / Payout**

* **Approved:** Node.js triggers smart contract → releases:

  * Worker payout → wallet
  * Platform fee → treasury wallet
* **Rejected / Expired:** full refund → creator
* Platform fee is **deterministic & unchangeable**

---

## **10. Reputation & Anchoring**

* Reputation metrics: accuracy, completion, reliability
* Weekly: Node.js computes **Merkle root** → publishes on-chain
* Protects contribution history and ensures auditability

---

## **11. ComputeShare (No Task)**

* Pure computation runs on devices automatically
* Outputs stored directly in Supabase
* No manual review needed
* Contributes to **network throughput & reputation metrics**

---

## **12. Storage & Backend Tech**

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

* **Node.js** enforces rules, handles assignment, validation, and triggers payouts
* **Supabase** is storage & logging backend
* **Smart contract** secures funds and automates payouts

---

## **13. Security & Loophole Mitigation**

* **Sybil attacks:** device fingerprint + behavioral limits
* **Malicious tasks:** category allowlist + keyword scan + risk levels
* **Backend power:** append-only logs, dual approval for high-value payouts
* **Fake consensus / collusion:** ≥3 workers, diverse fingerprints, weighted votes
* **Task sniping / race conditions:** atomic reservation + TTL + rate limits
* **Reputation gaming:** decay + difficulty weighting + probation periods
* **Platform fee:** deterministic, escrow-enforced
* **Abandoned tasks:** cooldowns, reduced priority, temporary suspension

---

## **14. Scalability Notes**

* Stateless Node.js → horizontal scaling
* Async task queue → Redis / RabbitMQ
* Backend never executes customer workloads
* Minimal blockchain usage → only escrow & reputation anchoring

---

### **15. One-Line Summary**

**“Users create and fund tasks, Node.js orchestrates assignment, execution, and verification, outputs stored in Supabase, smart contracts handle escrowed payouts, and large or compute-heavy tasks are split or run automatically on user devices.”**

---

This is ready to save as `DataRand_Backend_Guide.md` for your team.
