export type ButtonsBySlug = {
  [slug: string]: ButtonInfo[];
};

export type BroadCast = {
  id: string;
  title: string;
  streamId: string;
  categories: string[];
  buttons: ButtonInfo[];
  createdAt: Date;
  updatedAt?: Date;
};

export type ButtonInfo = {
  'file-name': string;
  value: string;
};

export type AudioState = {
  cache: { [fileName: string]: HTMLAudioElement };
  playingAudioName: string | undefined;
};
