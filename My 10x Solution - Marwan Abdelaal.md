# My 10x Solution — AI-Powered Meeting Assistant

## 1. The Problem

Teams spend hours in meetings with no actionable outcomes. Notes are scattered across tools, action items get lost in email threads, and decisions are forgotten. A 1-hour meeting creates 30 minutes of follow-up work per person — summarizing, assigning tasks, and tracking progress.

## Who Has This Problem

- Engineering teams doing daily standups
- Project managers tracking action items
- Remote teams with async communication
- Any team that runs meetings without a structured follow-up process

## The 10x Claim

What takes 30 minutes of manual note-taking, action item extraction, and task assignment now takes 3 minutes with AI.

## The Solution

A web application where users upload meeting transcripts (or record audio), and AI automatically extracts:
- Meeting summary (1-2 paragraphs)
- Key decisions made
- Action items with assigned owners
- Deadlines and priorities

The system stores everything, sends email reminders for overdue action items, and generates shareable PDF reports.

## 5+ Concepts from Section 2

| Concept | Implementation |
|---------|----------------|
| API endpoints | Express REST API with proper status codes and validation |
| Database | PostgreSQL with users, meetings, action_items, decisions tables |
| Authentication | Supabase Auth (login, signup, protected routes) |
| Background jobs | Inngest cron job for daily action item reminders |
| LLM integration | OpenRouter extracts summary, decisions, and action items from transcripts |
| Reporting | Playwright generates PDF meeting reports |
| Caching | Store AI results for identical transcripts to save cost |

**Total: 7 concepts — all from the first table (0 swaps needed).**

## Non-Goal (What I Will NOT Build)

- ❌ Real-time audio transcription — user must provide transcript
- ❌ Slack/Teams integration (future)
- ❌ Meeting scheduling / calendar integration (future)
- ❌ Mobile app
- ❌ Multi-tenant organization support (single user focus)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Backend | Node.js + Express |
| Database | PostgreSQL (Docker) |
| Auth | Supabase |
| Jobs | Inngest |
| PDF | Playwright |
| LLM | OpenRouter (free tier) |
| Caching | In-memory (Redis optional) |
| Deployment | Render.com or Railway (free tier) |

## Milestones

| Milestone | Timebox | Deliverable |
|-----------|---------|-------------|
| M1: One-Pager | 1 evening | This document |
| M2: Walking Skeleton | 1 weekend | POST /meetings → DB → GET response |
| M3: Concepts | ~2 weeks | Add AI, auth, jobs, PDF, caching |
| M4: Runnable | 1 weekend | README + seed data + demo |
| M5: Submit | 1 evening | Overview doc + GitHub repo |
