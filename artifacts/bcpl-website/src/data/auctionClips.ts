/** Season 4 Auction — self-hosted highlight clips (720p, public/auction/clips/). */
export type AuctionClip = {
  /** mp4 filename inside public/auction/clips/ */
  file: string;
  /** poster jpg filename inside public/auction/clips/ */
  poster: string;
  dur: string;
  /** loop very short clips in the player */
  loop?: boolean;
  title: string;
  titleHi: string;
};

export const AUCTION_STREAM = {
  ytId: 'Akv5fWqHXMQ',
  dur: '7hr+',
} as const;

export const AUCTION_CLIPS: AuctionClip[] = [
  { file: 'auc-clip-01.mp4', poster: 'auc-clip-01.jpg', dur: '0:35', title: 'Auction Arena Reveal',        titleHi: 'Auction arena की पहली झलक' },
  { file: 'auc-clip-02.mp4', poster: 'auc-clip-02.jpg', dur: '0:15', title: 'Walking Into the Auction',    titleHi: 'Auction में entry' },
  { file: 'auc-clip-03.mp4', poster: 'auc-clip-03.jpg', dur: '0:12', title: 'Behind the Scenes: Team Shoot', titleHi: 'पर्दे के पीछे: Team shoot' },
  { file: 'auc-clip-12.mp4', poster: 'auc-clip-12.jpg', dur: '0:17', title: 'Sourav Ganguly at the Auction', titleHi: 'Auction में Sourav Ganguly' },
  { file: 'auc-clip-05.mp4', poster: 'auc-clip-05.jpg', dur: '0:05', title: 'The Trophy on Camera',        titleHi: 'Trophy camera पर' },
  { file: 'auc-clip-06.mp4', poster: 'auc-clip-06.jpg', dur: '0:02', loop: true, title: 'Season 4 Jerseys', titleHi: 'Season 4 की jerseys' },
  { file: 'auc-clip-07.mp4', poster: 'auc-clip-07.jpg', dur: '0:27', title: 'Inside the Auction Arena',    titleHi: 'Auction arena के अंदर' },
  { file: 'auc-clip-08.mp4', poster: 'auc-clip-08.jpg', dur: '0:13', title: 'Live Bidding',                titleHi: 'Live बोली' },
  { file: 'auc-clip-09.mp4', poster: 'auc-clip-09.jpg', dur: '0:08', title: 'Player on the Block',         titleHi: 'Player की बोली शुरू' },
  { file: 'auc-clip-10.mp4', poster: 'auc-clip-10.jpg', dur: '0:30', title: 'The Hammer Falls',            titleHi: 'हथौड़ा गिरा' },
  { file: 'auc-clip-11.mp4', poster: 'auc-clip-11.jpg', dur: '0:03', loop: true, title: 'Sold! Team Celebration', titleHi: 'Sold! Team की खुशी' },
];
