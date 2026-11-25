import {
  siYoutube,
  siTiktok,
  siFacebook,
  siInstagram,
  siShopee,
  siZalo,
} from "simple-icons";
import type { Social } from "../i18n/content";

/** Brand colour and simple-icons path per channel; `path: null` means draw the mail envelope. */
const brand: Record<Social["key"], { color: string; path: string | null }> = {
  youtube: { color: `#${siYoutube.hex}`, path: siYoutube.path },
  tiktok: { color: "var(--text)", path: siTiktok.path },
  facebook: { color: `#${siFacebook.hex}`, path: siFacebook.path },
  instagram: { color: `#${siInstagram.hex}`, path: siInstagram.path },
  shopee: { color: `#${siShopee.hex}`, path: siShopee.path },
  zalo: { color: `#${siZalo.hex}`, path: siZalo.path },
  email: { color: "var(--accent)", path: null },
};

export function socialBrand(key: Social["key"]): {
  color: string;
  path: string | null;
} {
  return brand[key];
}
