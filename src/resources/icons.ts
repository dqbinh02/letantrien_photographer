import { IconType } from "react-icons";

import {
  HiArrowUpRight,
  HiOutlineLink,
  HiArrowTopRightOnSquare,
  HiEnvelope,
  HiArrowRight,
} from "react-icons/hi2";

import {
  PiHouseDuotone,
  PiGridFourDuotone,
  PiBookBookmarkDuotone,
  PiImageDuotone,
} from "react-icons/pi";

import { FaDiscord, FaGithub, FaLinkedin, FaX, FaThreads } from "react-icons/fa6";

export const iconLibrary: Record<string, IconType> = {
  arrowUpRight: HiArrowUpRight,
  arrowRight: HiArrowRight,
  email: HiEnvelope,
  book: PiBookBookmarkDuotone,
  openLink: HiOutlineLink,
  home: PiHouseDuotone,
  gallery: PiImageDuotone,
  grid: PiGridFourDuotone,
  discord: FaDiscord,
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaX,
  threads: FaThreads,
  arrowUpRightFromSquare: HiArrowTopRightOnSquare,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
