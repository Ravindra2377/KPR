export type SocialLinks = {
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  youtube?: string;
  dribbble?: string;
  behance?: string;
};

export type PortfolioItem = {
  _id: string;
  key?: string;
  url: string;
  type: "image" | "video";
  title?: string;
  description?: string;
  link?: string;
  createdAt?: string;
  uploadedAt?: string;
  meta?: {
    width?: number;
    height?: number;
  };
  thumbs?: Record<string, string>;
};

export type BannerAsset = {
  url: string;
  key?: string;
  altText?: string;
  blurhash?: string | null;
  meta?: {
    width?: number;
    height?: number;
  };
};

export type ProfileUser = {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  about?: string;
  building?: string;
  lookingFor?: string;
  quote?: string;
  banner?: BannerAsset | null;
  avatar?: string;
  roles?: string[];
  skills?: string[];
  portfolio?: PortfolioItem[];
  social?: SocialLinks;
};
