/**
 * Computed achievement badges — NO cron, NO stored state. Every badge is
 * derived on read from the tables the journey already writes, so a badge can
 * never drift from reality and there is nothing to backfill.
 *
 * earnedAt is a best-effort timestamp from the underlying row when we have one;
 * where the source has no single timestamp (e.g. a count threshold) it is null.
 */
import { db } from "@workspace/db";
import {
  registrationsTable, phase1VideosTable, phase2PaymentsTable,
  kycRecordsTable, referralCodesTable, referralSignupsTable,
  phase1PaymentsTable,
} from "@workspace/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { isClassificationComplete } from "./classification";
import { pgCauseOf } from "./pgErrors";

export type Badge = {
  id: string;
  earned: boolean;
  earnedAt: string | null;
  title: string;
  titleHi: string;
  desc: string;
  descHi: string;
  icon: string;
};

const PAID = ["success", "paid"];

type Def = Omit<Badge, "earned" | "earnedAt">;
const DEFS: Def[] = [
  { id: "profile_complete", icon: "user-check", title: "Profile Complete", titleHi: "प्रोफ़ाइल पूरी", desc: "Set your playing style", descHi: "अपनी खेल शैली चुनी" },
  { id: "video_uploaded", icon: "video", title: "Video Submitted", titleHi: "वीडियो जमा", desc: "Uploaded your trial video", descHi: "ट्रायल वीडियो अपलोड किया" },
  { id: "trial_done", icon: "flag", title: "Trial Attended", titleHi: "ट्रायल पूरा", desc: "Completed your physical trial", descHi: "अपना फ़िज़िकल ट्रायल पूरा किया" },
  { id: "phase2_paid", icon: "credit-card", title: "Phase 2 Cleared", titleHi: "Phase 2 पूरा", desc: "Completed Phase 2 payment", descHi: "Phase 2 भुगतान पूरा किया" },
  { id: "kyc_verified", icon: "shield", title: "KYC Verified", titleHi: "KYC सत्यापित", desc: "Your KYC is verified", descHi: "आपका KYC सत्यापित है" },
  { id: "first_vote", icon: "check-square", title: "First Vote", titleHi: "पहला वोट", desc: "Cast your first fan vote", descHi: "अपना पहला फैन वोट दिया" },
  { id: "voter_x5", icon: "volume-2", title: "Super Fan", titleHi: "सुपर फैन", desc: "Voted in 5 fan polls", descHi: "5 फैन पोल में वोट किया" },
  { id: "referral_1", icon: "user-plus", title: "First Referral", titleHi: "पहला रेफरल", desc: "1 friend paid via your code", descHi: "आपके कोड से 1 दोस्त ने भुगतान किया" },
  { id: "referral_3", icon: "users", title: "Recruiter", titleHi: "रिक्रूटर", desc: "3 friends paid via your code", descHi: "आपके कोड से 3 दोस्तों ने भुगतान किया" },
];

/** Count distinct fan polls a user voted in (table is created lazily). */
async function fanPollVoteCount(userId: string): Promise<number> {
  try {
    const r = await db.execute(sql`
      SELECT COUNT(DISTINCT poll_id)::int AS n FROM fan_poll_votes WHERE user_id = ${userId}
    `);
    const rows = (r as unknown as { rows?: Array<{ n: number }> }).rows ?? [];
    return rows[0]?.n ?? 0;
  } catch (e) {
    if (pgCauseOf(e)?.code === "42P01") return 0; // polls never used yet
    throw e;
  }
}

/** Paid referrals attributed to this user's personal code. */
async function referralPaidCount(userId: string): Promise<number> {
  const [rc] = await db.select({ code: referralCodesTable.code })
    .from(referralCodesTable)
    .where(eq(referralCodesTable.userId, userId))
    .limit(1);
  if (!rc) return 0;
  const [row] = await db
    .select({ n: sql<number>`count(distinct ${referralSignupsTable.registrationId})::int` })
    .from(referralSignupsTable)
    .innerJoin(phase1PaymentsTable, eq(phase1PaymentsTable.registrationId, referralSignupsTable.registrationId))
    .where(and(eq(referralSignupsTable.code, rc.code), inArray(phase1PaymentsTable.status, PAID)));
  return row?.n ?? 0;
}

/**
 * Compute all badges for a user. `registrationId` is the user's primary
 * registration (from pickUserRegistration); when null, journey badges simply
 * stay unearned but vote/referral badges still resolve.
 */
export async function computeBadges(
  userId: string,
  registration: { id: string; role: string; classification: unknown } | null,
): Promise<Badge[]> {
  const earned = new Map<string, string | null>();

  if (registration) {
    // profile_complete
    if (isClassificationComplete(registration.role, registration.classification)) {
      earned.set("profile_complete", null);
    }
    // video_uploaded
    const [vid] = await db.select({ at: phase1VideosTable.submittedAt })
      .from(phase1VideosTable)
      .where(eq(phase1VideosTable.registrationId, registration.id))
      .orderBy(sql`${phase1VideosTable.submittedAt} ASC`)
      .limit(1);
    if (vid) earned.set("video_uploaded", vid.at?.toISOString() ?? null);

    // phase2_paid
    const [p2] = await db.select({ at: phase2PaymentsTable.createdAt })
      .from(phase2PaymentsTable)
      .where(and(eq(phase2PaymentsTable.registrationId, registration.id), inArray(phase2PaymentsTable.status, PAID)))
      .limit(1);
    if (p2) earned.set("phase2_paid", p2.at?.toISOString() ?? null);

    // kyc_verified
    const [kyc] = await db.select({ at: kycRecordsTable.verifiedAt })
      .from(kycRecordsTable)
      .where(and(eq(kycRecordsTable.registrationId, registration.id), eq(kycRecordsTable.status, "verified")))
      .limit(1);
    if (kyc) earned.set("kyc_verified", kyc.at?.toISOString() ?? null);

    // trial_done — trial cleared / team signed on the registration OR an
    // allocated+checked-in trial. We use the cheap registration status signal.
    const [reg] = await db.select({ phase2Status: registrationsTable.phase2Status })
      .from(registrationsTable)
      .where(eq(registrationsTable.id, registration.id))
      .limit(1);
    if (reg && ["trial_cleared", "auction_shortlisted", "team_signed"].includes(reg.phase2Status ?? "")) {
      earned.set("trial_done", null);
    }
  }

  const votes = await fanPollVoteCount(userId);
  if (votes >= 1) earned.set("first_vote", null);
  if (votes >= 5) earned.set("voter_x5", null);

  const refPaid = await referralPaidCount(userId);
  if (refPaid >= 1) earned.set("referral_1", null);
  if (refPaid >= 3) earned.set("referral_3", null);

  return DEFS.map((d) => ({
    ...d,
    earned: earned.has(d.id),
    earnedAt: earned.get(d.id) ?? null,
  }));
}
