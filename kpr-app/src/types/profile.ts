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
  title?: string;
  description?: string;
  mediaUrl: string;
  mimeType?: string;
  link?: string;
  createdAt?: string;
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
  banner?: string;
  avatar?: string;
  roles?: string[];
  skills?: string[];
  portfolio?: PortfolioItem[];
  social?: SocialLinks;
};
