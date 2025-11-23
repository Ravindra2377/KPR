export type PodTag = string;

export type PodApplicant = {
  _id?: string;
  userId: string;
  name?: string;
  avatar?: string;
  message?: string;
  requestedAt?: string;
  status?: string;
};

export type PodRole = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  capacity?: number;
  slots?: number;
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
  roles?: string[];
  visibility?: string;
  sort?: string;
  page?: number;
  limit?: number;
  recommended?: boolean;
};

export interface Applicant {
  _id: string;
  userId: string;
  name: string;
  avatar: string;
  role: string;
  message?: string;
  appliedAt: string;
}

export interface Member {
  userId: string;
  name: string;
  avatar: string;
  role: string;
  joinedAt: string;
  isModerator: boolean;
}

export type ActivityType =
  | "member_joined"
  | "application_received"
  | "invite_sent"
  | "member_removed"
  | "member_promoted"
  | "member_demoted"
  | "pod_created"
  | "role_updated"
  | "settings_changed";

export interface Activity {
  _id: string;
  type: ActivityType;
  user: string;
  role?: string;
  timestamp: string;
}
