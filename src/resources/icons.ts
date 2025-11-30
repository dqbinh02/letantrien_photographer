import type { IconType } from "react-icons";

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
  PiSquareDuotone,
  PiColumnsDuotone,
  PiGridNineDuotone,
  PiLockKeyDuotone,
  PiDownloadSimpleDuotone,
  PiHeartDuotone,
  PiPaletteDuotone,
  PiArrowsClockwiseDuotone,
} from "react-icons/pi";

import { FaDiscord, FaGithub, FaLinkedin, FaX, FaThreads, FaFacebook } from "react-icons/fa6";

export const iconLibrary: Record<string, IconType> = {
  arrowUpRight: HiArrowUpRight,
  arrowRight: HiArrowRight,
  email: HiEnvelope,
  book: PiBookBookmarkDuotone,
  openLink: HiOutlineLink,
  home: PiHouseDuotone,
  gallery: PiImageDuotone,
  grid: PiGridFourDuotone,
  single: PiSquareDuotone,
  columns: PiColumnsDuotone,
  grid3: PiGridNineDuotone,
  lock: PiLockKeyDuotone,
  download: PiDownloadSimpleDuotone,
  heart: PiHeartDuotone,
  palette: PiPaletteDuotone,
  refresh: PiArrowsClockwiseDuotone,
  discord: FaDiscord,
  github: FaGithub,
  linkedin: FaLinkedin,
  x: FaX,
  threads: FaThreads,
  facebook: FaFacebook,
  arrowUpRightFromSquare: HiArrowTopRightOnSquare,
};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
