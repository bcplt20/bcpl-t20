/* News articles migrated from the old BCPL website (Aug 2026).
   Images are self-hosted in public/bcpl-assets/news/.
   "press" links point to the ORIGINAL external coverage (news outlets),
   never back to the old website. */

export type NewsArticle = {
  slug: string;
  tag: string;            // e.g. "Press Release", "Auction"
  title: string;
  titleHi: string;
  date: string;           // display date
  iso: string;            // for sorting
  image: string;          // filename under bcpl-assets/news/
  paragraphs: string[];
  press: { label: string; url: string }[];
};

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "bcpl-season-4-auctions-the-success-story",
    tag: "Auction",
    title: "BCPL Season 4 Auctions: The Success Story!",
    titleHi: "BCPL Season 4 Auction: कामयाबी की कहानी!",
    date: "Feb 17, 2026",
    iso: "2026-02-17",
    image: "auction-success.jpg",
    paragraphs: [
      "With the first-ever Auctions concluded on Sunday, the league built & solidified its stature in the amateur cricket universe. The Auctions came with their own challenges, but the show put on by the BCPL was one to remember — franchises went head-to-head for the best corporate cricketing talent in the country.",
      "A few snippets from what Dada & Zaheer Khan had to say in their dedicated time with the press are covered in the coverage links below."
    ],
    press: [
      { label: "IANS", url: "https://x.com/ians_india/status/2020453529442521489" },
      { label: "PTI", url: "https://x.com/pti_news/status/2020459177446146123" },
      { label: "Tribune India", url: "https://www.tribuneindia.com/news/sports/bcpl-to-create-new-pathways-for-corporate-cricketing-talent-sourav-ganguly/" },
      { label: "Lokmat Times", url: "https://www.lokmattimes.com/cricket/news/bcpl-to-create-new-pathways-for-corporate-cricketing-talent-sourav-ganguly/" },
      { label: "News18", url: "https://www.news18.com/agency-feeds/bcpl-to-create-new-pathways-for-corporate-cricketing-talent-sourav-ganguly-9888445.html" }
    ]
  },
  {
    slug: "the-bcpl-season-4-auction-shortlist",
    tag: "Auction",
    title: "The BCPL Season 4 Auction Shortlist",
    titleHi: "BCPL Season 4 Auction Shortlist",
    date: "Feb 7, 2026",
    iso: "2026-02-07",
    image: "auction-shortlist.png",
    paragraphs: [
      "The wait is over! It's your turn to make cricketing dreams a reality! The final shortlist of players going under the hammer on Sunday was announced — hundreds of corporate cricketers from cities across India, from Patna and Kanpur to Surat, Mumbai and Delhi, made the cut for the league's first-ever player auction."
    ],
    press: []
  },
  {
    slug: "sourav-ganguly-brand-ambassador-2025",
    tag: "Press Release",
    title: "Bhartiya Corporate Premier League (BCPL) Proud to Announce Sourav Ganguly as Brand Ambassador for 2025",
    titleHi: "BCPL को गर्व है — Sourav Ganguly बने 2025 के Brand Ambassador",
    date: "Oct 16, 2025",
    iso: "2025-10-16",
    image: "ganguly-ambassador.jpg",
    paragraphs: [
      "A new era in sports is set to dawn with the official announcement of the Bhartiya Corporate Premier League (BCPL) 2025. The pioneering T20 cricket tournament is proud to announce that the legendary former Indian captain Sourav Ganguly will lead the charge as its Brand Ambassador.",
      "The BCPL is conceptualised with a grand vision: to create India's most prestigious and aspirational sporting platform for working professionals. It aims to transcend the boundaries of the office, bringing corporate India onto the cricket field."
    ],
    press: [
      { label: "ANI News", url: "https://aninews.in/news/business/cricket-legend-sourav-ganguly-to-lead-the-charge-as-brand-ambassador-for-the-bhartiya-corporate-premier-league-bcpl-202520251013172902/" },
      { label: "India Today", url: "https://www.indiatoday.in/impact-feature/story/cricket-legend-sourav-ganguly-to-lead-the-charge-as-brand-ambassador-for-the-bhartiya-corporate-premier-league-bcpl-2025-2802883-2025-10-14" },
      { label: "Hindustan Times", url: "https://www.hindustantimes.com/genesis/sourav-ganguly-announced-as-brand-ambassador-for-the-bhartiya-corporate-premier-league-bcpl-2025-101760421709217.html" },
      { label: "News18", url: "https://www.news18.com/studio18/cricket-legend-sourav-ganguly-to-lead-the-charge-as-brand-ambassador-for-the-bhartiya-corporate-premier-league-bcpl-2025-9635012.html" },
      { label: "Zee News", url: "https://zeenews.india.com/consumer-connect/bcpl-2025-sourav-ganguly-to-lead-charge-as-brand-ambassador-for-bhartiya-corporate-premier-league-2971917.html" }
    ]
  }
];
