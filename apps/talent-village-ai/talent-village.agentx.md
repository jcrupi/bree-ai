# Talent Village UI/UX Roles

This document outlines the capabilities, UI configuration, and access levels for the different roles interacting with the Talent Village Live Assessment Engine.

## The Three Core Roles

### 👤 Candidate

The candidate is the subject of the assessment.

- **View:** "Live Assessment" Chat window
- **Capabilities:**
  - Has a read/write connection to the `assessmentMessages` NATS Vine.
  - Can only see the ongoing assessment chat between themselves, the AI, and potentially the Lead Expert masquerading or intervening.
  - End-to-End Encrypted communication channel.
- **Restrictions:**
  - Cannot see the Expert Vine Chat.
  - Cannot access AI Configuration tools or Intervention Queue.
  - Cannot invite others.

### 👑 Lead Expert

The Lead Expert acts as the moderator, director, and senior evaluator of the live assessment.

- **View:** Full Expert Terminal Dashboard ("self", "candidate", or "experts" profile views)
- **Capabilities:**
  - **Full Mirror Access:** Can view the active candidate's chat in real-time.
  - **Direct Intervention:** Can type and send messages directly into the Candidate Assessment Vine.
  - **Simulation Mode:** Can act as a candidate to test or direct the flow.
  - **AI Tools Suite:** Full access to configure Auto-AI Responses, AI Auto-Suggest, and adjust question limits.
  - **Intervention Queue Management:** Receives suggestions from other experts or AI; can approve/send or dismiss them.
  - **Question Designer:** Can use the AI Question Designer to generate and inject specific technical questions.
  - **Expert Roster Control:** Has the authority to toggle "Chat Enabled" privileges for standard Experts, upgrading them from read-only to read/write on the Candidate mirror.
  - **Vine Management:** Can generate and copy invite links for new candidates or collaborating experts.
- **Restrictions:**
  - None within the scope of the assessment.

### 👥 Expert (Non-Lead)

Normal Experts are collaborating evaluators participating in the assessment observation.

- **View:** "My Dashboard" & "Expert Collaboration" views
- **Capabilities:**
  - **Expert Vine Chat:** Can freely message and collaborate with the Lead Expert and other Experts in a private NATS Vine channel invisible to the candidate.
  - **Read-Only Mirror (Default):** Can view the live Candidate Assessment chat, but cannot directly message the candidate by default.
  - **Propose to Queue:** Can suggest questions or interventions, which are sent to the Lead Expert's Intervention Queue for approval rather than being sent directly to the candidate.
  - **Conditional Direct Chat:** If the Lead Expert explicitly enables them in the Expert Roster, the normal Expert gains send capabilities on the Candidate Mirror.
- **Restrictions:**
  - Cannot send direct messages to the candidate without Lead approval.
  - Cannot see or use the AI Configuration or Intervention Queue.
  - Cannot use the "Act as Candidate" simulation feature.
  - Cannot generate new Vine invites.
