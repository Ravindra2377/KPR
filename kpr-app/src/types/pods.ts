export type PodTag = string;

export type PodApplicant = {
  userId: string;
  name?: string;
  avatar?: string;
  message?: string;
  requestedAt?: string;
};

export type PodRole = {
  id: string;
  title: string;
  slots: number;
  filled: number;
  skills?: string[];
  applicants?: PodApplicant[];
  openSlots?: number;
};

export type PodMember = {
  _id: string;
  name: string;
  avatar?: string;
  skills?: string[];
};

export type PodOwner = PodMember;

export type Pod = {
  _id: string;
  name: string;
  description?: string;
  owner: PodOwner;
  members: PodMember[];
  roles: PodRole[];
  tags?: PodTag[];
  skills?: string[];
  visibility?: string;
  coverImage?: string;
  boosted?: boolean;
  updatedAt?: string;
  membersCount?: number;
  userIsOwner?: boolean;
  userIsMember?: boolean;
  userHasAppliedForRoleIds?: string[];
};

export type PodFilterOptions = {
  search?: string;
  skills?: string[];
  tags?: string[];
  visibility?: string;
  sort?: string;
  page?: number;
  limit?: number;
  recommended?: boolean;
};
