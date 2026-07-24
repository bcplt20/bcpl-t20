import { Redirect } from 'wouter';

/**
 * /auction/selected — placeholder until the Season 5 auction era begins.
 *
 * The old page here was a hardcoded demo ("Congratulations, your profile is
 * live", fake teams bidding, a downloadable player profile with fake data —
 * "Rahul Sharma / Mumbai Mavericks / ₹8,50,000"). Nobody has been trial-cleared
 * or shortlisted yet, and a fake downloadable "selection proof" is a fraud
 * risk, so the page now redirects to the honest auction info page.
 *
 * When trials finish and real players enter the auction pool (2027), rebuild
 * this as a real page driven by the logged-in player's own status/data —
 * never hardcoded placeholders. Journey routing in lib/auth.ts still points
 * trial_cleared / auction_shortlisted players here, which is fine: they will
 * land on the auction info page until the real page exists.
 */
export function AuctionSelected() {
  return <Redirect to="/auction/live" replace />;
}
