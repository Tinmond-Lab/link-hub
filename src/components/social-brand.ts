import {
  siYoutube,
  siTiktok,
  siFacebook,
  siInstagram,
  siShopee,
  siZalo,
} from "simple-icons";
import type { Social } from "../i18n/content";

/** simple-icons path per channel; `path: null` means draw the mail envelope. */
const brand: Record<Social["key"], { path: string | null }> = {
  youtube: { path: siYoutube.path },
  tiktok: { path: siTiktok.path },
  facebook: { path: siFacebook.path },
  instagram: { path: siInstagram.path },
  shopee: { path: siShopee.path },
  zalo: { path: siZalo.path },
  email: { path: null },
};

export function socialBrand(key: Social["key"]): { path: string | null } {
  return brand[key];
}
